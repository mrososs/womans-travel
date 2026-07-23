<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Button, Icon } from '@org/shared-ui';
import CheckoutTravelerForm from '~/components/CheckoutTravelerForm.vue';
import type { TravelerDetails } from '~/components/CheckoutTravelerForm.vue';
import type { Database } from '~/types/database.types';

/**
 * CheckoutPayment — two-step checkout for the Durrah women's travel frontend.
 *
 * Step 1 (traveler): collects the traveler's four-part name, passport number +
 * dates, and the accuracy / group-compliance declarations (CheckoutTravelerForm).
 * Step 2 (payment): creates a server-side pending order (with the traveler
 * manifest) and mounts Moyasar's hosted card form (mada / Visa / Mastercard).
 *
 * Card data goes directly to Moyasar (PCI-safe); the order is only confirmed
 * server-side by /api/payments/callback (+ webhook) once Moyasar reports the
 * charge as paid. The order summary is shown alongside both steps.
 */

type MoyasarGlobal = { init: (opts: Record<string, unknown>) => void };
declare global {
  interface Window {
    Moyasar?: MoyasarGlobal;
  }
}

const MOYASAR_VERSION = '1.15.0';
// VAT rate (fraction). Default mirrors the seeded tax_settings row; the live
// admin-editable value is loaded from tax_settings on mount.
const vatRate = ref(0.15);
// Whole-number-friendly percentage for the summary label (15.00 → "15").
const vatPercentLabel = computed(() => `${+(vatRate.value * 100).toFixed(2)}`);

// Demo fallback — mirrors DEMO_ITEM in server/api/payments/create.post.ts so the
// displayed summary matches what the server actually charges when the cart is empty.
const DEMO_ITEM = {
  item_type: 'trip' as const,
  item_id: 'demo-wadi-ramsa',
  title: 'رحلة وادي الرمسا الحصرية',
  unit_price: 4800,
  quantity: 1,
};

const { items, hydrate, clear } = useCart();
const { isLoggedIn } = useAuth();
const localePath = useLocalePath();
const { locale } = useI18n();
const config = useRuntimeConfig();
const publishableKey = config.public.moyasarPublishableKey as string;

// Tabby (Pay in 4) availability + config — loaded from payment_settings on mount.
const tabbyEnabled = ref(false);
const tabbyTestMode = ref(true);
type TabbyPhase = 'idle' | 'redirecting' | 'error';
const tabbyPhase = ref<TabbyPhase>('idle');
const tabbyError = ref('');

// Only surface the test-card hint when a Moyasar *test* key is in use, so the
// live deployment never shows "use test Visa 4111…".
const isTestMode = computed(() => publishableKey.startsWith('pk_test'));

const nf = new Intl.NumberFormat('en-US');

const lines = computed(() => (items.value.length ? items.value : [DEMO_ITEM]));
const usingDemo = computed(() => items.value.length === 0);
const subtotal = computed(() =>
  lines.value.reduce((s, i) => s + i.unit_price * i.quantity, 0)
);
const vat = computed(() => Math.round(subtotal.value * vatRate.value));
const total = computed(() => subtotal.value + vat.value);

// Tabby splits the total into 4 equal, interest-free payments.
const tabbyInstallment = computed(() => Math.round((total.value / 4) * 100) / 100);
const tabbySchedule = computed(() => [
  { label: 'اليوم', amount: tabbyInstallment.value },
  { label: 'بعد شهر', amount: tabbyInstallment.value },
  { label: 'بعد شهرين', amount: tabbyInstallment.value },
  { label: 'بعد ٣ أشهر', amount: tabbyInstallment.value },
]);

// Stepper: 1 = traveler details, 2 = payment.
const step = ref<1 | 2>(1);
const traveler = ref<TravelerDetails | null>(null);

// Payment method chosen in step 2.
type PaymentMethod = 'moyasar' | 'tabby' | 'bank_transfer';
const method = ref<PaymentMethod>('moyasar');

// Business bank-account details for the manual-transfer option. Defaults mirror
// the seeded row; the live (admin-editable) values are loaded from bank_settings.
const bank = ref({
  bankName: 'مصرف الإنماء',
  accountName: 'مؤسسة رحلات المستقبل الذهبي',
  accountNumber: '68207575565000',
  iban: 'SA3705000068207575565000',
});

const transferReference = ref('');
const submitting = ref(false);
const bankError = ref('');
const copied = ref('');

type Phase = 'loading' | 'form' | 'error';
const phase = ref<Phase>('loading');
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

/** Step 1 → 2: store the validated traveler details and start the payment. */
function onTravelerNext(details: TravelerDetails) {
  if (!isLoggedIn.value) {
    navigateTo(localePath('/auth/login'));
    return;
  }
  traveler.value = details;
  step.value = 2;
  // Only the electronic gateway needs preparing; the bank card is static.
  if (method.value === 'moyasar') begin();
}

/** Switch payment method in step 2 (mounts Moyasar lazily on first select). */
function selectMethod(m: PaymentMethod) {
  if (method.value === m) return;
  method.value = m;
  bankError.value = '';
  tabbyError.value = '';
  tabbyPhase.value = 'idle';
  if (m === 'moyasar' && step.value === 2) begin();
}

/**
 * Tabby (Pay in 4): create a pending order + Tabby Checkout Session server-side,
 * then redirect the shopper to Tabby's hosted checkout. On return, our callback
 * verifies + captures the payment. If Tabby declines the buyer at scoring time
 * we surface a friendly message and keep the other methods available.
 */
async function startTabby() {
  if (!isLoggedIn.value) {
    navigateTo(localePath('/auth/login'));
    return;
  }
  if (!traveler.value) {
    step.value = 1;
    return;
  }
  tabbyPhase.value = 'redirecting';
  tabbyError.value = '';
  try {
    const res = await $fetch<{ webUrl?: string; rejected?: boolean; reason?: string }>(
      '/api/payments/tabby/create',
      { method: 'POST', body: { traveler: traveler.value, lang: locale.value } }
    );
    if (res.rejected || !res.webUrl) {
      tabbyPhase.value = 'error';
      tabbyError.value =
        'عذرًا، لم تتم الموافقة على التقسيط عبر تابي لهذا الطلب. يمكنكِ المتابعة بالبطاقة أو التحويل البنكي.';
      return;
    }
    // Full-page redirect to Tabby's hosted checkout (HPP).
    window.location.href = res.webUrl;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 401) {
      navigateTo(localePath('/auth/login'));
      return;
    }
    tabbyPhase.value = 'error';
    tabbyError.value =
      (err as { statusMessage?: string; message?: string })?.statusMessage ||
      (err as Error)?.message ||
      'تعذّر بدء الدفع عبر تابي، حاولي مرة أخرى.';
  }
}

/** Copy a bank detail to the clipboard with a brief "copied" confirmation. */
async function copyValue(value: string, key: string) {
  try {
    await navigator.clipboard.writeText(value.replace(/\s+/g, ''));
    copied.value = key;
    setTimeout(() => (copied.value = copied.value === key ? '' : copied.value), 1500);
  } catch {
    /* clipboard unavailable — no-op */
  }
}

/**
 * Bank-transfer submit ("تم إرسال المبلغ"): create a pending bank-transfer
 * order server-side, clear the cart, and send the shopper to My Bookings where
 * the transfer shows as "under review" until an admin approves it.
 */
async function submitBankTransfer() {
  if (!isLoggedIn.value) {
    navigateTo(localePath('/auth/login'));
    return;
  }
  if (!traveler.value) {
    step.value = 1;
    return;
  }
  const ref_ = transferReference.value.trim();
  if (ref_.length < 4) {
    bankError.value = 'الرجاء إدخال رقم عملية التحويل البنكي.';
    return;
  }

  submitting.value = true;
  bankError.value = '';
  try {
    await $fetch<{ orderId: string }>('/api/orders/bank-transfer', {
      method: 'POST',
      body: { traveler: traveler.value, transferReference: ref_ },
    });
    await clear(); // server already cleared the DB cart; reset local state too
    navigateTo(localePath('/account/orders'));
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 401) {
      navigateTo(localePath('/auth/login'));
      return;
    }
    bankError.value =
      (err as { statusMessage?: string; message?: string })?.statusMessage ||
      (err as Error)?.message ||
      'تعذّر تسجيل الحجز، حاولي مرة أخرى.';
  } finally {
    submitting.value = false;
  }
}

/** Return to the traveler form to edit the details (step 2 → 1). */
function editTraveler() {
  step.value = 1;
  phase.value = 'loading';
  errorMsg.value = '';
}

async function begin() {
  if (phase.value === 'form') return;
  if (!traveler.value) {
    step.value = 1;
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
    // 1) Create the pending order server-side (amount recomputed there); the
    // traveler manifest is validated + snapshotted onto the order.
    const order = await $fetch<{
      orderId: string;
      amount: number;
      currency: string;
      description: string;
    }>('/api/payments/create', { method: 'POST', body: { traveler: traveler.value } });

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

onMounted(async () => {
  // Preload the cart so the summary reflects the real items.
  hydrate();

  // Load the live bank-account details + VAT rate (admin-editable via the dashboard).
  const supa = useSupabaseClient<Database>();
  const [{ data }, { data: tax }, { data: pay }] = await Promise.all([
    supa
      .from('bank_settings')
      .select('bank_name, account_name, account_number, iban')
      .eq('id', 1)
      .maybeSingle(),
    supa.from('tax_settings').select('vat_percent').eq('id', 1).maybeSingle(),
    supa
      .from('payment_settings')
      .select('tabby_enabled, tabby_test_mode')
      .eq('id', 1)
      .maybeSingle(),
  ]);
  if (pay) {
    tabbyEnabled.value = pay.tabby_enabled !== false;
    tabbyTestMode.value = pay.tabby_test_mode !== false;
  }
  if (data) {
    bank.value = {
      bankName: data.bank_name,
      accountName: data.account_name,
      accountNumber: data.account_number,
      iban: data.iban,
    };
  }
  if (tax && tax.vat_percent != null) {
    const pct = Number(tax.vat_percent);
    if (Number.isFinite(pct) && pct >= 0 && pct <= 100) vatRate.value = pct / 100;
  }
});
</script>

<template>
  <section class="co" dir="rtl">
    <header class="co__head">
      <span class="co__eyebrow">الدفع الآمن</span>
      <h1 class="co__title">إتمام الحجز</h1>
      <p class="co__lead">
        <Icon name="shield-check" :size="16" />
        جميع المدفوعات مشفّرة ومحمية عبر بوابات دفع سعودية معتمدة
      </p>
    </header>

    <!-- ============ STEPPER ============ -->
    <ol class="co-steps" aria-label="خطوات إتمام الحجز">
      <li class="co-step" :class="{ 'is-active': step === 1, 'is-done': step > 1 }">
        <span class="co-step__num">
          <Icon v-if="step > 1" name="check" :size="16" />
          <template v-else>1</template>
        </span>
        <span class="co-step__label">بيانات المسافرة</span>
      </li>
      <li class="co-step__sep" aria-hidden="true" />
      <li class="co-step" :class="{ 'is-active': step === 2 }">
        <span class="co-step__num">2</span>
        <span class="co-step__label">الدفع</span>
      </li>
    </ol>

    <div class="co__grid">
      <!-- ============ LEFT: STEP CONTENT ============ -->
      <div class="co__pay">
        <!-- STEP 1 — traveler details -->
        <div v-if="step === 1" class="co-card">
          <h2 class="co-card__title">بيانات المسافرة</h2>
          <p class="co-step__lead">
            أدخلي بياناتكِ كما وردت في جواز السفر، ثم أقرّي بصحة المعلومات قبل المتابعة إلى الدفع.
          </p>
          <CheckoutTravelerForm @next="onTravelerNext" />
        </div>

        <!-- STEP 2 — payment -->
        <div v-else class="co-card">
          <div class="co-card__head">
            <h2 class="co-card__title">طريقة الدفع</h2>
            <button type="button" class="co-back" @click="editTraveler">
              <Icon name="chevron-right" :size="15" /> تعديل البيانات
            </button>
          </div>

          <!-- Payment-method selector -->
          <div class="co-methods" role="radiogroup" aria-label="اختيار طريقة الدفع">
            <button
              type="button"
              class="co-method"
              :class="{ 'is-active': method === 'moyasar' }"
              role="radio"
              :aria-checked="method === 'moyasar'"
              @click="selectMethod('moyasar')"
            >
              <span class="co-method__radio"><span class="co-method__dot" /></span>
              <Icon name="credit-card" :size="20" />
              <span class="co-method__label">الدفع الإلكتروني (ميسّر)</span>
            </button>
            <button
              v-if="tabbyEnabled"
              type="button"
              class="co-method co-method--tabby"
              :class="{ 'is-active': method === 'tabby' }"
              role="radio"
              :aria-checked="method === 'tabby'"
              @click="selectMethod('tabby')"
            >
              <span class="co-method__radio"><span class="co-method__dot" /></span>
              <span class="co-tabby-logo" aria-hidden="true">tabby</span>
              <span class="co-method__label">قسّميها على 4 دفعات</span>
            </button>
            <button
              type="button"
              class="co-method"
              :class="{ 'is-active': method === 'bank_transfer' }"
              role="radio"
              :aria-checked="method === 'bank_transfer'"
              @click="selectMethod('bank_transfer')"
            >
              <span class="co-method__radio"><span class="co-method__dot" /></span>
              <Icon name="building-2" :size="20" />
              <span class="co-method__label">تحويل بنكي</span>
            </button>
          </div>

          <!-- ===== Electronic payment (Moyasar) ===== -->
          <template v-if="method === 'moyasar'">
            <!-- Loading -->
            <div v-if="phase === 'loading'" class="co-loading">
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
              <ul class="co-brands" aria-hidden="true">
                <li><Icon name="credit-card" :size="18" /> مدى</li>
                <li><Icon name="credit-card" :size="18" /> Visa</li>
                <li><Icon name="credit-card" :size="18" /> Mastercard</li>
              </ul>
              <div class="mysr-form" />
              <p v-if="isTestMode" class="co-mysr__hint">
                <Icon name="shield-check" :size="14" />
                بيئة اختبار — استخدمي بطاقة Visa التجريبية 4111&nbsp;1111&nbsp;1111&nbsp;1111
              </p>
              <p v-else class="co-mysr__hint">
                <Icon name="shield-check" :size="14" />
                دفع آمن ومشفّر عبر بوابة Moyasar — بياناتكِ محميّة بالكامل
              </p>
            </div>
          </template>

          <!-- ===== Tabby — Pay in 4 (installments) ===== -->
          <div v-else-if="method === 'tabby'" class="co-tabby">
            <div class="co-tabby__hero">
              <span class="co-tabby-logo co-tabby-logo--lg" aria-hidden="true">tabby</span>
              <p class="co-tabby__tag">قسّمي مبلغ طلبكِ على <strong>4 دفعات</strong> — بدون فوائد ولا رسوم</p>
            </div>

            <ol class="co-tabby__plan" aria-label="جدول الدفعات">
              <li v-for="(p, i) in tabbySchedule" :key="i" class="co-tabby__step">
                <span class="co-tabby__dot">{{ i + 1 }}</span>
                <span class="co-tabby__when">{{ p.label }}</span>
                <span class="co-tabby__amt co-price">
                  {{ nf.format(p.amount) }}<Icon name="saudi-riyal" :size="13" />
                </span>
              </li>
            </ol>

            <div v-if="tabbyPhase === 'error'" class="co-error co-error--inline">
              <Icon name="alert-triangle" :size="20" />
              <p>{{ tabbyError }}</p>
            </div>

            <Button
              variant="primary"
              size="lg"
              :disabled="tabbyPhase === 'redirecting'"
              @click="startTabby"
            >
              <template #iconStart><Icon name="arrow-left" :size="18" /></template>
              {{ tabbyPhase === 'redirecting' ? 'جارٍ التحويل إلى تابي…' : 'المتابعة إلى تابي' }}
            </Button>

            <p v-if="tabbyTestMode" class="co-tabby__hint">
              <Icon name="shield-check" :size="14" />
              بيئة اختبار — استخدمي رقم الجوال ‎+966500000001 والرمز 8888 لإتمام التجربة.
            </p>
            <p v-else class="co-tabby__hint">
              <Icon name="shield-check" :size="14" />
              يتم اتخاذ قرار الموافقة على التقسيط لحظيًا من تابي عند المتابعة.
            </p>
          </div>

          <!-- ===== Manual bank transfer ===== -->
          <div v-else class="co-bank">
            <p class="co-bank__lead">
              حوّلي المبلغ الإجمالي إلى الحساب البنكي التالي، ثم أدخلي رقم عملية التحويل واضغطي «تم إرسال المبلغ».
              سيتم تأكيد حجزكِ بعد مراجعة الإدارة للتحويل.
            </p>

            <div class="co-bank__amount">
              <span>المبلغ المطلوب تحويله</span>
              <strong class="co-price">{{ nf.format(total) }}<Icon name="saudi-riyal" :size="18" /></strong>
            </div>

            <dl class="co-bank__details">
              <div class="co-bank__row">
                <dt><Icon name="building-2" :size="15" /> اسم البنك</dt>
                <dd>{{ bank.bankName }}</dd>
              </div>
              <div class="co-bank__row">
                <dt><Icon name="user" :size="15" /> اسم صاحب الحساب</dt>
                <dd>{{ bank.accountName }}</dd>
              </div>
              <div class="co-bank__row">
                <dt><Icon name="hash" :size="15" /> رقم الحساب</dt>
                <dd class="co-bank__mono">
                  {{ bank.accountNumber }}
                  <button type="button" class="co-bank__copy" @click="copyValue(bank.accountNumber, 'acc')">
                    <Icon :name="copied === 'acc' ? 'check' : 'copy'" :size="14" />
                  </button>
                </dd>
              </div>
              <div class="co-bank__row">
                <dt><Icon name="credit-card" :size="15" /> الآيبان (IBAN)</dt>
                <dd class="co-bank__mono">
                  {{ bank.iban }}
                  <button type="button" class="co-bank__copy" @click="copyValue(bank.iban, 'iban')">
                    <Icon :name="copied === 'iban' ? 'check' : 'copy'" :size="14" />
                  </button>
                </dd>
              </div>
            </dl>

            <label class="co-bank__field">
              <span class="co-bank__field-label">رقم عملية التحويل البنكي</span>
              <input
                v-model="transferReference"
                type="text"
                inputmode="numeric"
                class="co-bank__input"
                placeholder="مثال: 1029384756"
                :disabled="submitting"
                @input="bankError = ''"
              />
            </label>

            <p v-if="bankError" class="co-bank__error">
              <Icon name="alert-triangle" :size="15" /> {{ bankError }}
            </p>

            <Button variant="primary" size="lg" :disabled="submitting" @click="submitBankTransfer">
              <template #iconStart><Icon name="check" :size="18" /></template>
              {{ submitting ? 'جارٍ الإرسال…' : 'تم إرسال المبلغ' }}
            </Button>

            <p class="co-bank__note">
              <Icon name="info" :size="14" />
              لن يتم تأكيد الحجز إلا بعد التحقق من وصول المبلغ. يمكنكِ متابعة حالة الطلب من صفحة «حجوزاتي».
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
              <span class="co-line__k">ضريبة القيمة المضافة ({{ vatPercentLabel }}%)</span>
              <span class="co-line__v co-price">{{ nf.format(vat) }}<Icon name="saudi-riyal" :size="13" /></span>
            </div>
          </div>

          <div class="co-total">
            <span class="co-total__k">الإجمالي</span>
            <span class="co-total__v co-price">{{ nf.format(total) }}<Icon name="saudi-riyal" :size="20" /></span>
          </div>

          <p class="co-reassure">
            <Icon name="shield-check" :size="14" />
            دفع آمن ومشفّر — يُرجى العلم أن المبلغ المدفوع غير قابل للاسترجاع
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

/* stepper */
.co-steps {
  display: flex; align-items: center; justify-content: center; gap: var(--space-3);
  list-style: none; margin: 0 auto clamp(24px, 4vw, 40px); padding: 0;
  max-width: 480px;
}
.co-step { display: inline-flex; align-items: center; gap: 10px; }
.co-step__num {
  width: 34px; height: 34px; flex: none; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-weight: var(--weight-bold); font-size: var(--text-sm);
  background: var(--surface-card); color: var(--text-muted);
  border: 1.5px solid var(--border-default);
  transition: background var(--dur-base), color var(--dur-base), border-color var(--dur-base);
}
.co-step__label { font-family: var(--font-display); font-weight: var(--weight-bold); font-size: var(--text-sm); color: var(--text-muted); }
.co-step.is-active .co-step__num { background: var(--brand-solid); border-color: var(--brand-solid); color: #fff; }
.co-step.is-active .co-step__label { color: var(--text-strong); }
.co-step.is-done .co-step__num { background: var(--success-500); border-color: var(--success-500); color: #fff; }
.co-step.is-done .co-step__label { color: var(--text-strong); }
.co-step__sep { flex: 1; max-width: 72px; height: 2px; background: var(--border-default); border-radius: 2px; }

.co-step__lead { color: var(--text-muted); font-size: var(--text-sm); line-height: var(--leading-relaxed); margin: 0 0 var(--space-5); }

.co-card__head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-5); }
.co-card__head .co-card__title { margin: 0; }
.co-back {
  display: inline-flex; align-items: center; gap: 3px;
  border: none; background: transparent; cursor: pointer;
  font-family: var(--font-body); font-weight: var(--weight-bold); font-size: var(--text-sm);
  color: var(--text-brand); padding: 6px 8px; border-radius: var(--radius-sm);
  transition: background var(--dur-fast);
}
.co-back:hover { background: var(--rose-50); }

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

/* payment-method selector */
.co-methods { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-5); }
.co-method {
  display: flex; align-items: center; gap: 10px; cursor: pointer; text-align: start;
  padding: 14px 16px; border: 1.5px solid var(--border-default); border-radius: var(--radius-md);
  background: var(--surface-card); color: var(--text-strong);
  font-family: var(--font-display); font-weight: var(--weight-bold); font-size: var(--text-sm);
  transition: border-color var(--dur-fast), background var(--dur-fast), box-shadow var(--dur-fast);
}
.co-method:hover { border-color: var(--brand-solid); }
.co-method.is-active { border-color: var(--brand-solid); background: var(--rose-50); box-shadow: var(--shadow-sm); }
.co-method :deep(svg) { color: var(--brand-strong); flex: none; }
.co-method__label { flex: 1; min-width: 0; }
.co-method__radio {
  width: 18px; height: 18px; flex: none; border-radius: 50%;
  border: 2px solid var(--border-default); display: inline-flex; align-items: center; justify-content: center;
  transition: border-color var(--dur-fast);
}
.co-method.is-active .co-method__radio { border-color: var(--brand-solid); }
.co-method__dot { width: 9px; height: 9px; border-radius: 50%; background: transparent; transition: background var(--dur-fast); }
.co-method.is-active .co-method__dot { background: var(--brand-solid); }

/* Tabby brand accent (mint green) — used on the method chip + panel. */
.co-tabby-logo {
  font-family: var(--font-display); font-weight: var(--weight-extrabold);
  letter-spacing: -0.02em; color: #001e1e;
  background: #3fddc5; border-radius: 6px; padding: 2px 8px; line-height: 1.2;
  font-size: var(--text-sm);
}
.co-method--tabby.is-active { border-color: #22c3a6; background: #edfcf8; box-shadow: var(--shadow-sm); }
.co-method--tabby .co-method__radio { }
.co-method--tabby.is-active .co-method__radio { border-color: #22c3a6; }
.co-method--tabby.is-active .co-method__dot { background: #22c3a6; }

/* Tabby panel */
.co-tabby { display: grid; gap: var(--space-4); }
.co-tabby__hero {
  display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap;
  padding: var(--space-4); border-radius: var(--radius-md);
  background: #edfcf8; border: 1.5px solid #bff0e5;
}
.co-tabby-logo--lg { font-size: var(--text-lg); padding: 4px 12px; }
.co-tabby__tag { margin: 0; font-size: var(--text-sm); color: var(--text-body); line-height: var(--leading-relaxed); }
.co-tabby__tag strong { color: #0f8f77; }
.co-tabby__plan { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; border: 1.5px solid var(--border-soft); border-radius: var(--radius-md); overflow: hidden; }
.co-tabby__step {
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: var(--space-3);
  padding: 12px 16px; background: var(--surface-card); border-bottom: 1px solid var(--border-hair);
}
.co-tabby__step:last-child { border-bottom: none; }
.co-tabby__dot {
  width: 26px; height: 26px; flex: none; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: #3fddc5; color: #001e1e; font-family: var(--font-display); font-weight: var(--weight-bold); font-size: var(--text-xs);
}
.co-tabby__when { font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--weight-semibold); }
.co-tabby__amt { font-family: var(--font-display); font-weight: var(--weight-bold); color: var(--text-strong); }
.co-tabby__hint {
  display: flex; align-items: center; gap: 6px; justify-content: center;
  margin: 0; font-size: var(--text-xs); color: var(--text-muted);
}
.co-tabby__hint :deep(svg) { color: var(--success-500); flex: none; }
.co-error--inline { flex-direction: row; padding: var(--space-3) var(--space-4); text-align: start; background: var(--danger-50, #fef2f2); border-radius: var(--radius-md); }
.co-error--inline p { margin: 0; }

/* bank-transfer card */
.co-bank { display: grid; gap: var(--space-4); }
.co-bank__lead { color: var(--text-muted); font-size: var(--text-sm); line-height: var(--leading-relaxed); margin: 0; }
.co-bank__amount {
  display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
  padding: var(--space-4); border-radius: var(--radius-md);
  background: var(--surface-cream, var(--rose-50)); border: 1.5px dashed var(--border-default);
}
.co-bank__amount span { font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--weight-semibold); }
.co-bank__amount strong { font-family: var(--font-display); font-weight: var(--weight-extrabold); font-size: var(--text-2xl); color: var(--brand-strong); }
.co-bank__details {
  margin: 0; display: grid; gap: 2px; border: 1.5px solid var(--border-soft); border-radius: var(--radius-md); overflow: hidden;
}
.co-bank__row {
  display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
  padding: 12px 16px; background: var(--surface-card); border-bottom: 1px solid var(--border-hair);
}
.co-bank__row:last-child { border-bottom: none; }
.co-bank__row dt { display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-xs); color: var(--text-muted); font-weight: var(--weight-semibold); }
.co-bank__row dt :deep(svg) { color: var(--brand-strong); }
.co-bank__row dd { margin: 0; font-weight: var(--weight-bold); color: var(--text-strong); font-size: var(--text-sm); text-align: end; }
.co-bank__mono { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-num); direction: ltr; }
.co-bank__copy {
  border: none; background: transparent; cursor: pointer; color: var(--text-brand);
  display: inline-flex; padding: 4px; border-radius: var(--radius-sm); transition: background var(--dur-fast);
}
.co-bank__copy:hover { background: var(--rose-50); }
.co-bank__field { display: grid; gap: 6px; }
.co-bank__field-label { font-family: var(--font-display); font-weight: var(--weight-bold); font-size: var(--text-sm); color: var(--text-strong); }
.co-bank__input {
  width: 100%; padding: 12px 14px; border: 1.5px solid var(--border-default); border-radius: var(--radius-md);
  font-family: var(--font-num); font-size: var(--text-base); color: var(--text-strong); background: var(--surface-card);
  transition: border-color var(--dur-fast);
}
.co-bank__input:focus { outline: none; border-color: var(--brand-solid); }
.co-bank__error { display: flex; align-items: center; gap: 6px; margin: 0; font-size: var(--text-sm); color: var(--danger-500); }
.co-bank__note { display: flex; align-items: flex-start; gap: 6px; margin: 0; font-size: var(--text-xs); color: var(--text-muted); line-height: var(--leading-relaxed); }
.co-bank__note :deep(svg) { color: var(--text-brand); flex: none; margin-top: 2px; }

@media (max-width: 520px) {
  .co-methods { grid-template-columns: 1fr; }
}

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
