<script setup lang="ts">
import { computed, ref } from 'vue';
import { useScrollReveal } from '@org/shared-utils';
import PageHero from '~/components/PageHero.vue';
import ServiceCard from '~/components/ServiceCard.vue';
import ServiceCardSkeleton from '~/components/ServiceCardSkeleton.vue';
import FaqSection from '~/components/FaqSection.vue';

const { t } = useI18n();
const { pick } = useDbPick();
const { data: services, pending } = useServices();
const { ready } = useDelayedReady(pending);

useHead(() => ({ title: `${t('pages.services.title')} · ${t('brand')}` }));

const items = computed(() => services.value ?? []);
const grid = ref<HTMLElement | null>(null);
useScrollReveal(grid, { selector: '.svc', stagger: 0.07, watch: ready });
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('pages.services.eyebrow')"
      :title="t('pages.services.title')"
      :description="t('pages.services.lead')"
      icon="concierge-bell"
      grad="linear-gradient(135deg,#9E5863,#7C444E)"
    />

    <section ref="grid" class="section">
      <div class="container">
        <div class="grid-cards">
          <template v-if="ready">
            <ServiceCard
              v-for="s in items"
              :key="s.id"
              :icon="s.icon"
              :title="pick(s, 'title')"
              :desc="pick(s, 'desc')"
            />
          </template>
          <template v-else>
            <ServiceCardSkeleton v-for="n in 6" :key="`sk-${n}`" />
          </template>
        </div>
      </div>
    </section>

    <FaqSection />
  </div>
</template>

<style scoped>
.grid-cards { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 620px) { .grid-cards { grid-template-columns: 1fr 1fr; } }
@media (min-width: 980px) { .grid-cards { grid-template-columns: 1fr 1fr 1fr; } }
</style>
