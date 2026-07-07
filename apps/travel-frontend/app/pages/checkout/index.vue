<script setup lang="ts">
import CheckoutPayment from '~/components/CheckoutPayment.vue';

const { t } = useI18n();
useHead(() => ({ title: `${t('cart.checkout')} · ${t('brand')}` }));
</script>

<template>
  <section class="section">
    <div class="container">
      <CheckoutPayment />
    </div>
  </section>
</template>
