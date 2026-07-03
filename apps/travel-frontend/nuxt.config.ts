import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineNuxtConfig } from 'nuxt/config';

const currentDir = dirname(fileURLToPath(import.meta.url));
const libsDir = resolve(currentDir, '../../libs');

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  workspaceDir: '../../',
  devtools: { enabled: true },
  devServer: {
    host: 'localhost',
    port: 4200,
  },

  // Saudi Women's Travel Agency — Arabic-first (RTL). `dir`/`lang` are set
  // dynamically per locale via useLocaleHead() (see app.vue); the values here
  // are just the SSR default for the Arabic (default) locale.
  app: {
    head: {
      htmlAttrs: {
        dir: 'rtl',
        lang: 'ar',
      },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        // Preload the LCP hero image so the browser discovers it from the
        // initial HTML (removes the ~570ms LCP "load delay" measured on the
        // first slide of HeroCarousel — /hero/hero-1.webp).
        {
          rel: 'preload',
          as: 'image',
          href: '/hero/hero-1.webp',
          type: 'image/webp',
          fetchpriority: 'high',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;800&family=Almarai:wght@300;400;700;800&display=swap',
        },
      ],
    },
  },

  // Long-lived caching for static hero/marketing images (served with
  // `max-age=0, must-revalidate` by default, forcing a revalidation on every
  // repeat visit). These files are content-stable, so cache them for a week.
  routeRules: {
    '/hero/**': {
      headers: { 'cache-control': 'public, max-age=604800, stale-while-revalidate=86400' },
    },
  },

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase', '@nuxtjs/i18n'],

  // Bilingual: Arabic (default, RTL) at "/", English (LTR) under "/en".
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'ar',
    langDir: 'locales',
    locales: [
      { code: 'ar', language: 'ar-SA', name: 'العربية', dir: 'rtl', file: 'ar.json' },
      { code: 'en', language: 'en-US', name: 'English', dir: 'ltr', file: 'en.json' },
    ],
    detectBrowserLanguage: false,
    bundle: { optimizeTranslationDirective: false },
  },

  // Supabase connection is read from SUPABASE_URL / SUPABASE_KEY (see .env.example).
  // `redirect: false` keeps auth-gating opt-in while we scaffold; enable per-route later.
  supabase: {
    redirect: false,
  },

  tailwindcss: {
    // Tailwind config + entry CSS live in the app.
    cssPath: '~/assets/css/styles.css',
    configPath: resolve(currentDir, 'tailwind.config.ts'),
  },

  typescript: {
    // Build-time type checking is disabled: the bundled vue-tsc / @vue/language-core
    // currently crashes on vue-router's Volar plugin ("sfc-route-blocks"). Type-check
    // in the IDE (Volar) or via a dedicated step once those versions align.
    typeCheck: false,
    tsConfig: {
      extends: '../../../tsconfig.base.json', // Nuxt copies this string as-is to the `./.nuxt/tsconfig.json`, therefore it needs to be relative to that directory
    },
  },

  imports: {
    autoImport: true,
  },

  css: ['~/assets/css/styles.css', '~/assets/css/site.css'],

  // Resolve the Nx workspace libraries by their package names in both the
  // Vite (client) and Nitro (server) builds. These explicit aliases replace the
  // (now-removed) @nx/vite `nxViteTsPaths` plugin, which triggered Nx project-
  // graph / Nx Cloud computation and hung the Vercel build. They mirror the
  // `paths` in tsconfig.base.json, so path resolution is unchanged.
  alias: {
    '@org/shared-ui': resolve(libsDir, 'shared-ui/src/index.ts'),
    '@org/shared-utils': resolve(libsDir, 'shared-utils/src/index.ts'),
    '@org/supabase-client': resolve(libsDir, 'supabase-client/src/index.ts'),
  },
});
