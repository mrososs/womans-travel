<script setup lang="ts">
import { computed, ref } from 'vue';
import { useScrollReveal } from '@org/shared-utils';
import PageHero from '~/components/PageHero.vue';
import PackageCard from '~/components/PackageCard.vue';

const { t } = useI18n();
const { pick } = useDbPick();
const { data: packages } = usePackages();

useHead(() => ({ title: `${t('pages.packages.title')} · ${t('brand')}` }));

const items = computed(() => packages.value ?? []);
const grid = ref<HTMLElement | null>(null);
useScrollReveal(grid, { selector: '.pkg', stagger: 0.08 });
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('pages.packages.eyebrow')"
      :title="t('pages.packages.title')"
      :description="t('pages.packages.lead')"
      icon="crown"
      image="/hero/hero-1.png"
    />

    <section ref="grid" class="section">
      <div class="container">
        <div class="grid-cards">
          <PackageCard
            v-for="p in items"
            :key="p.id"
            :title="pick(p, 'title')"
            :desc="pick(p, 'desc')"
            :icon="p.icon"
            :grad="p.grad"
            :price="pick(p, 'price')"
            :currency="t('common.currency')"
            :from-label="t('common.startingFrom')"
            :kind-label="t(`destinations.kinds.${p.kind}`)"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.grid-cards { display: grid; grid-template-columns: 1fr; gap: 24px; }
@media (min-width: 620px) { .grid-cards { grid-template-columns: 1fr 1fr; } }
@media (min-width: 980px) { .grid-cards { grid-template-columns: 1fr 1fr 1fr; } }
</style>
