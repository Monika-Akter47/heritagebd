# HeritageBD documentation

HeritageBD is a heritage-tourism and local-marketplace platform for Bangladesh. It is a
React single-page app (`src/`) talking to a framework-less PHP 8 REST API (`backend/`)
backed by MySQL/MariaDB.

| Document | What it covers |
|---|---|
| [architecture.md](architecture.md) | System overview, request lifecycle, repo layout |
| [setup.md](setup.md) | Local development, environment variables, deployment |
| [deploy-vercel.md](deploy-vercel.md) | Step-by-step: frontend on Vercel, PHP backend on Render (Docker), hosted MySQL |
| [frontend.md](frontend.md) | Routes, global state, API client, data sources |
| [api.md](api.md) | Full endpoint reference with auth requirements |
| [database.md](database.md) | Tables, enums, migrations |
| [workflows.md](workflows.md) | Order / pre-order / booking / trip rules, money splits, area-based foods and products |
| [diagrams.md](diagrams.md) | 13 UML diagrams (Mermaid): context, use cases, class, ER, sequences, state machines, components |
| [security.md](security.md) | Auth model, access control, upload handling, hardening checklist |
| [known-issues.md](known-issues.md) | Open bugs and gaps, plus what was fixed |
| [contributing.md](contributing.md) | Workflow, checks to run, conventions, adding migrations |
| [CHANGELOG.md](CHANGELOG.md) | What changed, upgrade steps, what was verified |

The top-level [README](../README.md) is the Windows/XAMPP quick start, and
[backend/README.md](../backend/README.md) lists every migration an existing database needs.
