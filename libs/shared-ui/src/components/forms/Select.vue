<script setup lang="ts">
import { computed, useId } from 'vue';
import Icon from '../display/Icon.vue';
import type { SelectOption } from '../../types';

/**
 * Select — styled wrapper around a native <select> (best for mobile / RTL).
 * Pass options as {value,label}[] or provide <option> children in the slot.
 */
const props = withDefaults(
  defineProps<{
    label?: string;
    id?: string;
    options?: SelectOption[] | null;
    placeholder?: string;
    error?: string;
    hint?: string;
  }>(),
  { options: null, error: '', hint: '' }
);

const model = defineModel<string>({ default: '' });

// useId() must be called in setup scope, not inside a computed getter.
const generatedId = useId();
const rid = computed(() => props.id || `drh-select-${generatedId}`);
const message = computed(() => props.error || props.hint);
const classes = computed(() => ['drh-select', props.error ? 'drh-select--error' : '']);
const isPlaceholder = computed(() => props.placeholder != null && model.value === '');
</script>

<template>
  <div :class="classes">
    <label v-if="label" class="drh-select__label" :for="rid">{{ label }}</label>
    <div class="drh-select__wrap">
      <span v-if="$slots.iconStart" class="drh-select__ico"><slot name="iconStart" /></span>
      <select
        :id="rid"
        :name="rid"
        v-model="model"
        class="drh-select__control"
        :class="{ 'drh-select__control--placeholder': isPlaceholder }"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <template v-if="options">
          <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
        </template>
        <slot v-else />
      </select>
      <span class="drh-select__chev"><Icon name="chevron-down" :size="18" /></span>
    </div>
    <span v-if="message" class="drh-select__msg">{{ message }}</span>
  </div>
</template>

<style>
.drh-select { display: flex; flex-direction: column; gap: 7px; font-family: var(--font-body); }
.drh-select__label { font-size: var(--text-sm); font-weight: var(--weight-bold); color: var(--text-strong); }
.drh-select__wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--surface-card);
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
  height: var(--tap-comfort);
  padding: 0 16px;
  transition: border-color var(--dur-base) var(--ease-standard),
    box-shadow var(--dur-base) var(--ease-standard);
}
.drh-select__wrap:hover { border-color: var(--border-strong); }
.drh-select__wrap:focus-within { border-color: var(--brand); box-shadow: var(--ring-brand); }
.drh-select__wrap select {
  appearance: none;
  -webkit-appearance: none;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-strong);
  flex: 1;
  height: 100%;
  padding-inline-end: 26px;
  cursor: pointer;
  min-width: 0;
}
.drh-select__wrap select { direction: rtl; }
.drh-select__wrap select:invalid { color: var(--text-subtle); }
/* The wrapper (:focus-within) owns the focus ring — suppress the inner
   control's own :focus-visible ring so there's no double border. */
.drh-select__wrap select:focus,
.drh-select__wrap select:focus-visible { box-shadow: none; border-radius: 0; }
.drh-select__control--placeholder { color: var(--text-subtle); }
.drh-select__wrap option {
  background: var(--surface-card);
  color: var(--text-strong);
  font-family: var(--font-body);
  padding-block: 8px;
  padding-inline: 14px;
}
.drh-select__chev {
  position: absolute;
  inset-inline-end: 14px;
  pointer-events: none;
  color: var(--text-muted);
  display: inline-flex;
}
.drh-select__chev svg { width: 18px; height: 18px; }
.drh-select__ico { display: inline-flex; color: var(--text-muted); margin-inline-end: 10px; flex: none; }
.drh-select__ico svg { width: 19px; height: 19px; }
.drh-select__msg { font-size: var(--text-xs); color: var(--text-muted); }
.drh-select--error .drh-select__wrap { border-color: var(--danger-500); }
.drh-select--error .drh-select__msg { color: var(--danger-500); }
</style>
