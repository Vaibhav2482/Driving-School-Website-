# Architecture

## Overview

```
React SPA (Vite)  ──HTTPS / JSON──►  Express API  ──Prisma──►  PostgreSQL
public · admin · portals            REST /api/v1               source of truth
```

- **Website = front door, admin = business engine, portals = customer/operations experience,
  backend = core, database = source of truth.**
- One deployable API (modular monolith), one SPA with three route areas. No microservices.
- The browser never talks to PostgreSQL. Business logic and authorization live in the backend.
- Data flows one way: `admin edits → database → API → public website / portals`. Business data
  (packages, prices, contact details, branches, RTA services) is **not** hard-coded in React.

## Repository layout

```
Driving School/
├─ package.json            npm workspaces (client, server) and repo-wide scripts
├─ docs/                   this documentation
├─ client/
│  └─ src/
│     ├─ app/              App root, providers, route table, route guards
│     ├─ assets/           bundled brand assets (waiting on client's logo/photos)
│     ├─ components/
│     │  ├─ ui/            primitives: Button, Input, Select, Textarea, Card, Badge, Alert, Modal, Table, Skeleton…
│     │  └─ common/        composed pieces: FormField, EmptyState, PageHeader, StatCard, ConfirmDialog, Seo…
│     ├─ config/           env validation, site constants, navigation
│     ├─ features/         one folder per domain (auth so far): api, hooks, schemas, components
│     ├─ layouts/          PublicLayout, DashboardShell + Admin/Student/Instructor layouts
│     ├─ lib/              apiClient, queryClient, cn, format (money), time (IST)
│     ├─ pages/            public/, admin/, student/, instructor/, auth/, dev/
│     └─ styles/           Tailwind entry + design tokens
└─ server/
   ├─ prisma/              schema.prisma, migrations/, seed.ts, seed.dev.ts, seed/
   └─ src/
      ├─ server.ts         process entry: env → logger → prisma → listen, graceful shutdown
      ├─ app.ts            createApp(deps): middleware pipeline and router mounting
      ├─ config/           env.ts (Zod validation, fail-fast)
      ├─ lib/              logger, errors (AppError), response helpers, prisma factory
      ├─ middleware/       requestId, httpLogger, rateLimit, validate, notFound, errorHandler
      ├─ integrations/     payments/ and notifications/: provider CONTRACTS (implemented later)
      ├─ jobs/             reserved for the background worker (Phase 12)
      └─ modules/          one folder per feature: routes, controller, service, schemas, tests
```

A server feature module (added phase by phase) follows this shape:
`x.routes.ts` (wiring + `requirePermission` + `validate`) → `x.controller.ts` (thin HTTP adapter) →
`x.service.ts` (business rules, Prisma calls) → `x.schemas.ts` (Zod). There is no repository layer:
Prisma is already the data-access layer.

## Request pipeline (server)

```
requestId → httpLogger → helmet → cors → rateLimit → json(100kb) → /api/v1 routers
          → notFound → errorHandler
```

- **Dependency injection:** `createApp({ env, logger, prisma })` receives everything it needs; nothing
  reads `process.env` after startup, so tests build isolated apps with a stub database.
- **Fail fast:** `loadEnv()` validates configuration with Zod. Missing or invalid variables stop the
  process with a list of problems (names only, never secret values). Production additionally requires
  an https `CLIENT_URL`, and secrets that are ≥ 32 characters, distinct and not placeholders.
- **Logging:** Pino JSON. Redacts authorization headers, cookies, passwords and tokens; the request log
  contains method, path (no query string), status and request id only.
- **Validation:** `validate({ body, query, params })` parses with Zod, strips unknown fields, and returns
  a 400 listing every problem. Typed access via `getValidated`. Backend validation is mandatory; frontend
  validation is UX only.

## API conventions

- Base path `/api/v1`. Success: `{ "data": … }` or `{ "data": …, "meta": … }`.
  Errors: `{ "error": { "code", "message", "details?" } }`.
- Codes: `BAD_REQUEST`, `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
  `PAYLOAD_TOO_LARGE`, `RATE_LIMITED`, `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`.
- Unexpected errors always return a generic 500; stack traces and internal messages are only logged.
- Prisma constraint errors are mapped centrally (unique → 409, foreign key → 409, not found → 404).
- `GET /api/v1/health` (liveness, no DB) and `GET /api/v1/health/ready` (checks the database, 503 if down).
- Timestamps on the wire are ISO-8601 UTC; money is integer paise.

## Data conventions

See [erd.md](erd.md). In short: UUIDv7 keys, integer paise for money, `timestamptz` (UTC) for instants,
`date` for calendar dates, minutes-from-midnight for recurring weekly windows, soft delete only where
history matters, and hand-written SQL constraints for what Prisma cannot express (double-booking).

## Authentication and roles (built in Phase 3)

- Password hashing with bcrypt (cost 12). 15-minute access JWT kept **in memory** by the SPA.
- Refresh token: random 256-bit value in an httpOnly, Secure, SameSite=Strict cookie scoped to
  `/api/v1/auth`; only its SHA-256 hash is stored. Rotated on every use with reuse detection by family.
- One `role` per user: `SUPER_ADMIN`, `OWNER`, `ADMIN`, `INSTRUCTOR`, `STUDENT`. Permissions are explicit
  strings mapped from roles in one file and enforced by `requirePermission(...)`. **Ownership is enforced
  in the query** (`where: { id, userId }`); records that are not yours return 404.
- The client's `RequireRole` guard is a UX layer only. The API re-authorizes every request.

## Booking (Phases 6–8)

`Enquiry → (staff convert) → Student + Enrollment → Booking (requested) → Lesson (instructor + vehicle)`.
Overlap protection is enforced by PostgreSQL `EXCLUDE` constraints on `Lesson` (same instructor / same
vehicle, half-open time ranges, active statuses only). The API translates SQLSTATE `23P01` to HTTP 409.
Business hours and slot generation are computed server-side in `Asia/Kolkata`.

## Payments and notifications

- Payment logic hides behind `integrations/payments/payment-provider.ts`. Phase 9 ships a manual provider;
  Razorpay can implement the same interface later. Secret keys never reach the browser.
- Notifications use an outbox (`Notification` rows) plus channel providers behind
  `integrations/notifications/notification-channel.ts`. V1: in-app and email; WhatsApp is click-to-chat only.

## Frontend conventions

- Server state with TanStack Query; auth state in a single context; no global store.
- Forms with React Hook Form + Zod through the `FormField` wrapper (label, hint, error, ARIA wiring).
- Public pages are in the main bundle; admin/student/instructor areas are lazy-loaded.
- Design tokens (Tailwind v4 `@theme`) live in `client/src/styles/index.css`: `brand` navy, `accent` red
  (reserved for the primary CTA), `signal` road-sign yellow (tiny accents), warm `sand` neutrals.
- Every list/section needs loading, error and empty states. Empty states are preferred over sample data.

## Public website (Phase 2)

- **Pages:** `/`, `/about`, `/courses`, `/packages`, `/packages/:slug`, `/rta-services`, `/contact`, `/book`, `/faq`,
  `/reviews` (all under `PublicLayout`; only the home page is in the main bundle, the rest are lazy chunks).
- **Data:** every business fact and catalogue item comes from `GET /api/v1/public/*`. Loading, error and empty states
  exist for each. Nothing is fabricated: no packages means an enquiry call to action, no reviews means the section is
  hidden (home) or an invitation (reviews page), no RTA services means a "contact us" card.
- **Public API** (`server/src/modules/public`): `catalog.service.ts` reads with explicit `select` allow-lists (only display
  fields are ever read), `enquiries.service.ts` creates leads, `public.routes.ts` wires rate limiting, the honeypot and
  validation. Packages and RTA services are visible only when `ACTIVE` and not deleted; only `APPROVED` reviews are public.
- **Enquiry abuse protection:** per-IP rate limit (`ENQUIRY_RATE_LIMIT_MAX`/hour), hidden honeypot field (bots get a normal
  success response but nothing is stored), strict Zod validation with text normalisation (HTML and control characters
  stripped, Indian mobile normalised to E.164), consent stored as a timestamp, 10-minute duplicate suppression per phone.
  The client IP is used only in memory for rate limiting and is never stored.
- **SEO:** per-page title, description, Open Graph and Twitter tags (`Seo`), canonical URLs when `VITE_SITE_URL` is set,
  `DrivingSchool` JSON-LD built only from real data (no ratings, hours, price range), `/robots.txt` and `/sitemap.xml`
  generated by the API from `CLIENT_URL` and the database.
- **Brand assets:** temporary text logo and vector hero artwork, replaceable via `client/src/config/brand.ts`.
- **Resilience:** `config/business-defaults.ts` holds the card-printed facts as a fallback only, so call, WhatsApp and
  address never disappear if the API is slow or down.

## Roadmap

| Phase | Scope                                                           | Status   |
| ----- | --------------------------------------------------------------- | -------- |
| 1     | Architecture and project foundation                             | **Done** |
| 2     | Brand/design system and public website (incl. enquiry form)     | Next     |
| 3     | Authentication and roles                                        |          |
| 4     | Admin foundation (+ Packages, Branches, Settings, RTA, Reviews) |          |
| 5     | Students and instructors, enquiry conversion                    |          |
| 6     | Enrollments and bookings                                        |          |
| 7     | Lessons and progress                                            |          |
| 8     | Vehicles and scheduling (availability, conflict handling)       |          |
| 9     | Payments (manual ledger, provider interface)                    |          |
| 10    | Student portal                                                  |          |
| 11    | Instructor portal                                               |          |
| 12    | Notifications and reports                                       |          |
| 13    | Security, performance and testing                               |          |
| 14    | Production deployment                                           |          |
