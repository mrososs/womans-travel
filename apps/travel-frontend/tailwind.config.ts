import type { Config } from 'tailwindcss';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));

/**
 * Tailwind theme wired to the Durrah design tokens (tokens.css).
 * Colors/radii/shadows reference the CSS custom properties so the
 * tokens remain the single source of truth; components may also use
 * `var(--token)` directly in scoped styles.
 */
export default {
  content: [
    join(currentDir, 'app/**/*.{vue,js,ts,jsx,tsx}'),
    join(currentDir, 'app.vue'),
    join(currentDir, '../../libs/shared-ui/src/**/*.{vue,js,ts,jsx,tsx}'),
  ],
  theme: {
    // Design-system breakpoints (mobile-first): 620 / 860 / 980 / 1200
    screens: {
      sm: '620px',
      md: '860px',
      lg: '980px',
      xl: '1200px',
    },
    extend: {
      colors: {
        rose: {
          50: 'var(--rose-50)',
          100: 'var(--rose-100)',
          200: 'var(--rose-200)',
          300: 'var(--rose-300)',
          400: 'var(--rose-400)',
          500: 'var(--rose-500)',
          600: 'var(--rose-600)',
          700: 'var(--rose-700)',
          800: 'var(--rose-800)',
        },
        gold: {
          100: 'var(--gold-100)',
          200: 'var(--gold-200)',
          300: 'var(--gold-300)',
          400: 'var(--gold-400)',
          500: 'var(--gold-500)',
          600: 'var(--gold-600)',
        },
        navy: {
          500: 'var(--navy-500)',
          600: 'var(--navy-600)',
          700: 'var(--navy-700)',
          800: 'var(--navy-800)',
          900: 'var(--navy-900)',
        },
        pearl: 'var(--pearl)',
        cream: 'var(--cream)',
        sand: 'var(--sand)',
        // Semantic aliases
        brand: 'var(--brand)',
        'brand-solid': 'var(--brand-solid)',
        'brand-strong': 'var(--brand-strong)',
        'brand-soft': 'var(--brand-soft)',
        'text-strong': 'var(--text-strong)',
        'text-body': 'var(--text-body)',
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',
        'surface-card': 'var(--surface-card)',
        'surface-cream': 'var(--surface-cream)',
        'surface-navy': 'var(--surface-navy)',
        'border-soft': 'var(--border-soft)',
        'border-default': 'var(--border-default)',
      },
      fontFamily: {
        display: ['Cairo', 'Tajawal', 'Almarai', 'system-ui', 'sans-serif'],
        body: ['Tajawal', 'Cairo', 'Almarai', 'system-ui', 'sans-serif'],
        alt: ['Almarai', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': 'var(--text-2xs)',
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        '4xl': 'var(--text-4xl)',
        '5xl': 'var(--text-5xl)',
        '6xl': 'var(--text-6xl)',
        '7xl': 'var(--text-7xl)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        rose: 'var(--shadow-rose)',
        gold: 'var(--shadow-gold)',
      },
      maxWidth: {
        container: 'var(--container-xl)',
      },
      backgroundImage: {
        'grad-rose': 'var(--grad-rose)',
        'grad-gold': 'var(--grad-gold)',
        'grad-navy': 'var(--grad-navy)',
        'grad-pearl': 'var(--grad-pearl)',
        'grad-scrim': 'var(--grad-scrim)',
      },
    },
  },
  plugins: [],
} satisfies Config;
