<script setup lang="ts">
import { computed, ref } from 'vue';
import { Badge, Card, Dialog, Button, Icon } from '@org/shared-ui';
import BookingCard from '~/components/trip/BookingCard.vue';
import TripGrid from '~/components/TripGrid.vue';
import TripPhoto from '~/components/TripPhoto.vue';
import { HIGHLIGHTS, ITINERARY, INCLUDES } from '~/data/site';

const { t } = useI18n();
const { lc } = useLocalize();
const localePath = useLocalePath();
const route = useRoute();

// All trips from Supabase (shared 'trips' asyncData cache). Awaited so the
// 404 check + SSR status resolve before render.
const { data: trips } = await useTrips();

const trip = computed(() => (trips.value ?? []).find((tr) => tr.id === String(route.params.id)));

if (!trip.value) {
  throw createError({ statusCode: 404, statusMessage: 'Trip not found', fatal: true });
}

const current = computed(() => trip.value!);
const related = computed(() => (trips.value ?? []).filter((tr) => tr.id !== current.value.id).slice(0, 3));
const done = ref(false);

useHead(() => ({ title: `${lc(current.value.title)} · ${t('brand')}` }));

function goTrip(id: string) {
  navigateTo(localePath(`/trip/${id}`));
}
</script>

<template>
  <div>
    <div class="container trip-breadcrumb">
      <NuxtLink :to="localePath('/')">{{ t('trip.breadcrumbHome') }}</NuxtLink>
      <Icon name="chevron-left" :size="14" />
      <NuxtLink :to="localePath('/destinations')">{{ t('trip.breadcrumbDest') }}</NuxtLink>
      <Icon name="chevron-left" :size="14" />
      <span class="trip-breadcrumb__current">{{ lc(current.title) }}</span>
    </div>

    <section class="container trip-hero-wrap">
      <div class="trip-hero">
        <TripPhoto :grad="current.grad" :icon="current.icon" :img="current.img" :alt="lc(current.title)" :icon-size="180" />
        <div class="trip-hero__scrim" />
        <div class="trip-hero__content">
          <div class="trip-hero__badges">
            <Badge :variant="current.tierVariant">{{ t(`tiers.${current.tierKey}`) }}</Badge>
            <Badge v-if="current.seats" variant="danger" dot>
              {{ t('common.seatsLeft', { count: current.seats }) }}
            </Badge>
          </div>
          <div class="trip-hero__region">{{ lc(current.region) }}</div>
          <h1 class="trip-hero__title">{{ lc(current.title) }}</h1>
          <div class="trip-hero__meta">
            <span><Icon name="clock" :size="16" color="var(--gold-300)" />{{ lc(current.duration) }}</span>
            <span><Icon name="calendar-days" :size="16" color="var(--gold-300)" />{{ lc(current.dates) }}</span>
            <span><Icon name="star" :size="16" color="var(--gold-300)" />{{ current.rating }} ({{ current.reviews }})</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section trip-body">
      <div class="container">
        <div class="trip-grid">
          <div>
            <p class="trip-intro">{{ t('trip.intro') }}</p>

            <div class="trip-highlights">
              <div v-for="h in HIGHLIGHTS" :key="h.icon" class="trip-highlight">
                <Icon :name="h.icon" :size="20" color="var(--brand-strong)" />
                <span>{{ lc(h.label) }}</span>
              </div>
            </div>

            <h2 class="trip-h2">{{ t('trip.itineraryTitle') }}</h2>
            <div class="trip-timeline">
              <div class="trip-timeline__line" />
              <div class="trip-timeline__items">
                <div v-for="(it, i) in ITINERARY" :key="i" class="trip-step">
                  <span class="trip-step__dot" />
                  <div class="trip-step__day">{{ lc(it.day) }}</div>
                  <div class="trip-step__title">{{ lc(it.title) }}</div>
                  <div class="trip-step__desc">{{ lc(it.desc) }}</div>
                </div>
              </div>
            </div>

            <Card variant="outline" padding="lg">
              <div class="trip-includes__title">{{ t('trip.includesTitle') }}</div>
              <div class="trip-includes">
                <div v-for="(inc, i) in INCLUDES" :key="i" class="trip-include">
                  <span class="trip-include__tick"><Icon name="check" :size="14" /></span>
                  <span>{{ lc(inc) }}</span>
                </div>
              </div>
            </Card>
          </div>

          <BookingCard :trip="current" @book="done = true" />
        </div>
      </div>
    </section>

    <section class="section trip-related">
      <div class="container">
        <h2 class="h-sec trip-related__head">{{ t('trip.relatedTitle') }}</h2>
        <TripGrid :trips="related" @open="goTrip" />
      </div>
    </section>

    <Dialog v-model:open="done" variant="center" :title="t('trip.success.title')" @close="done = false">
      <div class="trip-done">
        <span class="trip-done__icon"><Icon name="check" :size="32" /></span>
        <p>{{ t('trip.success.body', { title: lc(current.title) }) }}</p>
      </div>
      <template #footer>
        <Button block @click="done = false">{{ t('trip.success.ok') }}</Button>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.trip-breadcrumb { padding: 18px var(--gutter) 0; display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); }
.trip-breadcrumb a { color: var(--text-muted); text-decoration: none; }
.trip-breadcrumb__current { color: var(--text-strong); font-weight: 700; }

.trip-hero-wrap { padding-top: 18px; padding-bottom: 8px; }
.trip-hero { position: relative; border-radius: 28px; overflow: hidden; height: clamp(300px, 45vw, 440px); box-shadow: var(--shadow-lg); }
.trip-hero__scrim { position: absolute; inset: 0; background: var(--grad-scrim); opacity: 0.5; }
.trip-hero__content { position: absolute; bottom: 0; inset-inline: 0; padding: clamp(20px, 4vw, 40px); }
.trip-hero__badges { display: flex; gap: 8px; margin-bottom: 14px; }
.trip-hero__region { font-family: var(--font-display); font-weight: 800; font-size: 13px; color: var(--gold-300); margin-bottom: 6px; }
.trip-hero__title { font-family: var(--font-display); font-weight: 800; font-size: clamp(28px, 5vw, 48px); color: #fff; margin: 0; line-height: 1.2; }
.trip-hero__meta { display: flex; gap: 18px; margin-top: 14px; color: rgba(255, 255, 255, 0.92); font-size: 14px; flex-wrap: wrap; }
.trip-hero__meta span { display: inline-flex; align-items: center; gap: 5px; }

.trip-body { padding-top: 32px; }
.trip-intro { font-size: clamp(15px, 1.6vw, 17px); line-height: 1.9; color: var(--text-body); margin: 0 0 28px; }
.trip-highlights { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 36px; }
.trip-highlight { display: flex; align-items: center; gap: 12px; background: var(--surface-cream); border-radius: 16px; padding: 14px 18px; }
.trip-highlight span { font-size: 14.5px; font-weight: 700; color: var(--text-body); }
.trip-h2 { font-family: var(--font-display); font-weight: 800; font-size: 24px; color: var(--text-strong); margin: 0 0 20px; }
.trip-timeline { position: relative; padding-inline-start: 26px; margin-bottom: 36px; }
.trip-timeline__line { position: absolute; inset-inline-start: 6px; top: 8px; bottom: 8px; width: 2px; background: var(--border-default); }
.trip-timeline__items { display: grid; gap: 22px; }
.trip-step { position: relative; }
.trip-step__dot { position: absolute; inset-inline-start: -26px; top: 4px; width: 14px; height: 14px; border-radius: 50%; background: var(--brand); border: 3px solid var(--surface-page); }
.trip-step__day { font-family: var(--font-display); font-weight: 800; font-size: 12px; color: var(--text-gold); }
.trip-step__title { font-family: var(--font-display); font-weight: 700; font-size: 16px; color: var(--text-strong); margin: 2px 0; }
.trip-step__desc { font-size: 14px; color: var(--text-muted); line-height: 1.7; }
.trip-includes__title { font-family: var(--font-display); font-weight: 800; font-size: 18px; color: var(--text-strong); margin-bottom: 16px; }
.trip-includes { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.trip-include { display: flex; align-items: center; gap: 10px; }
.trip-include span:last-child { font-size: 14px; color: var(--text-body); }
.trip-include__tick { flex: none; width: 22px; height: 22px; border-radius: 50%; background: var(--success-100); color: var(--success-500); display: inline-flex; align-items: center; justify-content: center; }
.trip-related { padding-top: 0; }
.trip-related__head { margin-bottom: 30px; }
.trip-done { text-align: center; padding: 4px 0; }
.trip-done__icon { display: inline-flex; width: 64px; height: 64px; border-radius: 50%; background: var(--success-100); color: var(--success-500); align-items: center; justify-content: center; margin-bottom: 14px; }
.trip-done p { color: var(--text-body); margin: 0; line-height: 1.8; }

@media (max-width: 620px) {
  .trip-highlights, .trip-includes { grid-template-columns: 1fr; }
}
</style>
