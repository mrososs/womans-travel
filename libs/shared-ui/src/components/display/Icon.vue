<script setup lang="ts">
import { computed } from 'vue';
import * as lucideIcons from 'lucide-vue-next';

/**
 * Icon — thin wrapper around the Lucide glyph set (1.75 stroke by default,
 * per the Durrah brand). Names are kebab-case, e.g. `map-pin`, `shield-check`.
 */
const props = withDefaults(
  defineProps<{
    name: string;
    size?: number;
    strokeWidth?: number;
    color?: string;
  }>(),
  { size: 20, strokeWidth: 1.75, color: 'currentColor' }
);

function toPascal(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

// Runtime lookup keeps the build resilient to Lucide's icon renames.
const registry = lucideIcons as unknown as Record<string, unknown>;
const iconComponent = computed(() => {
  const key = toPascal(props.name);
  return (registry[key] || registry[`${key}Icon`] || null) as
    | Record<string, unknown>
    | null;
});
</script>

<template>
  <component
    :is="iconComponent"
    v-if="iconComponent"
    :size="size"
    :stroke-width="strokeWidth"
    :absolute-stroke-width="true"
    :color="color"
    aria-hidden="true"
  />
</template>
