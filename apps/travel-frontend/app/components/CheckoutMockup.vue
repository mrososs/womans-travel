<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { gsap } from 'gsap';
import { Button, Icon } from '@org/shared-ui';

/**
 * CheckoutMockup — luxury RTL payment / checkout mockup for the Ashwaq / Durrah
 * women's travel frontend. Split layout on desktop (payment form on the right,
 * order summary on the left in RTL), stacked on mobile. GSAP powers the
 * method-switch transition and the fake "payment succeeded" overlay.
 *
 * This is a self-contained visual mockup: `pay()` simulates a gateway call and
 * plays a success animation — it does NOT hit a real payment endpoint.
 */

type MethodId = 'mada' | 'card' | 'applepay' | 'stcpay';

const methods: { id: MethodId; label: string; sub: string; icon: string }[] = [
  { id: 'mada', label: 'مدى', sub: 'Mada', icon: 'credit-card' },
  { id: 'card', label: 'البطاقات الائتمانية', sub: 'Visa / Mastercard', icon: 'credit-card' },
  { id: 'applepay', label: 'Apple Pay', sub: 'الدفع باللمس', icon: 'apple' },
  { id: 'stcpay', label: 'STC Pay', sub: 'المحفظة الرقمية', icon: 'smartphone' },
];

const method = ref<MethodId>('mada');
const usesCardForm = computed(() => method.value === 'mada' || method.value === 'card');

/* ---- dummy order data ---- */
const order = {
  trip: 'رحلة وادي الرمسا الحصرية',
  meta: 'رحلة سيدات · 5 ليالٍ · شاملة الإقامة الفاخرة',
  travelers: 2,
  pricePer: 4800,
};
const subtotal = computed(() => order.pricePer * order.travelers);
const vat = computed(() => Math.round(subtotal.value * 0.15));
const total = computed(() => subtotal.value + vat.value);

const nf = new Intl.NumberFormat('en-US');

/* ---- card form state ---- */
const card = reactive({ name: '', number: '', expiry: '', cvv: '' });

function onCardNumber(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 16);
  card.number = digits.replace(/(.{4})/g, '$1 ').trim();
}
function onExpiry(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
  card.expiry = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}
function onCvv(e: Event) {
  card.cvv = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
}

const cardBrand = computed(() => {
  const n = card.number.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard';
  if (/^(4|5|6)/.test(n) && method.value === 'mada') return 'mada';
  return '';
});

/* ---- animation refs ---- */
const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const root = ref<HTMLElement | null>(null);
const panel = ref<HTMLElement | null>(null);
const overlay = ref<HTMLElement | null>(null);
const checkPath = ref<SVGPathElement | null>(null);

onMounted(() => {
  if (prefersReduced() || !root.value) return;
  gsap.from(root.value.querySelectorAll('[data-reveal]'), {
    opacity: 0,
    y: 22,
    duration: 0.6,
    ease: 'expo.out',
    stagger: 0.08,
  });
});

// Subtle transition of the payment panel whenever the method changes.
watch(method, async () => {
  await nextTick();
  if (prefersReduced() || !panel.value) return;
  gsap.fromTo(
    panel.value,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
  );
});

/* ---- fake submission ---- */
const paying = ref(false);
const done = ref(false);

const canPay = computed(() => {
  if (!usesCardForm.value) return true;
  return (
    card.name.trim().length > 2 &&
    card.number.replace(/\s/g, '').length >= 16 &&
    /^\d{2}\/\d{2}$/.test(card.expiry) &&
    card.cvv.length >= 3
  );
});

async function pay() {
  if (!canPay.value || paying.value) return;
  paying.value = true;

  // Simulate a gateway round-trip.
  await new Promise((r) => setTimeout(r, 1200));

  paying.value = false;
  done.value = true;

   
  console.log('[CheckoutMockup] Payment simulated ✔', {
    method: method.value,
    amount: total.value,
    currency: 'SAR',
    travelers: order.travelers,
  });

  await nextTick();
  playSuccess();
}

function playSuccess() {
  if (!overlay.value) return;
  if (prefersReduced()) {
    gsap.set(overlay.value, { autoAlpha: 1 });
    if (checkPath.value) checkPath.value.style.strokeDashoffset = '0';
    return;
  }
  const len = checkPath.value?.getTotalLength() ?? 48;
  gsap.set(checkPath.value, { strokeDasharray: len, strokeDashoffset: len });

  const tl = gsap.timeline();
  tl.set(overlay.value, { autoAlpha: 1 })
    .from(overlay.value.querySelector('.co-success__card'), {
      scale: 0.9,
      opacity: 0,
      duration: 0.4,
      ease: 'back.out(1.7)',
    })
    .from(
      overlay.value.querySelector('.co-success__ring'),
      { scale: 0, opacity: 0, duration: 0.45, ease: 'back.out(2)' },
      '-=0.2'
    )
    .to(checkPath.value, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.inOut' }, '-=0.1')
    .from(
      overlay.value.querySelectorAll('.co-success__text > *'),
      { y: 14, opacity: 0, duration: 0.4, ease: 'power2.out', stagger: 0.08 },
      '-=0.2'
    );
}

function reset() {
  done.value = false;
  if (overlay.value) gsap.set(overlay.value, { autoAlpha: 0 });
}
</script>

<template>
  <section ref="root" class="co" dir="rtl">
    <header class="co__head" data-reveal>
      <span class="co__eyebrow">الدفع الآمن</span>
      <h1 class="co__title">إتمام الحجز</h1>
      <p class="co__lead">
        <Icon name="shield-check" :size="16" />
        جميع المدفوعات مشفّرة ومحمية · تُدار عبر بوابة دفع سعودية معتمدة
      </p>
    </header>

    <div class="co__grid">
      <!-- ============ PAYMENT (right in RTL) ============ -->
      <div class="co__pay" data-reveal>
        <div class="co-card">
          <h2 class="co-card__title">طريقة الدفع</h2>

          <!-- Payment method selectors -->
          <div class="co-methods" role="radiogroup" aria-label="طريقة الدفع">
            <button
              v-for="m in methods"
              :key="m.id"
              type="button"
              role="radio"
              :aria-checked="method === m.id"
              class="co-method"
              :class="{ 'co-method--active': method === m.id }"
              @click="method = m.id"
            >
              <span class="co-method__ico"><Icon :name="m.icon" :size="22" /></span>
              <span class="co-method__body">
                <span class="co-method__label">{{ m.label }}</span>
                <span class="co-method__sub">{{ m.sub }}</span>
              </span>
              <span class="co-method__dot" aria-hidden="true">
                <Icon v-if="method === m.id" name="check" :size="14" />
              </span>
            </button>
          </div>

          <!-- Method-specific panel -->
          <div ref="panel" class="co-panel">
            <!-- Card form (Mada / Visa / Mastercard) -->
            <form v-if="usesCardForm" class="co-form" @submit.prevent="pay">
              <div class="co-field">
                <input
                  id="co-name"
                  v-model="card.name"
                  class="co-input"
                  type="text"
                  placeholder=" "
                  autocomplete="cc-name"
                >
                <label class="co-label" for="co-name">اسم حاملة البطاقة</label>
                <span class="co-field__ico"><Icon name="user" :size="18" /></span>
              </div>

              <div class="co-field">
                <input
                  id="co-number"
                  :value="card.number"
                  class="co-input co-input--num"
                  type="text"
                  inputmode="numeric"
                  placeholder=" "
                  autocomplete="cc-number"
                  dir="ltr"
                  @input="onCardNumber"
                >
                <label class="co-label" for="co-number">رقم البطاقة</label>
                <span class="co-field__brand" :data-brand="cardBrand">
                  <Icon name="credit-card" :size="18" />
                </span>
              </div>

              <div class="co-form__row">
                <div class="co-field">
                  <input
                    id="co-exp"
                    :value="card.expiry"
                    class="co-input co-input--num"
                    type="text"
                    inputmode="numeric"
                    placeholder=" "
                    autocomplete="cc-exp"
                    dir="ltr"
                    @input="onExpiry"
                  >
                  <label class="co-label" for="co-exp">تاريخ الانتهاء (MM/YY)</label>
                </div>
                <div class="co-field">
                  <input
                    id="co-cvv"
                    :value="card.cvv"
                    class="co-input co-input--num"
                    type="text"
                    inputmode="numeric"
                    placeholder=" "
                    autocomplete="cc-csc"
                    dir="ltr"
                    @input="onCvv"
                  >
                  <label class="co-label" for="co-cvv">رمز الأمان (CVV)</label>
                  <span class="co-field__ico"><Icon name="lock" :size="16" /></span>
                </div>
              </div>
            </form>

            <!-- Apple Pay -->
            <div v-else-if="method === 'applepay'" class="co-wallet co-wallet--apple">
              <Icon name="apple" :size="34" />
              <p class="co-wallet__title">الدفع عبر Apple&nbsp;Pay</p>
              <p class="co-wallet__note">
                سيُطلب منكِ تأكيد الدفع باستخدام Face&nbsp;ID أو Touch&nbsp;ID عند الضغط على زر الدفع.
              </p>
            </div>

            <!-- STC Pay -->
            <div v-else class="co-wallet co-wallet--stc">
              <Icon name="smartphone" :size="34" />
              <p class="co-wallet__title">الدفع عبر STC&nbsp;Pay</p>
              <p class="co-wallet__note">
                سنرسل رمز تحقّق إلى رقم جوّالكِ المسجّل في محفظة STC&nbsp;Pay لإتمام العملية بأمان.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ ORDER SUMMARY (left in RTL) ============ -->
      <aside class="co__summary" data-reveal>
        <div class="co-card co-card--summary">
          <h2 class="co-card__title">ملخّص الطلب</h2>

          <div class="co-trip">
            <span class="co-trip__badge"><Icon name="sparkles" :size="18" /></span>
            <div>
              <p class="co-trip__name">{{ order.trip }}</p>
              <p class="co-trip__meta">{{ order.meta }}</p>
            </div>
          </div>

          <div class="co-lines">
            <div class="co-line">
              <span class="co-line__k"><Icon name="users" :size="15" /> عدد المسافرات</span>
              <span class="co-line__v">{{ order.travelers }}</span>
            </div>
            <div class="co-line">
              <span class="co-line__k">سعر الفرد</span>
              <span class="co-line__v co-price">{{ nf.format(order.pricePer) }}<Icon name="saudi-riyal" :size="13" /></span>
            </div>
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

          <Button
            variant="primary"
            size="lg"
            block
            :disabled="!canPay || paying"
            @click="pay"
          >
            <template #iconStart>
              <Icon :name="paying ? 'loader' : 'lock'" :size="18" />
            </template>
            {{ paying ? 'جارٍ معالجة الدفع…' : 'ادفعي الآن' }}
          </Button>

          <p class="co-reassure">
            <Icon name="shield-check" :size="14" />
            دفع آمن ومشفّر — يُرجى العلم أن المبلغ المدفوع غير قابل للاسترجاع
          </p>
        </div>
      </aside>
    </div>

    <!-- ============ SUCCESS OVERLAY ============ -->
    <div ref="overlay" class="co-success" :class="{ 'co-success--on': done }" aria-live="polite">
      <div class="co-success__card">
        <div class="co-success__ring">
          <svg viewBox="0 0 52 52" class="co-success__svg">
            <circle class="co-success__circle" cx="26" cy="26" r="24" />
            <path ref="checkPath" class="co-success__check" fill="none" d="M16 27 l7 7 l13 -15" />
          </svg>
        </div>
        <div class="co-success__text">
          <h3 class="co-success__heading">تم الدفع بنجاح</h3>
          <p class="co-success__desc">
            تم تأكيد حجزكِ في <strong>{{ order.trip }}</strong>. أرسلنا تفاصيل الرحلة
            وإيصال الدفع إلى بريدكِ الإلكتروني.
          </p>
          <div class="co-success__amount">
            <span class="co-success__amount-label">المبلغ المدفوع</span>
            <span class="co-success__amount-val">
              {{ nf.format(total) }}<Icon name="saudi-riyal" :size="18" />
            </span>
          </div>
          <Button variant="outline" size="md" @click="reset">العودة إلى الحجز</Button>
        </div>
      </div>
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

/* ---- header ---- */
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
.co__lead {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: var(--text-sm);
}
.co__lead :deep(svg) { color: var(--success-500); }

/* ---- split layout ---- */
.co__grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: clamp(20px, 3vw, 36px);
  align-items: start;
}

/* ---- cards ---- */
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

/* ---- payment methods ---- */
.co-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}
.co-method {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-align: start;
  padding: 14px 16px;
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  cursor: pointer;
  transition: border-color var(--dur-base) var(--ease-standard),
    box-shadow var(--dur-base) var(--ease-standard),
    background var(--dur-base) var(--ease-standard),
    transform var(--dur-fast) var(--ease-standard);
}
.co-method:hover { border-color: var(--border-strong); }
.co-method:active { transform: scale(0.985); }
.co-method:focus-visible { outline: none; box-shadow: var(--ring-brand); }
.co-method--active {
  border-color: var(--brand);
  background: var(--brand-tint);
  box-shadow: var(--ring-brand);
}
.co-method__ico {
  display: inline-flex;
  width: 40px;
  height: 40px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--surface-cream);
  color: var(--text-strong);
}
.co-method--active .co-method__ico { background: var(--white); color: var(--brand-strong); }
.co-method__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.co-method__label {
  font-family: var(--font-display);
  font-weight: var(--weight-bold);
  font-size: var(--text-base);
  color: var(--text-strong);
}
.co-method__sub { font-size: var(--text-xs); color: var(--text-muted); }
.co-method__dot {
  width: 20px;
  height: 20px;
  flex: none;
  border-radius: var(--radius-circle);
  border: 1.5px solid var(--border-strong);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: background var(--dur-base) var(--ease-standard),
    border-color var(--dur-base) var(--ease-standard);
}
.co-method--active .co-method__dot { background: var(--brand); border-color: var(--brand); }

/* ---- card form (floating labels) ---- */
.co-panel { min-height: 168px; }
.co-form { display: grid; gap: var(--space-4); }
.co-form__row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }

.co-field { position: relative; }
.co-input {
  width: 100%;
  height: var(--tap-comfort);
  padding: 20px 44px 6px 16px;
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-strong);
  background: var(--surface-card);
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
  outline: none;
  transition: border-color var(--dur-base) var(--ease-standard),
    box-shadow var(--dur-base) var(--ease-standard);
}
.co-input--num { letter-spacing: 0.08em; }
.co-input:hover { border-color: var(--border-strong); }
.co-input:focus { border-color: var(--brand); box-shadow: var(--ring-brand); }

.co-label {
  position: absolute;
  inset-inline-start: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: var(--text-base);
  color: var(--text-subtle);
  pointer-events: none;
  transition: all var(--dur-fast) var(--ease-standard);
}
.co-input:focus + .co-label,
.co-input:not(:placeholder-shown) + .co-label {
  top: 12px;
  transform: none;
  font-size: var(--text-2xs);
  font-weight: var(--weight-bold);
  color: var(--brand-strong);
}

.co-field__ico,
.co-field__brand {
  position: absolute;
  inset-inline-end: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  color: var(--text-muted);
  pointer-events: none;
}
.co-field__brand[data-brand='visa'] { color: #1a1f71; }
.co-field__brand[data-brand='mastercard'] { color: #eb001b; }
.co-field__brand[data-brand='mada'] { color: var(--brand-strong); }

/* ---- wallet panels ---- */
.co-wallet {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-2);
  padding: var(--space-8) var(--space-5);
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface-cream);
}
.co-wallet__title {
  font-family: var(--font-display);
  font-weight: var(--weight-bold);
  font-size: var(--text-lg);
  color: var(--text-strong);
  margin: 4px 0 0;
}
.co-wallet__note { font-size: var(--text-sm); color: var(--text-muted); max-width: 42ch; margin: 0; line-height: var(--leading-relaxed); }
.co-wallet--apple :deep(svg) { color: var(--navy-900); }
.co-wallet--stc :deep(svg) { color: #4f008c; }

/* ---- order summary ---- */
.co-trip {
  display: flex;
  gap: var(--space-3);
  padding-bottom: var(--space-5);
  margin-bottom: var(--space-5);
  border-bottom: 1.5px solid var(--border-hair);
}
.co-trip__badge {
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--grad-gold);
  color: var(--navy-900);
}
.co-trip__name { font-family: var(--font-display); font-weight: var(--weight-bold); color: var(--text-strong); margin: 0 0 4px; font-size: var(--text-base); }
.co-trip__meta { font-size: var(--text-xs); color: var(--text-muted); margin: 0; line-height: var(--leading-normal); }

.co-lines { display: grid; gap: var(--space-3); margin-bottom: var(--space-4); }
.co-line { display: flex; align-items: center; justify-content: space-between; font-size: var(--text-sm); }
.co-line__k { display: inline-flex; align-items: center; gap: 6px; color: var(--text-muted); }
.co-line__k :deep(svg) { color: var(--text-subtle); }
.co-line__v { font-weight: var(--weight-semibold); color: var(--text-body); }

.co-price { display: inline-flex; align-items: center; gap: 3px; font-family: var(--font-num); }
.co-price :deep(svg) { width: 0.85em; height: 0.85em; }

.co-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) 0 var(--space-5);
  margin-top: var(--space-2);
  border-top: 1.5px solid var(--border-default);
}
.co-total__k { font-family: var(--font-display); font-weight: var(--weight-bold); font-size: var(--text-lg); color: var(--text-strong); }
.co-total__v { font-family: var(--font-display); font-weight: var(--weight-extrabold); font-size: var(--text-2xl); color: var(--brand-strong); }

.co-reassure {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  margin: var(--space-4) 0 0;
  font-size: var(--text-xs);
  color: var(--text-muted);
}
.co-reassure :deep(svg) { color: var(--success-500); flex: none; }

/* ---- success overlay ---- */
.co-success {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--gutter);
  background: var(--surface-veil);
  backdrop-filter: var(--blur-md);
  visibility: hidden;
  opacity: 0;
}
.co-success__card {
  background: var(--surface-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: clamp(28px, 5vw, 48px);
  max-width: 420px;
  width: 100%;
  text-align: center;
}
.co-success__ring { display: flex; justify-content: center; margin-bottom: var(--space-5); }
.co-success__svg { width: 96px; height: 96px; }
.co-success__circle { fill: var(--success-100); stroke: var(--success-500); stroke-width: 2; }
.co-success__check { stroke: var(--success-500); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
.co-success__text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
}
.co-success__heading {
  font-family: var(--font-display);
  font-weight: var(--weight-extrabold);
  font-size: var(--text-2xl);
  color: var(--text-strong);
  margin: 0;
}
.co-success__desc {
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: var(--leading-relaxed);
  margin: 0;
  max-width: 34ch;
}
.co-success__amount {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: var(--space-4) 0;
  border-top: 1.5px solid var(--border-hair);
  border-bottom: 1.5px solid var(--border-hair);
}
.co-success__amount-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--text-muted);
}
.co-success__amount-val {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-display);
  font-weight: var(--weight-extrabold);
  font-size: var(--text-3xl);
  color: var(--brand-strong);
}
.co-success__amount-val :deep(svg) { width: 0.7em; height: 0.7em; }

/* ---- responsive: stack on mobile ---- */
@media (max-width: 860px) {
  .co__grid { grid-template-columns: 1fr; }
  .co-card--summary { position: static; }
  /* summary above the form on small screens */
  .co__summary { order: -1; }
}
@media (max-width: 480px) {
  .co-methods { grid-template-columns: 1fr; }
  .co-form__row { grid-template-columns: 1fr; }
}
</style>
