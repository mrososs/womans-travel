<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Button, Icon } from '@org/shared-ui';

/**
 * CheckoutPayment — real Moyasar checkout for the Durrah women's travel
 * frontend. Renders the order summary from the shopper's cart (with a demo
 * fallback), then on "proceed" creates a server-side pending order and mounts
 * Moyasar's hosted payment form (mada / Visa / Mastercard). Card data goes
 * directly to Moyasar (PCI-safe); the order is only confirmed server-side by
 * /api/payments/callback (+ webhook) once Moyasar reports the charge as paid.
 */

type MoyasarGlobal = { init: (opts: Record<string, unknown>) => void };
declare global {
  interface Window {
    Moyasar?: MoyasarGlobal;
  }
}

const MOYASAR_VERSION = '1.15.0';
const VAT_RATE = 0.15;

// Demo fallback — mirrors DEMO_ITEM in server/api/payments/create.post.ts so the
// displayed summary matches what the server actually charges when the cart is empty.
const DEMO_ITEM = {
  item_type: 'trip' as const,
  item_id: 'demo-wadi-ramsa',
  title: 'رحلة وادي الرمسا الحصرية',
  unit_price: 4800,
  quantity: 1,
};

const { items, hydrate } = useCart();
const { isLoggedIn } = useAuth();
const localePath = useLocalePath();
const config = useRuntimeConfig();
const publishableKey = config.public.moyasarPublishableKey as string;

const nf = new Intl.NumberFormat('en-US');

const lines = computed(() => (items.value.length ? items.value : [DEMO_ITEM]));
const usingDemo = computed(() => items.value.length === 0);
const subtotal = computed(() =>
  lines.value.reduce((s, i) => s + i.unit_price * i.quantity, 0)
);
const vat = computed(() => Math.round(subtotal.value * VAT_RATE));
const total = computed(() => subtotal.value + vat.value);

type Phase = 'idle' | 'loading' | 'form' | 'error';
const phase = ref<Phase>('idle');
const errorMsg = ref('');

/** Inject Moyasar's CSS + JS once and resolve when the global is ready. */
function loadMoyasar(): Promise<MoyasarGlobal> {
  return new Promise((resolve, reject) => {
    if (window.Moyasar) return resolve(window.Moyasar);

    if (!document.getElementById('moyasar-css')) {
      const link = document.createElement('link');
      link.id = 'moyasar-css';
      link.rel = 'stylesheet';
      link.href = `https://cdn.moyasar.com/mpf/${MOYASAR_VERSION}/moyasar.css`;
      document.head.appendChild(link);
    }

    const existing = document.getElementById('moyasar-js') as HTMLScriptElement | null;
    const onLoad = () => (window.Moyasar ? resolve(window.Moyasar) : reject(new Error('Moyasar unavailable')));
    if (existing) {
      existing.addEventListener('load', onLoad);
      existing.addEventListener('error', () => reject(new Error('Failed to load Moyasar.js')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'moyasar-js';
    script.src = `https://cdn.moyasar.com/mpf/${MOYASAR_VERSION}/moyasar.js`;
    script.onload = onLoad;
    script.onerror = () => reject(new Error('Failed to load Moyasar.js'));
    document.head.appendChild(script);
  });
}

async function begin() {
  if (phase.value === 'loading' || phase.value === 'form') return;

  if (!isLoggedIn.value) {
    navigateTo(localePath('/auth/login'));
    return;
  }
  if (!publishableKey) {
    phase.value = 'error';
    errorMsg.value = 'مفتاح الدفع غير مُهيّأ. الرجاء ضبط MOYASAR_PUBLISHABLE_KEY.';
    return;
  }

  phase.value = 'loading';
  errorMsg.value = '';

  try {
    // 1) Create the pending order server-side (amount recomputed there).
    const order = await $fetch<{
      orderId: string;
      amount: number;
      currency: string;
      description: string;
    }>('/api/payments/create', { method: 'POST' });

    // 2) Load + mount Moyasar's hosted form.
    const Moyasar = await loadMoyasar();
    phase.value = 'form';
    await nextTick();

    Moyasar.init({
      element: '.mysr-form',
      amount: order.amount, // halalas, authoritative from the server
      currency: order.currency,
      description: order.description,
      publishable_api_key: publishableKey,
      callback_url: `${window.location.origin}/api/payments/callback`,
      methods: ['creditcard'],
      metadata: { order_id: order.orderId },
    });
  } catch (err: unknown) {
    phase.value = 'error';
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 401) {
      navigateTo(localePath('/auth/login'));
      return;
    }
    errorMsg.value =
      (err as { statusMessage?: string; message?: string })?.statusMessage ||
      (err as Error)?.message ||
      'تعذّر بدء عملية الدفع، حاولي مرة أخرى.';
  }
}

onMounted(() => {
  // Preload the cart so the summary reflects the real items.
  hydrate();
});
</script>

<template>
  <section class="co" dir="rtl">
    <header class="co__head">
      <span class="co__eyebrow">الدفع الآمن</span>
      <h1 class="co__title">إتمام الحجز</h1>
      <p class="co__lead">
        <Icon name="shield-check" :size="16" />
        جميع المدفوعات مشفّرة ومحمية · تُدار عبر بوابة الدفع السعودية Moyasar
      </p>
    </header>

    <div class="co__grid">
      <!-- ============ PAYMENT ============ -->
      <div class="co__pay">
        <div class="co-card">
          <h2 class="co-card__title">طريقة الدفع</h2>

          <!-- Idle: intro + proceed -->
          <div v-if="phase === 'idle'" class="co-intro">
            <ul class="co-brands" aria-hidden="true">
              <li><Icon name="credit-card" :size="20" /> مدى</li>
              <li><Icon name="credit-card" :size="20" /> Visa</li>
              <li><Icon name="credit-card" :size="20" /> Mastercard</li>
            </ul>
            <p class="co-intro__note">
              سيتم تحويلكِ إلى نموذج دفع آمن معتمد من Moyasar. لا يتم تخزين بيانات
              بطاقتكِ على خوادمنا إطلاقًا.
            </p>
            <Button variant="primary" size="lg" block @click="begin">
              <template #iconStart><Icon name="lock" :size="18" /></template>
              متابعة الدفع الآمن
            </Button>
          </div>

          <!-- Loading -->
          <div v-else-if="phase === 'loading'" class="co-loading">
            <Icon name="loader" :size="26" class="co-spin" />
            <p>جارٍ تجهيز بوابة الدفع…</p>
          </div>

          <!-- Error -->
          <div v-else-if="phase === 'error'" class="co-error">
            <Icon name="alert-triangle" :size="26" />
            <p>{{ errorMsg }}</p>
            <Button variant="outline" size="md" @click="begin">إعادة المحاولة</Button>
          </div>

          <!-- Moyasar hosted form mounts here -->
          <div v-show="phase === 'form'" class="co-mysr">
            <div class="mysr-form"></div>
            <p class="co-mysr__hint">
              <Icon name="shield-check" :size="14" />
              بيئة اختبار — استخدمي بطاقة Visa التجريبية 4111&nbsp;1111&nbsp;1111&nbsp;1111
            </p>
          </div>
        </div>
      </div>

      <!-- ============ ORDER SUMMARY ============ -->
      <aside class="co__summary">
        <div class="co-card co-card--summary">
          <h2 class="co-card__title">ملخّص الطلب</h2>

          <div v-if="usingDemo" class="co-demo-note">
            <Icon name="info" :size="14" /> عربة الشراء فارغة — نعرض رحلة تجريبية للتجربة.
          </div>

          <div class="co-lines">
            <div v-for="l in lines" :key="`${l.item_type}:${l.item_id}`" class="co-item">
              <span class="co-item__title">{{ l.title }}</span>
              <span class="co-item__qty">×{{ l.quantity }}</span>
              <span class="co-item__price co-price">
                {{ nf.format(l.unit_price * l.quantity) }}<Icon name="saudi-riyal" :size="13" />
              </span>
            </div>
          </div>

          <div class="co-lines co-lines--totals">
            <div class="co-line">
              <span class="co-line__k">المجموع الفرعي</span>
              <span class="co-line__v co-price">{{ nf.format(subtotal) }}<Icon name="saudi-riyal" :size="13" /></span>
            </div>
            <div class="co-line">
              <span class="co-line__k">ضريبة القيمة المضافة (15%)</span>
              <span class="co-line__v co-price">{{ nf.format(vat) }}<Icon name="saudi-riyal" :size="13" /></span>
            </div>
          </div>

          <div class="co-total">
            <span class="co-total__k">الإجمالي</span>
            <span class="co-total__v co-price">{{ nf.format(total) }}<Icon name="saudi-riyal" :size="20" /></span>
          </div>

          <p class="co-reassure">
            <Icon name="shield-check" :size="14" />
            يمكنكِ إلغاء الحجز مجّانًا حتى 48 ساعة قبل موعد الرحلة
          </p>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.co {
  font-family: var(--font-body);
  color: var(--text-body);
  background: var(--surface-page);
  padding: clamp(24px, 5vw, 56px) var(--gutter);
  max-width: var(--container-xl);
  margin-inline: auto;
  position: relative;
}

.co__head { text-align: center; margin-bottom: clamp(28px, 4vw, 44px); }
.co__eyebrow {
  font-family: var(--font-display);
  font-weight: var(--weight-extrabold);
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-wide);
  color: var(--text-gold);
}
.co__title {
  font-family: var(--font-display);
  font-weight: var(--weight-extrabold);
  font-size: clamp(28px, 4.5vw, 44px);
  color: var(--text-strong);
  margin: 8px 0 12px;
}
.co__lead { display: inline-flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: var(--text-sm); }
.co__lead :deep(svg) { color: var(--success-500); }

.co__grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: clamp(20px, 3vw, 36px);
  align-items: start;
}

.co-card {
  background: var(--surface-card);
  border: 1.5px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: clamp(20px, 3vw, 32px);
}
.co-card--summary { position: sticky; top: var(--space-6); }
.co-card__title {
  font-family: var(--font-display);
  font-weight: var(--weight-bold);
  font-size: var(--text-xl);
  color: var(--text-strong);
  margin: 0 0 var(--space-5);
}

/* intro */
.co-brands { display: flex; gap: var(--space-3); list-style: none; padding: 0; margin: 0 0 var(--space-4); flex-wrap: wrap; }
.co-brands li {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border: 1.5px solid var(--border-default); border-radius: var(--radius-md);
  font-family: var(--font-display); font-weight: var(--weight-bold); font-size: var(--text-sm); color: var(--text-strong);
}
.co-brands :deep(svg) { color: var(--brand-strong); }
.co-intro__note { color: var(--text-muted); font-size: var(--text-sm); line-height: var(--leading-relaxed); margin: 0 0 var(--space-5); }

/* loading / error */
.co-loading, .co-error {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
  padding: var(--space-8) var(--space-4); text-align: center; color: var(--text-muted);
}
.co-error :deep(svg) { color: var(--danger-500); }
.co-spin { animation: co-spin 0.9s linear infinite; color: var(--brand-strong); }
@keyframes co-spin { to { transform: rotate(360deg); } }

/* moyasar form container */
.co-mysr { min-height: 220px; }
.co-mysr__hint {
  display: flex; align-items: center; gap: 6px; justify-content: center;
  margin: var(--space-4) 0 0; font-size: var(--text-xs); color: var(--text-muted);
}
.co-mysr__hint :deep(svg) { color: var(--success-500); flex: none; }

/* summary */
.co-demo-note {
  display: flex; align-items: center; gap: 6px;
  font-size: var(--text-xs); color: var(--text-muted);
  background: var(--surface-cream); border-radius: var(--radius-sm);
  padding: 8px 10px; margin-bottom: var(--space-4);
}
.co-lines { display: grid; gap: var(--space-3); margin-bottom: var(--space-4); }
.co-lines--totals { padding-top: var(--space-4); border-top: 1.5px solid var(--border-hair); }
.co-item { display: grid; grid-template-columns: 1fr auto auto; gap: var(--space-2); align-items: center; font-size: var(--text-sm); }
.co-item__title { font-weight: var(--weight-semibold); color: var(--text-strong); min-width: 0; }
.co-item__qty { color: var(--text-muted); font-size: var(--text-xs); }
.co-line { display: flex; align-items: center; justify-content: space-between; font-size: var(--text-sm); }
.co-line__k { color: var(--text-muted); }
.co-line__v { font-weight: var(--weight-semibold); color: var(--text-body); }
.co-price { display: inline-flex; align-items: center; gap: 3px; font-family: var(--font-num); }
.co-price :deep(svg) { width: 0.85em; height: 0.85em; }

.co-total {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-4) 0 var(--space-5); margin-top: var(--space-2);
  border-top: 1.5px solid var(--border-default);
}
.co-total__k { font-family: var(--font-display); font-weight: var(--weight-bold); font-size: var(--text-lg); color: var(--text-strong); }
.co-total__v { font-family: var(--font-display); font-weight: var(--weight-extrabold); font-size: var(--text-2xl); color: var(--brand-strong); }

.co-reassure {
  display: flex; align-items: center; gap: 6px; justify-content: center;
  margin: var(--space-4) 0 0; font-size: var(--text-xs); color: var(--text-muted);
}
.co-reassure :deep(svg) { color: var(--success-500); flex: none; }

@media (max-width: 860px) {
  .co__grid { grid-template-columns: 1fr; }
  .co-card--summary { position: static; }
  .co__summary { order: -1; }
}
</style>
