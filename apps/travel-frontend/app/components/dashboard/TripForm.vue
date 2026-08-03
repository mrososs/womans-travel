<script setup lang="ts">
import { computed } from 'vue';
import { Input, Select, Switch } from '@org/shared-ui';
import ImageUpload from '~/components/dashboard/ImageUpload.vue';
import type { TripInsert } from '~/composables/useAdminContent';

/**
 * TripForm — field editor for a single trip row. The parent owns the reactive
 * `model` object; this component mutates its fields in place (v-model per field).
 * `isNew` toggles whether the `id` slug is editable (locked when editing).
 */
const props = defineProps<{ model: TripInsert; isNew: boolean }>();

const { t } = useI18n();

/**
 * Arabic price proxy: the admin can type digits in any script, and the field
 * shows them as grouped Arabic-Indic numerals (e.g. 7200 → ٧٬٢٠٠). Whenever the
 * Arabic price changes we also mirror it into the numeric `price_amount`, which
 * drives reports and cart totals.
 */
const priceAr = computed({
  get: () => props.model.price_ar ?? '',
  set: (v: string) => {
    props.model.price_ar = formatArabicPriceInput(v);
    props.model.price_amount = parsePriceAmount(v) || null;
  },
});

const kindOptions = [
  { value: 'intl', label: t('destinations.kinds.intl') },
  { value: 'local', label: t('destinations.kinds.local') },
];
const categoryOptions = [
  { value: 'city', label: t('categories.city') },
  { value: 'mountain', label: t('categories.mountain') },
  { value: 'beach', label: t('categories.beach') },
];
const tierOptions = [
  { value: 'luxury', label: t('tiers.luxury') },
  { value: 'exclusive', label: t('tiers.exclusive') },
  { value: 'domestic', label: t('tiers.domestic') },
  { value: 'popular', label: t('tiers.popular') },
];
const variantOptions = [
  { value: 'solid', label: 'solid' },
  { value: 'gold', label: 'gold' },
  { value: 'navy', label: 'navy' },
  { value: 'brand', label: 'brand' },
];
</script>

<template>
  <div class="tform">
    <Input v-model="model.id" :label="t('admin.slug')" :placeholder="t('admin.slugPh')" :disabled="!isNew" required />

    <ImageUpload v-model="model.image_url" folder="trips" :slug="model.id || ''" />

    <div class="tform__grid">
      <Input v-model="model.title_ar" :label="t('admin.titleAr')" required />
      <Input v-model="model.title_en" :label="t('admin.titleEn')" required />
      <Input v-model="model.region_ar" :label="t('admin.regionAr')" />
      <Input v-model="model.region_en" :label="t('admin.regionEn')" />
      <Select v-model="model.category_id" :label="t('admin.category')" :options="categoryOptions" />
      <Select v-model="model.kind" :label="t('admin.kind')" :options="kindOptions" />
      <Select v-model="model.tier_key" :label="t('admin.tier')" :options="tierOptions" />
      <Select v-model="model.tier_variant" :label="t('admin.tierVariant')" :options="variantOptions" />
      <Input v-model="model.duration_ar" :label="t('admin.durationAr')" />
      <Input v-model="model.duration_en" :label="t('admin.durationEn')" />
      <Input v-model="model.dates_ar" :label="t('admin.datesAr')" />
      <Input v-model="model.dates_en" :label="t('admin.datesEn')" />
      <Input v-model="priceAr" :label="t('admin.priceAr')" :hint="t('admin.priceArHint')" />
      <Input v-model="model.price_en" :label="t('admin.priceEn')" />
      <Input v-model.number="model.price_amount" type="number" :label="t('admin.priceAmount')" />
      <Input v-model.number="model.seats" type="number" :label="t('admin.seats')" />
      <Input v-model.number="model.rating" type="number" :label="t('admin.rating')" />
      <Input v-model.number="model.reviews" type="number" :label="t('admin.reviews')" />
      <Input v-model="model.icon" :label="t('admin.icon')" :placeholder="t('admin.iconPh')" />
      <Input v-model="model.grad" :label="t('admin.grad')" :placeholder="t('admin.gradPh')" />
    </div>

    <Switch v-model="model.featured" :label="t('admin.featured')" />
    <Switch v-model="model.coming_soon" :label="t('admin.comingSoon')" />

    <div class="tform__field">
      <label class="tform__label">{{ t('admin.depositTitle') }}</label>
      <p class="tform__hint">{{ t('admin.depositHint') }}</p>
    </div>
    <Input v-model.number="model.deposit_amount" type="number" :label="t('admin.depositAmount')" />

    <div class="tform__field">
      <label class="tform__label">{{ t('admin.discountTitle') }}</label>
      <p class="tform__hint">{{ t('admin.discountHint') }}</p>
    </div>
    <div class="tform__grid">
      <Input v-model="model.discount_price_ar" :label="t('admin.discountPriceAr')" />
      <Input v-model="model.discount_price_en" :label="t('admin.discountPriceEn')" />
      <Input v-model.number="model.discount_price_amount" type="number" :label="t('admin.discountPriceAmount')" />
      <Input v-model.number="model.discount_seats_limit" type="number" :label="t('admin.discountSeatsLimit')" />
      <Input v-model="model.discount_label_ar" :label="t('admin.discountLabelAr')" />
      <Input v-model="model.discount_label_en" :label="t('admin.discountLabelEn')" />
      <Input :model-value="model.discount_seats_claimed ?? 0" type="number" disabled :label="t('admin.discountSeatsClaimed')" />
    </div>
  </div>
</template>

<style scoped>
.tform { display: grid; gap: 16px; }
.tform__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 560px) { .tform__grid { grid-template-columns: 1fr; } }
.tform__field { display: flex; flex-direction: column; gap: 7px; }
.tform__label { font-size: var(--text-sm); font-weight: var(--weight-bold); color: var(--text-strong); }
.tform__hint { font-size: var(--text-sm); color: var(--text-muted); margin: 0; }
</style>
