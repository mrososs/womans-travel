<script setup lang="ts">
import { computed } from 'vue';

/**
 * BarChart — a lightweight, dependency-free column chart built with flexbox
 * (so it flips correctly under RTL automatically). Supports one or two series
 * of values per category (e.g. revenue vs profit).
 */
const props = withDefaults(
  defineProps<{
    /** One entry per category (month). `values` holds one value per series. */
    data: { label: string; values: number[] }[];
    /** Series metadata — name + CSS colour. Length should match values length. */
    series: { name: string; color: string }[];
    /** Formats a raw value for tooltips / axis. */
    format?: (n: number) => string;
    height?: number;
  }>(),
  { format: (n: number) => String(n), height: 240 }
);

const max = computed(() => {
  const all = props.data.flatMap((d) => d.values);
  return Math.max(1, ...all);
});

function barHeight(v: number) {
  return `${Math.max(2, (v / max.value) * 100)}%`;
}
</script>

<template>
  <div class="bar">
    <div v-if="series.length" class="bar__legend">
      <span v-for="s in series" :key="s.name" class="bar__legenditem">
        <span class="bar__swatch" :style="{ background: s.color }" />
        {{ s.name }}
      </span>
    </div>

    <div class="bar__plot" :style="{ height: `${height}px` }">
      <div v-for="(d, i) in data" :key="i" class="bar__col">
        <div class="bar__bars">
          <span
            v-for="(v, si) in d.values"
            :key="si"
            class="bar__bar"
            :style="{ height: barHeight(v), background: series[si]?.color }"
            :title="`${series[si]?.name ?? ''}: ${format(v)}`"
          />
        </div>
        <div class="bar__label">{{ d.label }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bar { width: 100%; }
.bar__legend { display: flex; gap: 18px; flex-wrap: wrap; margin-bottom: 16px; }
.bar__legenditem {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: 600; color: var(--text-muted);
}
.bar__swatch { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
.bar__plot {
  display: flex; align-items: flex-end; gap: 10px;
  border-bottom: 1px solid var(--border-soft);
  padding-bottom: 0;
}
.bar__col {
  flex: 1 1 0;
  display: flex; flex-direction: column; align-items: center;
  height: 100%; justify-content: flex-end; gap: 8px; min-width: 0;
}
.bar__bars { display: flex; align-items: flex-end; gap: 4px; width: 100%; height: 100%; justify-content: center; }
.bar__bar {
  flex: 1 1 0; max-width: 26px; min-width: 8px;
  border-radius: 6px 6px 0 0;
  transition: opacity var(--dur-base) var(--ease-standard);
}
.bar__bar:hover { opacity: 0.82; }
.bar__label {
  font-size: 12px; font-weight: 600; color: var(--text-subtle);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
}
</style>
