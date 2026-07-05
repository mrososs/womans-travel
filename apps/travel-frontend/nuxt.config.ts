import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineNuxtConfig } from 'nuxt/config';

const currentDir = dirname(fileURLToPath(import.meta.url));
const libsDir = resolve(currentDir, '../../libs');

// Supabase project origin (REST + Realtime + Storage) — whitelisted in the CSP
// connect-src / img-src. Wildcards kept as a fallback for storage subdomains.
const SUPABASE_ORIGIN = 'https://snqujifbaottvysziysj.supabase.co';

// Content-Security-Policy. 'unsafe-inline' is required for scripts because Nuxt
// injects the inline hydration payload, and for styles because of scoped/inline
// styles; 'unsafe-eval' is intentionally NOT allowed. Fonts come from Google
// Fonts; images may come from Supabase Storage and other https hosts.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${SUPABASE_ORIGIN} wss://snqujifbaottvysziysj.supabase.co https://*.supabase.co wss://*.supabase.co`,
  'upgrade-insecure-requests',
].join('; ');

// Security response headers applied to every route (see routeRules below).
const SECURITY_HEADERS = {
  'content-security-policy': CSP,
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'x-frame-options': 'SAMEORIGIN',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  'x-dns-prefetch-control': 'off',
};

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
    // Crossfade + subtle lift between routes (CSS in app/assets/css/site.css).
    // Reduced-motion users get an instant swap via the media query there.
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: {
        dir: 'rtl',
        lang: 'ar',
      },
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/brand/icon-512.png' },
        { rel: 'apple-touch-icon', href: '/brand/apple-touch-icon.png' },
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
        // First-paint splash logo — preload so the brand lockup renders instantly.
        {
          rel: 'preload',
          as: 'image',
          href: '/brand/logo-lockup.png',
          type: 'image/png',
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
    // Security headers on every response.
    '/**': { headers: { ...SECURITY_HEADERS } },
    '/hero/**': {
      headers: {
        ...SECURITY_HEADERS,
        'cache-control': 'public, max-age=604800, stale-while-revalidate=86400',
      },
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
