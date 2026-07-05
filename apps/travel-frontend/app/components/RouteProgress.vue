<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * RouteProgress — navigation feedback for SPA route changes. A slim gold
 * progress bar advances along the top of the viewport, and if a navigation
 * runs longer than a short threshold a small brand chip (the camel mark with a
 * plane looping overhead) fades in so slow transitions never feel stalled.
 *
 * Driven by Nuxt's page-loading hooks; the bar eases toward ~92% while loading
 * and snaps to 100% on completion. Respects prefers-reduced-motion (the plane
 * stops looping; the bar still fills to convey state).
 */
const { locale } = useI18n();
const loadingText = locale.value === 'ar' ? 'جارٍ التحضير' : 'Preparing';

const active = ref(false); // bar visible
const showChip = ref(false); // delayed chip
const progress = ref(0); // 0..100

let raf: number | undefined;
let chipTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

function tick() {
  // Ease toward 92% asymptotically; the closer we get, the slower we crawl.
  if (progress.value < 92) {
    const remaining = 92 - progress.value;
    progress.value += Math.max(0.4, remaining * 0.028);
    raf = requestAnimationFrame(tick);
  }
}

function start() {
  clearTimeout(hideTimer);
  cancelAnimationFrame(raf ?? 0);
  active.value = true;
  progress.value = progress.value > 80 ? 0 : progress.value; // reset if a prior run nearly finished
  if (progress.value === 0) progress.value = 8;
  raf = requestAnimationFrame(tick);
  clearTimeout(chipTimer);
  chipTimer = setTimeout(() => {
    if (active.value) showChip.value = true;
  }, 260);
}

function finish() {
  cancelAnimationFrame(raf ?? 0);
  clearTimeout(chipTimer);
  progress.value = 100;
  showChip.value = false;
  hideTimer = setTimeout(() => {
    active.value = false;
    progress.value = 0;
  }, 360);
}

onMounted(() => {
  const nuxtApp = useNuxtApp();
  nuxtApp.hook('page:loading:start', start);
  nuxtApp.hook('page:loading:end', finish);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(raf ?? 0);
  clearTimeout(chipTimer);
  clearTimeout(hideTimer);
});
</script>

<template>
  <div class="rp" aria-hidden="true">
    <!-- Top progress bar -->
    <div v-show="active" class="rp__bar">
      <span
        class="rp__fill"
        :class="{ 'rp__fill--done': progress >= 100 }"
        :style="{ transform: `scaleX(${progress / 100})` }"
      />
    </div>

    <!-- Delayed flying-logo chip -->
    <Transition name="rp-chip">
      <div v-if="showChip" class="rp__chip" role="status" :aria-label="loadingText">
        <div class="rp__scene">
          <svg class="rp__plane" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M21 15.5 3.6 21l3.9-6.2L3.6 8.5 21 14v1.5ZM7.2 14.4l7.6-.5-7.6-2.6-1.4 1.6 1.4 1.5Z"
              fill="currentColor"
            />
          </svg>
          <img
            class="rp__mark"
            src="/brand/logo-mark.png"
            alt=""
            width="102"
            height="141"
          >
        </div>
        <span class="rp__label">{{ loadingText }}<i>.</i><i>.</i><i>.</i></span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.rp__bar {
  position: fixed;
  inset-inline: 0;
  top: 0;
  height: 3px;
  z-index: 9999;
  background: transparent;
  overflow: hidden;
}
.rp__fill {
  display: block;
  height: 100%;
  width: 100%;
  transform-origin: left center;
  transform: scaleX(0);
  background: linear-gradient(90deg, var(--gold-400, #ceab6c), var(--gold-500, #c6a15b), var(--rose-500, #b76e79));
  box-shadow: 0 0 12px rgba(198, 161, 91, 0.7);
  transition: transform 0.18s var(--ease-out);
  border-end-end-radius: 3px;
  border-start-end-radius: 3px;
}
.rp__fill--done { transition: transform 0.34s var(--ease-out); }

/* Brand chip */
.rp__chip {
  position: fixed;
  z-index: 9998;
  inset-block-end: clamp(20px, 5vw, 40px);
  inset-inline-end: clamp(20px, 5vw, 40px);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px 10px 12px;
  border-radius: var(--radius-pill, 999px);
  background: var(--glass-bg, rgba(251, 248, 243, 0.82));
  backdrop-filter: var(--blur-md, blur(14px));
  -webkit-backdrop-filter: var(--blur-md, blur(14px));
  border: 1px solid var(--border-gold, #ddc290);
  box-shadow: var(--shadow-lg, 0 20px 48px rgba(38, 24, 22, 0.12));
}
.rp__scene {
  position: relative;
  width: 34px;
  height: 40px;
  flex: none;
}
.rp__mark {
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 50%;
  translate: -50% 0;
  height: 30px;
  width: auto;
  animation: rpBob 1.6s var(--ease-gentle, ease-in-out) infinite;
}
.rp__plane {
  position: absolute;
  top: -2px;
  inset-inline-start: -2px;
  width: 15px;
  height: 15px;
  color: var(--gold-500, #c6a15b);
  offset-path: path('M0 12 Q17 -4 34 8');
  offset-rotate: auto;
  animation: rpFly 1.7s var(--ease-in-out, ease-in-out) infinite;
}
.rp__label {
  font-family: var(--font-display);
  font-weight: var(--weight-semibold, 600);
  font-size: 13px;
  letter-spacing: 0.02em;
  color: var(--text-body, #24314b);
  white-space: nowrap;
}
.rp__label i {
  font-style: normal;
  opacity: 0.3;
  animation: rpDot 1.2s steps(1) infinite;
}
.rp__label i:nth-child(2) { animation-delay: 0.2s; }
.rp__label i:nth-child(3) { animation-delay: 0.4s; }

@keyframes rpFly {
  0% { offset-distance: 0%; opacity: 0; }
  12% { opacity: 1; }
  88% { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0; }
}
@keyframes rpBob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
@keyframes rpDot {
  0%, 60% { opacity: 0.3; }
  30% { opacity: 1; }
}

/* Chip enter/leave */
.rp-chip-enter-active { transition: opacity 0.28s var(--ease-out), transform 0.28s var(--ease-out); }
.rp-chip-leave-active { transition: opacity 0.2s var(--ease-out), transform 0.2s var(--ease-out); }
.rp-chip-enter-from,
.rp-chip-leave-to { opacity: 0; transform: translateY(10px); }

@media (prefers-reduced-motion: reduce) {
  .rp__plane,
  .rp__mark,
  .rp__label i { animation: none; }
  .rp__plane { opacity: 1; offset-distance: 55%; }
}
</style>
