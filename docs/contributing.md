# Contributing

## Workflow

1. Run the API (`php -S localhost:8080 index.php` in `backend/`) and the frontend (`npm run dev`).
2. Make the change.
3. Run the checks below.
4. Add an entry under `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md). If the change needs a database
   change, add a migration (next section) and list it under "Upgrade steps".

## Checks before you finish

```bash
npm run typecheck
npm run build
php backend/tests/settlement_smoke.php
npm run test:api -- http://localhost:8080
```

PHP syntax check for every backend file (PowerShell, XAMPP):

```powershell
Get-ChildItem backend -Recurse -Filter *.php | % { C:\xampp\php\php.exe -l $_.FullName }
```

For anything touching orders, pre-orders, bookings or money, walk the flow through the API against a
**throwaway** database (create `heritagebd_test`, import `schema.sql` and `seed.sql` with their
`CREATE DATABASE`/`USE heritagebd` lines removed, start the API with `DB_NAME=heritagebd_test`).
Never test against a database you care about: `schema.sql` drops every table.

## API smoke test

`npm run test:api -- http://localhost:8080` (or `php backend/tests/api_smoke.php <api-url>`) drives
the real API over HTTP through every major flow: 121 checks covering accounts, catalogue, orders and
settlement, guide bookings, pre-orders, local foods, admin, uploads and security. It needs the
`seed.sql` demo accounts and **creates data**, so point it at a test database.

To test against PostgreSQL locally without installing it, use PGlite (a dev dependency):

```bash
node node_modules/@electric-sql/pglite-socket/dist/scripts/server.js --port=54329 --max-connections=10
```

Load `backend/database/postgres/schema.sql` and `seed.sql` into it, then start the API with
`DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54329/postgres DB_SSLMODE=disable` and
`php -d extension=pdo_pgsql -S 127.0.0.1:8098 index.php` (XAMPP ships the driver; the `-d` flag loads
it without editing `php.ini`).

## Writing SQL for both databases

The API runs on MySQL (local XAMPP) and PostgreSQL (Supabase). `HeritagePDO` in
`config/database.php` rewrites `LIKE` to `ILIKE` on PostgreSQL; everything else must be portable:

- Single quotes for string values (`'pending'`). Double quotes mean an identifier in PostgreSQL.
- No `DATE_ADD`, `DATE_SUB`, `DATE_FORMAT`, `CURDATE`, `MONTH()`, `YEAR()`, `IF()`. Compute dates in PHP
  (`date('Y-m-d H:i:s', …)`, which shares `APP_TIMEZONE` with the database) and pass them as parameters;
  use `CASE WHEN` instead of `IF()`.
- Upserts: branch on `db_is_pgsql()` (`ON CONFLICT (…) DO UPDATE` vs `ON DUPLICATE KEY UPDATE`).
- `GROUP BY` every selected column that isn't aggregated.
- Booleans are stored as `0`/`1` (`SMALLINT` in PostgreSQL), so `= 1` works on both.
- Run the smoke test on both databases before merging.

## Database changes

- Edit `backend/database/schema.sql` so fresh installs get the change.
- Add `backend/database/migrations/NNN_short_name.sql` for existing installs. Use the next number
  (currently `008`), and make it safe to read top to bottom (`IF NOT EXISTS` where MySQL allows it).
- List the migration in [database.md](database.md#migrations) and the changelog.
- Run `npm run db:pg` to regenerate `backend/database/postgres/`, and apply the equivalent change to
  Supabase in its SQL editor.

## Backend conventions

- One controller file per resource; handlers are plain functions `resource_action(PDO $pdo, ...$routeParams)`.
- Register routes in `backend/index.php`. Put literal paths before parameterised ones.
- Always start with `require_auth()` / `require_role()` and then check ownership of the record.
- End with `json_ok()` / `json_error()`. Never echo SQL or exception text.
- Status changes go through an explicit transition table. Money moves only inside a transaction and
  only through `helpers/earnings.php`.
- Use prepared statements only.

## Frontend conventions

- Add API calls to `src/services/api.ts`; pages never call `fetch` directly.
- Pass a typed fallback to `useApiData` (`[] as Product[]`, `null as PaymentTerms | null`): the hook
  takes its type from the fallback.
- Pages are default exports and are lazy-loaded in `App.tsx`; add new routes there with `lazy()`.
- Strings that contain apostrophes use double quotes.
- Tailwind v4 utilities; theme tokens live in `src/index.css`.
