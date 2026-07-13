<script setup lang="ts">
import { Card, Badge, Icon } from '@org/shared-ui';

withDefaults(
  defineProps<{
    title: string;
    desc: string;
    icon: string;
    grad: string;
    /** Editorial card photo; falls back to the gradient + icon when empty. */
    img?: string;
    price?: string;
    kindLabel?: string;
    fromLabel?: string;
    currency?: string;
    viewLabel?: string;
    /** Show a red "available now" badge (used for bookable groups on home). */
    availableNow?: boolean;
    availableLabel?: string;
  }>(),
  {
    img: '', price: '', kindLabel: '', fromLabel: '', currency: '', viewLabel: 'عرض',
    availableNow: false, availableLabel: 'متاح الآن',
  }
);

const emit = defineEmits<{ open: [] }>();
</script>

<template>
  <Card variant="elevated" padding="none" interactive class="pkg" @click="emit('open')">
    <div class="pkg__media" :style="{ background: grad }">
      <img v-if="img" class="pkg__img" :src="img" :alt="title" loading="lazy" decoding="async">
      <Icon v-else :name="icon" :size="64" :stroke-width="1.2" color="#fff" />
      <Badge v-if="kindLabel" variant="solid" class="pkg__badge">{{ kindLabel }}</Badge>
      <span v-if="availableNow" class="pkg__available">
        <span class="pkg__available-dot" />
        {{ availableLabel }}
      </span>
      <div class="pkg__actions">
        <span class="pkg__view"><Icon name="eye" :size="18" />{{ viewLabel }}</span>
      </div>
    </div>
    <div class="pkg__body">
      <h3 class="pkg__title">{{ title }}</h3>
      <p class="pkg__desc">{{ desc }}</p>
      <div v-if="price" class="pkg__price">
        <span class="pkg__from">{{ fromLabel }}</span>
        <b>{{ price }}</b>
        <Icon name="saudi-riyal" :size="18" class="pkg__riyal" />
        <span class="sr-only">{{ currency }}</span>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.pkg { display: flex; flex-direction: column; height: 100%; }
.pkg__media {
  position: relative; aspect-ratio: 16 / 9;
  display: flex; align-items: center; justify-content: center;
  color: #fff; overflow: hidden;
}
.pkg__media > :deep(svg) { opacity: 0.85; }
.pkg__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.pkg__media::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(0deg, rgba(18, 27, 51, 0.55), rgba(18, 27, 51, 0) 60%);
  opacity: 0; transition: opacity var(--dur-base) var(--ease-standard);
}
.pkg:hover .pkg__media::after { opacity: 1; }
.pkg__badge { position: absolute; top: 12px; inset-inline-start: 12px; z-index: 2; }
.pkg__available {
  position: absolute; top: 12px; inset-inline-end: 12px; z-index: 2;
  display: inline-flex; align-items: center; gap: 6px;
  background: #dc2626; color: #fff;
  font-family: var(--font-body); font-weight: 800; font-size: 12px;
  padding: 5px 11px; border-radius: var(--radius-pill);
  box-shadow: 0 2px 10px rgba(220, 38, 38, 0.45);
}
.pkg__available-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #fff;
  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); animation: pkg-pulse 1.8s infinite;
}
@keyframes pkg-pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.6); }
  70% { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
}
.pkg__actions {
  position: absolute; inset-block-end: 12px; inset-inline-end: 12px; z-index: 2;
  opacity: 0; transform: translateY(6px);
  transition: opacity var(--dur-base) var(--ease-standard), transform var(--dur-base) var(--ease-out);
}
.pkg:hover .pkg__actions { opacity: 1; transform: none; }
.pkg__view {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--glass-bg); -webkit-backdrop-filter: var(--blur-md); backdrop-filter: var(--blur-md);
  color: var(--navy-900); font-family: var(--font-body); font-weight: 700; font-size: 13px;
  padding: 8px 12px; border-radius: var(--radius-pill);
}
.pkg__body { padding: var(--space-6); display: flex; flex-direction: column; gap: 10px; }
.pkg__title { font-family: var(--font-display); font-weight: 800; font-size: var(--text-xl); color: var(--text-strong); }
.pkg__desc { font-size: 14px; color: var(--text-muted); line-height: 1.8; margin: 0; }
.pkg__price { margin-top: auto; padding-top: 8px; display: flex; align-items: center; gap: 6px; }
.pkg__from { font-size: 12px; color: var(--text-muted); }
.pkg__price b { font-family: var(--font-display); font-weight: 800; font-size: var(--text-2xl); color: var(--text-strong); }
.pkg__riyal { width: 0.8em; height: 0.8em; color: var(--text-strong); flex: none; }
</style>
