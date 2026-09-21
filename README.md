# Sri Sai Balaji Driving School: Website

The website for **Sri Sai Balaji Driving School** (Kondapur and Hafeezpet, Hyderabad): a fast, single-page
marketing site with a WhatsApp enquiry form.

There is **no backend and no database**. Visitors send an enquiry by tapping "Send" in WhatsApp; nothing is
stored on a server. To change the content, edit a file and redeploy.

## Technology

React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7, React Hook Form + Zod, Vitest + Testing Library.
Deployed to Vercel as a static site (`vercel.json`).

## Getting started

Requires Node.js ≥ 22.12.

```bash
npm install
npm run dev        # http://localhost:5273 (a dedicated port with strictPort; override with VITE_DEV_PORT)
```

| Command                | What it does                                   |
| ---------------------- | ---------------------------------------------- |
| `npm run build`        | Type-check and build to `client/dist`          |
| `npm run preview`      | Serve the production build locally             |
| `npm run test`         | Run all tests (Vitest)                         |
| `npm run lint`         | ESLint                                         |
| `npm run typecheck`    | TypeScript                                     |
| `npm run format`       | Format everything with Prettier                |
| `npm run format:check` | Verify formatting                              |
| `npm run check`        | format:check + lint + typecheck + test + build |

Configuration is optional. Copy `client/.env.example` to `client/.env.local` to set `VITE_SITE_URL` (the public
origin, used for canonical and Open Graph URLs). Never put secrets in `VITE_*` values: they reach the browser.

## Changing the content

Everything the site says about the business lives in two files:

- `client/src/config/business-defaults.ts`: name, phone numbers, address, recognition line, services.
- `client/src/features/public/content.ts`: branches, **training plans**, **RTA services** and **reviews**.

Only facts confirmed from the business card are filled in. Plans, RTA services and reviews are empty on purpose,
and the sections that depend on them hide themselves (or show a "contact us" prompt) rather than invent content.
Add real entries to those arrays and the pages update.

### Logo and photography

The client's real logo and photographs are not available yet. The site uses a temporary text logo and
royalty-free **stock photographs** (Unsplash licence). They are _not_ pictures of the school's own cars,
instructors or learners, and nothing on the site claims they are.

- Logo: set `brandLogo` in `client/src/config/brand.ts`.
- Photos: put the school's own images in `client/src/assets/photos/` and point the matching entry in
  `client/src/config/photos.ts` at the new file (keep the key). No component changes are needed.

### Link preview (WhatsApp, Facebook, Google)

When someone shares the site link, the card they see is `client/public/og-image.jpg` (1200×630) with the page
title and description from `client/index.html`. Replace the image when real photos arrive. The preview only
works once `VITE_SITE_URL` is set to the real domain (crawlers need absolute URLs), and `apple-touch-icon.png`
is the home-screen icon.

## How enquiries work

The form on the page validates the name and mobile number, then builds a ready-to-send WhatsApp message
(`client/src/features/enquiry/message.ts`) addressed to the school's WhatsApp number. The visitor taps "Send".
The site states that this is an enquiry, not a confirmed booking.

## Going live

`vercel.json` currently sends `X-Robots-Tag: noindex, nofollow` so the preview site stays out of search results.
**Remove that header when the real domain goes live**, and set `VITE_SITE_URL`.

## Repository layout

```
client/   the React app (the whole website)
docs/     architecture and decisions
```

See [docs/architecture.md](docs/architecture.md) and [docs/decisions.md](docs/decisions.md).
