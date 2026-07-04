<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@org/shared-ui';

/**
 * Money — a currency amount rendered as a locale-grouped number followed by the
 * Saudi Riyal glyph (Lucide `saudi-riyal`), matching how prices appear across
 * the marketing site (PackageCard, CartDrawer).
 */
const props = withDefaults(
  defineProps<{ amount: number | string | null | undefined; size?: number }>(),
  { size: 14 }
);

const { locale } = useI18n();
const text = computed(() =>
  new Intl.NumberFormat(locale.value === 'ar' ? 'ar' : 'en').format(Number(props.amount ?? 0))
);
</script>

<template>
  <span class="money">{{ text }}<Icon name="saudi-riyal" :size="size" class="money__icon" /></span>
</template>

<style scoped>
.money { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
.money__icon { flex: none; }
</style>
