<script setup lang="ts">
import { ref } from 'vue';
import { Button, Tag, Icon } from '@org/shared-ui';
import { useScrollReveal } from '@org/shared-utils';
import HeroCarousel from '~/components/home/HeroCarousel.vue';
import HeroSearch from '~/components/home/HeroSearch.vue';
import WhySection from '~/components/home/WhySection.vue';
import StatsBand from '~/components/home/StatsBand.vue';
import ReviewsSection from '~/components/home/ReviewsSection.vue';
import CtaBand from '~/components/home/CtaBand.vue';
import FaqSection from '~/components/FaqSection.vue';
import NewsletterBand from '~/components/NewsletterBand.vue';
import TripGrid from '~/components/TripGrid.vue';
import { CATEGORIES, TRIPS } from '~/data/site';

const { t } = useI18n();
const localePath = useLocalePath();

useHead(() => ({
  title: `${t('brand')} · ${t('hero.title')}`,
  meta: [{ name: 'description', content: t('hero.subtitle') }],
}));

const featured = ref<HTMLElement | null>(null);
useScrollReveal(featured, { selector: '.grid-trips > *', stagger: 0.09 });

function goTrip(id: string) {
  navigateTo(localePath(`/trip/${id}`));
}
function goDestinations() {
  navigateTo(localePath('/destinations'));
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
        <TripGrid :trips="TRIPS" @open="goTrip" />
      </div>
    </section>

    <WhySection />
    <StatsBand />
    <ReviewsSection />
    <FaqSection />
    <CtaBand @explore="goDestinations" />
    <NewsletterBand />
  </div>
</template>

<style scoped>
.featured__chips { margin-bottom: 30px; }
</style>
