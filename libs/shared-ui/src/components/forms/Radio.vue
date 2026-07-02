<script setup lang="ts">
import { computed } from 'vue';

/**
 * Radio — single-choice control. Bind a group with the same v-model and give
 * each option a distinct `value`.
 */
const props = withDefaults(
  defineProps<{ label?: string; value: string; name?: string; disabled?: boolean }>(),
  { disabled: false }
);

const model = defineModel<string>();

const classes = computed(() => ['drh-radio', props.disabled ? 'drh-radio--disabled' : '']);
</script>

<template>
  <label :class="classes">
    <input
      type="radio"
      v-model="model"
      :value="value"
      :name="name"
      :disabled="disabled"
    />
    <span class="drh-radio__dot" />
    <span v-if="label" class="drh-radio__label">{{ label }}</span>
  </label>
</template>

<style>
.drh-radio {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  font-family: var(--font-body);
  cursor: pointer;
  user-select: none;
}
.drh-radio input { position: absolute; opacity: 0; width: 0; height: 0; }
.drh-radio__dot {
  width: 22px;
  height: 22px;
  flex: none;
  border-radius: 50%;
  border: 1.5px solid var(--border-strong);
  background: var(--surface-card);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--dur-base) var(--ease-standard),
    transform var(--dur-fast) var(--ease-standard);
}
.drh-radio__dot::after {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--brand-solid);
  transform: scale(0);
  transition: transform var(--dur-base) var(--ease-out);
}
.drh-radio input:checked + .drh-radio__dot { border-color: var(--brand-solid); }
.drh-radio input:checked + .drh-radio__dot::after { transform: scale(1); }
.drh-radio input:focus-visible + .drh-radio__dot { box-shadow: var(--ring-brand); }
.drh-radio:active .drh-radio__dot { transform: scale(0.9); }
.drh-radio__label { font-size: var(--text-base); color: var(--text-body); line-height: 1.4; }
.drh-radio--disabled { opacity: 0.5; cursor: not-allowed; }
</style>
