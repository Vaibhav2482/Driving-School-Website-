# Architecture

## Overview

A static, single-page React site. No server, database, authentication or API. Business content is TypeScript data
in the repository; enquiries leave the browser as a WhatsApp click-to-chat link.

```
Visitor's browser ──► Vercel (static files)
        │
        └── enquiry form ──► wa.me link ──► the school's WhatsApp
```

## Repository layout

```
client/src/
  app/          App, routes (single page + redirects for old URLs)
  assets/       photos
  components/
    common/     FormField, Seo, JsonLd, FullPageSpinner
    site/       page sections (hero, plans, pickup, RTA, FAQ, contact, header, footer, ...)
    ui/         button and form-control style helpers
  config/       brand, business-defaults, photos, public-nav, site, env
  features/
    enquiry/    EnquiryForm, schema (Zod), message (WhatsApp text)
    public/     content (the site's data), hooks, business helpers, FAQ, structured data, labels
  layouts/      PublicLayout (header, main, footer, mobile action bar)
  lib/          contact (tel and WhatsApp links), format, time, cn
  pages/        HomePage, 404 and route-error pages
  styles/       Tailwind v4 theme tokens (index.css)
docs/
```

## The page

`HomePage` renders all sections in order; each has an `id` that the header menu scrolls to
(`config/public-nav.ts`). Old multi-page URLs (`/about`, `/packages`, `/book`, ...) redirect to the matching
section (`app/routes.tsx`). Unknown URLs get a 404 inside the site layout.

## Content

`features/public/content.ts` is the single source of site content, read through hooks in `hooks.ts`. The hooks are
synchronous, so there are no loading or error states. Nothing is fabricated: no plans means a "contact us"
prompt, no reviews means the section is hidden, no RTA services means a "contact us" card. Tests swap content with
`setContentForTests` and it is reset after every test.

## Enquiry form

React Hook Form + Zod (`schema.ts`): name and an Indian mobile number are required; plan, branch, date, time
window, pickup address and message are optional. On submit, `message.ts` composes the text (only fields the
visitor filled in) and `lib/contact.ts` builds the `wa.me` link. The form never claims a booking is confirmed
and promises no response time.

## Frontend conventions

- Forms go through the `FormField` wrapper (label, hint, error, ARIA wiring). After a failed submit the first
  invalid control gets focus.
- Design tokens (Tailwind v4 `@theme`) live in `client/src/styles/index.css`. See `docs/decisions.md` for the
  visual identity.
- Prefer empty states over sample data.

## SEO

Per-page title, description, Open Graph and Twitter tags (`Seo`); canonical URLs when `VITE_SITE_URL` is set;
`DrivingSchool` JSON-LD built only from confirmed data (no ratings, hours or price range). Crawling is blocked
by header in `vercel.json` until launch.

## Deployment

Vercel: `npm ci`, `npm run build`, serve `client/dist`, with a rewrite of all paths to `/index.html`.
