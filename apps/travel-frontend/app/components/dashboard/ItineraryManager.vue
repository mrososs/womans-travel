<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { Input, Button, Icon } from '@org/shared-ui';
import type { PackageDayRow } from '~/composables/useAdminContent';

/**
 * ItineraryManager — CRUD editor for a package's day-by-day program. Each day
 * carries a day number, a bilingual title and a bilingual list of activities
 * (one per line in the textarea). The storefront renders these as a timeline
 * with bulleted activities. Writes persist immediately (per row), so this works
 * inside the package edit dialog once the package has been saved.
 */
const props = defineProps<{ packageId: string }>();

const { t } = useI18n();
const { listDays, saveDay, deleteDay } = useAdminContent();
const notify = useNotify();

/** Editable draft — a day row that may not yet exist in the DB (no id). */
type Draft = {
  id?: string;
  day_number: number;
  title_ar: string;
  title_en: string;
  items_ar: string;
  items_en: string;
  sort: number;
};

const entries = reactive<Draft[]>([]);
const loading = ref(false);
const savingId = ref<string | number | null>(null);

function toDraft(row: PackageDayRow): Draft {
  return {
    id: row.id,
    day_number: row.day_number,
    title_ar: row.title_ar,
    title_en: row.title_en,
    items_ar: row.items_ar,
    items_en: row.items_en,
    sort: row.sort,
  };
}

async function load() {
  if (!props.packageId) {
    entries.splice(0);
    return;
  }
  loading.value = true;
  try {
    const rows = await listDays(props.packageId);
    entries.splice(0, entries.length, ...rows.map(toDraft));
  } catch (err) {
    notify.error((err as Error)?.message || t('admin.itinerary.loadError'));
  } finally {
    loading.value = false;
  }
}

watch(() => props.packageId, load, { immediate: true });

function addRow() {
  const nextDay = entries.length + 1;
  entries.push({
    day_number: nextDay,
    title_ar: '',
    title_en: '',
    items_ar: '',
    items_en: '',
    sort: entries.length,
  });
}

async function saveRow(i: number) {
  const e = entries[i];
  if (!e) return;
  if (!e.title_ar.trim() || !e.title_en.trim()) {
    notify.error(t('admin.itinerary.titleRequired'));
    return;
  }
  savingId.value = e.id ?? i;
  try {
    const saved = await saveDay({
      ...(e.id ? { id: e.id } : {}),
      package_id: props.packageId,
      day_number: Number(e.day_number) || 1,
      title_ar: e.title_ar.trim(),
      title_en: e.title_en.trim(),
      items_ar: e.items_ar,
      items_en: e.items_en,
      sort: Number(e.sort) || 0,
    });
    entries.splice(i, 1, toDraft(saved));
    notify.success(t('admin.itinerary.saved'));
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
    if (e.id) await deleteDay(e.id);
    entries.splice(i, 1);
    notify.success(t('admin.itinerary.deleted'));
  } catch (err) {
    notify.error((err as Error)?.message || t('admin.saveError'));
  }
}
</script>

<template>
  <div class="itin">
    <div class="itin__head">
      <div>
        <div class="itin__title">{{ t('admin.itinerary.title') }}</div>
        <div class="itin__hint">{{ t('admin.itinerary.hint') }}</div>
      </div>
      <Button v-if="packageId" size="sm" variant="outline" type="button" @click="addRow">
        <template #iconStart><Icon name="plus" :size="15" /></template>
        {{ t('admin.itinerary.add') }}
      </Button>
    </div>

    <p v-if="!packageId" class="itin__note">{{ t('admin.itinerary.saveFirst') }}</p>
    <div v-else-if="loading" class="itin__note">{{ t('common.loading') }}</div>
    <p v-else-if="!entries.length" class="itin__note">{{ t('admin.itinerary.empty') }}</p>

    <div v-else class="itin__list">
      <div v-for="(e, i) in entries" :key="e.id ?? `new-${i}`" class="itin__row">
        <div class="itin__fields">
          <Input v-model.number="e.day_number" size="sm" type="number" :label="t('admin.itinerary.dayNumber')" />
          <Input v-model.number="e.sort" size="sm" type="number" :label="t('admin.sort')" />
          <Input v-model="e.title_ar" size="sm" :label="t('admin.itinerary.titleAr')" />
          <Input v-model="e.title_en" size="sm" :label="t('admin.itinerary.titleEn')" />
        </div>
        <div class="itin__texts">
          <div class="itin__field">
            <label class="itin__label">{{ t('admin.itinerary.itemsAr') }}</label>
            <textarea v-model="e.items_ar" class="itin__textarea" rows="4" :placeholder="t('admin.itinerary.itemsPh')" />
          </div>
          <div class="itin__field">
            <label class="itin__label">{{ t('admin.itinerary.itemsEn') }}</label>
            <textarea v-model="e.items_en" class="itin__textarea" rows="4" :placeholder="t('admin.itinerary.itemsPh')" />
          </div>
        </div>
        <div class="itin__foot">
          <Button size="sm" type="button" :disabled="savingId === (e.id ?? i)" @click="saveRow(i)">
            {{ savingId === (e.id ?? i) ? t('common.sending') : t('admin.itinerary.saveRow') }}
          </Button>
          <button
            type="button"
            class="itin__del"
            :aria-label="t('actions.delete')"
            @click="removeRow(i)"
          >
            <Icon name="trash-2" :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.itin { display: grid; gap: 14px; border-top: 1px solid var(--border-hair); padding-top: 18px; }
.itin__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.itin__title { font-family: var(--font-display); font-weight: 800; font-size: var(--text-base); color: var(--text-strong); }
.itin__hint { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }
.itin__note { margin: 0; font-size: 13px; color: var(--text-subtle); background: var(--surface-cream); border-radius: var(--radius-md); padding: 12px 14px; }
.itin__list { display: grid; gap: 12px; }
.itin__row { border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 14px; background: var(--surface-card); display: grid; gap: 12px; }
.itin__fields { display: grid; grid-template-columns: 100px 100px 1fr 1fr; gap: 12px; align-items: end; }
.itin__texts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.itin__field { display: flex; flex-direction: column; gap: 6px; }
.itin__label { font-size: var(--text-sm); font-weight: var(--weight-bold); color: var(--text-strong); }
.itin__textarea {
  font-family: var(--font-body); font-size: var(--text-sm); color: var(--text-strong);
  background: var(--surface-card); border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md); padding: 10px 12px; resize: vertical; line-height: 1.7;
}
.itin__textarea:focus { outline: none; border-color: var(--brand); box-shadow: var(--ring-brand); }
.itin__foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.itin__del {
  width: 36px; height: 36px; border-radius: 9px; border: 1px solid var(--border-default);
  background: var(--surface-card); color: var(--text-body); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard);
}
.itin__del:hover { background: var(--danger-100, #fde8e8); color: var(--danger-500); border-color: var(--danger-500); }
@media (max-width: 640px) {
  .itin__fields { grid-template-columns: 1fr 1fr; }
  .itin__texts { grid-template-columns: 1fr; }
}
</style>
