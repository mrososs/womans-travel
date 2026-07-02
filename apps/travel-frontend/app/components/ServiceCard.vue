<script setup lang="ts">
import { Icon } from '@org/shared-ui';

defineProps<{ icon: string; title: string; desc: string }>();
</script>

<template>
  <div class="svc" data-reveal>
    <span class="svc__icon"><Icon :name="icon" :size="24" /></span>
    <h3 class="svc__title">{{ title }}</h3>
    <p class="svc__desc">{{ desc }}</p>
  </div>
</template>

<style scoped>
.svc {
  background: var(--surface-card);
  border: 1px solid var(--border-hair);
  border-radius: var(--radius-lg);
  padding: 26px;
  box-shadow: var(--shadow-sm);
  transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
.svc:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
.svc__icon {
  width: 52px; height: 52px; border-radius: 15px;
  background: var(--rose-100); color: var(--brand-strong);
  display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;
}
.svc__title { font-family: var(--font-display); font-weight: 800; font-size: 18px; color: var(--text-strong); margin-bottom: 8px; }
.svc__desc { font-size: 14px; color: var(--text-muted); line-height: 1.8; margin: 0; }
</style>
