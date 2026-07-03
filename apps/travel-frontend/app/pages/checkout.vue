<script setup lang="ts">
import CheckoutMockup from '~/components/CheckoutMockup.vue';

const { t } = useI18n();
useHead(() => ({ title: `${t('cart.checkout')} · ${t('brand')}` }));
</script>

<template>
  <section class="section">
    <div class="container">
      <CheckoutMockup />
    </div>
  </section>
</template>
