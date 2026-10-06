# Movieo

A movie and TV discovery front end. Catalogue data and artwork come from
[TMDB](https://www.themoviedb.org/); playback and download links are handed off
to third-party embed providers. The app hosts no media files.

## Requirements

- Node.js 22
- A TMDB API key. Multiple keys are supported: provide them comma-separated to
  rotate across the rate limit.

## Environment

Create `.env.local`:

```bash
TMDB_API_KEYS=your_key_here
```

Optional, all with safe defaults:

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for `metadataBase`, Open Graph, sitemap, and robots | `https://movieo.app` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact address on the legal pages | `contact@example.com` |
| `NEXT_PUBLIC_SENTRY_DSN` | Enables client-side error reporting | unset (console only) |

## Commands

```bash
npm run dev            # Next.js dev server
npm run build          # next build
npm start              # next start

npm run dev:vinext     # vinext dev (Workers runtime), port 3001
npm run build:vinext   # vinext build
npm run start:vinext   # wrangler dev against the built output
npm run deploy:vinext  # deploy to Cloudflare Workers
```

Deployment targets Cloudflare Workers via [`vinext`](https://github.com/lakehq/vinext)
and is driven by `.github/workflows/deploy.yml`, which runs typecheck, lint, and
build before deploying. `wrangler.jsonc` declares a `RATE_LIMITER` binding used
by `lib/rate-limit.ts`; without it the limiter falls back to a bounded
per-isolate map.

## Structure

```
app/                  routes; app/api/* are the server endpoints
components/           UI, all client components where interactive
lib/tmdb/client.ts    the only module that talks to the TMDB API
lib/tmdb/safe.ts      failure-tolerant wrappers used during prerender
lib/use-dialog.ts    shared modal behaviour (focus trap, scroll lock, Escape)
lib/rate-limit.ts    Cloudflare rate limiting with an in-memory fallback
```

## Notes for contributors

- Every TMDB read on a prerendered page goes through `safeLoad` from
  `lib/tmdb/safe.ts`. A third-party network blip must not fail the build.
- New overlays should use `useDialog` from `lib/use-dialog.ts` rather than
  hand-rolling keydown and body-scroll handling.
- Client-side data fetches check `res.ok` and distinguish a failed request from
  an empty result. Call `reportError` from `lib/error-reporting.ts` on failure.
- The dark solid palette is deliberate. Do not reintroduce glass effects or
  `backdrop-filter`.
