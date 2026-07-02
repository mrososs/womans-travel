<script setup lang="ts">
import { Card, Icon } from '@org/shared-ui';

withDefaults(
  defineProps<{
    title: string;
    desc: string;
    icon: string;
    grad: string;
    price?: string;
    currency?: string;
  }>(),
  { price: '', currency: '' }
);
</script>

<template>
  <Card variant="elevated" padding="none" class="prod" data-reveal>
    <div class="prod__media" :style="{ background: grad }">
      <Icon :name="icon" :size="52" :stroke-width="1.3" color="#fff" />
    </div>
    <div class="prod__body">
      <h3 class="prod__title">{{ title }}</h3>
      <p class="prod__desc">{{ desc }}</p>
      <div v-if="price" class="prod__price"><b>{{ price }}</b> <span>{{ currency }}</span></div>
    </div>
  </Card>
</template>

<style scoped>
.prod { display: flex; flex-direction: column; height: 100%; }
.prod__media { aspect-ratio: 4 / 3; display: flex; align-items: center; justify-content: center; color: #fff; }
.prod__media > :deep(svg) { opacity: 0.85; }
.prod__body { padding: var(--space-5); display: flex; flex-direction: column; gap: 8px; }
.prod__title { font-family: var(--font-display); font-weight: 700; font-size: var(--text-lg); color: var(--text-strong); }
.prod__desc { font-size: 13.5px; color: var(--text-muted); line-height: 1.7; margin: 0; }
.prod__price { margin-top: auto; padding-top: 6px; display: flex; align-items: baseline; gap: 5px; }
.prod__price b { font-family: var(--font-display); font-weight: 800; font-size: var(--text-xl); color: var(--text-strong); }
.prod__price span { font-size: 12px; font-weight: 700; color: var(--text-strong); }
</style>
