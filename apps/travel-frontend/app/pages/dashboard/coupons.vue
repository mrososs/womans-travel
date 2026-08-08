<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { Card, Badge, Button, Input, Icon, Dialog } from '@org/shared-ui';
import type { BadgeVariant } from '@org/shared-ui';
import type { Database } from '~/types/database.types';

/**
 * dashboard/coupons — mint, pause and delete percentage discount codes.
 *
 * Writes go straight through supabase-js; the `coupons_admin_all` RLS policy
 * (is_admin()) is what authorises them, exactly like dashboard/settings.vue.
 * Redemption counts come from `coupon_redemptions`, ignoring 'released' rows —
 * those belong to orders that failed, so they never consumed a use.
 */
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] });

const { t, locale } = useI18n();
const client = useSupabaseClient<Database>();
const notify = useNotify();

useHead(() => ({ title: `${t('dashboard.nav.coupons')} · ${t('brand')}` }));

const bcp47 = computed(() => (locale.value === 'ar' ? 'ar' : 'en'));

interface CouponRow {
  id: string;
  code: string;
  discount_percent: number;
  status: string;
  max_redemptions: number | null;
  expires_at: string | null;
  created_at: string;
}

const { data, pending, refresh } = useAsyncData('admin-coupons', async () => {
  const { data: coupons } = await client
    .from('coupons')
    .select('id, code, discount_percent, status, max_redemptions, expires_at, created_at')
    .order('created_at', { ascending: false });

  // A single read of the live redemptions, tallied per coupon.
  const { data: redemptions } = await client
    .from('coupon_redemptions')
    .select('coupon_id, status')
    .neq('status', 'released');

  const used: Record<string, number> = {};
  for (const r of redemptions ?? []) used[r.coupon_id] = (used[r.coupon_id] ?? 0) + 1;

  return { coupons: (coupons ?? []) as CouponRow[], used };
});

// Local, mutable copy so pause/resume updates the row without a full refetch.
const rows = ref<CouponRow[]>([]);
watch(data, (v) => (rows.value = v ? [...v.coupons] : []), { immediate: true });
const used = computed(() => data.value?.used ?? {});

// ---------- Create ----------

// Ambiguous glyphs (0/O, 1/I/L) are excluded so a code read aloud or copied
// off a screenshot can't be mistyped.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode(length = 6): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `DRH-${out}`;
}

const form = reactive({
  code: '',
  percent: '10',
  expiresAt: '',
  maxRedemptions: '',
});
const creating = ref(false);

function generate() {
  form.code = randomCode();
}

async function create() {
  const code = form.code.trim().toUpperCase();
  if (!code) {
    notify.error(t('dashboard.coupons.codeRequired'));
    return;
  }
  const percent = Number(form.percent);
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
    notify.error(t('dashboard.coupons.percentError'));
    return;
  }
  const max = form.maxRedemptions.trim() ? Number(form.maxRedemptions) : null;
  if (max !== null && (!Number.isFinite(max) || max < 1)) {
    notify.error(t('dashboard.coupons.percentError'));
    return;
  }

  creating.value = true;
  try {
    const { error } = await client.from('coupons').insert({
      code,
      discount_percent: percent,
      // A date input gives a bare day; expire at the end of it, not the start.
      expires_at: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
      max_redemptions: max,
    });
    if (error) {
      // 23505 — the unique index on coupons.code.
      if (error.code === '23505') {
        notify.error(t('dashboard.coupons.duplicate'));
        return;
      }
      throw error;
    }
    notify.success(t('dashboard.coupons.created'));
    form.code = '';
    form.expiresAt = '';
    form.maxRedemptions = '';
    await refresh();
  } catch (err: unknown) {
    notify.error((err as { message?: string })?.message || t('dashboard.coupons.createError'));
  } finally {
    creating.value = false;
  }
}

// ---------- Row actions ----------

const busyId = ref<string | null>(null);

/** Pause/resume — the "stop this coupon" control. History is preserved. */
async function toggleStatus(c: CouponRow) {
  const next = c.status === 'active' ? 'paused' : 'active';
  busyId.value = c.id;
  try {
    const { error } = await client.from('coupons').update({ status: next }).eq('id', c.id);
    if (error) throw error;
    const row = rows.value.find((r) => r.id === c.id);
    if (row) row.status = next;
    notify.success(next === 'paused' ? t('dashboard.coupons.paused') : t('dashboard.coupons.resumed'));
  } catch (err: unknown) {
    notify.error((err as { message?: string })?.message || t('dashboard.actionError'));
  } finally {
    busyId.value = null;
  }
}

const toDelete = ref<CouponRow | null>(null);
const deleteOpen = computed({
  get: () => toDelete.value !== null,
  set: (open: boolean) => {
    if (!open) toDelete.value = null;
  },
});

async function confirmDelete() {
  const c = toDelete.value;
  if (!c) return;
  busyId.value = c.id;
  try {
    const { error } = await client.from('coupons').delete().eq('id', c.id);
    if (error) throw error;
    rows.value = rows.value.filter((r) => r.id !== c.id);
    notify.success(t('dashboard.coupons.deleted'));
  } catch (err: unknown) {
    notify.error((err as { message?: string })?.message || t('dashboard.coupons.deleteError'));
  } finally {
    busyId.value = null;
    toDelete.value = null;
  }
}

// ---------- Display helpers ----------

const copied = ref('');
async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    copied.value = code;
    notify.success(t('dashboard.coupons.copied'));
    setTimeout(() => (copied.value = copied.value === code ? '' : copied.value), 1500);
  } catch {
    /* clipboard unavailable — no-op */
  }
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat(bcp47.value, { dateStyle: 'medium' }).format(new Date(iso));
}
function isExpired(c: CouponRow) {
  return c.expires_at != null && new Date(c.expires_at) <= new Date();
}
function usesLabel(c: CouponRow) {
  const n = used.value[c.id] ?? 0;
  return c.max_redemptions == null ? `${n} / ∞` : `${n} / ${c.max_redemptions}`;
}
function statusVariant(c: CouponRow): BadgeVariant {
  if (isExpired(c)) return 'neutral';
  return c.status === 'active' ? 'success' : 'warning';
}
</script>

<template>
  <div class="coupons">
    <Card variant="elevated" padding="lg">
      <div class="coupons__head">
        <span class="coupons__ico"><Icon name="ticket-percent" :size="22" /></span>
        <div>
          <h2 class="coupons__title">{{ t('dashboard.coupons.createTitle') }}</h2>
          <p class="coupons__lead">{{ t('dashboard.coupons.createLead') }}</p>
        </div>
      </div>

      <form class="coupons__form" @submit.prevent="create">
        <div class="coupons__code">
          <Input v-model="form.code" :label="t('dashboard.coupons.code')" placeholder="DRH-XXXXXX" required />
          <Button type="button" variant="outline" size="md" @click="generate">
            <template #iconStart><Icon name="refresh-cw" :size="16" /></template>
            {{ t('dashboard.coupons.generate') }}
          </Button>
        </div>

        <div class="coupons__grid">
          <Input v-model="form.percent" type="number" :label="t('dashboard.coupons.percent')" required />
          <Input v-model="form.expiresAt" type="date" :label="t('dashboard.coupons.expiresAt')" />
          <Input
            v-model="form.maxRedemptions"
            type="number"
            :label="t('dashboard.coupons.maxRedemptions')"
            :placeholder="t('dashboard.coupons.unlimited')"
          />
        </div>

        <div class="coupons__actions">
          <Button type="submit" variant="primary" size="md" :disabled="creating">
            <template #iconStart><Icon name="plus" :size="16" /></template>
            {{ creating ? t('common.sending') : t('dashboard.coupons.create') }}
          </Button>
        </div>
      </form>
    </Card>

    <Card variant="elevated" padding="lg">
      <h2 class="coupons__title">{{ t('dashboard.coupons.listTitle') }}</h2>
      <p class="coupons__lead coupons__lead--table">{{ t('dashboard.coupons.listLead') }}</p>

      <div v-if="pending" class="coupons__loading">{{ t('common.loading') }}</div>
      <div v-else class="coupons__table">
        <table>
          <thead>
            <tr>
              <th>{{ t('dashboard.coupons.code') }}</th>
              <th>{{ t('dashboard.coupons.percent') }}</th>
              <th>{{ t('dashboard.coupons.used') }}</th>
              <th>{{ t('dashboard.coupons.expiry') }}</th>
              <th>{{ t('dashboard.ordersTable.status') }}</th>
              <th>{{ t('dashboard.ordersTable.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in rows" :key="c.id">
              <td>
                <span class="coupons__code-cell">
                  <bdi class="coupons__mono">{{ c.code }}</bdi>
                  <button
                    type="button"
                    class="coupons__copy"
                    :aria-label="t('dashboard.coupons.code')"
                    @click="copyCode(c.code)"
                  >
                    <Icon :name="copied === c.code ? 'check' : 'copy'" :size="14" />
                  </button>
                </span>
              </td>
              <td class="coupons__pct">{{ +c.discount_percent }}%</td>
              <td class="coupons__mono">{{ usesLabel(c) }}</td>
              <td>
                <span v-if="c.expires_at">{{ fmtDate(c.expires_at) }}</span>
                <span v-else class="coupons__muted">{{ t('dashboard.coupons.never') }}</span>
              </td>
              <td>
                <Badge :variant="statusVariant(c)">
                  {{ isExpired(c) ? t('dashboard.coupons.expiredNote') : t(`dashboard.coupons.status.${c.status}`) }}
                </Badge>
              </td>
              <td>
                <div class="coupons__row-actions">
                  <Button
                    size="sm"
                    variant="outline"
                    :disabled="busyId === c.id"
                    @click="toggleStatus(c)"
                  >
                    <template #iconStart>
                      <Icon :name="c.status === 'active' ? 'pause' : 'play'" :size="15" />
                    </template>
                    {{ c.status === 'active' ? t('dashboard.coupons.pause') : t('dashboard.coupons.resume') }}
                  </Button>
                  <Button size="sm" variant="ghost" :disabled="busyId === c.id" @click="toDelete = c">
                    <template #iconStart><Icon name="trash-2" :size="15" /></template>
                    {{ t('dashboard.coupons.delete') }}
                  </Button>
                </div>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="6" class="coupons__empty">{{ t('dashboard.coupons.empty') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <Dialog v-model:open="deleteOpen" variant="center" :title="t('dashboard.coupons.deleteTitle')">
      <p class="coupons__confirm">
        {{ t('dashboard.coupons.deleteConfirm', { code: toDelete?.code ?? '' }) }}
      </p>
      <div class="coupons__confirm-actions">
        <Button variant="outline" size="md" @click="toDelete = null">{{ t('dashboard.cancel') }}</Button>
        <Button variant="primary" size="md" :disabled="busyId !== null" @click="confirmDelete">
          <template #iconStart><Icon name="trash-2" :size="16" /></template>
          {{ t('dashboard.coupons.delete') }}
        </Button>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.coupons { display: grid; gap: 24px; }
.coupons__head { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 24px; }
.coupons__ico {
  width: 46px; height: 46px; flex: none; border-radius: var(--radius-md);
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--rose-100); color: var(--brand-strong);
}
.coupons__title {
  font-family: var(--font-display); font-weight: 800; font-size: var(--text-lg);
  color: var(--text-strong); margin: 0;
}
.coupons__lead { color: var(--text-muted); font-size: var(--text-sm); margin: 6px 0 0; line-height: var(--leading-relaxed); }
.coupons__lead--table { margin-bottom: 20px; }
.coupons__loading { padding: 40px; text-align: center; color: var(--text-muted); }

.coupons__form { display: grid; gap: 18px; max-width: 720px; }
.coupons__code { display: flex; align-items: flex-end; gap: 12px; }
.coupons__code > :first-child { flex: 1; min-width: 0; }
.coupons__grid { display: grid; gap: 18px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.coupons__actions { margin-top: 6px; }

.coupons__table { width: 100%; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 760px; }
thead th {
  font-family: var(--font-body); font-weight: 700; font-size: 13px;
  color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.02em;
  padding: 12px 14px; border-bottom: 1px solid var(--border-soft); white-space: nowrap; text-align: start;
}
tbody td { padding: 14px; font-size: 14px; color: var(--text-body); border-bottom: 1px solid var(--border-hair); white-space: nowrap; }
tbody tr:hover { background: var(--rose-50); }
.coupons__code-cell { display: inline-flex; align-items: center; gap: 8px; }
.coupons__mono { font-family: var(--font-num); font-weight: 700; letter-spacing: 0.04em; }
.coupons__pct { font-family: var(--font-num); font-weight: 700; }
.coupons__muted { color: var(--text-subtle); }
.coupons__copy {
  display: inline-flex; border: none; background: transparent; cursor: pointer;
  color: var(--text-muted); padding: 4px; border-radius: var(--radius-sm);
  transition: color var(--dur-base) var(--ease-standard), background var(--dur-base) var(--ease-standard);
}
.coupons__copy:hover { color: var(--brand-strong); background: var(--rose-100); }
.coupons__copy:focus-visible { outline: none; box-shadow: var(--ring-brand); }
.coupons__row-actions { display: inline-flex; gap: 8px; }
.coupons__empty { text-align: center; color: var(--text-subtle); padding: 28px; }

.coupons__confirm { color: var(--text-body); font-size: var(--text-sm); line-height: var(--leading-relaxed); margin: 0 0 20px; }
.coupons__confirm-actions { display: flex; gap: 12px; justify-content: flex-end; }

@media (max-width: 720px) {
  .coupons__grid { grid-template-columns: 1fr; }
  .coupons__code { flex-direction: column; align-items: stretch; }
}
</style>
