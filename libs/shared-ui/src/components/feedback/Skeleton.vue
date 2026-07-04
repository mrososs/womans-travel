<script setup lang="ts">
import { computed } from 'vue';

/**
 * Skeleton — shimmer placeholder shown while content loads. Compose several
 * of these to mirror a component's layout. Honours `prefers-reduced-motion`.
 */
type Variant = 'rect' | 'text' | 'circle';

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    /** Any CSS width (e.g. '60%', '120px'). */
    width?: string;
    /** Any CSS height (e.g. '1em', '160px'). */
    height?: string;
    /** Overrides the variant's default corner radius. */
    radius?: string;
  }>(),
  { variant: 'rect' }
);

const style = computed(() => ({
  width: props.width,
  height: props.height,
  borderRadius: props.radius,
}));
</script>

<template>
  <span class="drh-skel" :class="`drh-skel--${variant}`" :style="style" aria-hidden="true" />
</template>

<style>
.drh-skel {
  --_c1: color-mix(in srgb, var(--text-strong) 7%, var(--surface-card));
  --_c2: color-mix(in srgb, var(--text-strong) 14%, var(--surface-card));
  display: block;
  border-radius: var(--radius-md);
  background: linear-gradient(100deg, var(--_c1) 30%, var(--_c2) 50%, var(--_c1) 70%);
  background-size: 200% 100%;
  animation: drh-skel-shimmer 1.4s ease-in-out infinite;
}
.drh-skel--text { height: 0.9em; border-radius: var(--radius-sm); }
.drh-skel--circle { border-radius: var(--radius-circle); }

@keyframes drh-skel-shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .drh-skel { animation: none; }
}
</style>
