<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button, Tag, Icon } from '@org/shared-ui';
import { useScrollReveal } from '@org/shared-utils';
import HeroCarousel from '~/components/home/HeroCarousel.vue';
import HeroSearch from '~/components/home/HeroSearch.vue';
import WhySection from '~/components/home/WhySection.vue';
import StatsBand from '~/components/home/StatsBand.vue';
import ReviewsSection from '~/components/home/ReviewsSection.vue';
import PaymentBand from '~/components/home/PaymentBand.vue';
import CtaBand from '~/components/home/CtaBand.vue';
import FaqSection from '~/components/FaqSection.vue';
import NewsletterBand from '~/components/NewsletterBand.vue';
import TripGrid from '~/components/TripGrid.vue';
import TripCardSkeleton from '~/components/TripCardSkeleton.vue';
import PackageCard from '~/components/PackageCard.vue';
import PackageCardSkeleton from '~/components/PackageCardSkeleton.vue';
import { CATEGORIES } from '~/data/site';

const { t } = useI18n();
const { pick } = useDbPick();
const localePath = useLocalePath();

useHead(() => ({
  title: `${t('brand')} · ${t('hero.title')}`,
  meta: [{ name: 'description', content: t('hero.subtitle') }],
}));

// Featured trips are served from Supabase (public-read `trips` table).
const { data: trips, pending } = useTrips();
const { ready } = useDelayedReady(pending);
const featuredTrips = computed(() => trips.value ?? []);

// Bookable travel groups (packages) — the available-now products on home.
const { data: packages, pending: packagesPending } = usePackages();
const { ready: groupsReady } = useDelayedReady(packagesPending);
const groups = computed(() => packages.value ?? []);

function packageOffer(p: { discount_seats_limit: number | null; discount_seats_claimed: number; discount_price_amount: number | null }) {
  return getOfferInfo(p.discount_seats_limit, p.discount_seats_claimed, p.discount_price_amount);
}

const featured = ref<HTMLElement | null>(null);
useScrollReveal(featured, { selector: '.grid-trips > *', stagger: 0.09, watch: ready });

function goTrip(id: string) {
  navigateTo(localePath(`/trip/${id}`));
}
function goPackage(id: string) {
  navigateTo(localePath(`/packages/${id}`));
}
function goDestinations() {
  navigateTo(localePath('/destinations'));
}
function goPackages() {
  navigateTo(localePath('/packages'));
}
</script>

<template>
  <div>
    <section class="hero">
      <HeroCarousel />
      <div class="container hero__in">
        <div class="eyebrow">{{ t('hero.eyebrow') }}</div>
        <h1>{{ t('hero.title') }}</h1>
        <p>{{ t('hero.subtitle') }}</p>
        <HeroSearch @search="goDestinations" />
      </div>
    </section>

    <section id="groups" class="section section--groups">
      <div class="container">
        <div class="sec-head">
          <div>
            <div class="eyebrow">{{ t('homeGroups.eyebrow') }}</div>
            <h2 class="h-sec">{{ t('homeGroups.title') }}</h2>
            <p class="groups__lead">{{ t('homeGroups.lead') }}</p>
          </div>
          <Button variant="outline" @click="goPackages">
            {{ t('homeGroups.viewAll') }}
            <template #iconEnd><Icon name="arrow-left" :size="18" /></template>
          </Button>
        </div>
        <div class="groups__grid">
          <template v-if="groupsReady">
            <PackageCard
              v-for="p in groups"
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
              available-now
              :available-label="t('common.availableNow')"
              @open="goPackage(p.id)"
            />
          </template>
          <template v-else>
            <PackageCardSkeleton v-for="n in 2" :key="`gsk-${n}`" />
          </template>
        </div>
      </div>
    </section>

    <section id="destinations" ref="featured" class="section">
      <div class="container">
        <div class="sec-head">
          <div>
            <div class="eyebrow">{{ t('featured.eyebrow') }}</div>
            <h2 class="h-sec">{{ t('featured.title') }}</h2>
          </div>
          <Button variant="outline" @click="goDestinations">
            {{ t('featured.viewAll') }}
            <template #iconEnd><Icon name="arrow-left" :size="18" /></template>
          </Button>
        </div>
        <div class="chips featured__chips">
          <Tag
            v-for="(c, i) in CATEGORIES"
            :key="c.id"
            :selected="i === 0"
            @click="goDestinations"
          >
            <template #icon><Icon :name="c.icon" :size="15" /></template>
            {{ t(`categories.${c.id}`) }}
          </Tag>
        </div>
        <TripGrid v-if="ready" :trips="featuredTrips" @open="goTrip" />
        <div v-else class="grid-trips">
          <TripCardSkeleton v-for="n in 6" :key="`sk-${n}`" />
        </div>
      </div>
    </section>

    <WhySection />
    <StatsBand />
    <PaymentBand />
    <ReviewsSection />
    <FaqSection />
    <CtaBand @explore="goDestinations" />
    <NewsletterBand />
  </div>
</template>

<style scoped>
.featured__chips { margin-bottom: 30px; }
.section--groups { padding-bottom: 0; }
.groups__lead { color: var(--text-muted); font-size: 15px; line-height: 1.7; margin: 8px 0 0; max-width: 52ch; }
.groups__grid { display: grid; grid-template-columns: 1fr; gap: 24px; margin-top: 30px; }
@media (min-width: 760px) { .groups__grid { grid-template-columns: 1fr 1fr; } }
</style>
