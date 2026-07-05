<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * AppSplash — first-paint brand splash. Shows the full logo lockup with a
 * choreographed "take-off": the mark reveals, a metallic gold sheen sweeps
 * across it (the logo PNG itself is used as a CSS mask so the sheen only
 * touches the ink), a thin gold runway line draws under the wordmark, and the
 * whole thing lifts away to reveal the app.
 *
 * It is rendered once in app.vue, so it only appears on a full page load — SPA
 * route changes (which keep app.vue mounted) get RouteProgress instead. Honors
 * prefers-reduced-motion and can be dismissed with a click/tap or Escape.
 */
const { locale } = useI18n();

const brand = locale.value === 'ar' ? 'رحلات المستقبل الذهبي' : 'Rahlat Almustaqbal Aldhahabi';
const tagline = locale.value === 'ar' ? 'سفرٌ نسائيٌّ فاخر' : "Women's luxury travel";

const visible = ref(true);
const leaving = ref(false);

let holdTimer: ReturnType<typeof setTimeout> | undefined;
let exitTimer: ReturnType<typeof setTimeout> | undefined;
let dismissed = false;

function lock() {
  document.documentElement.classList.add('splash-lock');
}
function unlock() {
  document.documentElement.classList.remove('splash-lock');
}

function dismiss() {
  if (dismissed) return;
  dismissed = true;
  clearTimeout(holdTimer);
  leaving.value = true;
  exitTimer = setTimeout(() => {
    visible.value = false;
    unlock();
  }, 460);
}

onMounted(() => {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  lock();
  holdTimer = setTimeout(dismiss, reduced ? 650 : 2100);
  window.addEventListener('keydown', onKey);
});

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') dismiss();
}

onBeforeUnmount(() => {
  clearTimeout(holdTimer);
  clearTimeout(exitTimer);
  window.removeEventListener('keydown', onKey);
  unlock();
});
</script>

<template>
  <Transition name="splash-fade" appear>
    <div
      v-if="visible"
      class="splash"
      :class="{ 'splash--leaving': leaving }"
      role="status"
      :aria-label="brand"
      @click="dismiss"
    >
      <div class="splash__stage">
        <div class="splash__halo" aria-hidden="true" />
        <div class="splash__logo">
          <img
            class="splash__img"
            src="/brand/logo-lockup.png"
            :alt="brand"
            width="362"
            height="262"
            fetchpriority="high"
          >
          <span class="splash__shine" aria-hidden="true" />
        </div>
        <span class="splash__line" aria-hidden="true" />
        <p class="splash__tag">{{ tagline }}</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: var(--gutter);
  background:
    radial-gradient(120% 80% at 50% 18%, rgba(183, 110, 121, 0.10), transparent 60%),
    radial-gradient(90% 70% at 82% 90%, rgba(198, 161, 91, 0.12), transparent 62%),
    var(--grad-pearl, linear-gradient(180deg, #fdfbf7 0%, #f4eadb 100%));
  cursor: pointer;
  transition: opacity 0.44s var(--ease-out), transform 0.44s var(--ease-out);
}
.splash--leaving {
  opacity: 0;
  transform: scale(1.04);
  pointer-events: none;
}

.splash__stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(14px, 2.4vw, 22px);
}

.splash__halo {
  position: absolute;
  top: 42%;
  left: 50%;
  width: clamp(320px, 70vw, 560px);
  aspect-ratio: 1;
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(244, 234, 219, 0) 66%);
  filter: blur(4px);
  animation: splashHalo 2.1s var(--ease-out) both;
}

.splash__logo {
  position: relative;
  width: clamp(220px, 62vw, 400px);
}
.splash__img {
  display: block;
  width: 100%;
  height: auto;
  animation: splashLogo 1s var(--ease-out) both;
  filter: drop-shadow(0 18px 34px rgba(38, 24, 22, 0.12));
}

/* Metallic sheen — the lockup PNG masks a moving gold/white gradient so the
   highlight sweeps across only the logo's ink, not the whole box. */
.splash__shine {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    100deg,
    transparent 42%,
    rgba(255, 255, 255, 0.85) 49%,
    rgba(214, 178, 90, 0.7) 53%,
    transparent 61%
  );
  background-size: 240% 100%;
  background-repeat: no-repeat;
  background-position-x: 150%;
  -webkit-mask: url('/brand/logo-lockup.png') center / contain no-repeat;
  mask: url('/brand/logo-lockup.png') center / contain no-repeat;
  animation: splashShine 1.15s var(--ease-standard) 0.55s both;
}

.splash__line {
  width: clamp(120px, 30vw, 210px);
  height: 2px;
  border-radius: 2px;
  background: var(--grad-gold, linear-gradient(120deg, #ddc290, #c6a15b));
  transform-origin: center;
  animation: splashLine 0.7s var(--ease-out) 0.5s both;
}

.splash__tag {
  margin: 0;
  font-family: var(--font-display);
  font-weight: var(--weight-semibold);
  font-size: clamp(13px, 2.2vw, 16px);
  letter-spacing: 0.12em;
  color: var(--text-gold, #806526);
  animation: splashTag 0.7s var(--ease-out) 0.7s both;
}

@keyframes splashLogo {
  from {
    opacity: 0;
    transform: scale(0.86) translateY(8px);
    filter: drop-shadow(0 18px 34px rgba(38, 24, 22, 0)) blur(6px);
  }
  to {
    opacity: 1;
    transform: none;
    filter: drop-shadow(0 18px 34px rgba(38, 24, 22, 0.12)) blur(0);
  }
}
@keyframes splashShine {
  from { background-position-x: 150%; }
  to { background-position-x: -70%; }
}
@keyframes splashHalo {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
  55% { opacity: 1; }
  100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
}
@keyframes splashLine {
  from { opacity: 0; transform: scaleX(0); }
  to { opacity: 1; transform: scaleX(1); }
}
@keyframes splashTag {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}

/* Transition wrapper (initial appear) */
.splash-fade-enter-active { transition: opacity 0.3s var(--ease-out); }
.splash-fade-enter-from { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .splash__img,
  .splash__halo,
  .splash__line,
  .splash__tag { animation: none; }
  .splash__shine { display: none; }
  .splash__img { opacity: 1; }
  .splash { transition: opacity 0.3s linear; }
  .splash--leaving { transform: none; }
}
</style>
