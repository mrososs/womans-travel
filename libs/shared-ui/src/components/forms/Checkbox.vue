<script setup lang="ts">
import { computed } from 'vue';
import Icon from '../display/Icon.vue';

/**
 * Checkbox — custom square with an animated check. Two-way bound via v-model.
 */
const props = withDefaults(
  defineProps<{ label?: string; disabled?: boolean }>(),
  { disabled: false }
);

const model = defineModel<boolean>({ default: false });

const classes = computed(() => ['drh-check', props.disabled ? 'drh-check--disabled' : '']);
</script>

<template>
  <label :class="classes">
    <input type="checkbox" v-model="model" :disabled="disabled" />
    <span class="drh-check__box"><Icon name="check" :size="15" /></span>
    <span v-if="label" class="drh-check__label">{{ label }}</span>
  </label>
</template>

<style>
.drh-check {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  font-family: var(--font-body);
  cursor: pointer;
  user-select: none;
}
.drh-check input { position: absolute; opacity: 0; width: 0; height: 0; }
.drh-check__box {
  width: 22px;
  height: 22px;
  flex: none;
  border-radius: 7px;
  border: 1.5px solid var(--border-strong);
  background: var(--surface-card);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: background var(--dur-base) var(--ease-standard),
    border-color var(--dur-base) var(--ease-standard),
    transform var(--dur-fast) var(--ease-standard);
}
.drh-check__box svg {
  width: 15px;
  height: 15px;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity var(--dur-fast), transform var(--dur-fast) var(--ease-out);
}
.drh-check input:checked + .drh-check__box { background: var(--brand-solid); border-color: var(--brand-solid); }
.drh-check input:checked + .drh-check__box svg { opacity: 1; transform: scale(1); }
.drh-check input:focus-visible + .drh-check__box { box-shadow: var(--ring-brand); }
.drh-check:active .drh-check__box { transform: scale(0.9); }
.drh-check__label { font-size: var(--text-base); color: var(--text-body); line-height: 1.4; }
.drh-check--disabled { opacity: 0.5; cursor: not-allowed; }
</style>
