<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { Icon } from '@org/shared-ui';

/**
 * BackToTop — floating button that appears once the visitor nears the bottom
 * of the page and scrolls back to the top when pressed. Sits opposite the
 * WhatsApp FAB (inline-end) so the two never overlap.
 */
const { t } = useI18n();

const visible = ref(false);
let ticking = false;

/** Reveal when within ~320px of the page bottom. */
function evaluate() {
  ticking = false;
  const scrolled = window.scrollY + window.innerHeight;
  const full = document.documentElement.scrollHeight;
  visible.value = scrolled >= full - 320;
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(evaluate);
}

function toTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  evaluate();
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onScroll);
});
</script>

<template>
  <button
    type="button"
    class="to-top"
    :class="{ 'to-top--on': visible }"
    :aria-hidden="!visible"
    :tabindex="visible ? 0 : -1"
    :aria-label="t('backToTop')"
    :title="t('backToTop')"
    @click="toTop"
  >
    <Icon name="arrow-up" :size="24" color="var(--gold-300)" />
  </button>
</template>

<style scoped>
.to-top {
  position: fixed;
  inset-block-end: 22px;
  inset-inline-end: 22px;
  z-index: var(--z-toast);
  width: 52px;
  height: 52px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-circle);
  background: var(--surface-navy);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  opacity: 0;
  transform: translateY(14px) scale(0.9);
  pointer-events: none;
  transition:
    opacity var(--dur-base) var(--ease-out),
    transform var(--dur-base) var(--ease-out),
    background var(--dur-base) var(--ease-standard);
}
.to-top--on {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}
.to-top:hover { background: var(--navy-700); transform: translateY(-2px) scale(1); }
.to-top:active { transform: scale(0.94); }
.to-top:focus-visible { outline: none; box-shadow: var(--ring-gold); }

@media (prefers-reduced-motion: reduce) {
  .to-top { transition: opacity var(--dur-base) var(--ease-standard); transform: none; }
  .to-top--on { transform: none; }
  .to-top:hover { transform: none; }
}
</style>
