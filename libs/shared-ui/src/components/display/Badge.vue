<script setup lang="ts">
import { computed } from 'vue';

/**
 * Badge — small non-interactive status / label pill.
 */
type Variant =
  | 'brand' | 'gold' | 'navy' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'solid';

const props = withDefaults(
  defineProps<{ variant?: Variant; dot?: boolean }>(),
  { variant: 'brand', dot: false }
);

const classes = computed(() => ['drh-badge', `drh-badge--${props.variant}`]);
</script>

<template>
  <span :class="classes">
    <span v-if="dot" class="drh-badge__dot" />
    <slot name="icon" />
    <slot />
  </span>
</template>

<style>
.drh-badge {
  --_bg: var(--rose-100);
  --_fg: var(--brand-strong);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-body);
  font-weight: var(--weight-bold);
  font-size: var(--text-xs);
  line-height: 1;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  background: var(--_bg);
  color: var(--_fg);
  white-space: nowrap;
}
.drh-badge svg { width: 1em; height: 1em; }
.drh-badge__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

.drh-badge--brand { --_bg: var(--rose-100); --_fg: var(--brand-strong); }
.drh-badge--gold { --_bg: var(--gold-100); --_fg: var(--gold-600); }
.drh-badge--navy { --_bg: var(--navy-900); --_fg: var(--text-on-navy); }
.drh-badge--success { --_bg: var(--success-100); --_fg: var(--success-500); }
.drh-badge--warning { --_bg: var(--warning-100); --_fg: var(--warning-500); }
.drh-badge--danger { --_bg: var(--danger-100); --_fg: var(--danger-500); }
.drh-badge--info { --_bg: var(--info-100); --_fg: var(--info-500); }
.drh-badge--neutral { --_bg: var(--sand); --_fg: var(--navy-700); }
.drh-badge--solid { --_bg: var(--grad-gold); --_fg: var(--navy-900); box-shadow: var(--shadow-gold); }
</style>
