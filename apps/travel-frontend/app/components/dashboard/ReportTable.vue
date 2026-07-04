<script setup lang="ts" generic="T extends Record<string, unknown>">
import Money from '~/components/dashboard/Money.vue';

/**
 * ReportTable — a simple, responsive data table for the dashboard. Columns are
 * described declaratively so the same component renders any report; the whole
 * table scrolls horizontally on narrow screens. Columns flagged `currency`
 * render the amount with the Saudi Riyal glyph.
 */
defineProps<{
  columns: {
    key: keyof T & string;
    label: string;
    align?: 'start' | 'end' | 'center';
    currency?: boolean;
    format?: (value: T[keyof T], row: T) => string;
  }[];
  rows: T[];
  emptyText?: string;
}>();
</script>

<template>
  <div class="rtable">
    <table>
      <thead>
        <tr>
          <th
            v-for="c in columns"
            :key="c.key"
            :style="{ textAlign: c.align ?? 'start' }"
          >{{ c.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, ri) in rows" :key="ri">
          <td
            v-for="c in columns"
            :key="c.key"
            :style="{ textAlign: c.align ?? 'start' }"
          >
            <Money v-if="c.currency" :amount="row[c.key] as number" />
            <template v-else>{{ c.format ? c.format(row[c.key], row) : String(row[c.key]) }}</template>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td :colspan="columns.length" class="rtable__empty">{{ emptyText ?? '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.rtable { width: 100%; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 560px; }
thead th {
  font-family: var(--font-body); font-weight: 700; font-size: 13px;
  color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.02em;
  padding: 12px 14px; border-bottom: 1px solid var(--border-soft); white-space: nowrap;
}
tbody td {
  padding: 14px; font-size: 14px; color: var(--text-body);
  border-bottom: 1px solid var(--border-hair); white-space: nowrap;
}
tbody tr:hover { background: var(--rose-50); }
.rtable__empty { text-align: center; color: var(--text-subtle); padding: 28px; }
</style>
