<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Card, Button, Dialog, Icon } from '@org/shared-ui';
import PackageForm from '~/components/dashboard/PackageForm.vue';
import OptionsManager from '~/components/dashboard/OptionsManager.vue';
import type { Database } from '~/types/database.types';
import type { PackageInsert } from '~/composables/useAdminContent';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] });

const { t } = useI18n();
const { pick } = useDbPick();
const client = useSupabaseClient<Database>();
const { savePackage, deletePackage } = useAdminContent();
const notify = useNotify();

useHead(() => ({ title: `${t('admin.packages.title')} · ${t('brand')}` }));

const { data, pending, refresh } = useAsyncData('admin-packages', async () => {
  const { data, error } = await client.from('packages').select('*').order('sort');
  if (error) throw error;
  return data ?? [];
});
const rows = computed(() => data.value ?? []);

function blankPackage(): PackageInsert {
  return {
    id: '', kind: 'intl', title_ar: '', title_en: '', desc_ar: '', desc_en: '',
    price_ar: '', price_en: '', price_amount: null, cost_amount: null,
    icon: 'crown', grad: 'linear-gradient(155deg,#24314B,#9E5863)', image_url: null, sort: 0,
  };
}

const form = reactive<PackageInsert>(blankPackage());
const isNew = ref(true);
const open = ref(false);
const saving = ref(false);

function openAdd() {
  Object.assign(form, blankPackage());
  isNew.value = true;
  open.value = true;
}
function openEdit(row: Database['public']['Tables']['packages']['Row']) {
  Object.assign(form, blankPackage(), row);
  isNew.value = false;
  open.value = true;
}

function num(v: unknown): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function save() {
  if (!form.id?.trim() || !form.title_ar?.trim() || !form.title_en?.trim()) {
    notify.error(t('admin.requiredError'));
    return;
  }
  saving.value = true;
  try {
    await savePackage({
      ...form,
      id: form.id.trim(),
      price_amount: num(form.price_amount),
      cost_amount: num(form.cost_amount),
      sort: num(form.sort) ?? 0,
    });
    notify.success(t('admin.saved'));
    open.value = false;
    await refresh();
  } catch (err) {
    notify.error((err as Error)?.message || t('admin.saveError'));
  } finally {
    saving.value = false;
  }
}

const deleteTarget = ref<string | null>(null);
async function confirmDelete() {
  if (!deleteTarget.value) return;
  try {
    await deletePackage(deleteTarget.value);
    notify.success(t('admin.deleted'));
    await refresh();
  } catch (err) {
    notify.error((err as Error)?.message || t('admin.saveError'));
  } finally {
    deleteTarget.value = null;
  }
}
</script>

<template>
  <div class="adminlist">
    <Card variant="elevated" padding="lg">
      <div class="adminlist__head">
        <h2 class="adminlist__title">{{ t('admin.packages.title') }}</h2>
        <Button size="sm" @click="openAdd">
          <template #iconStart><Icon name="plus" :size="16" /></template>
          {{ t('admin.packages.add') }}
        </Button>
      </div>

      <div v-if="pending" class="adminlist__loading">{{ t('common.loading') }}</div>
      <div v-else class="adminlist__table">
        <table>
          <thead>
            <tr>
              <th>{{ t('admin.col.photo') }}</th>
              <th>{{ t('admin.col.title') }}</th>
              <th>{{ t('admin.col.kind') }}</th>
              <th>{{ t('admin.col.price') }}</th>
              <th style="text-align:end">{{ t('admin.col.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>
                <span class="adminlist__thumb">
                  <img v-if="row.image_url" :src="row.image_url" alt="" >
                  <Icon v-else name="image" :size="16" />
                </span>
              </td>
              <td>
                <div class="adminlist__name">{{ pick(row, 'title') }}</div>
                <div class="adminlist__sub">{{ row.id }}</div>
              </td>
              <td>{{ t(`destinations.kinds.${row.kind}`) }}</td>
              <td dir="ltr">{{ pick(row, 'price') }}</td>
              <td style="text-align:end">
                <div class="adminlist__actions">
                  <button type="button" class="adminlist__icon" :aria-label="t('actions.edit')" @click="openEdit(row)">
                    <Icon name="pencil" :size="16" />
                  </button>
                  <button type="button" class="adminlist__icon adminlist__icon--danger" :aria-label="t('actions.delete')" @click="deleteTarget = row.id">
                    <Icon name="trash-2" :size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="5" class="adminlist__empty">{{ t('admin.emptyPackages') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Dialog v-model:open="open" variant="center" :title="isNew ? t('admin.packages.add') : t('admin.packages.edit')" @close="open = false">
      <PackageForm :model="form" :is-new="isNew" />
      <OptionsManager v-if="!isNew" item-type="package" :item-id="form.id" />
      <template #footer>
        <Button variant="ghost" @click="open = false">{{ t('admin.cancel') }}</Button>
        <Button :disabled="saving" @click="save">{{ saving ? t('common.sending') : t('admin.save') }}</Button>
      </template>
    </Dialog>

    <Dialog :open="!!deleteTarget" variant="center" :title="t('admin.deleteTitle')" @close="deleteTarget = null">
      <p class="adminlist__confirm">{{ t('admin.deleteConfirm') }}</p>
      <template #footer>
        <Button variant="ghost" @click="deleteTarget = null">{{ t('admin.cancel') }}</Button>
        <Button variant="danger" @click="confirmDelete">{{ t('actions.delete') }}</Button>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.adminlist__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.adminlist__title { font-family: var(--font-display); font-weight: 800; font-size: var(--text-lg); color: var(--text-strong); margin: 0; }
.adminlist__loading { padding: 40px; text-align: center; color: var(--text-muted); }
.adminlist__table { width: 100%; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 640px; }
thead th {
  font-family: var(--font-body); font-weight: 700; font-size: 13px; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.02em; padding: 12px 14px;
  border-bottom: 1px solid var(--border-soft); white-space: nowrap; text-align: start;
}
tbody td { padding: 12px 14px; font-size: 14px; color: var(--text-body); border-bottom: 1px solid var(--border-hair); vertical-align: middle; }
tbody tr:hover { background: var(--rose-50); }
.adminlist__thumb {
  display: inline-flex; align-items: center; justify-content: center;
  width: 52px; height: 40px; border-radius: 8px; overflow: hidden;
  background: var(--surface-cream); color: var(--text-subtle); border: 1px solid var(--border-hair);
}
.adminlist__thumb img { width: 100%; height: 100%; object-fit: cover; }
.adminlist__name { font-weight: 700; color: var(--text-strong); }
.adminlist__sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.adminlist__actions { display: inline-flex; gap: 6px; }
.adminlist__icon {
  width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--border-default);
  background: var(--surface-card); color: var(--text-body); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard);
}
.adminlist__icon:hover { background: var(--rose-50); color: var(--brand-strong); border-color: var(--brand); }
.adminlist__icon--danger:hover { background: var(--danger-100, #fde8e8); color: var(--danger-500); border-color: var(--danger-500); }
.adminlist__empty { text-align: center; color: var(--text-subtle); padding: 28px; }
.adminlist__confirm { margin: 0; color: var(--text-body); line-height: 1.7; }
</style>
