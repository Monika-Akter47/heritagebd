<?php
/**
 * Database connection (PDO): MySQL/MariaDB (local XAMPP) or PostgreSQL (Supabase).
 *
 * Configure with environment variables, either one URL:
 *   DATABASE_URL=postgresql://user:pass@host:5432/postgres   (Supabase "Session pooler" URI)
 * or separate values:
 *   DB_DRIVER=mysql|pgsql  DB_HOST  DB_PORT  DB_NAME  DB_USER  DB_PASS
 * Defaults match XAMPP (MySQL, root, no password).
 */

function env_or(string $key, string $default): string {
    $val = getenv($key);
    return $val !== false && $val !== '' ? $val : $default;
}

(function () {
    $url = env_or('DATABASE_URL', '');
    $parts = $url !== '' ? parse_url($url) : [];
    $scheme = $parts['scheme'] ?? '';
    $driver = in_array($scheme, ['postgres', 'postgresql'], true) ? 'pgsql'
        : ($scheme === 'mysql' ? 'mysql' : env_or('DB_DRIVER', 'mysql'));
    define('DB_DRIVER', $driver === 'pgsql' ? 'pgsql' : 'mysql');
    define('DB_HOST', isset($parts['host']) ? $parts['host'] : env_or('DB_HOST', '127.0.0.1'));
    define('DB_PORT', isset($parts['port']) ? (string)$parts['port'] : env_or('DB_PORT', DB_DRIVER === 'pgsql' ? '5432' : '3306'));
    define('DB_NAME', isset($parts['path']) && trim($parts['path'], '/') !== '' ? trim($parts['path'], '/') : env_or('DB_NAME', DB_DRIVER === 'pgsql' ? 'postgres' : 'heritagebd'));
    define('DB_USER', isset($parts['user']) ? urldecode($parts['user']) : env_or('DB_USER', DB_DRIVER === 'pgsql' ? 'postgres' : 'root'));
    // DB_PASS wins over a password inside DATABASE_URL, so passwords with characters such as
    // @ # / : need no URL-encoding: put the URI without a password, and the password in DB_PASS.
    define('DB_PASS', env_or('DB_PASS', '') !== '' ? env_or('DB_PASS', '') : (isset($parts['pass']) ? urldecode($parts['pass']) : ''));
})();

// PHP's date() and the database's NOW() must agree, or "today" checks (booking dates, token
// expiry) drift by the offset between the two. XAMPP ships PHP set to Europe/Berlin.
date_default_timezone_set(env_or('APP_TIMEZONE', 'Asia/Dhaka'));

function db_is_pgsql(): bool {
    return DB_DRIVER === 'pgsql';
}

/**
 * PDO that smooths over the one dialect difference the controllers rely on everywhere:
 * MySQL's default collation makes LIKE case-insensitive, PostgreSQL's LIKE is not, so on
 * PostgreSQL every LIKE runs as ILIKE. Everything else in the codebase is written in SQL
 * both databases accept.
 */
class HeritagePDO extends PDO {
    private function portable(string $sql): string {
        return db_is_pgsql() ? preg_replace('/\bLIKE\b/', 'ILIKE', $sql) : $sql;
    }

    #[\ReturnTypeWillChange]
    public function prepare($query, $options = []) {
        return parent::prepare($this->portable($query), $options);
    }

    #[\ReturnTypeWillChange]
    public function query($query, $fetchMode = null, ...$fetchModeArgs) {
        return $fetchMode === null
            ? parent::query($this->portable($query))
            : parent::query($this->portable($query), $fetchMode, ...$fetchModeArgs);
    }

    #[\ReturnTypeWillChange]
    public function exec($statement) {
        return parent::exec($this->portable($statement));
    }
}

/** Writes a CA certificate held in an environment variable to a temp file and returns its path. */
function db_ca_file(): ?string {
    $caPem = getenv('DB_SSL_CA_PEM');
    if (!$caPem) return null;
    $caFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'heritagebd-db-ca.pem';
    if (!is_file($caFile)) file_put_contents($caFile, str_replace('\n', "\n", $caPem));
    return $caFile;
}

function get_db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $offset = (new DateTime())->format('P');
        try {
            if (db_is_pgsql()) {
                // Supabase requires TLS. With DB_SSL_CA_PEM set the server certificate is verified too.
                $ca = db_ca_file();
                $sslmode = env_or('DB_SSLMODE', $ca ? 'verify-full' : 'require');
                $dsn = 'pgsql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';sslmode=' . $sslmode
                    . ($ca ? ';sslrootcert=' . $ca : '');
                $pdo = new HeritagePDO($dsn, DB_USER, DB_PASS, $options);
                $pdo->exec("SET TIME ZONE INTERVAL '$offset' HOUR TO MINUTE");
            } else {
                $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
                // Hosted MySQL (Aiven, TiDB...) requires TLS; DB_SSL_CA_PEM holds the provider's CA text.
                if ($ca = db_ca_file()) $options[PDO::MYSQL_ATTR_SSL_CA] = $ca;
                $pdo = new HeritagePDO($dsn, DB_USER, DB_PASS, $options);
                // Numeric offset works without MySQL's named time-zone tables being loaded.
                $pdo->exec("SET time_zone = '$offset'");
            }
        } catch (PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            error_log('[HeritageBD] Database connection failed: ' . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Database connection failed. Please try again later.']);
            exit;
        }
    }
    return $pdo;
}
