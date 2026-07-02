<script setup lang="ts">
import Icon from '../display/Icon.vue';
import type { BottomNavItem } from '../../types';

/**
 * BottomNav — frosted mobile bottom tab bar. Set one item `{ fab: true }` to
 * render it as a raised primary action. Bind active id with v-model.
 */
defineProps<{ items: BottomNavItem[] }>();
const model = defineModel<string>();
</script>

<template>
  <nav class="drh-bottomnav">
    <template v-for="it in items" :key="it.id">
      <button
        v-if="it.fab"
        class="drh-bottomnav__fab"
        :aria-label="it.label"
        @click="model = it.id"
      >
        <span class="drh-bottomnav__fab-btn"><Icon :name="it.icon" :size="26" /></span>
        <span class="drh-bottomnav__lbl">{{ it.label }}</span>
      </button>
      <button
        v-else
        class="drh-bottomnav__item"
        :aria-current="model === it.id ? 'page' : undefined"
        @click="model = it.id"
      >
        <span class="drh-bottomnav__ico"><Icon :name="it.icon" :size="22" /></span>
        <span class="drh-bottomnav__lbl">{{ it.label }}</span>
      </button>
    </template>
  </nav>
</template>

<style>
.drh-bottomnav {
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  background: var(--glass-bg);
  backdrop-filter: var(--blur-lg);
  -webkit-backdrop-filter: var(--blur-lg);
  border-top: 1px solid var(--border-hair);
  box-shadow: var(--shadow-lg);
  padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
  font-family: var(--font-body);
}
.drh-bottomnav__item {
  appearance: none;
  border: none;
  background: transparent;
  cursor: pointer;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--text-muted);
  padding: 6px 4px;
  border-radius: var(--radius-md);
  min-height: var(--tap-min);
  transition: color var(--dur-base) var(--ease-standard);
}
.drh-bottomnav__ico {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 30px;
  border-radius: var(--radius-pill);
  transition: background var(--dur-base) var(--ease-standard);
}
.drh-bottomnav__ico svg { width: 22px; height: 22px; }
.drh-bottomnav__lbl { font-size: var(--text-2xs); font-weight: var(--weight-bold); }
.drh-bottomnav__item[aria-current='page'] { color: var(--brand-strong); }
.drh-bottomnav__item[aria-current='page'] .drh-bottomnav__ico { background: var(--rose-100); }
.drh-bottomnav__item:focus-visible { outline: none; box-shadow: var(--ring-brand); }

.drh-bottomnav__fab {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transform: translateY(-14px);
  cursor: pointer;
  border: none;
  background: transparent;
}
.drh-bottomnav__fab-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--brand-solid);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-rose);
  border: 4px solid var(--surface-page);
  transition: transform var(--dur-fast) var(--ease-standard);
}
.drh-bottomnav__fab:active .drh-bottomnav__fab-btn { transform: scale(0.94); }
.drh-bottomnav__fab-btn svg { width: 26px; height: 26px; }
.drh-bottomnav__fab .drh-bottomnav__lbl { color: var(--brand-strong); }
</style>
