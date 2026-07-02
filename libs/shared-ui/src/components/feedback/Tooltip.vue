<script setup lang="ts">
/**
 * Tooltip — hover/focus label. Wraps a single interactive trigger (default
 * slot). The label text is the `content` prop or the `content` slot.
 */
withDefaults(
  defineProps<{ content?: string; side?: 'top' | 'bottom' }>(),
  { side: 'top' }
);
</script>

<template>
  <span class="drh-tip">
    <slot />
    <span :class="['drh-tip__pop', `drh-tip__pop--${side}`]" role="tooltip">
      <slot name="content">{{ content }}</slot>
    </span>
  </span>
</template>

<style>
.drh-tip { position: relative; display: inline-flex; }
.drh-tip__pop {
  position: absolute;
  z-index: var(--z-tooltip, 1050);
  pointer-events: none;
  background: var(--navy-900);
  color: var(--text-on-navy);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  line-height: 1.4;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  box-shadow: var(--shadow-md);
  opacity: 0;
  transform: translateY(4px) scale(0.96);
  transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out);
}
.drh-tip__pop::after { content: ''; position: absolute; width: 8px; height: 8px; background: var(--navy-900); transform: rotate(45deg); }
.drh-tip:hover .drh-tip__pop,
.drh-tip:focus-within .drh-tip__pop { opacity: 1; transform: none; }

.drh-tip__pop--top { bottom: calc(100% + 9px); left: 50%; transform: translateX(-50%) translateY(4px) scale(0.96); }
.drh-tip:hover .drh-tip__pop--top,
.drh-tip:focus-within .drh-tip__pop--top { transform: translateX(-50%); }
.drh-tip__pop--top::after { bottom: -4px; left: 50%; margin-left: -4px; }

.drh-tip__pop--bottom { top: calc(100% + 9px); left: 50%; transform: translateX(-50%) translateY(-4px) scale(0.96); }
.drh-tip:hover .drh-tip__pop--bottom,
.drh-tip:focus-within .drh-tip__pop--bottom { transform: translateX(-50%); }
.drh-tip__pop--bottom::after { top: -4px; left: 50%; margin-left: -4px; }
</style>
