# Sri Sai Balaji Driving School — Digital Platform

The digital operating system for **Sri Sai Balaji Driving School** (Kondapur and Hafeezpet, Hyderabad):
a public website, enquiry and booking pipeline, admin dashboard, and student and instructor portals.

> **Status: Phase 2 (public website) complete.** The public website, its public API slice (packages,
> branches, settings, RTA services, reviews, enquiries) and SEO files are built. Authentication and the
> admin, student and instructor areas are built in later phases. See
> [docs/architecture.md](docs/architecture.md) for the roadmap.

## Technology

| Layer    | Stack                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7, TanStack Query, React Hook Form + Zod |
| Backend  | Node.js, Express 5, TypeScript, Zod, Pino, Helmet                                                  |
| Database | PostgreSQL + Prisma 7                                                                              |
| Auth     | JWT access tokens + rotating refresh tokens, role-based authorization (Phase 3)                    |
| Testing  | Vitest, Supertest, Testing Library                                                                 |

The browser only talks to the Express API. Business rules and authorization live in the backend;
the database is the source of truth. There is no .NET or C# anywhere in this project.

## Prerequisites

- **Node.js ≥ 22.12** and npm ≥ 10
- **PostgreSQL ≥ 16** (developed against 18). The `btree_gist` extension ships with PostgreSQL.
- Git

## Installation

```bash
npm install          # installs both workspaces and generates the Prisma client
```

## Environment setup

Real configuration lives in git-ignored files. Copy the templates and fill in the placeholders:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Values you **must** supply in `server/.env` (the server refuses to start without them):

| Variable                                  | What to put there                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                            | Connection string for the database you create below                                                                       |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Two _different_ random strings, ≥ 32 chars: `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"` |
| `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD` | Credentials for the first OWNER account (only read by `npm run seed`; password ≥ 12 chars)                                |

Everything else has a safe default (`PORT=4000`, `BUSINESS_TIMEZONE=Asia/Kolkata`, …). Startup
validation names every missing or invalid variable, never echoes secret values, and in production also
requires `CLIENT_URL` over `https`.

## Database setup

1. Make sure the PostgreSQL service is running. On Windows, in an **elevated** PowerShell:
   `Start-Service postgresql-x64-18`
2. Create a dedicated user and database (as the `postgres` superuser, e.g. in `psql -U postgres`):

   ```sql
   CREATE USER srisaibalaji WITH PASSWORD 'choose-a-strong-password' CREATEDB;
   CREATE DATABASE srisaibalaji_dev OWNER srisaibalaji;
   ```

   `CREATEDB` lets `prisma migrate dev` create its temporary shadow database. Do not use the
   `postgres` superuser for the application.

3. Put the matching URL in `server/.env`:
   `DATABASE_URL=postgresql://srisaibalaji:choose-a-strong-password@localhost:5432/srisaibalaji_dev`
   (URL-encode special characters in the password).

### Migrations

```bash
npm run db:migrate     # dev: apply migrations (and create new ones after schema changes)
npm run db:deploy      # production: apply committed migrations only
npm run db:validate    # check schema.prisma without a database
npm run db:generate    # regenerate the Prisma client
```

There are two migrations. `…_init` is generated from `schema.prisma`. `…_integrity_constraints` is
**hand-written**: it adds the PostgreSQL exclusion constraints that make double-booking of an
instructor or vehicle impossible, plus `CHECK` constraints. Never edit an applied migration; add a new
one. Details: [docs/erd.md](docs/erd.md).

### Seeding

```bash
npm run seed       # production-safe: OWNER account, 2 branches, confirmed business settings, default skills
npm run seed:dev   # development only: clearly labelled [DEV] fake data
```

`seed` creates no fake students, reviews, revenue or statistics, and is safe to re-run (it never
overwrites owner-edited values or existing accounts). The owner must change the bootstrap password at
first sign-in. `seed:dev` refuses to run when `NODE_ENV=production` or against a non-local database.

## Development

```bash
npm run dev            # API on :4000 and web app on :5273 (Vite proxies /api to the API)
npm run dev:server     # API only
npm run dev:client     # web app only
```

Open http://localhost:5273 (a dedicated port with `strictPort`, so it never silently lands on another
project's dev server; override with `VITE_DEV_PORT`). In development there is also a living style guide at
`/dev/design-system` (absent from production builds).

| Command                | What it does                                   |
| ---------------------- | ---------------------------------------------- |
| `npm run build`        | Type-check and build client and server         |
| `npm run test`         | Run all tests (Vitest)                         |
| `npm run lint`         | ESLint, client and server                      |
| `npm run typecheck`    | TypeScript, client and server                  |
| `npm run format`       | Format everything with Prettier                |
| `npm run format:check` | Verify formatting                              |
| `npm run check`        | format:check + lint + typecheck + test + build |

API health: `GET http://localhost:4000/api/v1/health` → `{ "data": { "status": "ok" } }`
(`/api/v1/health/ready` also checks the database).

Public API (no login), used by the website: `GET /api/v1/public/packages`, `/packages/:slug`,
`/branches`, `/settings`, `/rta-services`, `/reviews`, and `POST /api/v1/public/enquiries`.
The API also serves `/robots.txt` and `/sitemap.xml` (built from `CLIENT_URL` and the database);
in production the reverse proxy must route those two paths to the API.

### Replacing the temporary logo and hero artwork

The client's real logo and photography are not available yet, so the site uses a temporary text logo and a
vector illustration. To swap in the real files, put them in `client/src/assets/` and set `brandLogo` and
`heroImage` in `client/src/config/brand.ts`. Nothing else needs to change.

### Public website content

Business details (phones, address, hours), branches, packages, RTA services and reviews all come from the
database. The facts printed on the business card are also seeded by `npm run seed`; the website shows
them from the API, and uses `client/src/config/business-defaults.ts` only as a fallback while the API is
loading or unreachable.

## Repository layout

```
client/   React app (public site, admin, student and instructor portals)
server/   Express API, Prisma schema, migrations, seeds
docs/     architecture, database ERD, decisions
```

## Documentation

- [docs/architecture.md](docs/architecture.md): system design, folder structure, API conventions, roadmap
- [docs/erd.md](docs/erd.md): entities, relationships, constraints
- [docs/decisions.md](docs/decisions.md): decisions and their reasons

## Security notes

- Never commit `.env` files or secrets; only `*.env.example` placeholders are tracked.
- Permissions are enforced on the server; client route guards are only a UX layer.
- Logs redact authorization headers, cookies, passwords and tokens, and omit query strings.
