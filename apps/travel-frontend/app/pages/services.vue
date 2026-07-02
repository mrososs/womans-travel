<script setup lang="ts">
import { computed, ref } from 'vue';
import { useScrollReveal } from '@org/shared-utils';
import ServiceCard from '~/components/ServiceCard.vue';
import FaqSection from '~/components/FaqSection.vue';

const { t } = useI18n();
const { pick } = useDbPick();
const { data: services } = useServices();

useHead(() => ({ title: `${t('pages.services.title')} · ${t('brand')}` }));

const items = computed(() => services.value ?? []);
const grid = ref<HTMLElement | null>(null);
useScrollReveal(grid, { selector: '.svc', stagger: 0.07 });
</script>

<template>
  <div>
    <section class="page-head">
      <div class="container">
        <div class="eyebrow">{{ t('pages.services.eyebrow') }}</div>
        <h1 class="h-sec">{{ t('pages.services.title') }}</h1>
        <p class="lead page-head__lead">{{ t('pages.services.lead') }}</p>
      </div>
    </section>

    <section ref="grid" class="section">
      <div class="container">
        <div class="grid-cards">
          <ServiceCard
            v-for="s in items"
            :key="s.id"
            :icon="s.icon"
            :title="pick(s, 'title')"
            :desc="pick(s, 'desc')"
          />
        </div>
      </div>
    </section>

    <FaqSection />
  </div>
</template>

<style scoped>
.page-head { background: var(--surface-cream); padding: clamp(40px, 6vw, 72px) 0; }
.page-head__lead { margin-top: 12px; }
.grid-cards { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 620px) { .grid-cards { grid-template-columns: 1fr 1fr; } }
@media (min-width: 980px) { .grid-cards { grid-template-columns: 1fr 1fr 1fr; } }
</style>
