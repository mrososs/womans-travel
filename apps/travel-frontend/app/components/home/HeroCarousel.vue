<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Icon } from '@org/shared-ui';
import { HERO_SLIDES } from '~/data/site';

/**
 * HeroCarousel — auto-rotating background slides with dots + arrows.
 * Autoplay pauses under prefers-reduced-motion.
 */
const current = ref(0);
const count = HERO_SLIDES.length;
let timer: ReturnType<typeof setInterval> | null = null;

function go(delta: number) {
  current.value = (current.value + delta + count) % count;
}

onMounted(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) timer = setInterval(() => go(1), 5200);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="hero__slides">
    <div
      v-for="(s, idx) in HERO_SLIDES"
      :key="idx"
      class="hero__slide"
      :class="{ on: idx === current }"
    >
      <div class="hero__kb" :style="{ background: s.grad }">
        <img v-if="s.img" :src="s.img" alt="" loading="lazy" >
        <span v-else class="hero__ic"><Icon :name="s.icon" :size="150" :stroke-width="1" color="#fff" /></span>
      </div>
    </div>
    <div class="hero__scrim" />
    <button class="hero__arrow hero__arrow--prev" aria-label="السابق" @click="go(-1)">
      <Icon name="chevron-left" :size="22" />
    </button>
    <button class="hero__arrow hero__arrow--next" aria-label="التالي" @click="go(1)">
      <Icon name="chevron-right" :size="22" />
    </button>
    <div class="hero__dots">
      <button
        v-for="(_, idx) in HERO_SLIDES"
        :key="idx"
        class="hero__dot"
        :class="{ on: idx === current }"
        :aria-label="`شريحة ${idx + 1}`"
        @click="current = idx"
      />
    </div>
  </div>
</template>

<style scoped>
.hero__slides { position: absolute; inset: 0; overflow: hidden; }
.hero__slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1.1s var(--ease-out); }
.hero__slide.on { opacity: 1; }
.hero__kb { position: absolute; inset: 0; transform: scale(1.04); transform-origin: center; }
.hero__kb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hero__ic { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.2; color: #fff; }
.hero__dots { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); z-index: 4; display: flex; gap: 8px; }
.hero__dot {
  width: 8px; height: 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.5);
  border: none; cursor: pointer; padding: 0; transition: width 0.3s, background 0.3s;
}
.hero__dot.on { width: 26px; background: #fff; }
.hero__arrow {
  position: absolute; top: 50%; transform: translateY(-50%); z-index: 4;
  width: 50px; height: 50px; border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.45); background: rgba(18, 27, 51, 0.4); color: #fff;
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.hero__arrow:hover { background: rgba(18, 27, 51, 0.66); }
.hero__arrow:active { transform: translateY(-50%) scale(0.92); }
.hero__arrow--prev { inset-inline-end: 16px; }
.hero__arrow--next { inset-inline-start: 16px; }
@media (max-width: 640px) { .hero__arrow { display: none; } }
@media (prefers-reduced-motion: no-preference) {
  .hero__slide.on .hero__kb { animation: heroKB 7s var(--ease-standard) forwards; }
}
@keyframes heroKB { from { transform: scale(1.04); } to { transform: scale(1.16); } }
</style>
