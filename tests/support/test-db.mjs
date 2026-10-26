// Throwaway PostgreSQL for the integration tests: an in-memory PGlite database loaded with the
// committed schema and demo seed, served over the PostgreSQL wire protocol so the PHP API can
// connect with pdo_pgsql exactly as it does to Supabase. Nothing is written to disk, so every
// run starts from the same data.
//
//   node tests/support/test-db.mjs [port]      prints "TEST_DB_READY <port>" when it accepts connections

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const port = Number(process.argv[2] || 54329);

const db = await PGlite.create();
for (const file of ['schema.sql', 'seed.sql']) {
  await db.exec(readFileSync(join(root, 'backend', 'database', 'postgres', file), 'utf8'));
}

const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1', maxConnections: 10 });
await server.start();
console.log(`TEST_DB_READY ${port}`);

const stop = async () => { await server.stop(); await db.close(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
