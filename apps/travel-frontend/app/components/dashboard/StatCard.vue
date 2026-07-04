<script setup lang="ts">
import { Card, Icon } from '@org/shared-ui';

/**
 * StatCard — a single KPI tile for the admin dashboard. Composes the shared
 * Card surface with a Lucide icon, a big value, and an optional sub-line.
 */
withDefaults(
  defineProps<{
    label: string;
    value?: string;
    icon: string;
    /** Accent tone for the icon chip. */
    tone?: 'brand' | 'gold' | 'navy' | 'success';
    sub?: string;
  }>(),
  { tone: 'brand', value: '', sub: '' }
);
</script>

<template>
  <Card variant="elevated" padding="lg" class="statcard">
    <div :class="['statcard__icon', `statcard__icon--${tone}`]">
      <Icon :name="icon" :size="22" />
    </div>
    <div class="statcard__body">
      <div class="statcard__label">{{ label }}</div>
      <div class="statcard__value"><slot name="value">{{ value }}</slot></div>
      <div v-if="sub || $slots.sub" class="statcard__sub"><slot name="sub">{{ sub }}</slot></div>
    </div>
  </Card>
</template>

<style scoped>
.statcard { display: flex; align-items: center; gap: 16px; }
.statcard__icon {
  flex: none;
  width: 52px; height: 52px;
  border-radius: var(--radius-lg);
  display: inline-flex; align-items: center; justify-content: center;
}
.statcard__icon--brand   { background: var(--rose-100); color: var(--brand-strong); }
.statcard__icon--gold    { background: var(--gold-100); color: var(--gold-600); }
.statcard__icon--navy    { background: var(--navy-900); color: #fff; }
.statcard__icon--success { background: var(--success-100); color: var(--success-500); }
.statcard__label { font-family: var(--font-body); font-weight: 600; font-size: 14px; color: var(--text-muted); }
.statcard__value {
  font-family: var(--font-display); font-weight: 800;
  font-size: var(--text-2xl); color: var(--text-strong);
  line-height: 1.15; margin-top: 2px;
}
.statcard__sub { font-size: 13px; color: var(--text-subtle); margin-top: 4px; }
</style>
