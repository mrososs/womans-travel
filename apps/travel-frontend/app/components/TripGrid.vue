<script setup lang="ts">
import { Button, TripCard } from '@org/shared-ui';
import TripPhoto from './TripPhoto.vue';
import type { Trip } from '~/data/site';

/**
 * TripGrid — responsive grid of TripCards (1 → 2 → 3 columns). Emits `open`
 * with the trip id when a card / its CTA / the view action is activated.
 * The heart toggles the Supabase-backed wishlist (sign-in required).
 */
defineProps<{ trips: Trip[] }>();
const emit = defineEmits<{ open: [id: string] }>();

const { t } = useI18n();
const { lc } = useLocalize();
const { has, toggle } = useWishlist();
const { isLoggedIn } = useAuth();
const notify = useNotify();

function offer(trip: Trip) {
  return getOfferInfo(trip.discountSeatsLimit, trip.discountSeatsClaimed, trip.discountAmount);
}

async function onFavourite(trip: Trip) {
  if (!isLoggedIn.value) {
    notify.error(t('wishlist.loginRequired'));
    return;
  }
  const result = await toggle({
    item_type: 'trip',
    item_id: trip.id,
    title: lc(trip.title),
    icon: trip.icon,
    grad: trip.grad,
    price: lc(trip.price),
  });
  if (result === 'added') notify.success(t('wishlist.added'));
  else if (result === 'removed') notify.info(t('wishlist.removed'));
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
      :price="offer(trip).active ? lc(trip.discountPrice!) : lc(trip.price)"
      :original-price="offer(trip).active ? lc(trip.price) : ''"
      :offer-label="offer(trip).active ? (trip.discountLabel ? lc(trip.discountLabel) : t('common.offerBadge')) : ''"
      :currency-label="t('common.currency')"
      :price-note="t('common.perPerson')"
      :vat-note="t('common.vatShort')"
      :tier="{ label: t(`tiers.${trip.tierKey}`), variant: trip.tierVariant }"
      :coming-soon="trip.comingSoon"
      :coming-soon-label="t('common.comingSoon')"
      :favourite="has('trip', trip.id)"
      :wishlist-label="t('actions.wishlist')"
      :remove-label="t('actions.wishlistRemove')"
      :view-label="t('actions.view')"
      @click="emit('open', trip.id)"
      @view="emit('open', trip.id)"
      @favourite="onFavourite(trip)"
    >
      <template #media>
        <TripPhoto :grad="trip.grad" :icon="trip.icon" :img="trip.img" :alt="lc(trip.title)" />
      </template>
      <template #cta>
        <Button size="sm" @click.stop="emit('open', trip.id)">{{ t('common.details') }}</Button>
      </template>
    </TripCard>
  </div>
</template>
