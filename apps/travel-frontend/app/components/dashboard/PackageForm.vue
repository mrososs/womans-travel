<script setup lang="ts">
import { Input, Select, Switch } from '@org/shared-ui';
import ImageUpload from '~/components/dashboard/ImageUpload.vue';
import type { PackageInsert } from '~/composables/useAdminContent';

/**
 * PackageForm — field editor for a single package row. The parent owns the
 * reactive `model` object; fields mutate it in place. `cost_amount` is the
 * admin-only cost used for profit reporting (never shown on the public site).
 */
defineProps<{ model: PackageInsert; isNew: boolean }>();

const { t } = useI18n();

const kindOptions = [
  { value: 'intl', label: t('destinations.kinds.intl') },
  { value: 'local', label: t('destinations.kinds.local') },
];
</script>

<template>
  <div class="pform">
    <Input v-model="model.id" :label="t('admin.slug')" :placeholder="t('admin.slugPh')" :disabled="!isNew" required />

    <ImageUpload v-model="model.image_url" folder="packages" :slug="model.id || ''" />

    <div class="pform__grid">
      <Input v-model="model.title_ar" :label="t('admin.titleAr')" required />
      <Input v-model="model.title_en" :label="t('admin.titleEn')" required />
      <Select v-model="model.kind" :label="t('admin.kind')" :options="kindOptions" />
      <Input v-model.number="model.sort" type="number" :label="t('admin.sort')" />
      <Input v-model="model.price_ar" :label="t('admin.priceAr')" />
      <Input v-model="model.price_en" :label="t('admin.priceEn')" />
      <Input v-model.number="model.price_amount" type="number" :label="t('admin.priceAmount')" />
      <Input v-model.number="model.cost_amount" type="number" :label="t('admin.costAmount')" />
      <Input v-model="model.icon" :label="t('admin.icon')" :placeholder="t('admin.iconPh')" />
      <Input v-model="model.grad" :label="t('admin.grad')" :placeholder="t('admin.gradPh')" />
    </div>

    <div class="pform__field">
      <label class="pform__label">{{ t('admin.descAr') }}</label>
      <textarea v-model="model.desc_ar" class="pform__textarea" rows="3" />
    </div>
    <div class="pform__field">
      <label class="pform__label">{{ t('admin.descEn') }}</label>
      <textarea v-model="model.desc_en" class="pform__textarea" rows="3" />
    </div>

    <div class="pform__field">
      <label class="pform__label">{{ t('admin.includesAr') }}</label>
      <p class="pform__hint">{{ t('admin.includesHint') }}</p>
      <textarea v-model="model.includes_ar" class="pform__textarea" rows="5" />
    </div>
    <div class="pform__field">
      <label class="pform__label">{{ t('admin.includesEn') }}</label>
      <textarea v-model="model.includes_en" class="pform__textarea" rows="5" />
    </div>

    <Switch v-model="model.sold_out" :label="t('admin.soldOut')" />

    <div class="pform__field">
      <label class="pform__label">{{ t('admin.depositTitle') }}</label>
      <p class="pform__hint">{{ t('admin.depositHint') }}</p>
    </div>
    <Input v-model.number="model.deposit_amount" type="number" :label="t('admin.depositAmount')" />

    <div class="pform__field">
      <label class="pform__label">{{ t('admin.discountTitle') }}</label>
      <p class="pform__hint">{{ t('admin.discountHint') }}</p>
    </div>
    <div class="pform__grid">
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
.pform { display: grid; gap: 16px; }
.pform__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 560px) { .pform__grid { grid-template-columns: 1fr; } }
.pform__field { display: flex; flex-direction: column; gap: 7px; }
.pform__label { font-size: var(--text-sm); font-weight: var(--weight-bold); color: var(--text-strong); }
.pform__hint { font-size: var(--text-sm); color: var(--text-muted); margin: 0; }
.pform__textarea {
  font-family: var(--font-body); font-size: var(--text-base); color: var(--text-strong);
  background: var(--surface-card); border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md); padding: 12px 14px; resize: vertical;
}
.pform__textarea:focus { outline: none; border-color: var(--brand); box-shadow: var(--ring-brand); }
</style>
