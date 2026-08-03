<script setup lang="ts">
import { computed, ref } from 'vue';
import { useScrollReveal } from '@org/shared-utils';
import PageHero from '~/components/PageHero.vue';
import PackageCard from '~/components/PackageCard.vue';
import PackageCardSkeleton from '~/components/PackageCardSkeleton.vue';

const { t } = useI18n();
const { pick } = useDbPick();
const { data: packages, pending } = usePackages();
const { ready } = useDelayedReady(pending);
const localePath = useLocalePath();

function goPackage(id: string) {
  navigateTo(localePath(`/packages/${id}`));
}

useHead(() => ({ title: `${t('pages.packages.title')} · ${t('brand')}` }));

const items = computed(() => packages.value ?? []);

function packageOffer(p: { discount_seats_limit: number | null; discount_seats_claimed: number; discount_price_amount: number | null }) {
  return getOfferInfo(p.discount_seats_limit, p.discount_seats_claimed, p.discount_price_amount);
}
const grid = ref<HTMLElement | null>(null);
useScrollReveal(grid, { selector: '.pkg', stagger: 0.08, watch: ready });
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('pages.packages.eyebrow')"
      :title="t('pages.packages.title')"
      :description="t('pages.packages.lead')"
      icon="crown"
      image="/hero/hero-1.webp"
    />

    <section ref="grid" class="section">
      <div class="container">
        <div class="grid-cards">
          <template v-if="ready">
            <PackageCard
              v-for="p in items"
              :key="p.id"
              :title="pick(p, 'title')"
              :desc="pick(p, 'desc')"
              :icon="p.icon"
              :grad="p.grad"
              :img="p.image_url"
              :price="packageOffer(p).active ? pick(p, 'discount_price') : pick(p, 'price')"
              :original-price="packageOffer(p).active ? pick(p, 'price') : ''"
              :offer-label="packageOffer(p).active ? (pick(p, 'discount_label') || t('common.offerBadge')) : ''"
              :currency="t('common.currency')"
              :from-label="t('common.startingFrom')"
              :kind-label="t(`destinations.kinds.${p.kind}`)"
              :view-label="t('actions.view')"
              :vat-note="t('common.vatShort')"
              :sold-out="p.sold_out"
              :sold-out-label="t('common.soldOut')"
              @open="goPackage(p.id)"
            />
          </template>
          <template v-else>
            <PackageCardSkeleton v-for="n in 6" :key="`sk-${n}`" />
          </template>
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
