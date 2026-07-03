# Deploying to Vercel (Git integration)

This is an Nx monorepo whose Nuxt app lives in `apps/travel-frontend`. The
root **`vercel.json`** makes it deploy correctly with Vercel's **default Root
Directory (the repo root)** — no monorepo Root Directory change required.

## How it works

`vercel.json` (repo root):

- `installCommand`: `npm install` — installs the workspace deps at the root.
- `buildCommand`: builds the app with Nx, then **moves** Nitro's Vercel output
  from `apps/travel-frontend/.vercel/output` to the repo-root `.vercel/output`,
  which is where Vercel looks for the Build Output API bundle.
- `framework: null` — we hand Vercel a prebuilt BOA bundle, so no framework
  auto-detection. Nitro still auto-selects its Vercel preset from the `VERCEL=1`
  build env, so **SSR and all `/server/api` routes run as functions**.
- `ignoreCommand`: `nx-ignore travel-frontend` — skips builds when a commit
  doesn't affect the app.

## Required dashboard settings

Open the project → **Settings**:

1. **Git → Production Branch:** set to **`demo`** (it defaults to the repo's
   default branch, `dev` — that's why the first deploy built dev).
2. **General → Root Directory:** leave it at the **repo root** (blank/default).
   Do **not** set it to `apps/travel-frontend` — the root `vercel.json` already
   handles the monorepo.
3. **Environment Variables** (Production + Preview) — required at **build time**;
   the `@nuxtjs/supabase` module fails the build if they're missing:

   | Name           | Value                              |
   | -------------- | ---------------------------------- |
   | `SUPABASE_URL` | your Supabase project URL          |
   | `SUPABASE_KEY` | your Supabase anon (public) key    |

4. **Redeploy** (Deployments → ⋯ → Redeploy, or push a new commit to `demo`).
   Use "Redeploy" **without** the build cache the first time after changing
   these settings.

## Why the first attempt 404'd

The project was imported with the default Root Directory (repo root), so Vercel
read no `vercel.json` (the earlier one was under `apps/travel-frontend/`), found
only the root `@org/source` package with no framework, and produced no servable
output → 404. The root `vercel.json` added here fixes that.

## Verify a build locally

```bash
VERCEL=1 npx nx build travel-frontend
# then the relocate the buildCommand does:
rm -rf .vercel/output && mkdir -p .vercel && mv apps/travel-frontend/.vercel/output .vercel/output
ls .vercel/output   # -> config.json  functions/  static/  nitro.json
```

On Windows the Nx build may end with an `os error 1314` symlink-permission
error *after* the bundle is written — local-only; Vercel's Linux builders are
unaffected.
