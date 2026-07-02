<script setup lang="ts">
import { computed } from 'vue';

/**
 * Switch — on/off toggle for a single setting. Two-way bound via v-model.
 */
const props = withDefaults(
  defineProps<{ label?: string; disabled?: boolean }>(),
  { disabled: false }
);

const model = defineModel<boolean>({ default: false });

const classes = computed(() => ['drh-switch', props.disabled ? 'drh-switch--disabled' : '']);
</script>

<template>
  <label :class="classes">
    <input type="checkbox" role="switch" v-model="model" :disabled="disabled" />
    <span class="drh-switch__track"><span class="drh-switch__thumb" /></span>
    <span v-if="label" class="drh-switch__label">{{ label }}</span>
  </label>
</template>

<style>
/* NOTE: the thumb translateX is negative because the track is RTL — it starts
   at the inline-start (right) edge and slides toward the inline-end (left). */
.drh-switch {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  user-select: none;
}
.drh-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.drh-switch__track {
  width: 48px;
  height: 28px;
  flex: none;
  border-radius: var(--radius-pill);
  background: var(--n-300);
  position: relative;
  transition: background var(--dur-base) var(--ease-standard);
}
.drh-switch__thumb {
  position: absolute;
  top: 3px;
  inset-inline-start: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: var(--shadow-sm);
  transition: transform var(--dur-base) var(--ease-out);
}
.drh-switch input:checked + .drh-switch__track { background: var(--brand-solid); }
.drh-switch input:checked + .drh-switch__track .drh-switch__thumb { transform: translateX(-20px); }
.drh-switch input:focus-visible + .drh-switch__track { box-shadow: var(--ring-brand); }
.drh-switch__label { font-size: var(--text-base); color: var(--text-body); }
.drh-switch--disabled { opacity: 0.5; cursor: not-allowed; }
</style>
