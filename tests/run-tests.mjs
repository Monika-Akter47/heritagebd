#!/usr/bin/env node
// One command for the whole PHP suite:
//   npm test                    unit + integration
//   npm run test:coverage       same, plus code coverage (needs the Xdebug extension)
//   node tests/run-tests.mjs --suite unit|integration [--coverage] [--filter <regex>]
//
// Starts an in-memory PostgreSQL seeded from backend/database/postgres (tests/support/test-db.mjs)
// and the PHP API on it (php -S), runs PHPUnit against them, then stops both. Results land in
// docs/testing/evidence/: junit.xml, and with --coverage the merged HTML/Clover/text reports.

import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, readdirSync, writeFileSync, existsSync, openSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const suite = opt('--suite', 'all');
const filter = opt('--filter', null);
const coverage = args.includes('--coverage');
const php = process.env.PHP_BINARY || 'php';
const evidence = join(root, 'docs', 'testing', 'evidence');
const covDir = join(root, 'coverage', 'parts');

const freePort = () => new Promise(res => { const s = net.createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); }); });
const children = [];
const stopAll = () => children.forEach(c => { try { c.kill(); } catch {} });
process.on('exit', stopAll);
process.on('SIGINT', () => { stopAll(); process.exit(130); });

function run(cmd, argv, env = {}) {
  return new Promise(res => {
    const p = spawn(cmd, argv, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });
    p.on('exit', code => res(code ?? 1));
  });
}

async function waitFor(check, what, ms = 60000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await check()) return; await new Promise(r => setTimeout(r, 250)); }
  throw new Error(`Timed out waiting for ${what}`);
}

mkdirSync(evidence, { recursive: true });
const phpunitArgs = ['vendor/bin/phpunit', '--log-junit', join(evidence, `junit-${suite === 'all' ? 'php' : suite}.xml`)];
if (suite !== 'all') phpunitArgs.push('--testsuite', suite);
if (filter) phpunitArgs.push('--filter', filter);
if (args.includes('--testdox')) phpunitArgs.push('--testdox');   // list each test by name
if (coverage) { rmSync(join(root, 'coverage'), { recursive: true, force: true }); mkdirSync(covDir, { recursive: true }); phpunitArgs.push('--coverage-php', join(covDir, 'phpunit.cov')); }

let env = {};
if (suite !== 'unit') {
  const dbPort = await freePort();
  const apiPort = await freePort();
  const db = spawn(process.execPath, [join(root, 'tests', 'support', 'test-db.mjs'), String(dbPort)], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] });
  children.push(db);
  let dbReady = false;
  db.stdout.on('data', d => { if (String(d).includes('TEST_DB_READY')) dbReady = true; });
  await waitFor(() => dbReady, 'test database');

  const dbUrl = `postgresql://postgres:postgres@127.0.0.1:${dbPort}/postgres`;
  const router = coverage ? 'tests/support/coverage-router.php' : 'backend/index.php';
  const apiArgs = ['-S', `127.0.0.1:${apiPort}`, '-t', 'backend', router];
  const api = spawn(php, apiArgs, {
    // The server logs every request to stderr; it must go to a file, since an unread pipe fills up and
    // blocks the server mid-run.
    cwd: root, stdio: ['ignore', 'ignore', (mkdirSync(join(root, 'coverage'), { recursive: true }), openSync(join(root, 'coverage', 'api-server.log'), 'w'))],
    env: { ...process.env, DATABASE_URL: dbUrl, DB_SSLMODE: 'disable', APP_TIMEZONE: 'Asia/Dhaka',
           HERITAGE_UPLOAD_DIR: join(root, 'coverage', 'uploads'),
           ...(coverage ? { XDEBUG_MODE: 'coverage', HERITAGE_COVERAGE_DIR: covDir } : {}) },
  });
  children.push(api);
  await waitFor(async () => { try { return (await fetch(`http://127.0.0.1:${apiPort}/api/health`)).ok; } catch { return false; } }, 'API server');
  env = { TEST_API_URL: `http://127.0.0.1:${apiPort}`, TEST_DB_URL: dbUrl };
  console.log(`Test database on :${dbPort}, API on :${apiPort}${coverage ? ' (coverage on)' : ''}\n`);
}

let code;
if (suite === 'e2e') {
  // Frontend dev server pointed at the test API, then the Playwright journeys (playwright.config.ts).
  const webPort = await freePort();
  const web = spawn(process.execPath, [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(webPort), '--strictPort', '--host', '127.0.0.1'],
    { cwd: root, stdio: 'ignore', env: { ...process.env, VITE_API_URL: env.TEST_API_URL } });
  children.push(web);
  await waitFor(async () => { try { return (await fetch(`http://127.0.0.1:${webPort}/`)).ok; } catch { return false; } }, 'web server');
  const extra = args.filter(a => !['--suite', 'e2e'].includes(a));
  code = await run(process.execPath, [join(root, 'node_modules', '@playwright', 'test', 'cli.js'), 'test', ...extra],
    { ...env, E2E_BASE_URL: `http://127.0.0.1:${webPort}` });
} else {
  code = await run(php, phpunitArgs, { ...env, ...(coverage ? { XDEBUG_MODE: 'coverage' } : {}) });
}
stopAll();

// --frontend: also run the Vitest suite, whatever PHPUnit returned, and fail if either failed.
if (args.includes('--frontend')) {
  const vitest = await run(process.execPath, [join(root, 'node_modules', 'vitest', 'vitest.mjs'), 'run', ...(coverage ? ['--coverage'] : [])]);
  code = code || vitest;
}
stopAll();

if (coverage) {
  await new Promise(r => setTimeout(r, 500));   // let the API flush its last coverage file
  console.log(`\nMerging ${readdirSync(covDir).length} coverage files…`);
  rmSync(join(evidence, 'coverage'), { recursive: true, force: true });
  await run(php, ['-d', 'memory_limit=2G', 'tests/support/merge-coverage.php', covDir, evidence], { XDEBUG_MODE: 'coverage' });
  if (existsSync(join(evidence, 'coverage.txt'))) console.log(`Coverage report: docs/testing/evidence/coverage/index.html`);
}
process.exit(code);
