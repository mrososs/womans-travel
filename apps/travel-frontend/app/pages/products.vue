<script setup lang="ts">
import { computed, ref } from 'vue';
import { useScrollReveal } from '@org/shared-utils';
import ProductCard from '~/components/ProductCard.vue';

const { t } = useI18n();
const { pick } = useDbPick();
const { data: products } = useProducts();

useHead(() => ({ title: `${t('pages.products.title')} · ${t('brand')}` }));

const items = computed(() => products.value ?? []);
const grid = ref<HTMLElement | null>(null);
useScrollReveal(grid, { selector: '.prod', stagger: 0.07 });
</script>

<template>
  <div>
    <section class="page-head">
      <div class="container">
        <div class="eyebrow">{{ t('pages.products.eyebrow') }}</div>
        <h1 class="h-sec">{{ t('pages.products.title') }}</h1>
        <p class="lead page-head__lead">{{ t('pages.products.lead') }}</p>
      </div>
    </section>

    <section ref="grid" class="section">
      <div class="container">
        <div class="grid-cards">
          <ProductCard
            v-for="p in items"
            :key="p.id"
            :title="pick(p, 'title')"
            :desc="pick(p, 'desc')"
            :icon="p.icon"
            :grad="p.grad"
            :price="pick(p, 'price')"
            :currency="t('common.currency')"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page-head { background: var(--surface-cream); padding: clamp(40px, 6vw, 72px) 0; }
.page-head__lead { margin-top: 12px; }
.grid-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (min-width: 720px) { .grid-cards { grid-template-columns: 1fr 1fr 1fr; } }
@media (min-width: 980px) { .grid-cards { grid-template-columns: repeat(4, 1fr); } }
</style>
