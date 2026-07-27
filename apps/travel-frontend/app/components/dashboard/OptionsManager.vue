<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { Input, Switch, Button, Icon } from '@org/shared-ui';
import type { ItemOptionRow, OptionOwnerType } from '~/composables/useAdminContent';

/**
 * OptionsManager — CRUD editor for a single item's purchasable options
 * (room type, deposit, …). Each option carries a bilingual label and its own
 * price; the storefront shows them in a dropdown and the selected one drives
 * the price + cart line. Writes persist immediately (per row), so this works
 * inside the trip/package edit dialog once the parent item has been saved.
 */
const props = defineProps<{ itemType: OptionOwnerType; itemId: string }>();

const { t } = useI18n();
const { listOptions, saveOption, deleteOption } = useAdminContent();
const notify = useNotify();

/** Editable draft — an option row that may not yet exist in the DB (no id). */
type Draft = {
  id?: string;
  label_ar: string;
  label_en: string;
  price_amount: number;
  /** Optional marked-down price; blank means this option isn't discounted. */
  discount_price_amount: string;
  available: boolean;
  sort: number;
};

/** Blank / zero / unparseable → null, so clearing the field removes the discount. */
function toDiscount(value: string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const entries = reactive<Draft[]>([]);
const loading = ref(false);
const savingId = ref<string | number | null>(null);

function toDraft(row: ItemOptionRow): Draft {
  return {
    id: row.id,
    label_ar: row.label_ar,
    label_en: row.label_en,
    price_amount: Number(row.price_amount) || 0,
    discount_price_amount: row.discount_price_amount == null ? '' : String(Number(row.discount_price_amount)),
    available: row.available,
    sort: row.sort,
  };
}

async function load() {
  if (!props.itemId) {
    entries.splice(0);
    return;
  }
  loading.value = true;
  try {
    const rows = await listOptions(props.itemType, props.itemId);
    entries.splice(0, entries.length, ...rows.map(toDraft));
  } catch (err) {
    notify.error((err as Error)?.message || t('admin.options.loadError'));
  } finally {
    loading.value = false;
  }
}

watch(() => props.itemId, load, { immediate: true });

function addRow() {
  entries.push({
    label_ar: '', label_en: '', price_amount: 0, discount_price_amount: '',
    available: true, sort: entries.length,
  });
}

async function saveRow(i: number) {
  const e = entries[i];
  if (!e) return;
  if (!e.label_ar.trim() || !e.label_en.trim()) {
    notify.error(t('admin.options.labelRequired'));
    return;
  }
  const discount = toDiscount(e.discount_price_amount);
  if (discount != null && discount >= (Number(e.price_amount) || 0)) {
    notify.error(t('admin.options.discountTooHigh'));
    return;
  }
  savingId.value = e.id ?? i;
  try {
    const saved = await saveOption({
      ...(e.id ? { id: e.id } : {}),
      item_type: props.itemType,
      item_id: props.itemId,
      label_ar: e.label_ar.trim(),
      label_en: e.label_en.trim(),
      price_amount: Number(e.price_amount) || 0,
      discount_price_amount: discount,
      available: e.available,
      sort: Number(e.sort) || 0,
    });
    entries.splice(i, 1, toDraft(saved));
    notify.success(t('admin.options.saved'));
  } catch (err) {
    notify.error((err as Error)?.message || t('admin.saveError'));
  } finally {
    savingId.value = null;
  }
}

async function removeRow(i: number) {
  const e = entries[i];
  if (!e) return;
  try {
    if (e.id) await deleteOption(e.id);
    entries.splice(i, 1);
    notify.success(t('admin.options.deleted'));
  } catch (err) {
    notify.error((err as Error)?.message || t('admin.saveError'));
  }
}
</script>

<template>
  <div class="opts">
    <div class="opts__head">
      <div>
        <div class="opts__title">{{ t('admin.options.title') }}</div>
        <div class="opts__hint">{{ t('admin.options.hint') }}</div>
      </div>
      <Button v-if="itemId" size="sm" variant="outline" type="button" @click="addRow">
        <template #iconStart><Icon name="plus" :size="15" /></template>
        {{ t('admin.options.add') }}
      </Button>
    </div>

    <p v-if="!itemId" class="opts__note">{{ t('admin.options.saveFirst') }}</p>
    <div v-else-if="loading" class="opts__note">{{ t('common.loading') }}</div>
    <p v-else-if="!entries.length" class="opts__note">{{ t('admin.options.empty') }}</p>

    <div v-else class="opts__list">
      <div v-for="(e, i) in entries" :key="e.id ?? `new-${i}`" class="opts__row">
        <div class="opts__fields">
          <Input v-model="e.label_ar" size="sm" :label="t('admin.options.labelAr')" />
          <Input v-model="e.label_en" size="sm" :label="t('admin.options.labelEn')" />
          <Input v-model.number="e.price_amount" size="sm" type="number" :label="t('admin.options.price')" />
          <Input
            v-model="e.discount_price_amount"
            size="sm"
            type="number"
            :label="t('admin.options.discountPrice')"
            :placeholder="t('admin.options.discountPricePh')"
          />
          <Input v-model.number="e.sort" size="sm" type="number" :label="t('admin.sort')" />
        </div>
        <div class="opts__foot">
          <Switch v-model="e.available" :label="t('admin.options.available')" />
          <div class="opts__actions">
            <Button size="sm" type="button" :disabled="savingId === (e.id ?? i)" @click="saveRow(i)">
              {{ savingId === (e.id ?? i) ? t('common.sending') : t('admin.options.saveRow') }}
            </Button>
            <button
              type="button"
              class="opts__del"
              :aria-label="t('actions.delete')"
              @click="removeRow(i)"
            >
              <Icon name="trash-2" :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.opts { display: grid; gap: 14px; border-top: 1px solid var(--border-hair); padding-top: 18px; }
.opts__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.opts__title { font-family: var(--font-display); font-weight: 800; font-size: var(--text-base); color: var(--text-strong); }
.opts__hint { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }
.opts__note { margin: 0; font-size: 13px; color: var(--text-subtle); background: var(--surface-cream); border-radius: var(--radius-md); padding: 12px 14px; }
.opts__list { display: grid; gap: 12px; }
.opts__row { border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 14px; background: var(--surface-card); display: grid; gap: 12px; }
.opts__fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.opts__foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.opts__actions { display: inline-flex; align-items: center; gap: 8px; }
.opts__del {
  width: 36px; height: 36px; border-radius: 9px; border: 1px solid var(--border-default);
  background: var(--surface-card); color: var(--text-body); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard);
}
.opts__del:hover { background: var(--danger-100, #fde8e8); color: var(--danger-500); border-color: var(--danger-500); }
@media (max-width: 560px) { .opts__fields { grid-template-columns: 1fr; } }
</style>
