<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Card, Button, Input, Icon } from '@org/shared-ui';
import type { Database } from '~/types/database.types';

/**
 * Dashboard → Payment settings. Lets an admin view and edit the business bank
 * account shown on the checkout bank-transfer card. Reads/writes the singleton
 * `bank_settings` row (admin write is enforced by RLS via is_admin()).
 */

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] });

const { t } = useI18n();
const client = useSupabaseClient<Database>();
const notify = useNotify();

useHead(() => ({ title: `${t('dashboard.nav.settings')} · ${t('brand')}` }));

const form = reactive({
  bank_name: '',
  account_name: '',
  account_number: '',
  iban: '',
});
const saving = ref(false);

const { pending } = useAsyncData('bank-settings', async () => {
  const { data } = await client
    .from('bank_settings')
    .select('bank_name, account_name, account_number, iban')
    .eq('id', 1)
    .maybeSingle();
  if (data) Object.assign(form, data);
  return data ?? null;
});

async function save() {
  if (!form.bank_name.trim() || !form.account_name.trim() || !form.account_number.trim() || !form.iban.trim()) {
    notify.error(t('dashboard.bank.requiredError'));
    return;
  }
  saving.value = true;
  try {
    // Upsert the singleton row (id = 1). RLS restricts this to admins.
    const { error } = await client.from('bank_settings').upsert(
      {
        id: 1,
        bank_name: form.bank_name.trim(),
        account_name: form.account_name.trim(),
        account_number: form.account_number.trim(),
        iban: form.iban.trim().replace(/\s+/g, ''),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) throw error;
    notify.success(t('dashboard.bank.saved'));
  } catch (err: unknown) {
    notify.error((err as { message?: string })?.message || t('dashboard.bank.saveError'));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="settings">
    <Card variant="elevated" padding="lg">
      <div class="settings__head">
        <span class="settings__ico"><Icon name="building-2" :size="22" /></span>
        <div>
          <h2 class="settings__title">{{ t('dashboard.bank.title') }}</h2>
          <p class="settings__lead">{{ t('dashboard.bank.lead') }}</p>
        </div>
      </div>

      <div v-if="pending" class="settings__loading">{{ t('common.loading') }}</div>

      <form v-else class="settings__form" @submit.prevent="save">
        <Input v-model="form.bank_name" :label="t('dashboard.bank.bankName')" required />
        <Input v-model="form.account_name" :label="t('dashboard.bank.accountName')" required />
        <Input v-model="form.account_number" :label="t('dashboard.bank.accountNumber')" required />
        <Input v-model="form.iban" :label="t('dashboard.bank.iban')" required />

        <div class="settings__actions">
          <Button type="submit" variant="primary" size="md" :disabled="saving">
            <template #iconStart><Icon name="save" :size="16" /></template>
            {{ saving ? t('common.sending') : t('dashboard.bank.save') }}
          </Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<style scoped>
.settings { max-width: 640px; }
.settings__head { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 24px; }
.settings__ico {
  width: 46px; height: 46px; flex: none; border-radius: var(--radius-md);
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--rose-100); color: var(--brand-strong);
}
.settings__title { font-family: var(--font-display); font-weight: 800; font-size: var(--text-lg); color: var(--text-strong); margin: 0; }
.settings__lead { color: var(--text-muted); font-size: var(--text-sm); margin: 6px 0 0; line-height: var(--leading-relaxed); }
.settings__loading { padding: 32px; text-align: center; color: var(--text-muted); }
.settings__form { display: grid; gap: 18px; }
.settings__actions { margin-top: 6px; }
</style>
