<script setup lang="ts">
import { computed, ref } from 'vue';
import { Card, Rating, Select, Radio, Button, Icon } from '@org/shared-ui';
import type { Trip } from '~/data/site';

const props = defineProps<{ trip: Trip }>();

const { t, locale } = useI18n();
const { lc } = useLocalize();
const { add } = useCart();
const notify = useNotify();

const date = ref('0');
const travellers = ref('1');
const room = ref('single');
const added = ref(false);

const dateOptions = computed(() => [
  { value: '0', label: lc(props.trip.dates) },
  { value: '1', label: t('trip.booking.waitlist') },
]);
const paxOptions = computed(() => [
  { value: '1', label: t('trip.booking.pax1') },
  { value: '2', label: t('trip.booking.pax2') },
  { value: '3', label: t('trip.booking.pax3') },
]);

/** Unit price parsed from the trip's display price (any digit script). */
const unitPrice = computed(() => parsePriceAmount(props.trip.price.en || props.trip.price.ar));
const qty = computed(() => Number(travellers.value) || 1);
const totalLabel = computed(() => formatPrice(unitPrice.value * qty.value, locale.value));

/** Add the trip to the cart — same flow as packages (cart → checkout → pay). */
async function addToCart() {
  await add(
    {
      item_type: 'trip',
      item_id: props.trip.id,
      title: lc(props.trip.title),
      unit_price: unitPrice.value,
      icon: props.trip.icon,
      grad: props.trip.grad,
    },
    qty.value
  );
  added.value = true;
  notify.success(t('cart.added'));
  setTimeout(() => (added.value = false), 2500);
}
</script>

<template>
  <Card variant="elevated" padding="lg" class="book-card">
    <div class="bookcard__price">
      <span class="bookcard__amount">{{ lc(trip.price) }}</span>
      <Icon name="saudi-riyal" :size="20" class="bookcard__riyal" />
      <span class="sr-only">{{ t('common.currency') }}</span>
      <span class="bookcard__per">/ {{ t('common.perPerson') }}</span>
    </div>
    <div class="bookcard__rating">
      <Rating :value="trip.rating" :count="trip.reviews" show-value :size="16" />
    </div>

    <div class="bookcard__fields">
      <Select v-model="date" :label="t('trip.booking.dateLabel')" :options="dateOptions" />
      <Select v-model="travellers" :label="t('trip.booking.travellersLabel')" :options="paxOptions">
        <template #iconStart><Icon name="users" :size="17" /></template>
      </Select>
      <div>
        <div class="bookcard__label">{{ t('trip.booking.roomLabel') }}</div>
        <div class="bookcard__radios">
          <Radio v-model="room" value="single" name="room" :label="t('trip.booking.single')" />
          <Radio v-model="room" value="double" name="room" :label="t('trip.booking.double')" />
        </div>
      </div>
    </div>

    <div class="bookcard__divider" />
    <div class="bookcard__total">
      <span class="bookcard__total-label">{{ t('trip.booking.total') }}</span>
      <span class="bookcard__total-value">
        {{ totalLabel }}
        <Icon name="saudi-riyal" :size="17" class="bookcard__riyal" />
        <span class="sr-only">{{ t('common.currency') }}</span>
      </span>
    </div>

    <Button block size="lg" @click="addToCart">
      <template #iconStart><Icon name="shopping-bag" :size="19" /></template>
      {{ added ? t('cart.added') : t('cart.addToCart') }}
    </Button>
    <div class="bookcard__note">
      <Icon name="lock" :size="14" color="var(--success-500)" />
      {{ t('trip.booking.secure') }}
    </div>
  </Card>
</template>

<style scoped>
.bookcard__price { display: flex; align-items: center; gap: 6px; }
.bookcard__amount { font-family: var(--font-display); font-weight: 800; font-size: 32px; color: var(--text-strong); }
.bookcard__riyal { width: 0.72em; height: 0.72em; color: var(--text-strong); flex: none; }
.bookcard__per { font-size: 13px; color: var(--text-muted); align-self: flex-end; margin-bottom: 4px; }
.bookcard__rating { margin-top: 4px; margin-bottom: 18px; }
.bookcard__fields { display: grid; gap: 14px; }
.bookcard__label { font-family: var(--font-body); font-weight: 700; font-size: 14px; color: var(--text-strong); margin-bottom: 10px; }
.bookcard__radios { display: grid; gap: 10px; }
.bookcard__divider { height: 1px; background: var(--border-hair); margin: 18px 0; }
.bookcard__total { display: flex; justify-content: space-between; margin-bottom: 16px; }
.bookcard__total-label { font-family: var(--font-display); font-weight: 800; font-size: 16px; color: var(--text-strong); }
.bookcard__total-value { font-family: var(--font-display); font-weight: 800; font-size: 20px; color: var(--text-strong); display: inline-flex; align-items: center; gap: 4px; }
.bookcard__total-value .bookcard__riyal { width: 0.85em; height: 0.85em; }
.bookcard__note {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-top: 12px; color: var(--text-muted); font-size: 12.5px;
}
</style>
