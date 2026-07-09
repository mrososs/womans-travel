<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Button, Badge, Icon } from '@org/shared-ui';
import type { BadgeVariant } from '@org/shared-ui';
import AccountNav from '~/components/account/AccountNav.vue';
import type { Database } from '~/types/database.types';

/**
 * Account → My Bookings. Lists the shopper's confirmed trips & packages and
 * lets them cancel for free within 48h of purchase. The window is shown as a
 * live countdown and re-checked server-side by /api/orders/cancel.
 */

definePageMeta({ middleware: 'auth' });

const { t, locale } = useI18n();
const localePath = useLocalePath();
const client = useSupabaseClient<Database>();
const notify = useNotify();

useHead(() => ({ title: `${t('account.orders')} · ${t('brand')}` }));

// Keep in sync with CANCEL_WINDOW_HOURS in server/api/orders/cancel.post.ts.
const CANCEL_WINDOW_MS = 48 * 60 * 60 * 1000;

type OrderItem = { title: string | null; quantity: number; item_type: string | null };
interface Booking {
  id: string;
  created_at: string;
  status: string;
  total: number;
  currency: string;
  payment_method: string | null;
  payment_status: string;
  order_items: OrderItem[];
}

// Administration contact number shown when a payment is cancelled.
const ADMIN_PHONE = '0500000000';

const nf = new Intl.NumberFormat('en-US');
const bcp47 = computed(() => (locale.value === 'ar' ? 'ar-SA' : 'en-GB'));

const { data, pending } = useAsyncData('account-bookings', async () => {
  // Show confirmed/cancelled/refunded orders, plus pending *bank transfers*
  // (which are awaiting admin review). Abandoned Moyasar drafts stay hidden.
  const { data: rows } = await client
    .from('orders')
    .select(
      'id, created_at, status, total, currency, payment_method, payment_status, order_items(title, quantity, item_type)'
    )
    .or('status.in.(paid,cancelled,refunded),and(status.eq.pending,payment_method.eq.bank_transfer)')
    .order('created_at', { ascending: false });
  return (rows ?? []) as Booking[];
});

// Local, mutable copy so a cancel updates the card instantly (no refetch).
const bookings = ref<Booking[]>([]);
watch(data, (v) => (bookings.value = v ? [...v] : []), { immediate: true });

// Live clock so the countdown / eligibility refresh without a reload.
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  now.value = Date.now();
  timer = setInterval(() => (now.value = Date.now()), 30_000);
});
onBeforeUnmount(() => timer && clearInterval(timer));

function deadline(o: Booking) {
  return new Date(o.created_at).getTime() + CANCEL_WINDOW_MS;
}
function cancellable(o: Booking) {
  return o.payment_status === 'paid' && now.value < deadline(o);
}

// Booking state (drives the messaging on each card).
function isReview(o: Booking) {
  return o.payment_status === 'pending' && o.payment_method === 'bank_transfer';
}
function isCancelled(o: Booking) {
  return o.payment_status === 'cancelled' || o.status === 'cancelled';
}
function isPaid(o: Booking) {
  return o.payment_status === 'paid' || o.status === 'paid';
}
function timeLeft(o: Booking) {
  const ms = Math.max(0, deadline(o) - now.value);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return t('account.bookings.timeLeft', { h, m });
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat(bcp47.value, { dateStyle: 'long' }).format(new Date(iso));
}
function titles(o: Booking) {
  const items = o.order_items ?? [];
  if (!items.length) return '—';
  return items.map((i) => `${i.title ?? '—'}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`).join(' · ');
}
function media(o: Booking) {
  const type = o.order_items?.[0]?.item_type;
  if (type === 'trip') return { icon: 'plane', grad: 'var(--grad-gold)' };
  if (type === 'product') return { icon: 'shopping-bag', grad: 'var(--grad-navy)' };
  return { icon: 'package', grad: 'var(--grad-rose)' };
}
function stateVariant(o: Booking): BadgeVariant {
  if (isReview(o)) return 'warning';
  if (isPaid(o)) return 'success';
  if (o.status === 'refunded') return 'info';
  return 'neutral';
}
function stateLabel(o: Booking) {
  if (isReview(o)) return t('account.bookings.status.review');
  if (isPaid(o)) return t('account.bookings.status.paid');
  if (isCancelled(o)) return t('account.bookings.status.cancelled');
  return t(`account.bookings.status.${o.status}`);
}

// Cancellation ----------------------------------------------------------
const confirmId = ref<string | null>(null);
const cancellingId = ref<string | null>(null);

async function doCancel(o: Booking) {
  cancellingId.value = o.id;
  try {
    await $fetch('/api/orders/cancel', { method: 'POST', body: { orderId: o.id } });
    const row = bookings.value.find((b) => b.id === o.id);
    if (row) {
      row.status = 'cancelled';
      row.payment_status = 'cancelled';
    }
    notify.success(t('account.bookings.cancelled'));
    confirmId.value = null;
  } catch (err: unknown) {
    const msg = (err as { statusMessage?: string })?.statusMessage || t('account.bookings.cancelError');
    notify.error(msg);
  } finally {
    cancellingId.value = null;
  }
}
</script>

<template>
  <section class="section">
    <div class="container account">
      <div class="account__head account__head--simple">
        <div>
          <div class="eyebrow">{{ t('account.welcome') }}</div>
          <h1 class="account__name">{{ t('account.bookings.title') }}</h1>
          <p class="account__lead">{{ t('account.bookings.subtitle') }}</p>
        </div>
      </div>

      <div class="account__grid">
        <AccountNav active="orders" />

        <div class="bk">
          <!-- Loading -->
          <div v-if="pending" class="bk__state">
            <Icon name="loader" :size="26" class="bk__spin" />
            <p>{{ t('common.loading') }}</p>
          </div>

          <!-- Empty -->
          <div v-else-if="!bookings.length" class="bk__state bk__empty">
            <span class="bk__empty-ico"><Icon name="package-open" :size="40" /></span>
            <p>{{ t('account.bookings.empty') }}</p>
            <Button variant="outline" @click="navigateTo(localePath('/packages'))">
              {{ t('account.bookings.emptyCta') }}
            </Button>
          </div>

          <!-- Bookings -->
          <ul v-else class="bk__list">
            <li v-for="o in bookings" :key="o.id" class="bk-card" :class="{ 'is-cancelled': isCancelled(o) }">
              <div class="bk-card__main">
                <span class="bk-card__media" :style="{ background: media(o).grad }">
                  <Icon :name="media(o).icon" :size="26" :stroke-width="1.4" color="#fff" />
                </span>
                <div class="bk-card__info">
                  <div class="bk-card__row">
                    <h2 class="bk-card__title">{{ titles(o) }}</h2>
                    <Badge :variant="stateVariant(o)">{{ stateLabel(o) }}</Badge>
                  </div>
                  <div class="bk-card__meta">
                    <span><Icon name="calendar" :size="14" /> {{ t('account.bookings.purchasedOn') }}: {{ fmtDate(o.created_at) }}</span>
                    <span class="bk-card__ref"><Icon name="hash" :size="14" />{{ o.id.slice(0, 8) }}</span>
                  </div>
                </div>
                <div class="bk-card__total">
                  <span class="bk-card__total-k">{{ t('account.bookings.total') }}</span>
                  <span class="bk-card__total-v">{{ nf.format(o.total) }}<Icon name="saudi-riyal" :size="16" /></span>
                </div>
              </div>

              <!-- Status / cancellation footer -->
              <div class="bk-card__foot" :class="{ 'bk-card__foot--alert': isCancelled(o) }">
                <!-- Bank transfer awaiting admin review -->
                <template v-if="isReview(o)">
                  <span class="bk-note bk-note--review">
                    <Icon name="clock" :size="15" /> {{ t('account.bookings.bankReview') }}
                  </span>
                </template>

                <!-- Payment cancelled — show contact-admin alert -->
                <template v-else-if="isCancelled(o)">
                  <span class="bk-alert">
                    <Icon name="alert-triangle" :size="16" />
                    {{ t('account.bookings.cancelledAlert', { phone: ADMIN_PHONE }) }}
                  </span>
                </template>

                <!-- Paid & confirmed — plus free-cancellation controls within 48h -->
                <template v-else-if="isPaid(o)">
                  <span class="bk-note bk-note--ok">
                    <Icon name="check-circle" :size="15" /> {{ t('account.bookings.paidConfirmed') }}
                  </span>

                  <template v-if="cancellable(o)">
                  <template v-if="confirmId === o.id">
                    <span class="bk-note bk-note--warn"><Icon name="alert-triangle" :size="15" /> {{ t('account.bookings.confirmTitle') }}</span>
                    <span class="bk-card__foot-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        :disabled="cancellingId === o.id"
                        @click="confirmId = null"
                      >{{ t('account.bookings.confirmNo') }}</Button>
                      <Button
                        variant="primary"
                        size="sm"
                        :disabled="cancellingId === o.id"
                        @click="doCancel(o)"
                      >
                        <template #iconStart><Icon name="x" :size="15" /></template>
                        {{ cancellingId === o.id ? t('common.sending') : t('account.bookings.confirmYes') }}
                      </Button>
                    </span>
                  </template>
                  <template v-else>
                    <span class="bk-note bk-note--ok"><Icon name="clock" :size="15" /> {{ timeLeft(o) }}</span>
                    <Button variant="ghost" size="sm" class="bk-card__cancel" @click="confirmId = o.id">
                      <template #iconStart><Icon name="x-circle" :size="16" /></template>
                      {{ t('account.bookings.cancel') }}
                    </Button>
                  </template>
                </template>

                  <template v-else>
                    <span class="bk-note bk-note--muted"><Icon name="lock" :size="15" /> {{ t('account.bookings.windowEnded') }}</span>
                  </template>
                </template>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.account { max-width: 960px; }
.account__head { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.account__name { font-family: var(--font-display); font-weight: 800; font-size: var(--text-2xl); color: var(--text-strong); margin: 2px 0 0; }
.account__lead { color: var(--text-muted); font-size: var(--text-sm); margin: 8px 0 0; max-width: 60ch; line-height: var(--leading-relaxed); }
.account__grid { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
@media (min-width: 860px) { .account__grid { grid-template-columns: 240px 1fr; } }

/* States */
.bk__state { display: grid; justify-items: center; gap: 14px; padding: 64px 0; color: var(--text-muted); text-align: center; }
.bk__spin { color: var(--brand-strong); animation: bk-spin 0.9s linear infinite; }
@keyframes bk-spin { to { transform: rotate(360deg); } }
.bk__empty-ico { color: var(--rose-300); }

/* List */
.bk__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; }
.bk-card {
  border: 1.5px solid var(--border-soft); border-radius: var(--radius-lg);
  background: var(--surface-card); box-shadow: var(--shadow-sm); overflow: hidden;
  transition: border-color var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard);
}
.bk-card:hover { box-shadow: var(--shadow-md); }
.bk-card.is-cancelled { opacity: 0.72; }

.bk-card__main { display: flex; align-items: center; gap: 16px; padding: 18px 20px; }
.bk-card__media {
  width: 60px; height: 60px; flex: none; border-radius: var(--radius-md);
  display: inline-flex; align-items: center; justify-content: center;
}
.is-cancelled .bk-card__media { filter: grayscale(0.7); }
.bk-card__info { flex: 1; min-width: 0; }
.bk-card__row { display: flex; align-items: center; gap: 12px; justify-content: space-between; }
.bk-card__title {
  font-family: var(--font-display); font-weight: 700; font-size: var(--text-base);
  color: var(--text-strong); margin: 0; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.bk-card__meta { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 8px; color: var(--text-muted); font-size: var(--text-xs); }
.bk-card__meta span { display: inline-flex; align-items: center; gap: 5px; }
.bk-card__ref { font-family: var(--font-num); color: var(--text-subtle); }
.bk-card__total { text-align: end; flex: none; }
.bk-card__total-k { display: block; font-size: var(--text-xs); color: var(--text-muted); }
.bk-card__total-v {
  display: inline-flex; align-items: center; gap: 3px; margin-top: 2px;
  font-family: var(--font-display); font-weight: 800; font-size: var(--text-lg); color: var(--brand-strong);
}
.bk-card__total-v :deep(svg) { width: 0.8em; height: 0.8em; }

.bk-card__foot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  padding: 12px 20px; border-top: 1.5px solid var(--border-hair); background: var(--surface-page);
}
.bk-card__foot-actions { display: inline-flex; align-items: center; gap: 8px; }
.bk-card__cancel { color: var(--danger-500); }
.bk-note { display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-xs); font-weight: 600; }
.bk-note--ok { color: var(--success-600, var(--success-500)); }
.bk-note--warn { color: var(--danger-500); }
.bk-note--muted { color: var(--text-subtle); }
.bk-note--review { color: var(--warning-600, var(--warning-500)); }

/* Cancelled-payment alert (contact administration) */
.bk-card__foot--alert { background: var(--danger-100, #fdecec); border-top-color: var(--danger-200, var(--danger-100)); }
.bk-alert {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: var(--text-sm); font-weight: 600; color: var(--danger-600, var(--danger-500));
  line-height: var(--leading-relaxed);
}
.bk-alert :deep(svg) { flex: none; }

@media (max-width: 560px) {
  .bk-card__main { flex-wrap: wrap; }
  .bk-card__total { text-align: start; width: 100%; display: flex; align-items: baseline; gap: 8px; }
}
</style>
