import type { Config } from 'tailwindcss';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default {
  content: [
    // App files
    join(currentDir, 'app/**/*.{vue,js,ts,jsx,tsx}'),
    join(currentDir, 'components/**/*.{vue,js,ts,jsx,tsx}'),
    join(currentDir, 'pages/**/*.{vue,js,ts,jsx,tsx}'),
    join(currentDir, 'app.vue'),
    // Shared UI library so Tailwind classes used there are not purged
    join(currentDir, '../../libs/shared-ui/src/**/*.{vue,js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
