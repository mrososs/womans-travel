<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Button, Icon } from '@org/shared-ui';
import type { Database } from '~/types/database.types';

/**
 * /checkout/success — shown after the payment callback confirmed the order as
 * paid. We reload the order (owner-scoped) to display the amount, and refresh
 * the cart (already cleared server-side) so the badge updates.
 */
const route = useRoute();
const localePath = useLocalePath();
const client = useSupabaseClient<Database>();
const { hydrate } = useCart();

const orderId = String(route.query.order ?? '');
const total = ref<number | null>(null);
const nf = new Intl.NumberFormat('en-US');
const analytics = useAnalytics();

useHead({ title: 'تم الدفع بنجاح · دُرّة' });

onMounted(async () => {
  await hydrate();
  if (!orderId) return;

  const { data } = await client
    .from('orders')
    .select('total, subtotal, status, discount_amount, coupon_code, order_items(item_type, item_id, title, quantity, unit_price)')
    .eq('id', orderId)
    .maybeSingle();
  if (!data) return;

  total.value = Number(data.total);

  // GA4 de-duplicates on transaction_id, so a refresh of this page (or a
  // second visit from the order history) can't double-count the revenue.
  analytics.purchase({
    transactionId: orderId,
    value: Number(data.total),
    tax: Math.round((Number(data.total) - Number(data.subtotal) + Number(data.discount_amount ?? 0)) * 100) / 100,
    discount: Number(data.discount_amount ?? 0),
    coupon: data.coupon_code,
    lines: data.order_items ?? [],
  });
});
</script>

<template>
  <section class="section">
    <div class="container co-result" dir="rtl">
      <div class="co-result__ring">
        <Icon name="check" :size="44" />
      </div>
      <h1 class="co-result__title">تم الدفع بنجاح</h1>
      <p class="co-result__desc">
        تم تأكيد حجزكِ. أرسلنا تفاصيل الرحلة وإيصال الدفع إلى بريدكِ الإلكتروني.
      </p>
      <div v-if="total !== null" class="co-result__amount">
        <span>المبلغ المدفوع</span>
        <strong class="co-price">{{ nf.format(total) }}<Icon name="saudi-riyal" :size="18" /></strong>
      </div>
      <div class="co-result__actions">
        <Button variant="primary" size="lg" @click="navigateTo(localePath('/account/orders'))">
          طلباتي
        </Button>
        <Button variant="outline" size="lg" @click="navigateTo(localePath('/packages'))">
          متابعة التصفح
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
  background: var(--success-100); color: var(--success-500); border: 2px solid var(--success-500);
}
.co-result__title { font-family: var(--font-display); font-weight: var(--weight-extrabold); font-size: var(--text-3xl); color: var(--text-strong); margin: 0; }
.co-result__desc { color: var(--text-muted); line-height: var(--leading-relaxed); margin: 0; max-width: 40ch; }
.co-result__amount {
  display: grid; gap: 4px; width: 100%; padding: var(--space-4) 0;
  border-top: 1.5px solid var(--border-hair); border-bottom: 1.5px solid var(--border-hair);
}
.co-result__amount span { font-size: var(--text-xs); color: var(--text-muted); font-weight: var(--weight-semibold); }
.co-result__amount strong { font-family: var(--font-display); font-weight: var(--weight-extrabold); font-size: var(--text-3xl); color: var(--brand-strong); justify-self: center; }
.co-price { display: inline-flex; align-items: center; gap: 4px; }
.co-price :deep(svg) { width: 0.7em; height: 0.7em; }
.co-result__actions { display: flex; gap: var(--space-3); flex-wrap: wrap; justify-content: center; margin-top: var(--space-3); }
</style>
