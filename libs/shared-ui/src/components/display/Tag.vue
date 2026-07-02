<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';

/**
 * Tag — selectable filter chip (category, destination type, price band).
 * Emits `click` (toggle) and `remove` (when removable).
 */
const props = withDefaults(
  defineProps<{
    selected?: boolean;
    removable?: boolean;
    /** Static tags render without hover/press affordance. */
    interactive?: boolean;
  }>(),
  { selected: false, removable: false, interactive: true }
);

const emit = defineEmits<{ click: []; remove: [] }>();

const classes = computed(() => [
  'drh-tag',
  !props.interactive && !props.removable ? 'drh-tag--static' : '',
]);
</script>

<template>
  <button
    type="button"
    :class="classes"
    :aria-pressed="selected"
    @click="emit('click')"
  >
    <slot name="icon" />
    <slot />
    <span
      v-if="removable"
      class="drh-tag__x"
      role="button"
      aria-label="إزالة"
      @click.stop="emit('remove')"
    >
      <Icon name="x" :size="14" />
    </span>
  </button>
</template>

<style>
.drh-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-body);
  font-weight: var(--weight-medium);
  font-size: var(--text-sm);
  line-height: 1;
  padding: 9px 16px;
  border-radius: var(--radius-pill);
  background: var(--surface-card);
  color: var(--text-body);
  border: 1.5px solid var(--border-default);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--dur-base) var(--ease-standard),
    color var(--dur-base) var(--ease-standard),
    border-color var(--dur-base) var(--ease-standard),
    transform var(--dur-fast) var(--ease-standard);
}
.drh-tag:hover { border-color: var(--rose-300); color: var(--brand-strong); }
.drh-tag:active { transform: scale(0.97); }
.drh-tag:focus-visible { outline: none; box-shadow: var(--ring-brand); }
.drh-tag svg { width: 1em; height: 1em; }
.drh-tag[aria-pressed='true'] {
  background: var(--brand-solid);
  color: #fff;
  border-color: transparent;
  box-shadow: var(--shadow-rose);
  font-weight: var(--weight-bold);
}
.drh-tag--static { cursor: default; }
.drh-tag--static:hover { border-color: var(--border-default); color: var(--text-body); }
.drh-tag__x { display: inline-flex; margin-inline-start: -2px; opacity: 0.7; }
.drh-tag__x:hover { opacity: 1; }
</style>
