import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
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

  // Saudi Women's Travel Agency — Arabic, right-to-left by default.
  app: {
    head: {
      htmlAttrs: {
        dir: 'rtl',
        lang: 'ar',
      },
    },
  },

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],

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

  css: ['~/assets/css/styles.css'],

  // Resolve the Nx workspace libraries by their package names in both the
  // Vite (client) and Nitro (server) builds.
  alias: {
    '@org/shared-ui': resolve(libsDir, 'shared-ui/src/index.ts'),
    '@org/shared-utils': resolve(libsDir, 'shared-utils/src/index.ts'),
    '@org/supabase-client': resolve(libsDir, 'supabase-client/src/index.ts'),
  },

  vite: {
    plugins: [nxViteTsPaths()],
  },
});
