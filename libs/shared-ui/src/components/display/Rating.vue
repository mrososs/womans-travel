<script setup lang="ts">
import { computed } from 'vue';

/**
 * Rating — champagne-gold star rating with fractional fills (CSS clip-path,
 * not glyphs). Interactive when `readOnly` is false; emits `change`.
 */
const props = withDefaults(
  defineProps<{
    value?: number;
    max?: number;
    size?: number;
    count?: number | null;
    showValue?: boolean;
    readOnly?: boolean;
  }>(),
  { value: 0, max: 5, size: 18, count: null, showValue: false, readOnly: true }
);

const emit = defineEmits<{ change: [value: number] }>();

const interactive = computed(() => !props.readOnly);

const stars = computed(() =>
  Array.from({ length: props.max }, (_, i) => ({
    index: i,
    fillPct: Math.max(0, Math.min(1, props.value - i)) * 100,
  }))
);

function pick(index: number) {
  if (interactive.value) emit('change', index + 1);
}
</script>

<template>
  <span
    class="drh-rating"
    :class="{ 'drh-rating--interactive': interactive }"
    role="img"
    :aria-label="`التقييم ${value} من ${max}`"
  >
    <span class="drh-rating__stars">
      <span
        v-for="s in stars"
        :key="s.index"
        class="drh-star"
        :style="{ fontSize: `${size}px`, width: `${size}px`, height: `${size}px` }"
        :role="interactive ? 'button' : undefined"
        @click="pick(s.index)"
      >
        <span class="drh-star__bg" />
        <span class="drh-star__fill" :style="{ width: `${s.fillPct}%` }" />
      </span>
    </span>
    <span v-if="showValue" class="drh-rating__val" :style="{ fontSize: `${size * 0.82}px` }">
      {{ value.toFixed(1) }}
    </span>
    <span v-if="count != null" class="drh-rating__count" :style="{ fontSize: `${size * 0.78}px` }">
      ({{ count }})
    </span>
  </span>
</template>

<style>
.drh-rating { display: inline-flex; align-items: center; gap: 8px; direction: ltr; }
.drh-rating__stars { display: inline-flex; gap: 3px; }
.drh-star { position: relative; width: 1em; height: 1em; display: inline-block; }
.drh-star__bg,
.drh-star__fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  -webkit-clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}
.drh-star__bg { right: 0; background: var(--n-300); }
.drh-star__fill { background: var(--grad-gold); }
.drh-rating--interactive .drh-star { cursor: pointer; }
.drh-rating--interactive .drh-star:hover {
  transform: scale(1.12);
  transition: transform var(--dur-fast) var(--ease-standard);
}
.drh-rating__val { font-family: var(--font-body); font-weight: 700; color: var(--text-strong); }
.drh-rating__count { font-family: var(--font-body); color: var(--text-muted); }
</style>
