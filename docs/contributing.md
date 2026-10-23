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
```

PHP syntax check for every backend file (PowerShell, XAMPP):

```powershell
Get-ChildItem backend -Recurse -Filter *.php | % { C:\xampp\php\php.exe -l $_.FullName }
```

For anything touching orders, pre-orders, bookings or money, walk the flow through the API against a
**throwaway** database (create `heritagebd_test`, import `schema.sql` and `seed.sql` with their
`CREATE DATABASE`/`USE heritagebd` lines removed, start the API with `DB_NAME=heritagebd_test`).
Never test against a database you care about: `schema.sql` drops every table.

## Database changes

- Edit `backend/database/schema.sql` so fresh installs get the change.
- Add `backend/database/migrations/NNN_short_name.sql` for existing installs. Use the next number
  (currently `007`), and make it safe to read top to bottom (`IF NOT EXISTS` where MySQL allows it).
- List the migration in [database.md](database.md#migrations) and the changelog.

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
