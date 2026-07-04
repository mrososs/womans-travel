<script setup lang="ts">
import { computed } from 'vue';
import { Card, Badge } from '@org/shared-ui';
import type { BadgeVariant } from '@org/shared-ui';
import Money from '~/components/dashboard/Money.vue';
import type { Database } from '~/types/database.types';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] });

const { t, locale } = useI18n();
const client = useSupabaseClient<Database>();

useHead(() => ({ title: `${t('dashboard.nav.orders')} · ${t('brand')}` }));

const bcp47 = computed(() => (locale.value === 'ar' ? 'ar' : 'en'));

const { data, pending } = useAsyncData('admin-orders', async () => {
  const { data: orders } = await client
    .from('orders')
    .select('id, created_at, status, total, currency, user_id, order_items(title, quantity, item_type)')
    .order('created_at', { ascending: false })
    .limit(50);

  const ids = [...new Set((orders ?? []).map((o) => o.user_id))];
  const names: Record<string, string> = {};
  if (ids.length) {
    const { data: profiles } = await client
      .from('profiles')
      .select('id, full_name')
      .in('id', ids);
    for (const p of profiles ?? []) names[p.id] = p.full_name ?? '';
  }
  return { orders: orders ?? [], names };
});

const rows = computed(() => data.value?.orders ?? []);

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat(bcp47.value, { dateStyle: 'medium' }).format(new Date(iso));
}
function buyer(userId: string) {
  return data.value?.names[userId] || `${userId.slice(0, 8)}…`;
}
function itemsLabel(items: { title: string | null; quantity: number }[]) {
  if (!items?.length) return '—';
  return items.map((i) => `${i.title ?? '—'}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join('، ');
}
function statusVariant(status: string): BadgeVariant {
  if (status === 'paid') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'refunded') return 'info';
  return 'neutral';
}
</script>

<template>
  <div class="orders">
    <Card variant="elevated" padding="lg">
      <h2 class="orders__title">{{ t('dashboard.recentOrders') }}</h2>
      <div v-if="pending" class="orders__loading">{{ t('common.loading') }}</div>
      <div v-else class="orders__table">
        <table>
          <thead>
            <tr>
              <th>{{ t('dashboard.ordersTable.date') }}</th>
              <th>{{ t('dashboard.ordersTable.buyer') }}</th>
              <th>{{ t('dashboard.ordersTable.items') }}</th>
              <th>{{ t('dashboard.ordersTable.status') }}</th>
              <th style="text-align:end">{{ t('dashboard.ordersTable.total') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in rows" :key="o.id">
              <td>{{ fmtDate(o.created_at) }}</td>
              <td>{{ buyer(o.user_id) }}</td>
              <td class="orders__items">{{ itemsLabel(o.order_items) }}</td>
              <td><Badge :variant="statusVariant(o.status)">{{ t(`dashboard.status.${o.status}`) }}</Badge></td>
              <td style="text-align:end"><Money :amount="o.total" /></td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="5" class="orders__empty">{{ t('dashboard.empty') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.orders__title {
  font-family: var(--font-display); font-weight: 800; font-size: var(--text-lg);
  color: var(--text-strong); margin: 0 0 20px;
}
.orders__loading { padding: 40px; text-align: center; color: var(--text-muted); }
.orders__table { width: 100%; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 640px; }
thead th {
  font-family: var(--font-body); font-weight: 700; font-size: 13px;
  color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.02em;
  padding: 12px 14px; border-bottom: 1px solid var(--border-soft); white-space: nowrap; text-align: start;
}
tbody td { padding: 14px; font-size: 14px; color: var(--text-body); border-bottom: 1px solid var(--border-hair); white-space: nowrap; }
.orders__items { white-space: normal; max-width: 320px; color: var(--text-muted); }
tbody tr:hover { background: var(--rose-50); }
.orders__empty { text-align: center; color: var(--text-subtle); padding: 28px; }
</style>
