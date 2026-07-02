<script setup lang="ts">
import { computed } from 'vue';
import PackageCard from '~/components/PackageCard.vue';

const { t } = useI18n();
const { pick } = useDbPick();
const { data: packages } = usePackages();

useHead(() => ({ title: `${t('pages.packages.title')} · ${t('brand')}` }));

const items = computed(() => packages.value ?? []);
</script>

<template>
  <div>
    <section class="page-head">
      <div class="container">
        <div class="eyebrow">{{ t('pages.packages.eyebrow') }}</div>
        <h1 class="h-sec">{{ t('pages.packages.title') }}</h1>
        <p class="lead page-head__lead">{{ t('pages.packages.lead') }}</p>
      </div>
    </section>

    <section class="section">
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
.page-head { background: var(--surface-cream); padding: clamp(40px, 6vw, 72px) 0; }
.page-head__lead { margin-top: 12px; }
.grid-cards { display: grid; grid-template-columns: 1fr; gap: 24px; }
@media (min-width: 620px) { .grid-cards { grid-template-columns: 1fr 1fr; } }
@media (min-width: 980px) { .grid-cards { grid-template-columns: 1fr 1fr 1fr; } }
</style>
