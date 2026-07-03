# Deploying the demo site to Vercel (Git integration)

The `demo` branch is configured to deploy on Vercel. Because this is an Nx
monorepo whose Nuxt app lives in `apps/travel-frontend`, the settings below
are non-default — follow them exactly the first time you connect the project.

## What's already in the repo

- **`apps/travel-frontend/vercel.json`** — pins the install/build commands so
  they run from the workspace root (where `nx` and `nuxt` are installed) while
  the project's **Root Directory** stays at the app, so Nitro's Vercel output
  (`apps/travel-frontend/.vercel/output`) lands exactly where Vercel expects it.
- Nitro auto-detects Vercel (`VERCEL=1`) and emits the Build Output API bundle,
  so **SSR and all `/server/api` routes** (contact, bookings, newsletter, trips)
  run as serverless functions — no static-export limitations.

## One-time setup in the Vercel dashboard

1. **New Project → Import** the GitHub repo `mrososs/womans-travel`.
2. **Root Directory:** set to `apps/travel-frontend` (click *Edit* next to the
   root directory during import). Keep *"Include files outside the root
   directory"* enabled (default) so the workspace `libs/*` are available.
3. **Framework Preset:** Nuxt.js (auto-detected). Leave Build/Install/Output
   command fields **empty** — `vercel.json` supplies them.
4. **Environment Variables** (Settings → Environment Variables), for the
   Production *and* Preview environments:

   | Name           | Value                                   |
   | -------------- | --------------------------------------- |
   | `SUPABASE_URL` | your Supabase project URL               |
   | `SUPABASE_KEY` | your Supabase anon (public) key         |

   These are required at **build time** — the `@nuxtjs/supabase` module fails
   the build if they're missing. Find them in Supabase → Project Settings → API.
5. **Production branch:** to serve the demo at the main production URL, go to
   Settings → Git → Production Branch and set it to `demo`. (Otherwise pushes to
   `demo` publish as Preview deployments with their own URL — also fine.)

## After that

Every push to `demo` triggers an automatic deploy. The `ignoreCommand`
(`nx-ignore travel-frontend`) skips the build when a commit doesn't affect the
app or its dependencies, saving build minutes.

## Verifying a build locally

```bash
VERCEL=1 npx nx build travel-frontend
```

produces `apps/travel-frontend/.vercel/output/` (config.json + functions +
static). On Windows this may end with an `os error 1314` symlink-permission
error *after* the bundle is written — that's a local-only issue; Vercel's Linux
builders are unaffected.
