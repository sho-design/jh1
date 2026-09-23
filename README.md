# JH1 Parts

Instant-quote 3D printing for the GTA. Own FDM and SLA farm for the fast lane; SLS, MJF and metal routed to vetted partners.
Built from the KNGHT blueprint: Next.js on Vercel, Stripe, Neon Postgres, GitHub.

> Sample build. Rates in `lib/pricing.ts`, names, phone and address are placeholders until the discovery brief comes back.

## What works today (week 0)

- Homepage with a live quote tool: drop an STL (or use the sample part) and get a price in CAD across Economy, Standard and Expedited.
- `/quote`: full quote with material, finish, quantity, PO number and line items.
- `/api/checkout`: recomputes the price on the server and opens Stripe Checkout in CAD. Runs in demo mode until `STRIPE_SECRET_KEY` is set.
- Process pages for FDM, SLA, SLS, MJF and metal.
- Database schema (`db/schema.ts`) for quotes, parts, orders, jobs, printers and partners.
- Pricing regression tests and CI on every pull request.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
npm test
```

## Repository map

| Path | Holds |
| --- | --- |
| `app/` | Pages and the checkout API route |
| `components/QuoteTool.tsx` | Upload, instant price, lead-time picker |
| `lib/pricing.ts` | Versioned pricing engine. Every rate change bumps `PRICING_VERSION` |
| `lib/stl.ts` | In-browser STL measurement |
| `db/schema.ts` | Drizzle schema for Neon Postgres |
| `services/geometry/` | Python worker for STL, 3MF, OBJ and STEP (deploys to Fly.io) |
| `tests/` | Pricing regression suite |
| `.github/` | CI, Dependabot, pull request template |

## Pricing rule

Changing any rate without bumping `PRICING_VERSION` and updating the locked values in `tests/pricing.test.ts` fails CI. Every price decision is a reviewed pull request.

## Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Vercel | Enables real checkout (use test keys first) |
| `STRIPE_TAX` | Vercel | Set to `on` once Stripe Tax is configured for GST and HST |
| `NEXT_PUBLIC_SITE_URL` | Vercel (optional) | Redirect URLs and sitemap. Leave unset to use the Vercel production URL |
| `DATABASE_URL` | Vercel (Neon integration) | Postgres connection |

## Build sequence

- **Week 0:** repo, CI, Vercel, Neon and Stripe connected. This scaffold.
- **Weeks 1 to 3:** file storage in Vercel Blob, quotes and orders saved to Postgres, Stripe webhooks, order emails (Resend).
- **Weeks 4 to 6:** production queue, printer status from Klipper or OctoPrint, shipping labels (EasyPost), QA photos, reorder.
- **Weeks 7 to 10:** STEP support via the geometry worker, partner routing, AI printability explanations, PO invoicing, more process pages.
