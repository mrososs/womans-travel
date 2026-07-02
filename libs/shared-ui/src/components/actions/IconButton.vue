<script setup lang="ts">
import { computed } from 'vue';

/**
 * IconButton — circular icon-only button. Always provide an accessible `label`.
 * Put the icon in the default slot.
 */
type Variant = 'ghost' | 'solid' | 'soft' | 'glass';
type Size = 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    label: string;
    variant?: Variant;
    size?: Size;
    disabled?: boolean;
  }>(),
  { variant: 'ghost', size: 'md', disabled: false }
);

const classes = computed(() => [
  'drh-iconbtn',
  `drh-iconbtn--${props.variant}`,
  `drh-iconbtn--${props.size}`,
]);
</script>

<template>
  <button type="button" :class="classes" :aria-label="label" :disabled="disabled">
    <slot />
  </button>
</template>

<style>
.drh-iconbtn {
  --_bg: var(--surface-card);
  --_fg: var(--text-body);
  --_bd: var(--border-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--_bd);
  background: var(--_bg);
  color: var(--_fg);
  border-radius: var(--radius-circle);
  cursor: pointer;
  padding: 0;
  transition: transform var(--dur-fast) var(--ease-standard),
    background var(--dur-base) var(--ease-standard),
    color var(--dur-base) var(--ease-standard),
    box-shadow var(--dur-base) var(--ease-standard);
}
.drh-iconbtn:hover { box-shadow: var(--shadow-sm); }
.drh-iconbtn:active { transform: scale(0.92); }
.drh-iconbtn:focus-visible { outline: none; box-shadow: var(--ring-brand); }
.drh-iconbtn[disabled] { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
.drh-iconbtn svg { width: 1.25em; height: 1.25em; }

.drh-iconbtn--sm { width: 40px; height: 40px; font-size: 16px; }
.drh-iconbtn--md { width: var(--tap-min); height: var(--tap-min); font-size: 19px; }
.drh-iconbtn--lg { width: var(--tap-comfort); height: var(--tap-comfort); font-size: 22px; }

.drh-iconbtn--solid { --_bg: var(--brand-solid); --_fg: #fff; --_bd: transparent; box-shadow: var(--shadow-rose); }
.drh-iconbtn--solid:hover { --_bg: var(--brand-strong); }
.drh-iconbtn--soft { --_bg: var(--rose-100); --_fg: var(--brand-strong); --_bd: transparent; }
.drh-iconbtn--soft:hover { --_bg: var(--rose-200); }
.drh-iconbtn--ghost { --_bg: transparent; --_fg: var(--text-body); --_bd: transparent; }
.drh-iconbtn--ghost:hover { --_bg: var(--rose-50); --_fg: var(--brand-strong); }
.drh-iconbtn--glass {
  --_bg: var(--glass-bg); --_fg: var(--navy-900); --_bd: rgba(255, 255, 255, 0.5);
  backdrop-filter: var(--blur-md); -webkit-backdrop-filter: var(--blur-md);
}
</style>
