# GrowthPilot — Netlify deployment guide

This project is a Next.js 15 app using Postgres (via Drizzle ORM), Resend, Gmail OAuth, and Google auth. It is **not** a Cloudflare Workers / OpenNext app anymore — the Cloudflare deps have been removed from `package.json` and the Next.js/SSR paths use standard Vercel/Netlify serverless functions.

## Prerequisites

- Node.js 20+
- A Vercel or Netlify account
- A PostgreSQL database (Neon, Supabase, Vercel Postgres, Railway, …). The app falls back to an in-memory demo store when `DATABASE_URL` is unset, so local dev works without a database.
- A Google OAuth client for the Gmail connector + Google sign-in
- (Optional) a Resend API key for real email sending

## Local-first

```bash
npm install
cp .env.local .env.local   # already present with placeholder values; replace with your real secrets
npm run db:push                     # create/upgrade the DB schema (requires DATABASE_URL set)
npm run dev                         # http://localhost:3000
```

Local `DATABASE_URL` is optional — the app falls back to an in-memory store when unset. In production you **must** set `DATABASE_URL` to a real Postgres connection string.

## Deploy to Netlify

1. Push this repo to GitHub/GitLab.
2. In Netlify, **Add new site → Import an existing project**.
   - Build command: `npm run build`
   - Publish directory: `.next`
   - (Netlify will use the serverless function handler automatically from `.next`)
3. **Environment variables** (Netlify → Site settings → Environment variables):
   - `DATABASE_URL` (production Postgres connection string)
   - `AUTH_SECRET` (random 32-byte hex)
   - `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `RESEND_API_KEY` (optional, for real Resend sending)
   - `CRON_SECRET` (random 32-byte hex, used by the cron API routes)
   - `NEXT_PUBLIC_SITE_URL` = your production Netlify URL (e.g. `https://growthpilot.netlify.app`)
4. **Post-deploy**:
   - `npm run db:push` won't work against the live DB from your laptop unless `DATABASE_URL` is pointed at prod — you can also run Drizzle migrations via a deploy plugin or a one-off function. For a first push, either:
     - point a local `DATABASE_URL` at a prod read/write DB and run `npm run db:push`, or
     - use a Drizzle deploy action / serverless migration helper.
5. **Verify**:
   - Open the live URL, sign up / sign in, connect Gmail, send a draft.

## Cron jobs (Netlify)

Netlify Functions don't have built-in cron the same way — the `vercel.json` file here uses the Vercel cron schedule format. If you deploy to **Netlify**, you have two options:

- **Route the cron endpoints through an external scheduler** (e.g. a cron-job.org or GitHub Actions cron that hits `https://growthpilot.netlify.app/api/cron/outreach` every weekday at 10:15 UTC, and the autopilot/followups endpoints on their schedules).
- **Move to Vercel** instead of Netlify if you want native cron schedules — the `vercel.json` is ready for Vercel.

If you prefer Netlify Functions with cron, there is a Vercel→Netlify mapping you can enable via a build plugin, but an external cron pinger is the simplest portable path.

## Gmail / Google OAuth redirect URIs to register

Regardless of deploy target, register these on your Google OAuth client (origin replaces with your live domain):

- `https://<your-domain>/api/mail/callback/gmail` — Gmail connector
- `https://<your-domain>/api/auth/google/callback` — Google sign-in

For local dev: `http://localhost:3000` variants of both.

## Env var checklist

| Variable | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | prod | Postgres connection string |
| `AUTH_SECRET` | prod | session signing secret |
| `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` | for Gmail connector | Google OAuth client |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | for Google sign-in | Google OAuth client (can share the same client as Gmail) |
| `RESEND_API_KEY` | optional | real email sending via Resend |
| `OPENAI_API_KEY` | optional | real LLM when you turn off demo mode |
| `CRON_SECRET` | prod (for cron endpoints) | shared secret the cron pinger sends as a header / query param |
| `NEXT_PUBLIC_SITE_URL` | prod | canonical public origin (used for unsubscribe links, OAuth redirect URIs) |

## Notes

- This scaffold removed `@opennextjs/cloudflare`, `wrangler`, and the Freebuff-generated `freebuff.*` config files from the dependency graph. If you already deployed to Freebuff Sites, those files are gone — redeploying to Netlify/Vercel is now a normal Next.js deploy, no OpenNext adapter needed.
- The `next.config.ts` externalizes the Node built-ins `postgres` needs (net, tls, crypto, stream, perf_hooks) so the serverless functions bundle cleanly. The Netlify build uses `.next` as the publish directory.
