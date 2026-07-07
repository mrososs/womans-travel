<script setup lang="ts">
import { computed } from 'vue';
import { Button, Icon } from '@org/shared-ui';

/**
 * /checkout/failed — shown when the payment callback could not confirm the
 * order (declined, cancelled, amount mismatch, or verification unavailable).
 */
const route = useRoute();
const localePath = useLocalePath();

useHead({ title: 'تعذّر إتمام الدفع · دُرّة' });

const reason = computed(() => String(route.query.reason ?? ''));
const reasonText = computed(() => {
  const map: Record<string, string> = {
    amount_mismatch: 'لم يتطابق المبلغ المدفوع مع قيمة الطلب.',
    verification_failed: 'تعذّر التحقق من عملية الدفع. لم يتم خصم أي مبلغ مؤكد.',
    missing_payment: 'لم نستلم معرّف عملية الدفع.',
    order_not_found: 'تعذّر العثور على الطلب.',
    failed: 'رُفضت عملية الدفع من قبل البنك.',
    unpaid: 'لم تكتمل عملية الدفع.',
  };
  return map[reason.value] || 'لم تكتمل عملية الدفع. لم يتم خصم أي مبلغ.';
});
</script>

<template>
  <section class="section">
    <div class="container co-result" dir="rtl">
      <div class="co-result__ring">
        <Icon name="x" :size="44" />
      </div>
      <h1 class="co-result__title">تعذّر إتمام الدفع</h1>
      <p class="co-result__desc">{{ reasonText }}</p>
      <div class="co-result__actions">
        <Button variant="primary" size="lg" @click="navigateTo(localePath('/checkout'))">
          المحاولة مرة أخرى
        </Button>
        <Button variant="outline" size="lg" @click="navigateTo(localePath('/cart'))">
          العودة للسلة
        </Button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.co-result { max-width: 520px; margin-inline: auto; text-align: center; display: grid; justify-items: center; gap: var(--space-4); padding: clamp(32px, 6vw, 64px) var(--gutter); }
.co-result__ring {
  width: 96px; height: 96px; border-radius: var(--radius-circle);
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--danger-100); color: var(--danger-500); border: 2px solid var(--danger-500);
}
.co-result__title { font-family: var(--font-display); font-weight: var(--weight-extrabold); font-size: var(--text-3xl); color: var(--text-strong); margin: 0; }
.co-result__desc { color: var(--text-muted); line-height: var(--leading-relaxed); margin: 0; max-width: 40ch; }
.co-result__actions { display: flex; gap: var(--space-3); flex-wrap: wrap; justify-content: center; margin-top: var(--space-3); }
</style>
