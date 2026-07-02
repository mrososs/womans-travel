<script setup lang="ts">
import { Card, Badge, Icon } from '@org/shared-ui';

withDefaults(
  defineProps<{
    title: string;
    desc: string;
    icon: string;
    grad: string;
    price?: string;
    kindLabel?: string;
    fromLabel?: string;
    currency?: string;
  }>(),
  { price: '', kindLabel: '', fromLabel: '', currency: '' }
);
</script>

<template>
  <Card variant="elevated" padding="none" class="pkg">
    <div class="pkg__media" :style="{ background: grad }">
      <Icon :name="icon" :size="64" :stroke-width="1.2" color="#fff" />
      <Badge v-if="kindLabel" variant="solid" class="pkg__badge">{{ kindLabel }}</Badge>
    </div>
    <div class="pkg__body">
      <h3 class="pkg__title">{{ title }}</h3>
      <p class="pkg__desc">{{ desc }}</p>
      <div v-if="price" class="pkg__price">
        <span class="pkg__from">{{ fromLabel }}</span>
        <b>{{ price }}</b> <span class="pkg__cur">{{ currency }}</span>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.pkg { display: flex; flex-direction: column; height: 100%; }
.pkg__media {
  position: relative; aspect-ratio: 16 / 9;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
}
.pkg__media > :deep(svg) { opacity: 0.85; }
.pkg__badge { position: absolute; top: 12px; inset-inline-start: 12px; }
.pkg__body { padding: var(--space-6); display: flex; flex-direction: column; gap: 10px; }
.pkg__title { font-family: var(--font-display); font-weight: 800; font-size: var(--text-xl); color: var(--text-strong); }
.pkg__desc { font-size: 14px; color: var(--text-muted); line-height: 1.8; margin: 0; }
.pkg__price { margin-top: auto; padding-top: 8px; display: flex; align-items: baseline; gap: 6px; }
.pkg__from { font-size: 12px; color: var(--text-muted); }
.pkg__price b { font-family: var(--font-display); font-weight: 800; font-size: var(--text-2xl); color: var(--text-strong); }
.pkg__cur { font-size: 13px; font-weight: 700; color: var(--text-strong); }
</style>
