<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { gsap } from 'gsap';
import { Icon } from '@org/shared-ui';

/**
 * PageHero — reusable page header with a gradient (or image/GIF) background,
 * navy scrim, GSAP entrance animation, and a gently floating decorative glyph.
 * Direction-agnostic (uses logical properties), so it flips for LTR/RTL.
 */
withDefaults(
  defineProps<{
    eyebrow?: string;
    title: string;
    description?: string;
    /** Lucide glyph shown as the animated watermark. */
    icon?: string;
    /** CSS gradient background (used when no image). */
    grad?: string;
    /** Optional background photo or animated GIF (served from /public). */
    image?: string;
  }>(),
  {
    eyebrow: '',
    description: '',
    icon: 'compass',
    grad: 'var(--grad-navy)',
    image: '',
  }
);

const root = ref<HTMLElement | null>(null);
const glyph = ref<HTMLElement | null>(null);

onMounted(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !root.value) return;

  const targets = root.value.querySelectorAll('[data-hero]');
  gsap.from(targets, {
    opacity: 0,
    y: 24,
    duration: 0.72,
    ease: 'expo.out',
    stagger: 0.1,
  });

  if (glyph.value) {
    gsap.to(glyph.value, {
      y: 16,
      rotate: 6,
      duration: 4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  }
});
</script>

<template>
  <section ref="root" class="phero" :style="{ background: image ? undefined : grad }">
    <img v-if="image" class="phero__img" :src="image" alt="" >
    <div class="phero__scrim" />
    <span ref="glyph" class="phero__glyph" aria-hidden="true">
      <Icon :name="icon" :size="220" :stroke-width="0.9" color="#fff" />
    </span>
    <div class="container phero__inner">
      <div v-if="eyebrow" class="phero__eyebrow" data-hero>{{ eyebrow }}</div>
      <h1 class="phero__title" data-hero>{{ title }}</h1>
      <p v-if="description" class="phero__desc" data-hero>{{ description }}</p>
    </div>
  </section>
</template>

<style scoped>
.phero {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  min-height: clamp(260px, 34vw, 380px);
}
.phero__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.phero__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(18, 27, 51, 0.78) 0%, rgba(18, 27, 51, 0.5) 55%, rgba(18, 27, 51, 0.25) 100%);
}
.phero__glyph {
  position: absolute;
  inset-inline-end: clamp(-40px, 2vw, 40px);
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.14;
  color: #fff;
  pointer-events: none;
}
.phero__inner { position: relative; z-index: 2; padding-top: 48px; padding-bottom: 48px; }
.phero__eyebrow {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 13px;
  color: var(--gold-300);
  letter-spacing: 0.02em;
  margin-bottom: 10px;
}
.phero__title {
  font-family: var(--font-display);
  font-weight: 800;
  color: #fff;
  font-size: clamp(30px, 5vw, 52px);
  line-height: 1.18;
  margin: 0;
  max-width: 18ch;
}
.phero__desc {
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(15px, 2vw, 18px);
  line-height: 1.85;
  max-width: 52ch;
  margin: 16px 0 0;
}
</style>
