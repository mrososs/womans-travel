<script setup lang="ts">
import { computed } from 'vue';

/**
 * Button — Durrah primary action. Pill-shaped, Cairo, warm shadow.
 * Renders an <a> when `href` is set, otherwise the `as` element.
 */
type Variant = 'primary' | 'gold' | 'navy' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    size?: Size;
    block?: boolean;
    disabled?: boolean;
    as?: string;
    href?: string;
    type?: 'button' | 'submit' | 'reset';
  }>(),
  { variant: 'primary', size: 'md', block: false, disabled: false, as: 'button', type: 'button' }
);

const tag = computed(() => (props.href ? 'a' : props.as));

const classes = computed(() => [
  'drh-btn',
  `drh-btn--${props.variant}`,
  `drh-btn--${props.size}`,
  props.block ? 'drh-btn--block' : '',
]);

const boundProps = computed(() => {
  if (tag.value === 'a') {
    return {
      href: props.disabled ? undefined : props.href,
      'aria-disabled': props.disabled ? 'true' : undefined,
    };
  }
  return { disabled: props.disabled, type: props.type };
});
</script>

<template>
  <component :is="tag" :class="classes" v-bind="boundProps">
    <span v-if="$slots.iconStart" class="drh-btn__ico"><slot name="iconStart" /></span>
    <slot />
    <span v-if="$slots.iconEnd" class="drh-btn__ico"><slot name="iconEnd" /></span>
  </component>
</template>

<style>
.drh-btn {
  --_bg: var(--brand-solid);
  --_fg: #fff;
  --_bd: transparent;
  --_sh: var(--shadow-rose);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-display);
  font-weight: var(--weight-bold);
  line-height: 1;
  border: 1.5px solid var(--_bd);
  background: var(--_bg);
  color: var(--_fg);
  border-radius: var(--radius-pill);
  box-shadow: var(--_sh);
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  transition: transform var(--dur-fast) var(--ease-standard),
    box-shadow var(--dur-base) var(--ease-standard),
    background var(--dur-base) var(--ease-standard),
    filter var(--dur-base) var(--ease-standard);
}
.drh-btn:hover { filter: brightness(0.96); box-shadow: var(--shadow-lg); }
.drh-btn:active { transform: scale(0.97); filter: brightness(0.92); }
.drh-btn:focus-visible { outline: none; box-shadow: var(--ring-brand); }
.drh-btn[disabled], .drh-btn[aria-disabled='true'] {
  opacity: 0.5; cursor: not-allowed; box-shadow: none; transform: none;
  filter: none; pointer-events: none;
}
.drh-btn__ico { display: inline-flex; align-items: center; }
.drh-btn__ico svg { width: 1.15em; height: 1.15em; }

.drh-btn--sm { font-size: var(--text-sm); padding: 0 var(--space-4); height: 40px; }
.drh-btn--md { font-size: var(--text-base); padding: 0 var(--space-6); height: var(--tap-comfort); }
.drh-btn--lg { font-size: var(--text-lg); padding: 0 var(--space-8); height: 60px; }
.drh-btn--block { display: flex; width: 100%; }

.drh-btn--primary { --_bg: var(--brand-solid); --_fg: #fff; --_sh: var(--shadow-rose); }
.drh-btn--primary:hover { --_bg: var(--brand-strong); }
.drh-btn--gold { --_bg: var(--grad-gold); --_fg: var(--navy-900); --_sh: var(--shadow-gold); }
.drh-btn--navy { --_bg: var(--navy-900); --_fg: var(--text-on-navy); --_sh: var(--shadow-md); }
.drh-btn--navy:hover { --_bg: var(--navy-700); }
.drh-btn--outline { --_bg: transparent; --_fg: var(--brand-strong); --_bd: var(--rose-300); --_sh: none; }
.drh-btn--outline:hover { --_bg: var(--rose-50); filter: none; box-shadow: none; }
.drh-btn--ghost { --_bg: transparent; --_fg: var(--text-body); --_bd: transparent; --_sh: none; }
.drh-btn--ghost:hover { --_bg: var(--rose-50); --_fg: var(--brand-strong); filter: none; box-shadow: none; }
</style>
