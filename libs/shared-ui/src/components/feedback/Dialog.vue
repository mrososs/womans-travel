<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue';
import Icon from '../display/Icon.vue';

/**
 * Dialog — modal. `variant="sheet"` is a mobile bottom sheet (default);
 * `variant="center"` is a centered modal. Bind visibility with v-model:open.
 */
const props = withDefaults(
  defineProps<{ open: boolean; title?: string; variant?: 'sheet' | 'center' }>(),
  { variant: 'sheet' }
);

const emit = defineEmits<{ 'update:open': [value: boolean]; close: [] }>();

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
    if (isOpen) document.addEventListener('keydown', onKey);
    else document.removeEventListener('keydown', onKey);
  }
);

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.removeEventListener('keydown', onKey);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="drh-dialog-fade">
      <div
        v-if="open"
        :class="['drh-dialog__scrim', `drh-dialog__scrim--${variant}`]"
        @click.self="close"
      >
        <div
          :class="['drh-dialog', `drh-dialog--${variant}`]"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <div v-if="variant === 'sheet'" class="drh-dialog__grip" />
          <div class="drh-dialog__head">
            <h3 class="drh-dialog__title">{{ title }}</h3>
            <button class="drh-dialog__close" aria-label="إغلاق" @click="close">
              <Icon name="x" :size="18" />
            </button>
          </div>
          <div class="drh-dialog__body"><slot /></div>
          <div v-if="$slots.footer" class="drh-dialog__foot"><slot name="footer" /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.drh-dialog__scrim {
  position: fixed;
  inset: 0;
  background: var(--surface-veil);
  z-index: var(--z-modal);
  display: flex;
  padding: 20px;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
}
.drh-dialog__scrim--center { align-items: center; justify-content: center; }
.drh-dialog__scrim--sheet { align-items: flex-end; justify-content: center; padding: 0; }

@keyframes drh-pop { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: none; } }
@keyframes drh-rise { from { transform: translateY(100%); } to { transform: none; } }

.drh-dialog {
  background: var(--surface-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 440px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 88vh;
}
.drh-dialog--center { animation: drh-pop var(--dur-slow) var(--ease-out); }
.drh-dialog--sheet {
  max-width: 520px;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  animation: drh-rise var(--dur-slow) var(--ease-out);
}
.drh-dialog__grip {
  width: 44px;
  height: 5px;
  border-radius: 999px;
  background: var(--n-300);
  margin: 12px auto 0;
  flex: none;
}
.drh-dialog__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px 6px;
}
.drh-dialog__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--text-xl);
  color: var(--text-strong);
  margin: 0;
}
.drh-dialog__close {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: var(--n-100);
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background var(--dur-base) var(--ease-standard);
}
.drh-dialog__close:hover { background: var(--sand); color: var(--text-strong); }
.drh-dialog__close svg { width: 18px; height: 18px; }
.drh-dialog__body { padding: 10px 24px 20px; overflow: auto; color: var(--text-body); }
.drh-dialog__foot {
  padding: 16px 24px calc(16px + env(safe-area-inset-bottom));
  display: flex;
  gap: 12px;
  border-top: 1px solid var(--border-hair);
}
.drh-dialog__foot > * { flex: 1; }

.drh-dialog-fade-enter-active,
.drh-dialog-fade-leave-active { transition: opacity var(--dur-base) var(--ease-standard); }
.drh-dialog-fade-enter-from,
.drh-dialog-fade-leave-to { opacity: 0; }
</style>
