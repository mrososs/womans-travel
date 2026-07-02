<script setup lang="ts">
import { computed } from 'vue';
import Icon from '../display/Icon.vue';
import type { TabItem } from '../../types';

/**
 * Tabs — controlled tab strip. `variant="underline"` (default) or `"segmented"`.
 * Bind the active tab id with v-model. `icon` is an optional Lucide name.
 */
const props = withDefaults(
  defineProps<{ tabs: TabItem[]; variant?: 'underline' | 'segmented' }>(),
  { variant: 'underline' }
);

const model = defineModel<string>();

const classes = computed(() => ['drh-tabs', `drh-tabs--${props.variant}`]);
</script>

<template>
  <div :class="classes">
    <div class="drh-tabs__list" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.id"
        class="drh-tabs__tab"
        role="tab"
        :aria-selected="model === t.id"
        @click="model = t.id"
      >
        <Icon v-if="t.icon" :name="t.icon" :size="17" />
        {{ t.label }}
      </button>
    </div>
  </div>
</template>

<style>
.drh-tabs { font-family: var(--font-body); }
.drh-tabs__list { display: flex; gap: 4px; }
.drh-tabs__tab {
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: var(--weight-bold);
  font-size: var(--text-sm);
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: color var(--dur-base) var(--ease-standard),
    background var(--dur-base) var(--ease-standard);
}
.drh-tabs__tab svg { width: 17px; height: 17px; }
.drh-tabs__tab:focus-visible { outline: none; box-shadow: var(--ring-brand); border-radius: var(--radius-sm); }

.drh-tabs--underline .drh-tabs__list { gap: 22px; border-bottom: 1.5px solid var(--border-hair); }
.drh-tabs--underline .drh-tabs__tab { padding: 12px 2px; position: relative; }
.drh-tabs--underline .drh-tabs__tab::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  bottom: -1.5px;
  height: 2.5px;
  background: var(--brand);
  border-radius: 2px;
  transform: scaleX(0);
  transition: transform var(--dur-base) var(--ease-out);
}
.drh-tabs--underline .drh-tabs__tab[aria-selected='true'] { color: var(--text-strong); }
.drh-tabs--underline .drh-tabs__tab[aria-selected='true']::after { transform: scaleX(1); }

.drh-tabs--segmented .drh-tabs__list { background: var(--sand); padding: 5px; border-radius: var(--radius-pill); gap: 0; }
.drh-tabs--segmented .drh-tabs__tab { flex: 1; justify-content: center; padding: 10px 16px; border-radius: var(--radius-pill); }
.drh-tabs--segmented .drh-tabs__tab[aria-selected='true'] {
  background: var(--surface-card);
  color: var(--brand-strong);
  box-shadow: var(--shadow-sm);
}
</style>
