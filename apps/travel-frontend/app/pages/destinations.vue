<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button, Input, Select, Tag, Tabs, Checkbox, Dialog, Icon } from '@org/shared-ui';
import { useScrollReveal } from '@org/shared-utils';
import PageHero from '~/components/PageHero.vue';
import TripGrid from '~/components/TripGrid.vue';
import TripCardSkeleton from '~/components/TripCardSkeleton.vue';
import { CATEGORIES } from '~/data/site';

const { t } = useI18n();
const { lc } = useLocalize();
const localePath = useLocalePath();

useHead(() => ({ title: `${t('destinations.title')} · ${t('brand')}` }));

// Trips are served from Supabase (public-read `trips` table) via useTrips().
const { data: trips, pending } = useTrips();
const { ready } = useDelayedReady(pending);
const allTrips = computed(() => trips.value ?? []);

const query = ref('');
const cat = ref('all');
const kind = ref('all');
const filterOpen = ref(false);

const amenities = ref({ fiveStar: true, womenOnly: true, escort: false });
const priceRange = ref('');
const durationRange = ref('');

const kindTabs = computed(() => [
  { id: 'all', label: t('destinations.kinds.all') },
  { id: 'intl', label: t('destinations.kinds.intl') },
  { id: 'local', label: t('destinations.kinds.local') },
]);

const results = computed(() =>
  allTrips.value.filter((trip) => {
    const byCat = cat.value === 'all' || trip.cat === cat.value;
    const byKind = kind.value === 'all' || trip.kind === kind.value;
    const q = query.value.trim();
    const byQuery = !q || lc(trip.title).includes(q) || lc(trip.region).includes(q);
    return byCat && byKind && byQuery;
  })
);

const resultsGrid = ref<HTMLElement | null>(null);
useScrollReveal(resultsGrid, { selector: '.grid-trips > *', stagger: 0.07, watch: ready });

function goTrip(id: string) {
  navigateTo(localePath(`/trip/${id}`));
}
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('destinations.eyebrow')"
      :title="t('destinations.title')"
      :description="t('destinations.lead')"
      icon="compass"
      image="/hero/hero-2.webp"
    />

    <section class="dest-toolbar-band">
      <div class="container">
        <div class="dest-toolbar">
          <div class="dest-toolbar__search">
            <Input v-model="query" size="sm" :placeholder="t('destinations.searchPlaceholder')">
              <template #iconStart><Icon name="search" :size="18" /></template>
            </Input>
          </div>
          <Tabs v-model="kind" variant="segmented" :tabs="kindTabs" />
          <Button variant="outline" size="sm" @click="filterOpen = true">
            <template #iconStart><Icon name="sliders-horizontal" :size="17" /></template>
            {{ t('destinations.filter') }}
          </Button>
        </div>
      </div>
    </section>

    <section ref="resultsGrid" class="section">
      <div class="container">
        <div class="chips dest-chips">
          <Tag
            v-for="c in CATEGORIES"
            :key="c.id"
            :selected="cat === c.id"
            @click="cat = c.id"
          >
            <template #icon><Icon :name="c.icon" :size="15" /></template>
            {{ t(`categories.${c.id}`) }}
          </Tag>
        </div>
        <template v-if="ready">
          <div class="dest-count">{{ t('destinations.resultsCount', { count: results.length }) }}</div>
          <TripGrid :trips="results" @open="goTrip" />
        </template>
        <div v-else class="grid-trips">
          <TripCardSkeleton v-for="n in 6" :key="`sk-${n}`" />
        </div>
      </div>
    </section>

    <Dialog v-model:open="filterOpen" variant="center" :title="t('destinations.dialog.title')" @close="filterOpen = false">
      <div class="dest-filters">
        <Select
          v-model="priceRange"
          :label="t('destinations.dialog.priceRange')"
          :placeholder="t('destinations.dialog.pricePlaceholder')"
          :options="[
            { value: 'a', label: t('destinations.dialog.price.a') },
            { value: 'b', label: t('destinations.dialog.price.b') },
            { value: 'c', label: t('destinations.dialog.price.c') },
          ]"
        />
        <Select
          v-model="durationRange"
          :label="t('destinations.dialog.duration')"
          :placeholder="t('destinations.dialog.durationPlaceholder')"
          :options="[
            { value: 's', label: t('destinations.dialog.dur.s') },
            { value: 'm', label: t('destinations.dialog.dur.m') },
            { value: 'l', label: t('destinations.dialog.dur.l') },
          ]"
        />
        <div>
          <div class="dest-filters__label">{{ t('destinations.dialog.amenities') }}</div>
          <div class="dest-filters__group">
            <Checkbox v-model="amenities.fiveStar" :label="t('destinations.dialog.fiveStar')" />
            <Checkbox v-model="amenities.womenOnly" :label="t('destinations.dialog.womenOnly')" />
            <Checkbox v-model="amenities.escort" :label="t('destinations.dialog.escort')" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="filterOpen = false">{{ t('destinations.dialog.reset') }}</Button>
        <Button @click="filterOpen = false">{{ t('destinations.dialog.apply') }}</Button>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.dest-toolbar-band { background: var(--surface-cream); padding: 24px 0; border-bottom: 1px solid var(--border-hair); }
.dest-toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.dest-toolbar__search { flex: 1 1 260px; min-width: 220px; }
.dest-chips { margin-bottom: 30px; }
.dest-count { color: var(--text-muted); font-size: 14px; margin-bottom: 22px; }
.dest-filters { display: grid; gap: 18px; }
.dest-filters__label { font-family: var(--font-body); font-weight: 700; font-size: 14px; color: var(--text-strong); margin-bottom: 10px; }
.dest-filters__group { display: grid; gap: 12px; }
</style>
