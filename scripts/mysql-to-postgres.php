<?php
/**
 * Converts HeritageBD's MySQL SQL into PostgreSQL (Supabase).
 *
 *   php scripts/mysql-to-postgres.php schema  backend/database/schema.sql  > backend/database/postgres/schema.sql
 *   php scripts/mysql-to-postgres.php data    backend/database/seed.sql    > backend/database/postgres/seed.sql
 *   php scripts/mysql-to-postgres.php data    my-mysqldump.sql             > data.pg.sql
 *
 * `schema` handles this project's CREATE TABLE style (ENUM → CHECK, AUTO_INCREMENT → identity,
 * ON UPDATE CURRENT_TIMESTAMP → trigger, inline KEY → CREATE INDEX, FKs deferred to commit) and
 * enables Row Level Security on every table so Supabase's public Data API exposes nothing.
 * `data` converts INSERT/UPDATE statements, including `mysqldump --complete-insert` output, and
 * wraps them in one transaction so deferred foreign keys accept any insert order.
 *
 * Regenerate the postgres/ files whenever schema.sql or seed.sql change: `npm run db:pg`.
 */

[$_, $mode, $file] = $argv + [null, null, null];
if (!in_array($mode, ['schema', 'data'], true) || !is_file((string)$file)) {
    fwrite(STDERR, "usage: php mysql-to-postgres.php schema|data <file.sql>\n");
    exit(1);
}
$sql = str_replace("\r\n", "\n", file_get_contents($file));

/** Splits SQL into statements on semicolons outside string literals and comments. */
function split_statements(string $sql): array {
    $out = []; $buf = ''; $len = strlen($sql); $quote = null;
    for ($i = 0; $i < $len; $i++) {
        $c = $sql[$i];
        if ($quote) {
            $buf .= $c;
            if ($c === '\\' && $quote === "'") { $buf .= $sql[++$i] ?? ''; continue; }
            if ($c === $quote) {
                if (($sql[$i + 1] ?? '') === $quote) { $buf .= $sql[++$i]; continue; }
                $quote = null;
            }
            continue;
        }
        if ($c === '-' && ($sql[$i + 1] ?? '') === '-') { // line comment
            $end = strpos($sql, "\n", $i); $end = $end === false ? $len : $end;
            $buf .= substr($sql, $i, $end - $i); $i = $end - 1; continue;
        }
        if ($c === '/' && ($sql[$i + 1] ?? '') === '*') { // block comment (incl. mysqldump /*!...*/)
            $end = strpos($sql, '*/', $i); $end = $end === false ? $len : $end + 2;
            $i = $end - 1; continue;
        }
        if ($c === "'" || $c === '"' || $c === '`') { $quote = $c; $buf .= $c; continue; }
        if ($c === ';') { $out[] = $buf; $buf = ''; continue; }
        $buf .= $c;
    }
    if (trim($buf) !== '') $out[] = $buf;
    return $out;
}

/** Rewrites MySQL string literals ('it\'s', \n …) as standard SQL literals and drops backticks. */
function convert_literals(string $stmt): string {
    $out = ''; $len = strlen($stmt);
    for ($i = 0; $i < $len; $i++) {
        $c = $stmt[$i];
        if ($c === '`') continue;
        if ($c === '-' && ($stmt[$i + 1] ?? '') === '-') {
            $end = strpos($stmt, "\n", $i); $end = $end === false ? $len : $end;
            $out .= substr($stmt, $i, $end - $i); $i = $end - 1; continue;
        }
        if ($c !== "'") { $out .= $c; continue; }
        $val = '';
        for ($i++; $i < $len; $i++) {
            $d = $stmt[$i];
            if ($d === '\\') {
                $n = $stmt[++$i] ?? '';
                $val .= ['n' => "\n", 'r' => "\r", 't' => "\t", '0' => '', 'Z' => "\x1a"][$n] ?? $n;
                continue;
            }
            if ($d === "'") {
                if (($stmt[$i + 1] ?? '') === "'") { $val .= "'"; $i++; continue; }
                break;
            }
            $val .= $d;
        }
        $out .= "'" . str_replace("'", "''", $val) . "'";
    }
    return $out;
}

function is_skippable(string $stmt): bool {
    return (bool)preg_match('/^\s*(SET\s|USE\s|CREATE DATABASE|LOCK TABLES|UNLOCK TABLES|DROP DATABASE)/i', strip_comments($stmt));
}

function strip_comments(string $stmt): string {
    return trim(preg_replace('/^\s*--.*$/m', '', $stmt));
}

/** INSERT IGNORE → INSERT … ON CONFLICT DO NOTHING */
function convert_dml(string $stmt): string {
    $stmt = convert_literals($stmt);
    if (preg_match('/\bINSERT\s+IGNORE\s+INTO\b/i', $stmt)) {
        $stmt = preg_replace('/\bINSERT\s+IGNORE\s+INTO\b/i', 'INSERT INTO', $stmt);
        $stmt = rtrim($stmt) . "\nON CONFLICT DO NOTHING";
    }
    // `ON DUPLICATE KEY UPDATE a=a` is MySQL's "keep the existing row". Anything else needs a
    // conflict target PostgreSQL can't infer, so refuse instead of guessing.
    if (preg_match('/\s+ON DUPLICATE KEY UPDATE\s+(.+)$/is', $stmt, $m)) {
        foreach (explode(',', $m[1]) as $assign) {
            if (!preg_match('/^\s*(\w+)\s*=\s*\1\s*$/', $assign)) {
                fwrite(STDERR, "Cannot convert upsert automatically: ON DUPLICATE KEY UPDATE {$m[1]}\n");
                exit(1);
            }
        }
        $stmt = substr($stmt, 0, -strlen($m[0])) . "\nON CONFLICT DO NOTHING";
    }
    return $stmt;
}

function convert_create_table(string $stmt, array &$after, array &$tables, array &$updatedAt): string {
    preg_match('/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)\s*\(/i', $stmt, $m);
    $table = $m[1];
    $tables[] = $table;
    $body = substr($stmt, strpos($stmt, '(') + 1);
    // Drop the table's own closing bracket (and any ENGINE=… options), nothing else.
    $body = preg_match('/\)\s*ENGINE\s*=.*$/is', $body)
        ? preg_replace('/\)\s*ENGINE\s*=.*$/is', '', $body)
        : preg_replace('/\)\s*$/s', '', rtrim($body));

    $lines = []; $fkColumns = []; $indexedLead = [];
    foreach (preg_split('/\n/', $body) as $line) {
        $trim = trim($line);
        if ($trim === '') continue;
        $hasComma = str_ends_with(rtrim(preg_replace('/\s--.*$/', '', $trim)), ',');
        $comment = preg_match('/\s(--.*)$/', $trim, $cm) ? ' ' . $cm[1] : '';
        $def = rtrim(preg_replace('/\s--.*$/', '', $trim), ', ');
        if ($def === '' && str_starts_with($trim, '--')) { $lines[] = "  $trim"; continue; }

        if (preg_match('/^FULLTEXT\s+(KEY|INDEX)/i', $def)) continue;
        if (preg_match('/^(?:KEY|INDEX)\s+(\w+)\s*\(([^)]+)\)$/i', $def, $k)) {
            $after[] = "CREATE INDEX IF NOT EXISTS {$table}_{$k[1]} ON {$table} ({$k[2]});";
            $indexedLead[] = trim(explode(',', $k[2])[0]);
            continue;
        }
        if (preg_match('/^UNIQUE\s+(?:KEY|INDEX)\s+(\w+)\s*\(([^)]+)\)$/i', $def, $k)) {
            $def = "CONSTRAINT {$table}_{$k[1]} UNIQUE ({$k[2]})";
        }
        if (preg_match('/^(\w+)\s+ENUM\s*\(([^)]*)\)(.*)$/i', $def, $e)) {
            $def = "{$e[1]} VARCHAR(40){$e[3]} CHECK ({$e[1]} IN ({$e[2]}))";
        }
        if (preg_match('/\bON UPDATE CURRENT_TIMESTAMP\b/i', $def)) {
            $def = preg_replace('/\s*ON UPDATE CURRENT_TIMESTAMP/i', '', $def);
            $updatedAt[$table] = true;
        }
        $def = preg_replace('/\bBIGINT\s+AUTO_INCREMENT\b/i', 'BIGINT GENERATED BY DEFAULT AS IDENTITY', $def);
        $def = preg_replace('/\bINT\s+AUTO_INCREMENT\b/i', 'INTEGER GENERATED BY DEFAULT AS IDENTITY', $def);
        $def = preg_replace('/\bTINYINT(\(\d+\))?/i', 'SMALLINT', $def);
        $def = preg_replace('/\bINT\s+UNSIGNED\b/i', 'BIGINT', $def);
        $def = preg_replace('/\bDATETIME\b/i', 'TIMESTAMP', $def);
        $def = preg_replace('/\b(LONG|MEDIUM)TEXT\b/i', 'TEXT', $def);
        $def = preg_replace('/\s+(CHARACTER SET|COLLATE)\s+\w+/i', '', $def);
        if (preg_match('/\bREFERENCES\b/i', $def)) {
            $def .= ' DEFERRABLE INITIALLY DEFERRED';
            // PostgreSQL (unlike InnoDB) doesn't index foreign-key columns automatically; without
            // one, joins and ON DELETE CASCADE scan the child table (Supabase lint 0001).
            if (preg_match('/FOREIGN KEY\s*\((\w+)\)/i', $def, $fk)) $fkColumns[] = $fk[1];
        }
        $lines[] = ['def' => "  $def", 'comment' => $comment];
    }
    // A primary key, unique constraint or index already covers its leading column; only index
    // foreign-key columns that nothing covers yet.
    foreach ($lines as $l) {
        if (!is_array($l)) continue;
        if (preg_match('/^\s*(\w+)\s.*\b(PRIMARY KEY|UNIQUE)\b/i', $l['def'], $p)
            && !in_array(strtoupper($p[1]), ['PRIMARY', 'CONSTRAINT', 'UNIQUE'], true)) $indexedLead[] = $p[1];
        if (preg_match('/^\s*(?:CONSTRAINT\s+\w+\s+)?(?:PRIMARY KEY|UNIQUE)\s*\((\w+)/i', $l['def'], $p)) $indexedLead[] = $p[1];
    }
    foreach (array_unique($fkColumns) as $col) {
        if (!in_array($col, $indexedLead, true)) $after[] = "CREATE INDEX IF NOT EXISTS {$table}_{$col}_fk_idx ON {$table} ({$col});";
    }
    // Re-join with commas only between definitions (removed KEY lines can leave dangling commas).
    $defs = array_keys(array_filter($lines, 'is_array'));
    $lastDef = end($defs);
    $outLines = [];
    foreach ($lines as $i => $l) {
        if (!is_array($l)) { $outLines[] = $l; continue; }
        $outLines[] = $l['def'] . ($i === $lastDef ? '' : ',') . $l['comment'];
    }
    return "CREATE TABLE {$table} (\n" . implode("\n", $outLines) . "\n)";
}

$statements = split_statements($sql);
$out = ["-- GENERATED by scripts/mysql-to-postgres.php from " . basename($file) . " — do not edit by hand.", ''];

if ($mode === 'schema') {
    $tables = []; $updatedAt = []; $after = [];
    $out[] = "BEGIN;\n";
    $out[] = "CREATE OR REPLACE FUNCTION heritagebd_set_updated_at() RETURNS trigger\nLANGUAGE plpgsql SET search_path = '' AS \$\$\nBEGIN\n  NEW.updated_at = CURRENT_TIMESTAMP;\n  RETURN NEW;\nEND;\n\$\$;\n";
    foreach ($statements as $stmt) {
        if (strip_comments($stmt) === '' || is_skippable($stmt)) continue;
        $clean = strip_comments($stmt);
        if (preg_match('/^DROP TABLE IF EXISTS\s+`?(\w+)`?/i', $clean, $m)) {
            $out[] = "DROP TABLE IF EXISTS {$m[1]} CASCADE;"; continue;
        }
        if (preg_match('/^CREATE TABLE/i', $clean)) {
            $pending = [];
            $out[] = convert_create_table($clean, $pending, $tables, $updatedAt) . ";";
            foreach ($pending as $p) $out[] = $p;
            $out[] = '';
            continue;
        }
        $out[] = convert_dml($clean) . ";\n";
    }
    foreach (array_keys($updatedAt) as $t) {
        $out[] = "CREATE TRIGGER {$t}_set_updated_at BEFORE UPDATE ON {$t} FOR EACH ROW EXECUTE FUNCTION heritagebd_set_updated_at();";
    }
    $out[] = "\n-- Supabase exposes the public schema through its Data API (PostgREST). The PHP API is the only";
    $out[] = "-- client, connecting as the postgres role (which bypasses RLS), so enable RLS with no policies:";
    $out[] = "-- anon/authenticated API keys can then read or write nothing.";
    foreach ($tables as $t) $out[] = "ALTER TABLE {$t} ENABLE ROW LEVEL SECURITY;";
    $out[] = "\nCOMMIT;";
} else {
    $out[] = "BEGIN;\n";
    foreach ($statements as $stmt) {
        $clean = strip_comments($stmt);
        if ($clean === '' || is_skippable($stmt)) continue;
        if (preg_match('/^(CREATE|DROP|ALTER)\s/i', $clean)) continue; // structure comes from schema
        $out[] = convert_dml($clean) . ';';
    }
    // Explicit ids inserted into identity columns don't advance their sequences; catch them up.
    $out[] = <<<'SQL'

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.table_name, c.column_name FROM information_schema.columns c
           WHERE c.table_schema = 'public' AND c.is_identity = 'YES' LOOP
    EXECUTE format('SELECT setval(pg_get_serial_sequence(%L, %L), COALESCE((SELECT MAX(%I) FROM %I), 0) + 1, false)',
                   r.table_name, r.column_name, r.column_name, r.table_name);
  END LOOP;
END $$;

COMMIT;
SQL;
}
echo implode("\n", $out), "\n";
