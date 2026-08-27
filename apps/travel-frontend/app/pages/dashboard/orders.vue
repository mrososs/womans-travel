<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Card, Badge, Button, Icon } from '@org/shared-ui';
import type { BadgeVariant } from '@org/shared-ui';
import Money from '~/components/dashboard/Money.vue';
import type { Database } from '~/types/database.types';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] });

const { t, locale } = useI18n();
const client = useSupabaseClient<Database>();
const notify = useNotify();

useHead(() => ({ title: `${t('dashboard.nav.orders')} · ${t('brand')}` }));

const bcp47 = computed(() => (locale.value === 'ar' ? 'ar' : 'en'));

/**
 * The traveler manifest snapshotted onto the order at checkout
 * (see server/utils/checkout.ts → normalizeTraveler). International bookings
 * carry a passport number; domestic-only carts carry a national ID/iqama
 * instead. Older orders predate one or both fields, hence every field optional.
 */
interface TravelerInfo {
  fullNameAr?: string | null;
  fullNameEn?: string | null;
  phone?: string | null;
  nationalId?: string | null;
  passportNumber?: string | null;
  passportExpiryDate?: string | null;
}

interface OrderRow {
  id: string;
  created_at: string;
  status: string;
  total: number;
  currency: string;
  user_id: string;
  payment_method: string | null;
  payment_status: string;
  transfer_reference: string | null;
  traveler_info: TravelerInfo | null;
  order_items: { title: string | null; quantity: number; item_type: string | null }[];
}

/** Buyer contact resolved from the `profiles` row behind each order. */
interface BuyerProfile {
  name: string;
  phone: string;
}

const { data, pending } = useAsyncData('admin-orders', async () => {
  const { data: orders } = await client
    .from('orders')
    .select(
      'id, created_at, status, total, currency, user_id, payment_method, payment_status, transfer_reference, traveler_info, order_items(title, quantity, item_type)'
    )
    .order('created_at', { ascending: false })
    .limit(50);

  const ids = [...new Set((orders ?? []).map((o) => o.user_id))];
  const buyers: Record<string, BuyerProfile> = {};
  if (ids.length) {
    // `phone` is the fallback for orders placed before checkout captured a
    // mobile on the manifest — admins can read every profile via RLS is_admin().
    const { data: profiles } = await client
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', ids);
    for (const p of profiles ?? []) {
      buyers[p.id] = { name: p.full_name ?? '', phone: p.phone ?? '' };
    }
  }
  return { orders: (orders ?? []) as OrderRow[], buyers };
});

// Local, mutable copy so an approve/cancel updates the row instantly.
const rows = ref<OrderRow[]>([]);
watch(data, (v) => (rows.value = v ? [...v.orders] : []), { immediate: true });
const buyers = computed(() => data.value?.buyers ?? {});

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat(bcp47.value, { dateStyle: 'medium' }).format(new Date(iso));
}
function buyer(o: OrderRow) {
  // Manifest name first — it's the four-part name the traveler documents carry,
  // which is what the ops team books on; the account name is the fallback.
  return (
    o.traveler_info?.fullNameAr ||
    buyers.value[o.user_id]?.name ||
    `${o.user_id.slice(0, 8)}…`
  );
}
/** Mobile from the order's manifest, falling back to the buyer's profile. */
function mobile(o: OrderRow) {
  return o.traveler_info?.phone || buyers.value[o.user_id]?.phone || '';
}
/**
 * The travel document on the manifest: a passport for international bookings,
 * a national ID/iqama for domestic-only ones. Returns the label to show next to
 * the number so an ID is never mistaken for a passport.
 */
function travelDoc(o: OrderRow): { label: string; value: string } {
  const info = o.traveler_info;
  if (info?.passportNumber) {
    return { label: t('dashboard.ordersTable.passportLabel'), value: info.passportNumber };
  }
  if (info?.nationalId) {
    return { label: t('dashboard.ordersTable.nationalIdLabel'), value: info.nationalId };
  }
  return { label: '', value: '' };
}
function itemsLabel(items: { title: string | null; quantity: number }[]) {
  if (!items?.length) return '—';
  return items.map((i) => `${i.title ?? '—'}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join('، ');
}
function methodLabel(method: string | null) {
  if (method === 'bank_transfer') return t('dashboard.method.bank_transfer');
  if (method === 'moyasar') return t('dashboard.method.moyasar');
  return '—';
}
function payStatusVariant(status: string): BadgeVariant {
  if (status === 'paid') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'failed') return 'danger';
  return 'neutral';
}
function isPendingTransfer(o: OrderRow) {
  return o.payment_method === 'bank_transfer' && o.payment_status === 'pending';
}

// Approve / cancel a pending bank transfer -----------------------------------
const busyId = ref<string | null>(null);

async function act(o: OrderRow, action: 'approve' | 'cancel') {
  busyId.value = o.id;
  try {
    const res = await $fetch<{ payment_status: string }>('/api/admin/orders/status', {
      method: 'POST',
      body: { orderId: o.id, action },
    });
    const row = rows.value.find((r) => r.id === o.id);
    if (row) {
      row.payment_status = res.payment_status;
      row.status = res.payment_status;
    }
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
              <th>{{ t('dashboard.ordersTable.mobile') }}</th>
              <th>{{ t('dashboard.ordersTable.document') }}</th>
              <th>{{ t('dashboard.ordersTable.items') }}</th>
              <th>{{ t('dashboard.ordersTable.method') }}</th>
              <th>{{ t('dashboard.ordersTable.status') }}</th>
              <th style="text-align:end">{{ t('dashboard.ordersTable.total') }}</th>
              <th>{{ t('dashboard.ordersTable.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in rows" :key="o.id">
              <td>{{ fmtDate(o.created_at) }}</td>
              <td>{{ buyer(o) }}</td>
              <td>
                <a v-if="mobile(o)" class="orders__tel" :href="`tel:${mobile(o)}`">
                  <Icon name="phone" :size="14" />
                  <bdi>{{ mobile(o) }}</bdi>
                </a>
                <span v-else class="orders__dash">—</span>
              </td>
              <td>
                <span v-if="travelDoc(o).value" class="orders__doc">
                  <bdi class="orders__doc-num">{{ travelDoc(o).value }}</bdi>
                  <small>{{ travelDoc(o).label }}</small>
                </span>
                <span v-else class="orders__dash">—</span>
              </td>
              <td class="orders__items">{{ itemsLabel(o.order_items) }}</td>
              <td>
                <span class="orders__method">
                  <Icon :name="o.payment_method === 'bank_transfer' ? 'building-2' : 'credit-card'" :size="15" />
                  {{ methodLabel(o.payment_method) }}
                </span>
                <span v-if="o.payment_method === 'bank_transfer' && o.transfer_reference" class="orders__ref">
                  {{ t('dashboard.transferRef') }}: <bdi>{{ o.transfer_reference }}</bdi>
                </span>
              </td>
              <td>
                <Badge :variant="payStatusVariant(o.payment_status)">
                  {{ t(`dashboard.paymentStatus.${o.payment_status}`) }}
                </Badge>
              </td>
              <td style="text-align:end"><Money :amount="o.total" /></td>
              <td>
                <div v-if="isPendingTransfer(o)" class="orders__actions">
                  <Button size="sm" variant="primary" :disabled="busyId === o.id" @click="act(o, 'approve')">
                    <template #iconStart><Icon name="check" :size="15" /></template>
                    {{ t('dashboard.approve') }}
                  </Button>
                  <Button size="sm" variant="outline" :disabled="busyId === o.id" @click="act(o, 'cancel')">
                    <template #iconStart><Icon name="x" :size="15" /></template>
                    {{ t('dashboard.cancel') }}
                  </Button>
                </div>
                <span v-else class="orders__dash">—</span>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="9" class="orders__empty">{{ t('dashboard.empty') }}</td>
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
table { width: 100%; border-collapse: collapse; min-width: 1080px; }
thead th {
  font-family: var(--font-body); font-weight: 700; font-size: 13px;
  color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.02em;
  padding: 12px 14px; border-bottom: 1px solid var(--border-soft); white-space: nowrap; text-align: start;
}
tbody td { padding: 14px; font-size: 14px; color: var(--text-body); border-bottom: 1px solid var(--border-hair); white-space: nowrap; vertical-align: top; }
.orders__items { white-space: normal; max-width: 280px; color: var(--text-muted); }
.orders__method { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: var(--text-strong); }
.orders__method :deep(svg) { color: var(--brand-strong); }
.orders__ref { display: block; margin-top: 4px; font-size: 12px; color: var(--text-muted); font-family: var(--font-num); }
/* Mobile + travel document: LTR numerals in a tabular font so the ops team can
   scan a column of numbers, with the document type spelled out underneath. */
.orders__tel {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--font-num); color: var(--text-strong);
  text-decoration: none; border-bottom: 1px dashed var(--border-strong);
}
.orders__tel:hover { color: var(--brand-strong); border-bottom-color: var(--brand-strong); }
.orders__tel :deep(svg) { color: var(--brand-strong); flex: none; }
.orders__doc { display: inline-flex; flex-direction: column; gap: 2px; }
.orders__doc-num { font-family: var(--font-num); font-weight: 600; color: var(--text-strong); letter-spacing: 0.02em; }
.orders__doc small { font-size: 11px; color: var(--text-muted); }
.orders__actions { display: inline-flex; gap: 8px; }
.orders__dash { color: var(--text-subtle); }
tbody tr:hover { background: var(--rose-50); }
.orders__empty { text-align: center; color: var(--text-subtle); padding: 28px; }
</style>
