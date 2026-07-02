<script setup lang="ts">
import { computed, useId } from 'vue';

/**
 * Input — labelled text field with optional icons, helper text, and error.
 * Two-way bound via v-model.
 */
const props = withDefaults(
  defineProps<{
    label?: string;
    id?: string;
    required?: boolean;
    size?: 'sm' | 'md';
    error?: string;
    hint?: string;
    disabled?: boolean;
    placeholder?: string;
    type?: string;
  }>(),
  { required: false, size: 'md', error: '', hint: '', disabled: false, type: 'text' }
);

const model = defineModel<string>();

// useId() must be called in setup scope, not inside a computed getter.
const generatedId = useId();
const rid = computed(() => props.id || `drh-input-${generatedId}`);
const message = computed(() => props.error || props.hint);

const fieldClasses = computed(() => ['drh-field', props.error ? 'drh-field--error' : '']);
const wrapClasses = computed(() => [
  'drh-inputwrap',
  `drh-inputwrap--${props.size}`,
  props.disabled ? 'drh-inputwrap--disabled' : '',
]);
</script>

<template>
  <div :class="fieldClasses">
    <label v-if="label" class="drh-field__label" :for="rid">
      {{ label }}<span v-if="required" class="drh-field__req">*</span>
    </label>
    <div :class="wrapClasses">
      <span v-if="$slots.iconStart" class="drh-inputwrap__ico"><slot name="iconStart" /></span>
      <input
        :id="rid"
        :name="rid"
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-invalid="!!error"
      />
      <span v-if="$slots.iconEnd" class="drh-inputwrap__ico"><slot name="iconEnd" /></span>
    </div>
    <span v-if="message" class="drh-field__msg">{{ message }}</span>
  </div>
</template>

<style>
.drh-field { display: flex; flex-direction: column; gap: 7px; font-family: var(--font-body); }
.drh-field__label { font-size: var(--text-sm); font-weight: var(--weight-bold); color: var(--text-strong); }
.drh-field__req { color: var(--brand); margin-inline-start: 2px; }
.drh-inputwrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-card);
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0 16px;
  height: var(--tap-comfort);
  transition: border-color var(--dur-base) var(--ease-standard),
    box-shadow var(--dur-base) var(--ease-standard),
    background var(--dur-base) var(--ease-standard);
}
.drh-inputwrap:hover { border-color: var(--border-strong); }
.drh-inputwrap:focus-within { border-color: var(--brand); box-shadow: var(--ring-brand); }
.drh-inputwrap input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-strong);
  min-width: 0;
  height: 100%;
}
.drh-inputwrap input::placeholder { color: var(--text-subtle); }
/* The wrapper (:focus-within) owns the focus ring — suppress the inner
   input's own :focus-visible ring so there's no double border. */
.drh-inputwrap input:focus,
.drh-inputwrap input:focus-visible { box-shadow: none; border-radius: 0; }
.drh-inputwrap__ico { display: inline-flex; color: var(--text-muted); flex: none; }
.drh-inputwrap__ico svg { width: 19px; height: 19px; }
.drh-field--error .drh-inputwrap { border-color: var(--danger-500); }
.drh-field--error .drh-inputwrap:focus-within { box-shadow: 0 0 0 3px rgba(180, 84, 78, 0.25); }
.drh-field__msg { font-size: var(--text-xs); color: var(--text-muted); }
.drh-field--error .drh-field__msg { color: var(--danger-500); }
.drh-inputwrap--disabled { opacity: 0.55; pointer-events: none; background: var(--n-100); }
.drh-inputwrap--sm { height: 44px; padding: 0 12px; }
.drh-inputwrap--sm input { font-size: var(--text-sm); }
</style>
