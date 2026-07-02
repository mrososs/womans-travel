<script setup lang="ts">
import { computed } from 'vue';
import Icon from '../display/Icon.vue';

/**
 * Toast — transient notification. Position a stack with fixed CSS in your app.
 * Emits `close` when the dismiss button is pressed.
 */
type Variant = 'brand' | 'success' | 'warning' | 'danger' | 'info';

const props = withDefaults(
  defineProps<{ variant?: Variant; title?: string; dismissible?: boolean }>(),
  { variant: 'brand', dismissible: true }
);

const emit = defineEmits<{ close: [] }>();

const ICONS: Record<Variant, string> = {
  brand: 'sparkles',
  success: 'check-circle-2',
  warning: 'alert-triangle',
  danger: 'alert-octagon',
  info: 'info',
};

const iconName = computed(() => ICONS[props.variant] || 'bell');
const classes = computed(() => ['drh-toast', `drh-toast--${props.variant}`]);
</script>

<template>
  <div :class="classes" role="status">
    <span class="drh-toast__ico">
      <slot name="icon"><Icon :name="iconName" :size="19" /></slot>
    </span>
    <div class="drh-toast__body">
      <p v-if="title" class="drh-toast__title">{{ title }}</p>
      <p v-if="$slots.default" class="drh-toast__msg"><slot /></p>
    </div>
    <button v-if="dismissible" class="drh-toast__x" aria-label="إغلاق" @click="emit('close')">
      <Icon name="x" :size="15" />
    </button>
  </div>
</template>

<style>
.drh-toast {
  --_ac: var(--brand);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-family: var(--font-body);
  background: var(--surface-card);
  border: 1px solid var(--border-hair);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 14px 16px;
  max-width: 400px;
  width: 100%;
  animation: drh-toast-in var(--dur-slow) var(--ease-out);
}
@keyframes drh-toast-in { from { opacity: 0; transform: translateY(-10px) scale(0.98); } to { opacity: 1; transform: none; } }
.drh-toast__ico {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--_ac) 16%, white);
  color: var(--_ac);
}
.drh-toast__ico svg { width: 19px; height: 19px; }
.drh-toast__body { flex: 1; min-width: 0; }
.drh-toast__title { font-weight: var(--weight-bold); font-size: var(--text-sm); color: var(--text-strong); margin: 0 0 2px; }
.drh-toast__msg { font-size: var(--text-sm); color: var(--text-muted); margin: 0; line-height: 1.5; }
.drh-toast__x {
  flex: none;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-subtle);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background var(--dur-fast), color var(--dur-fast);
}
.drh-toast__x:hover { background: var(--n-100); color: var(--text-strong); }
.drh-toast__x svg { width: 15px; height: 15px; }
.drh-toast--brand { --_ac: var(--brand); }
.drh-toast--success { --_ac: var(--success-500); }
.drh-toast--warning { --_ac: var(--warning-500); }
.drh-toast--danger { --_ac: var(--danger-500); }
.drh-toast--info { --_ac: var(--info-500); }
</style>
