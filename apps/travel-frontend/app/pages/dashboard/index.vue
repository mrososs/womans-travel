<script setup lang="ts">
import { computed } from 'vue';
import { Card } from '@org/shared-ui';
import StatCard from '~/components/dashboard/StatCard.vue';
import BarChart from '~/components/dashboard/BarChart.vue';
import LineChart from '~/components/dashboard/LineChart.vue';
import ReportTable from '~/components/dashboard/ReportTable.vue';
import Money from '~/components/dashboard/Money.vue';
import type { Database } from '~/types/database.types';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] });

const { t, locale } = useI18n();
const client = useSupabaseClient<Database>();

useHead(() => ({ title: `${t('dashboard.title')} · ${t('brand')}` }));

type MonthRow = Database['public']['Functions']['admin_monthly_report']['Returns'][number];
type Overview = Database['public']['Functions']['admin_overview']['Returns'][number];

const { data, pending } = useAsyncData('admin-dashboard', async () => {
  const [monthly, overview] = await Promise.all([
    client.rpc('admin_monthly_report', { months: 12 }),
    client.rpc('admin_overview'),
  ]);
  return {
    months: (monthly.data ?? []) as MonthRow[],
    overview: (overview.data?.[0] ?? null) as Overview | null,
  };
});

const months = computed(() => data.value?.months ?? []);
const overview = computed(() => data.value?.overview);
const isRtl = computed(() => locale.value === 'ar');
const bcp47 = computed(() => (locale.value === 'ar' ? 'ar' : 'en'));

function fmtNum(n: number | string | null | undefined) {
  return new Intl.NumberFormat(bcp47.value).format(Number(n ?? 0));
}
function fmtPct(n: number | string | null | undefined) {
  return `${new Intl.NumberFormat(bcp47.value, { maximumFractionDigits: 1 }).format(Number(n ?? 0))}%`;
}
function monthLabel(iso: string) {
  return new Intl.DateTimeFormat(bcp47.value, { month: 'short', year: '2-digit' })
    .format(new Date(iso));
}

const hasData = computed(() => months.value.length > 0);

const buyersChart = computed(() =>
  months.value.map((m) => ({ label: monthLabel(m.month), values: [Number(m.buyers)] }))
);
const buyersSeries = computed(() => [{ name: t('dashboard.buyers'), color: 'var(--brand)' }]);

const revenueChart = computed(() =>
  months.value.map((m) => ({
    label: monthLabel(m.month),
    values: [Number(m.revenue), Number(m.profit)],
  }))
);
const revenueSeries = computed(() => [
  { name: t('dashboard.revenue'), color: 'var(--rose-500)' },
  { name: t('dashboard.profit'), color: 'var(--gold-500)' },
]);

const profitLine = computed(() =>
  months.value.map((m) => ({ label: monthLabel(m.month), value: Number(m.profit_pct) }))
);

const tableColumns = computed(() => [
  { key: 'month', label: t('dashboard.table.month'), format: (v: unknown) => monthLabel(String(v)) },
  { key: 'buyers', label: t('dashboard.table.buyers'), align: 'end' as const, format: (v: unknown) => fmtNum(v as number) },
  { key: 'package_units', label: t('dashboard.table.units'), align: 'end' as const, format: (v: unknown) => fmtNum(v as number) },
  { key: 'revenue', label: t('dashboard.table.revenue'), align: 'end' as const, currency: true },
  { key: 'cost', label: t('dashboard.table.cost'), align: 'end' as const, currency: true },
  { key: 'profit', label: t('dashboard.table.profit'), align: 'end' as const, currency: true },
  { key: 'profit_pct', label: t('dashboard.table.profitPct'), align: 'end' as const, format: (v: unknown) => fmtPct(v as number) },
]);
</script>

<template>
  <div class="dashpage">
    <div v-if="pending" class="dashpage__loading">{{ t('common.loading') }}</div>

    <template v-else>
      <!-- KPI stat cards -->
      <div class="dashpage__kpis">
        <StatCard
          icon="users"
          tone="brand"
          :label="t('dashboard.kpi.buyers')"
          :value="fmtNum(overview?.total_buyers)"
          :sub="t('dashboard.kpi.buyersSub')"
        />
        <StatCard
          icon="wallet"
          tone="gold"
          :label="t('dashboard.kpi.revenue')"
          :sub="t('dashboard.kpi.revenueSub')"
        >
          <template #value><Money :amount="overview?.revenue" :size="20" /></template>
        </StatCard>
        <StatCard
          icon="trending-up"
          tone="success"
          :label="t('dashboard.kpi.profitPct')"
          :value="fmtPct(overview?.profit_pct)"
        >
          <template #sub><Money :amount="overview?.profit" :size="13" /></template>
        </StatCard>
        <StatCard
          icon="package"
          tone="navy"
          :label="t('dashboard.kpi.orders')"
          :value="fmtNum(overview?.total_orders)"
          :sub="t('dashboard.kpi.ordersSub', { units: fmtNum(overview?.total_units) })"
        />
      </div>

      <div v-if="!hasData" class="dashpage__empty">
        <Card variant="cream" padding="lg">{{ t('dashboard.empty') }}</Card>
      </div>

      <template v-else>
        <!-- Charts -->
        <div class="dashpage__charts">
          <Card variant="elevated" padding="lg">
            <h2 class="dashpage__cardtitle">{{ t('dashboard.charts.buyers') }}</h2>
            <BarChart :data="buyersChart" :series="buyersSeries" :format="fmtNum" />
          </Card>
          <Card variant="elevated" padding="lg">
            <h2 class="dashpage__cardtitle">{{ t('dashboard.charts.revenueProfit') }}</h2>
            <BarChart :data="revenueChart" :series="revenueSeries" :format="fmtNum" />
          </Card>
        </div>

        <Card variant="elevated" padding="lg" class="dashpage__wide">
          <h2 class="dashpage__cardtitle">{{ t('dashboard.charts.profitTrend') }}</h2>
          <LineChart :data="profitLine" :rtl="isRtl" :format="fmtPct" color="var(--gold-600)" />
        </Card>

        <!-- Monthly report table -->
        <Card variant="elevated" padding="lg" class="dashpage__wide">
          <h2 class="dashpage__cardtitle">{{ t('dashboard.reportTitle') }}</h2>
          <ReportTable :columns="tableColumns" :rows="months" :empty-text="t('dashboard.empty')" />
        </Card>
      </template>
    </template>
  </div>
</template>

<style scoped>
.dashpage { display: flex; flex-direction: column; gap: 24px; }
.dashpage__loading { padding: 60px; text-align: center; color: var(--text-muted); }
.dashpage__kpis { display: grid; grid-template-columns: 1fr; gap: 18px; }
@media (min-width: 620px) { .dashpage__kpis { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1100px) { .dashpage__kpis { grid-template-columns: repeat(4, 1fr); } }
.dashpage__charts { display: grid; grid-template-columns: 1fr; gap: 24px; }
@media (min-width: 980px) { .dashpage__charts { grid-template-columns: 1fr 1fr; } }
.dashpage__cardtitle {
  font-family: var(--font-display); font-weight: 800; font-size: var(--text-lg);
  color: var(--text-strong); margin: 0 0 20px;
}
.dashpage__empty { margin-top: 8px; }
</style>
