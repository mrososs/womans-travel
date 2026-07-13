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
    /** Screen-reader label for the currency (the Riyal symbol is shown visually). */
    currencyLabel?: string;
    tier?: TripTier | null;
    /** Pre-localized scarcity text, e.g. "3 seats left". */
    seatsText?: string;
    /** When true, show a "coming soon" badge and dim the media. */
    comingSoon?: boolean;
    /** Pre-localized "coming soon" label. */
    comingSoonLabel?: string;
    favourite?: boolean;
    /** Reveal wishlist + view actions on hover. */
    hoverActions?: boolean;
    /** Accessible labels for the hover actions. */
    wishlistLabel?: string;
    removeLabel?: string;
    viewLabel?: string;
    clickable?: boolean;
  }>(),
  {
    region: '', duration: '', dates: '', rating: null, reviews: null, price: '',
    priceNote: 'للشخص', tier: null, seatsText: '', comingSoon: false,
    comingSoonLabel: 'قريبًا', favourite: false,
    hoverActions: true, wishlistLabel: 'حفظ', removeLabel: 'إزالة من المحفوظات',
    viewLabel: 'عرض', clickable: true,
  }
);

const emit = defineEmits<{ click: []; favourite: []; view: [] }>();

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
    :class="{ 'drh-trip--soon': comingSoon }"
    @click="clickable && emit('click')"
  >
    <div class="drh-trip__media">
      <slot name="media" />
      <div class="drh-trip__top">
        <Badge v-if="tier" :variant="tier.variant || 'solid'">{{ tier.label }}</Badge>
        <span v-else />
      </div>
      <span v-if="comingSoon" class="drh-trip__soon">
        <Icon name="clock" :size="13" :stroke-width="2.4" />
        {{ comingSoonLabel }}
      </span>
      <div v-if="hoverActions" class="drh-trip__actions">
        <IconButton
          variant="glass"
          size="md"
          :label="favourite ? removeLabel : wishlistLabel"
          @click.stop="emit('favourite')"
        >
          <Icon name="heart" :size="19" :color="heartColor" />
        </IconButton>
        <IconButton variant="glass" size="md" :label="viewLabel" @click.stop="emit('view')">
          <Icon name="eye" :size="19" color="var(--navy-900)" />
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
          <span class="drh-trip__amount">
            <b>{{ price }}</b>
            <Icon name="saudi-riyal" :size="20" class="drh-trip__riyal" />
            <span v-if="currencyLabel" class="sr-only">{{ currencyLabel }}</span>
          </span>
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
.drh-trip__soon {
  position: absolute;
  top: 12px;
  inset-inline-end: 12px;
  z-index: 4;
  /* Escape the `.drh-trip__media > *` full-bleed sizing used for the photo. */
  width: auto;
  height: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-body);
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.01em;
  color: var(--navy-900, #121b33);
  background: var(--gold-300, #e6c675);
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm, 0 2px 8px rgba(18, 27, 51, 0.18));
  white-space: nowrap;
}
.drh-trip__soon svg { width: 13px; height: 13px; }
/* Coming-soon cards read as not-yet-available: gentle desaturate + lift scrim.
   Hover actions (save / view) stay available so travellers can still wishlist. */
.drh-trip--soon .drh-trip__media > * { filter: grayscale(0.45) brightness(0.94); }
.drh-trip--soon .drh-trip__media::after { opacity: 0.66; }
.drh-trip__actions {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-standard);
}
.drh-trip__actions .drh-iconbtn {
  transform: translateY(10px);
  transition: transform var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-standard);
}
.drh-trip:hover .drh-trip__actions { opacity: 1; }
.drh-trip:hover .drh-trip__actions .drh-iconbtn { transform: none; }
.drh-trip:hover .drh-trip__media::after { opacity: 0.72; }
@media (hover: none) {
  /* Touch devices: keep actions visible (no hover). */
  .drh-trip__actions { opacity: 1; }
  .drh-trip__actions .drh-iconbtn { transform: none; }
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
.drh-trip__amount { display: inline-flex; align-items: center; gap: 4px; color: var(--text-strong); }
.drh-trip__price b {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: var(--text-2xl);
  color: var(--text-strong);
}
.drh-trip__riyal { width: 0.8em; height: 0.8em; }
.drh-trip__price small { display: block; font-size: var(--text-xs); color: var(--text-muted); }
</style>
