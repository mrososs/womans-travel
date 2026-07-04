<script setup lang="ts">
import { computed } from 'vue';

/**
 * LineChart — a small, dependency-free SVG line/area chart for a single metric
 * over time (e.g. monthly profit %). When `rtl` is set the x-axis is mirrored
 * so the earliest month sits on the right, matching Arabic reading order.
 */
const props = withDefaults(
  defineProps<{
    data: { label: string; value: number }[];
    color?: string;
    format?: (n: number) => string;
    rtl?: boolean;
    height?: number;
  }>(),
  { color: 'var(--gold-600)', format: (n: number) => String(n), rtl: false, height: 240 }
);

const W = 640;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 16 };

const points = computed(() => {
  const items = props.rtl ? [...props.data].reverse() : props.data;
  const n = items.length;
  const max = Math.max(1, ...items.map((d) => d.value));
  const min = Math.min(0, ...items.map((d) => d.value));
  const span = max - min || 1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  return items.map((d, i) => {
    const x = PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = PAD.top + innerH - ((d.value - min) / span) * innerH;
    return { x, y, ...d };
  });
});

const linePath = computed(() =>
  points.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
);

const areaPath = computed(() => {
  const pts = points.value;
  if (!pts.length) return '';
  const baseY = H - PAD.bottom;
  return (
    `M ${pts[0].x.toFixed(1)} ${baseY} ` +
    pts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') +
    ` L ${pts[pts.length - 1].x.toFixed(1)} ${baseY} Z`
  );
});
</script>

<template>
  <div class="line">
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" :style="{ height: `${height}px` }" role="img">
      <path :d="areaPath" fill="var(--rose-50)" opacity="0.7" />
      <path :d="linePath" fill="none" :stroke="color" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      <g v-for="(p, i) in points" :key="i">
        <circle :cx="p.x" :cy="p.y" r="4" :fill="color" />
        <text :x="p.x" :y="H - 8" text-anchor="middle" class="line__xlabel">{{ p.label }}</text>
        <text :x="p.x" :y="p.y - 10" text-anchor="middle" class="line__vlabel">{{ format(p.value) }}</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.line { width: 100%; }
.line svg { width: 100%; display: block; overflow: visible; }
.line__xlabel { font-size: 11px; font-weight: 600; fill: var(--text-subtle); }
.line__vlabel { font-size: 11px; font-weight: 700; fill: var(--text-muted); }
</style>
