<script setup lang="ts">
import { Icon } from '@org/shared-ui';
import { WHY } from '~/data/site';

const { t } = useI18n();
const { lc } = useLocalize();
</script>

<template>
  <section id="why" class="section why">
    <div class="container">
      <div class="why__head">
        <div class="eyebrow">{{ t('why.eyebrow') }}</div>
        <h2 class="h-sec">{{ t('why.title') }}</h2>
      </div>
      <div class="grid-why">
        <div v-for="w in WHY" :key="w.icon" class="why__card" data-reveal>
          <span class="why__icon"><Icon :name="w.icon" :size="24" /></span>
          <div class="why__title">{{ lc(w.title) }}</div>
          <p class="why__desc">{{ lc(w.desc) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.why { background: var(--surface-cream); }
.why__head { text-align: center; margin-bottom: 44px; }
.why__card { background: var(--surface-card); border-radius: 20px; padding: 26px; box-shadow: var(--shadow-sm); }
.why__icon {
  width: 52px; height: 52px; border-radius: 15px;
  background: var(--rose-100); color: var(--brand-strong);
  display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;
}
.why__title { font-family: var(--font-display); font-weight: 800; font-size: 18px; color: var(--text-strong); margin-bottom: 8px; }
.why__desc { font-size: 14px; color: var(--text-muted); line-height: 1.8; margin: 0; }
</style>
