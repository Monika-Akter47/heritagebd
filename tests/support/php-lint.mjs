// Syntax-checks every PHP file of the API with `php -l` (part of `npm run lint`). Exits 1 on any error.
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..', '..');
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.php')) files.push(p);
  }
})(join(root, 'backend'));
for (const dir of ['tests/unit', 'tests/integration', 'tests/support']) {
  for (const name of readdirSync(join(root, dir))) if (name.endsWith('.php')) files.push(join(root, dir, name));
}

let errors = 0;
for (const f of files) {
  const r = spawnSync(process.env.PHP_BINARY || 'php', ['-l', f], { encoding: 'utf8' });
  if (r.status !== 0) { errors++; console.log(`ERROR ${relative(root, f)}\n${r.stdout}${r.stderr}`); }
}
console.log(`php -l: ${files.length} files, ${errors} error(s)`);
process.exit(errors ? 1 : 0);
