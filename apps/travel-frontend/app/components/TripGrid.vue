<script setup lang="ts">
import { reactive } from 'vue';
import { Button, TripCard } from '@org/shared-ui';
import TripPhoto from './TripPhoto.vue';
import type { Trip } from '~/data/site';

/**
 * TripGrid — responsive grid of TripCards (1 → 2 → 3 columns). Emits `open`
 * with the trip id when a card / its CTA / the view action is activated.
 * Wishlist toggle is client-side for now; it will persist via Supabase once
 * auth lands (see docs/plan.md, Phase 3).
 */
defineProps<{ trips: Trip[] }>();
const emit = defineEmits<{ open: [id: string] }>();

const { t } = useI18n();
const { lc } = useLocalize();

const favourites = reactive(new Set<string>());
function toggleFavourite(id: string) {
  if (favourites.has(id)) favourites.delete(id);
  else favourites.add(id);
}
</script>

<template>
  <div class="grid-trips">
    <TripCard
      v-for="trip in trips"
      :key="trip.id"
      :region="lc(trip.region)"
      :title="lc(trip.title)"
      :duration="lc(trip.duration)"
      :dates="lc(trip.dates)"
      :rating="trip.rating"
      :reviews="trip.reviews"
      :price="lc(trip.price)"
      :currency-label="t('common.currency')"
      :price-note="t('common.perPerson')"
      :tier="{ label: t(`tiers.${trip.tierKey}`), variant: trip.tierVariant }"
      :seats-text="trip.seats != null ? t('common.seatsLeft', { count: trip.seats }) : ''"
      :favourite="favourites.has(trip.id)"
      :wishlist-label="t('actions.wishlist')"
      :remove-label="t('actions.wishlistRemove')"
      :view-label="t('actions.view')"
      @click="emit('open', trip.id)"
      @view="emit('open', trip.id)"
      @favourite="toggleFavourite(trip.id)"
    >
      <template #media>
        <TripPhoto :grad="trip.grad" :icon="trip.icon" />
      </template>
      <template #cta>
        <Button size="sm" @click.stop="emit('open', trip.id)">{{ t('common.details') }}</Button>
      </template>
    </TripCard>
  </div>
</template>
