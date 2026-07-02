<script setup lang="ts">
import { computed } from 'vue';

/**
 * Card — the base surface. Compose media, headings, and actions inside.
 */
type Variant = 'elevated' | 'outline' | 'cream' | 'navy';
type Padding = 'none' | 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    padding?: Padding;
    interactive?: boolean;
    as?: string;
  }>(),
  { variant: 'elevated', padding: 'md', interactive: false, as: 'div' }
);

const classes = computed(() => [
  'drh-card',
  `drh-card--${props.variant}`,
  `drh-card__pad--${props.padding}`,
  props.interactive ? 'drh-card--interactive' : '',
]);
</script>

<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>

<style>
.drh-card {
  --_bg: var(--surface-card);
  --_bd: transparent;
  --_sh: var(--shadow-md);
  background: var(--_bg);
  border: 1px solid var(--_bd);
  box-shadow: var(--_sh);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out);
}
.drh-card--elevated { --_sh: var(--shadow-md); }
.drh-card--outline { --_bg: var(--surface-card); --_bd: var(--border-soft); --_sh: none; }
.drh-card--cream { --_bg: var(--surface-cream); --_bd: var(--border-hair); --_sh: none; }
.drh-card--navy { --_bg: var(--surface-navy); --_bd: transparent; --_sh: var(--shadow-lg); color: var(--text-on-navy); }
.drh-card--interactive { cursor: pointer; }
.drh-card--interactive:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
.drh-card--interactive:active { transform: translateY(-1px); }

.drh-card__pad--none { padding: 0; }
.drh-card__pad--sm { padding: var(--space-4); }
.drh-card__pad--md { padding: var(--space-6); }
.drh-card__pad--lg { padding: var(--space-8); }
</style>
