<script setup lang="ts">
import { Icon } from '@org/shared-ui';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
useHead(() => ({ title: `${t('account.orders')} · ${t('brand')}` }));
</script>

<template>
  <section class="section">
    <div class="container">
      <h1 class="h-sec">{{ t('account.orders') }}</h1>
      <div class="account-empty">
        <Icon name="package" :size="40" />
        <p>{{ t('account.soon') }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.account-empty { display: grid; justify-items: center; gap: 12px; padding: 64px 0; color: var(--text-muted); }
.account-empty :deep(svg) { color: var(--rose-300); }
</style>
