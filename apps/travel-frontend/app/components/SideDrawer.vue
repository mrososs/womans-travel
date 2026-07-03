<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import { Icon } from '@org/shared-ui';

const props = defineProps<{ open: boolean; title?: string }>();
const emit = defineEmits<{ 'update:open': [value: boolean]; close: [] }>();

const { locale } = useI18n();
// Hide toward the inline-end edge (left in RTL, right in LTR).
const hideX = computed(() => (locale.value === 'ar' ? '-100%' : '100%'));

function close() {
  emit('close');
  emit('update:open', false);
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close();
}

watch(
  () => props.open,
  (isOpen) => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    }
  }
);
onBeforeUnmount(() => {
  if (typeof document === 'undefined') return;
  document.removeEventListener('keydown', onKey);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="drawer" @click.self="close">
        <aside
          class="drawer__panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          :style="{ '--drawer-x': hideX }"
        >
          <header class="drawer__head">
            <h2 class="drawer__title">{{ title }}</h2>
            <button class="drawer__close" aria-label="X" @click="close"><Icon name="x" :size="20" /></button>
          </header>
          <div class="drawer__body"><slot /></div>
          <footer v-if="$slots.footer" class="drawer__foot"><slot name="footer" /></footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: var(--surface-veil);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  display: flex;
  justify-content: flex-end;
}
.drawer__panel {
  width: min(420px, 92vw);
  height: 100%;
  background: var(--surface-page);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
}
.drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px;
  border-bottom: 1px solid var(--border-hair);
}
.drawer__title { font-family: var(--font-display); font-weight: 800; font-size: var(--text-xl); color: var(--text-strong); margin: 0; }
.drawer__close {
  width: 38px; height: 38px; border-radius: 50%; border: none; cursor: pointer;
  background: var(--n-100); color: var(--text-muted);
  display: inline-flex; align-items: center; justify-content: center;
  transition: background var(--dur-base) var(--ease-standard);
}
.drawer__close:hover { background: var(--sand); color: var(--text-strong); }
.drawer__body { flex: 1; overflow-y: auto; padding: 18px 22px; }
.drawer__foot { padding: 18px 22px calc(18px + env(safe-area-inset-bottom)); border-top: 1px solid var(--border-hair); }

.drawer-enter-active,
.drawer-leave-active { transition: opacity var(--dur-base) var(--ease-standard); }
.drawer-enter-active .drawer__panel,
.drawer-leave-active .drawer__panel { transition: transform var(--dur-slow) var(--ease-out); }
.drawer-enter-from,
.drawer-leave-to { opacity: 0; }
.drawer-enter-from .drawer__panel,
.drawer-leave-to .drawer__panel { transform: translateX(var(--drawer-x)); }
</style>
