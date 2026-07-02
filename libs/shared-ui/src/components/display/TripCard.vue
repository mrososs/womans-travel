<script setup lang="ts">
import { computed } from 'vue';
import Card from './Card.vue';
import Badge from './Badge.vue';
import Rating from './Rating.vue';
import Icon from './Icon.vue';
import IconButton from '../actions/IconButton.vue';
import type { TripTier } from '../../types';

/**
 * TripCard — Durrah's signature destination card. Composes Card + Badge +
 * Rating + IconButton. Put the media (image or gradient placeholder) in the
 * `media` slot and the CTA in the `cta` slot.
 */
const props = withDefaults(
  defineProps<{
    region?: string;
    title: string;
    duration?: string;
    dates?: string;
    rating?: number | null;
    reviews?: number | null;
    price?: string;
    priceNote?: string;
    tier?: TripTier | null;
    /** Pre-localized scarcity text, e.g. "3 seats left". */
    seatsText?: string;
    favourite?: boolean;
    /** Show the favourite (heart) toggle. */
    favouritable?: boolean;
    clickable?: boolean;
  }>(),
  {
    region: '', duration: '', dates: '', rating: null, reviews: null, price: '',
    priceNote: 'للشخص', tier: null, seatsText: '', favourite: false,
    favouritable: false, clickable: true,
  }
);

const emit = defineEmits<{ click: []; favourite: [] }>();

const heartColor = computed(() =>
  props.favourite ? 'var(--brand)' : 'var(--navy-900)'
);
</script>

<template>
  <Card
    variant="elevated"
    padding="none"
    :interactive="clickable"
    class="drh-trip"
    @click="clickable && emit('click')"
  >
    <div class="drh-trip__media">
      <slot name="media" />
      <div class="drh-trip__top">
        <Badge v-if="tier" :variant="tier.variant || 'solid'">{{ tier.label }}</Badge>
        <span v-else />
        <IconButton
          v-if="favouritable"
          variant="glass"
          size="sm"
          :label="favourite ? 'إزالة من المحفوظات' : 'حفظ'"
          @click.stop="emit('favourite')"
        >
          <Icon name="heart" :size="17" :color="heartColor" />
        </IconButton>
      </div>
    </div>

    <div class="drh-trip__body">
      <span v-if="region" class="drh-trip__eyebrow">{{ region }}</span>
      <h3 class="drh-trip__title">{{ title }}</h3>

      <div class="drh-trip__meta">
        <span v-if="duration"><Icon name="clock" :size="15" />{{ duration }}</span>
        <span v-if="dates"><Icon name="calendar-days" :size="15" />{{ dates }}</span>
      </div>

      <div v-if="rating != null" class="drh-trip__meta">
        <Rating :value="rating" :count="reviews" show-value :size="15" />
        <Badge v-if="seatsText" variant="danger" dot>{{ seatsText }}</Badge>
      </div>

      <div class="drh-trip__divider" />

      <div class="drh-trip__foot">
        <div class="drh-trip__price">
          <b>{{ price }}</b>
          <small>{{ priceNote }}</small>
        </div>
        <slot name="cta" />
      </div>
    </div>
  </Card>
</template>

<style>
.drh-trip { display: flex; flex-direction: column; }
.drh-trip__media {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--grad-rose);
  overflow: hidden;
}
.drh-trip__media > img,
.drh-trip__media > * {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.drh-trip__media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--grad-scrim);
  opacity: 0.55;
  pointer-events: none;
}
.drh-trip__top {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 2;
}
.drh-trip__body { padding: var(--space-5); display: flex; flex-direction: column; gap: 10px; }
.drh-trip__eyebrow {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: var(--text-xs);
  color: var(--text-gold);
}
.drh-trip__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--text-xl);
  color: var(--text-strong);
  line-height: 1.3;
  margin: 0;
}
.drh-trip__meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  color: var(--text-muted);
  font-size: var(--text-sm);
}
.drh-trip__meta span { display: inline-flex; align-items: center; gap: 5px; }
.drh-trip__meta svg { width: 15px; height: 15px; color: var(--brand); }
.drh-trip__divider { height: 1px; background: var(--border-hair); margin: 2px 0; }
.drh-trip__foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }
.drh-trip__price b {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: var(--text-2xl);
  color: var(--text-strong);
}
.drh-trip__price small { display: block; font-size: var(--text-xs); color: var(--text-muted); }
</style>
