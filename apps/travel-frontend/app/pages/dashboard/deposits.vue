<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Card, Badge, Button, Icon } from '@org/shared-ui';
import type { BadgeVariant } from '@org/shared-ui';
import Money from '~/components/dashboard/Money.vue';
import type { Database } from '~/types/database.types';

/**
 * dashboard/deposits — bank-transfer orders paid as a deposit only
 * (`is_deposit_payment = true`). Approve/cancel reuse the same admin endpoint
 * as the main orders list; the only addition here is the remaining balance
 * (`total - paid_amount`) still owed once the trip/package is settled.
 */
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] });

const { t, locale } = useI18n();
const client = useSupabaseClient<Database>();
const notify = useNotify();

useHead(() => ({ title: `${t('dashboard.nav.deposits')} · ${t('brand')}` }));

const bcp47 = computed(() => (locale.value === 'ar' ? 'ar' : 'en'));

interface DepositOrderRow {
  id: string;
  created_at: string;
  total: number;
  paid_amount: number | null;
  currency: string;
  user_id: string;
  payment_status: string;
  transfer_reference: string | null;
  order_items: { title: string | null; quantity: number; item_type: string | null }[];
}

const { data, pending } = useAsyncData('admin-deposit-orders', async () => {
  const { data: orders } = await client
    .from('orders')
    .select(
      'id, created_at, total, paid_amount, currency, user_id, payment_status, transfer_reference, order_items(title, quantity, item_type)'
    )
    .eq('payment_method', 'bank_transfer')
    .eq('is_deposit_payment', true)
    .order('created_at', { ascending: false })
    .limit(50);

  const ids = [...new Set((orders ?? []).map((o) => o.user_id))];
  const names: Record<string, string> = {};
  if (ids.length) {
    const { data: profiles } = await client.from('profiles').select('id, full_name').in('id', ids);
    for (const p of profiles ?? []) names[p.id] = p.full_name ?? '';
  }
  return { orders: (orders ?? []) as DepositOrderRow[], names };
});

// Local, mutable copy so an approve/cancel updates the row instantly.
const rows = ref<DepositOrderRow[]>([]);
watch(data, (v) => (rows.value = v ? [...v.orders] : []), { immediate: true });
const names = computed(() => data.value?.names ?? {});

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat(bcp47.value, { dateStyle: 'medium' }).format(new Date(iso));
}
function buyer(userId: string) {
  return names.value[userId] || `${userId.slice(0, 8)}…`;
}
function itemsLabel(items: { title: string | null; quantity: number }[]) {
  if (!items?.length) return '—';
  return items.map((i) => `${i.title ?? '—'}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join('، ');
}
function remaining(o: DepositOrderRow) {
  return Math.max(0, Number(o.total) - Number(o.paid_amount ?? 0));
}
function payStatusVariant(status: string): BadgeVariant {
  if (status === 'paid') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'failed') return 'danger';
  return 'neutral';
}
function isPendingTransfer(o: DepositOrderRow) {
  return o.payment_status === 'pending';
}

// Approve / cancel a pending deposit transfer — same endpoint the main orders list uses.
const busyId = ref<string | null>(null);

async function act(o: DepositOrderRow, action: 'approve' | 'cancel') {
  busyId.value = o.id;
  try {
    const res = await $fetch<{ payment_status: string }>('/api/admin/orders/status', {
      method: 'POST',
      body: { orderId: o.id, action },
    });
    const row = rows.value.find((r) => r.id === o.id);
    if (row) row.payment_status = res.payment_status;
    notify.success(action === 'approve' ? t('dashboard.approved') : t('dashboard.cancelledOk'));
  } catch (err: unknown) {
    const msg = (err as { statusMessage?: string })?.statusMessage || t('dashboard.actionError');
    notify.error(msg);
  } finally {
    busyId.value = null;
  }
}
</script>

<template>
  <div class="deposits">
    <Card variant="elevated" padding="lg">
      <h2 class="deposits__title">{{ t('dashboard.deposits.title') }}</h2>
      <p class="deposits__lead">{{ t('dashboard.deposits.lead') }}</p>
      <div v-if="pending" class="deposits__loading">{{ t('common.loading') }}</div>
      <div v-else class="deposits__table">
        <table>
          <thead>
            <tr>
              <th>{{ t('dashboard.ordersTable.date') }}</th>
              <th>{{ t('dashboard.ordersTable.buyer') }}</th>
              <th>{{ t('dashboard.ordersTable.items') }}</th>
              <th style="text-align:end">{{ t('dashboard.deposits.table.deposit') }}</th>
              <th style="text-align:end">{{ t('dashboard.deposits.table.remaining') }}</th>
              <th style="text-align:end">{{ t('dashboard.ordersTable.total') }}</th>
              <th>{{ t('dashboard.ordersTable.status') }}</th>
              <th>{{ t('dashboard.ordersTable.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in rows" :key="o.id">
              <td>{{ fmtDate(o.created_at) }}</td>
              <td>{{ buyer(o.user_id) }}</td>
              <td class="deposits__items">
                {{ itemsLabel(o.order_items) }}
                <span v-if="o.transfer_reference" class="deposits__ref">
                  {{ t('dashboard.transferRef') }}: <bdi>{{ o.transfer_reference }}</bdi>
                </span>
              </td>
              <td style="text-align:end"><Money :amount="o.paid_amount" /></td>
              <td style="text-align:end"><Money :amount="remaining(o)" /></td>
              <td style="text-align:end"><Money :amount="o.total" /></td>
              <td>
                <Badge :variant="payStatusVariant(o.payment_status)">
                  {{ t(`dashboard.paymentStatus.${o.payment_status}`) }}
                </Badge>
              </td>
              <td>
                <div v-if="isPendingTransfer(o)" class="deposits__actions">
                  <Button size="sm" variant="primary" :disabled="busyId === o.id" @click="act(o, 'approve')">
                    <template #iconStart><Icon name="check" :size="15" /></template>
                    {{ t('dashboard.approve') }}
                  </Button>
                  <Button size="sm" variant="outline" :disabled="busyId === o.id" @click="act(o, 'cancel')">
                    <template #iconStart><Icon name="x" :size="15" /></template>
                    {{ t('dashboard.cancel') }}
                  </Button>
                </div>
                <span v-else class="deposits__dash">—</span>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="8" class="deposits__empty">{{ t('dashboard.deposits.empty') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.deposits__title {
  font-family: var(--font-display); font-weight: 800; font-size: var(--text-lg);
  color: var(--text-strong); margin: 0 0 6px;
}
.deposits__lead { color: var(--text-muted); font-size: var(--text-sm); margin: 0 0 20px; }
.deposits__loading { padding: 40px; text-align: center; color: var(--text-muted); }
.deposits__table { width: 100%; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 900px; }
thead th {
  font-family: var(--font-body); font-weight: 700; font-size: 13px;
  color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.02em;
  padding: 12px 14px; border-bottom: 1px solid var(--border-soft); white-space: nowrap; text-align: start;
}
tbody td { padding: 14px; font-size: 14px; color: var(--text-body); border-bottom: 1px solid var(--border-hair); white-space: nowrap; vertical-align: top; }
.deposits__items { white-space: normal; max-width: 280px; color: var(--text-muted); }
.deposits__ref { display: block; margin-top: 4px; font-size: 12px; color: var(--text-muted); font-family: var(--font-num); }
.deposits__actions { display: inline-flex; gap: 8px; }
.deposits__dash { color: var(--text-subtle); }
tbody tr:hover { background: var(--rose-50); }
.deposits__empty { text-align: center; color: var(--text-subtle); padding: 28px; }
</style>
