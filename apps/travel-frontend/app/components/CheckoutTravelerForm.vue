<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Button, Input, Checkbox, Icon } from '@org/shared-ui';

/**
 * CheckoutTravelerForm — step 1 of the checkout stepper. Collects the traveler's
 * full four-part Arabic name plus, for international trips, the English name
 * and passport number + issue/expiry dates — or, for a domestic-only cart
 * (Red Sea / Taif / Al-Baha / Madinah, etc.), just the national ID/iqama
 * number instead, since no passport is needed to travel inside Saudi Arabia.
 * The three mandatory declarations (information accuracy + commitment to the
 * group + not bringing children or people with special needs along) are
 * always required. On a valid submit it emits `next` with the sanitized
 * traveler payload; the parent then creates the order and mounts the payment
 * step (step 2).
 */

export interface TravelerDetails {
  fullNameAr: string;
  fullNameEn: string;
  nationalId: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  declaredAccurate: boolean;
  pledgedCompliance: boolean;
  pledgedNoCompanions: boolean;
}

const props = withDefaults(defineProps<{ busy?: boolean; domestic?: boolean }>(), {
  busy: false,
  domestic: false,
});
const emit = defineEmits<{ next: [traveler: TravelerDetails] }>();

const form = reactive<TravelerDetails>({
  fullNameAr: '',
  fullNameEn: '',
  nationalId: '',
  passportNumber: '',
  passportIssueDate: '',
  passportExpiryDate: '',
  declaredAccurate: false,
  pledgedCompliance: false,
  pledgedNoCompanions: false,
});

type FieldKey =
  | 'fullNameAr'
  | 'fullNameEn'
  | 'nationalId'
  | 'passportNumber'
  | 'passportIssueDate'
  | 'passportExpiryDate';

const errors = reactive<Record<FieldKey, string>>({
  fullNameAr: '',
  fullNameEn: '',
  nationalId: '',
  passportNumber: '',
  passportIssueDate: '',
  passportExpiryDate: '',
});
const declError = ref('');

// Saudi validation rules -------------------------------------------------
// Full four-part name in Arabic: Arabic letters (hamza→yaa) + tatweel + spaces;
// rejects Latin letters, digits and symbols.
const AR_FULL_NAME = /^[ء-يـ\s]{2,}$/;
// Full four-part name in English: Latin letters + spaces (allow hyphen/apostrophe).
const EN_FULL_NAME = /^[A-Za-z][A-Za-z\s'.-]*$/;
// The passport four-part name must be complete — at least four parts.
const countParts = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
// Saudi passport: a single letter followed by 7–8 digits, e.g. "A1234567".
const SA_PASSPORT = /^[A-Za-z][0-9]{7,8}$/;
// Saudi national ID (citizen, starts 1) or iqama (resident, starts 2) — 10 digits.
const SA_NATIONAL_ID = /^[12]\d{9}$/;

// Date bounds for the passport <input type="date"> fields.
const today = new Date();
const todayISO = today.toISOString().slice(0, 10);
// A passport must stay valid at least 6 months beyond travel (GCC/Saudi rule).
const minExpiry = new Date(today);
minExpiry.setMonth(minExpiry.getMonth() + 6);
const minExpiryISO = minExpiry.toISOString().slice(0, 10);

function clear(key: FieldKey) {
  errors[key] = '';
}

function validate(): boolean {
  (Object.keys(errors) as FieldKey[]).forEach((k) => (errors[k] = ''));
  declError.value = '';
  let ok = true;
  const fail = (key: FieldKey, msg: string) => {
    if (!errors[key]) errors[key] = msg;
    ok = false;
  };

  // Full four-part name (Arabic) — required, Arabic letters only, ≥ 4 parts.
  const nameAr = form.fullNameAr.trim();
  if (!nameAr) fail('fullNameAr', 'الاسم الرباعي بالعربية مطلوب');
  else if (!AR_FULL_NAME.test(nameAr))
    fail('fullNameAr', 'الاسم يجب أن يكون بالأحرف العربية فقط');
  else if (countParts(nameAr) < 4)
    fail('fullNameAr', 'يُرجى إدخال الاسم رباعيًا كما في الهوية');

  if (props.domestic) {
    // Domestic trip: national ID / iqama instead of a passport.
    const nationalId = form.nationalId.trim();
    if (!nationalId) fail('nationalId', 'رقم الهوية الوطنية أو الإقامة مطلوب');
    else if (!SA_NATIONAL_ID.test(nationalId))
      fail('nationalId', 'رقم الهوية غير صحيح — يجب أن يكون 10 أرقام تبدأ بـ 1 أو 2');
  } else {
    // Full four-part name (English) — required, Latin letters only, ≥ 4 parts.
    const nameEn = form.fullNameEn.trim();
    if (!nameEn) fail('fullNameEn', 'الاسم الرباعي بالإنجليزية مطلوب');
    else if (!EN_FULL_NAME.test(nameEn))
      fail('fullNameEn', 'الاسم يجب أن يكون بالأحرف الإنجليزية فقط');
    else if (countParts(nameEn) < 4)
      fail('fullNameEn', 'يُرجى إدخال الاسم رباعيًا كما في جواز السفر');

    // Passport number — required + Saudi format.
    const passport = form.passportNumber.trim();
    if (!passport) fail('passportNumber', 'رقم جواز السفر مطلوب');
    else if (!SA_PASSPORT.test(passport))
      fail('passportNumber', 'رقم جواز السفر غير صحيح — حرف يليه 7 أو 8 أرقام (مثال: A1234567)');

    // Issue date — optional, but cannot be in the future.
    if (form.passportIssueDate && form.passportIssueDate > todayISO) {
      fail('passportIssueDate', 'تاريخ الإصدار لا يمكن أن يكون في المستقبل');
    }

    // Expiry date — required, in the future, valid ≥ 6 months.
    if (!form.passportExpiryDate) fail('passportExpiryDate', 'تاريخ انتهاء الجواز مطلوب');
    else if (form.passportExpiryDate <= todayISO)
      fail('passportExpiryDate', 'تاريخ انتهاء الجواز يجب أن يكون في المستقبل');
    else if (form.passportExpiryDate < minExpiryISO)
      fail('passportExpiryDate', 'يجب أن يكون الجواز صالحًا 6 أشهر على الأقل من اليوم');

    // Issue date must precede expiry date when both are provided.
    if (
      form.passportIssueDate &&
      form.passportExpiryDate &&
      form.passportIssueDate >= form.passportExpiryDate
    ) {
      fail('passportIssueDate', 'تاريخ الإصدار يجب أن يسبق تاريخ الانتهاء');
    }
  }

  if (!form.declaredAccurate || !form.pledgedCompliance || !form.pledgedNoCompanions) {
    declError.value = 'الرجاء الموافقة على جميع بنود الإقرار والتعهّد قبل المتابعة';
    ok = false;
  }

  return ok;
}

function submit() {
  if (props.busy) return;
  if (!validate()) return;
  emit('next', {
    fullNameAr: form.fullNameAr.trim().replace(/\s+/g, ' '),
    fullNameEn: props.domestic ? '' : form.fullNameEn.trim().replace(/\s+/g, ' '),
    nationalId: props.domestic ? form.nationalId.trim() : '',
    passportNumber: props.domestic ? '' : form.passportNumber.trim().toUpperCase(),
    passportIssueDate: props.domestic ? '' : form.passportIssueDate,
    passportExpiryDate: props.domestic ? '' : form.passportExpiryDate,
    declaredAccurate: form.declaredAccurate,
    pledgedCompliance: form.pledgedCompliance,
    pledgedNoCompanions: form.pledgedNoCompanions,
  });
}
</script>

<template>
  <form class="tf" novalidate @submit.prevent="submit">
    <!-- Full four-part name (Arabic + English for intl; Arabic only for domestic) -->
    <fieldset class="tf__group">
      <legend class="tf__legend">
        <Icon name="user" :size="16" />
        {{ domestic ? 'الاسم الرباعي بالعربية' : 'الاسم رباعيًا كما في جواز السفر' }}
      </legend>
      <div class="tf__grid" :class="{ 'tf__grid--2': !domestic }">
        <Input
          v-model="form.fullNameAr"
          label="الاسم الرباعي بالعربية"
          required
          :error="errors.fullNameAr"
          :hint="errors.fullNameAr ? '' : 'الاسم الأول واسم الأب والجد والعائلة'"
          placeholder="مثال: نورة عبدالله محمد الأحمد"
          @update:model-value="clear('fullNameAr')"
        />
        <Input
          v-if="!domestic"
          v-model="form.fullNameEn"
          label="الاسم الرباعي بالإنجليزية"
          required
          dir="ltr"
          :error="errors.fullNameEn"
          :hint="errors.fullNameEn ? '' : 'كما هو مكتوب في جواز السفر'"
          placeholder="e.g. Noura Abdullah Mohammed Alahmad"
          @update:model-value="clear('fullNameEn')"
        />
      </div>
    </fieldset>

    <!-- Domestic trip: national ID / iqama instead of a passport -->
    <fieldset v-if="domestic" class="tf__group">
      <legend class="tf__legend">
        <Icon name="id-card" :size="16" /> رقم الهوية
      </legend>
      <div class="tf__grid">
        <Input
          v-model="form.nationalId"
          label="رقم الهوية الوطنية أو الإقامة"
          required
          dir="ltr"
          inputmode="numeric"
          :error="errors.nationalId"
          :hint="errors.nationalId ? '' : '10 أرقام، تبدأ بـ 1 (سعودي) أو 2 (مقيم)'"
          placeholder="1234567890"
          @update:model-value="clear('nationalId')"
        />
      </div>
    </fieldset>

    <!-- International trip: passport -->
    <fieldset v-else class="tf__group">
      <legend class="tf__legend">
        <Icon name="book-open" :size="16" /> بيانات جواز السفر
      </legend>
      <div class="tf__grid tf__grid--3">
        <Input
          v-model="form.passportNumber"
          label="رقم جواز السفر"
          required
          :error="errors.passportNumber"
          :hint="errors.passportNumber ? '' : 'حرف يليه 7 أو 8 أرقام'"
          placeholder="A1234567"
          @update:model-value="clear('passportNumber')"
        />
        <Input
          v-model="form.passportIssueDate"
          type="date"
          label="تاريخ الإصدار"
          :error="errors.passportIssueDate"
          :hint="errors.passportIssueDate ? '' : 'اختياري'"
          @update:model-value="clear('passportIssueDate')"
        />
        <Input
          v-model="form.passportExpiryDate"
          type="date"
          label="تاريخ الانتهاء"
          required
          :error="errors.passportExpiryDate"
          @update:model-value="clear('passportExpiryDate')"
        />
      </div>
    </fieldset>

    <!-- Declarations -->
    <section
      class="tf__decl-panel"
      :class="{ 'is-error': declError }"
      role="group"
      aria-label="الإقرار والتعهّد"
    >
      <header class="tf__decl-head">
        <span class="tf__decl-badge"><Icon name="shield-check" :size="20" /></span>
        <span class="tf__decl-heading">
          <b>الإقرار والتعهّد</b>
          <small>يُرجى قراءة البنود التالية والموافقة عليها قبل المتابعة</small>
        </span>
      </header>

      <div class="tf__decl-body">
        <label class="tf__pledge" :class="{ 'is-checked': form.declaredAccurate }">
          <Checkbox v-model="form.declaredAccurate" />
          <span class="tf__pledge-ico"><Icon name="file-check-2" :size="19" /></span>
          <span class="tf__pledge-txt">
            أُقِرّ بأن جميع المعلومات المُدخلة أعلاه صحيحة ومطابقة لبيانات {{ domestic ? 'الهوية' : 'جواز السفر' }}.
          </span>
        </label>

        <label class="tf__pledge" :class="{ 'is-checked': form.pledgedCompliance }">
          <Checkbox v-model="form.pledgedCompliance" />
          <span class="tf__pledge-ico"><Icon name="users" :size="19" /></span>
          <span class="tf__pledge-txt">
            <template v-if="domestic">
              أتعهّد بالالتزام مع المجموعة واحترام تعليمات الرحلة طوال مدة البرنامج.
            </template>
            <template v-else>
              أتعهّد بالالتزام مع المجموعة واحترام سياسات وقوانين الدول المسافر إليها طوال مدة الرحلة.
            </template>
          </span>
        </label>

        <label class="tf__pledge" :class="{ 'is-checked': form.pledgedNoCompanions }">
          <Checkbox v-model="form.pledgedNoCompanions" />
          <span class="tf__pledge-ico"><Icon name="user-x" :size="19" /></span>
          <span class="tf__pledge-txt">
            أتعهّد بعدم اصطحاب الأطفال أو ذوي الاحتياجات الخاصة مع أي مشتركة طوال مدة الرحلة.
          </span>
        </label>
      </div>

      <p v-if="declError" class="tf__declerr">
        <Icon name="alert-triangle" :size="15" /> {{ declError }}
      </p>
    </section>

    <Button type="submit" variant="primary" size="lg" block :disabled="busy">
      <template #iconStart><Icon name="arrow-left" :size="18" /></template>
      المتابعة إلى الدفع
    </Button>
  </form>
</template>

<style scoped>
.tf { display: grid; gap: var(--space-6); }
.tf__group {
  border: 1.5px solid var(--border-soft);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5) var(--space-5);
  margin: 0;
  min-width: 0;
}
.tf__legend {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: var(--font-display); font-weight: var(--weight-bold);
  font-size: var(--text-sm); color: var(--text-strong);
  padding-inline: var(--space-2);
}
.tf__legend :deep(svg) { color: var(--brand-strong); }
.tf__grid { display: grid; gap: var(--space-4); }
.tf__grid--2 { grid-template-columns: repeat(2, 1fr); }
.tf__grid--3 { grid-template-columns: repeat(3, 1fr); }

/* ===== Declaration & pledge panel ===== */
.tf__decl-panel {
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: border-color var(--dur-base) var(--ease-standard),
    box-shadow var(--dur-base) var(--ease-standard);
}
.tf__decl-panel.is-error { border-color: var(--danger-500); box-shadow: 0 0 0 3px rgba(180, 84, 78, 0.14); }

.tf__decl-head {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background:
    linear-gradient(180deg, var(--surface-cream), color-mix(in srgb, var(--surface-cream) 40%, transparent));
  border-bottom: 1.5px solid var(--border-hair);
}
.tf__decl-badge {
  width: 40px; height: 40px; flex: none; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--grad-gold, var(--gold-400)); color: #fff;
  box-shadow: 0 2px 8px rgba(184, 142, 47, 0.35);
}
.tf__decl-heading { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.tf__decl-heading b {
  font-family: var(--font-display); font-weight: var(--weight-bold);
  font-size: var(--text-base); color: var(--text-strong);
}
.tf__decl-heading small { font-size: var(--text-xs); color: var(--text-muted); line-height: var(--leading-snug); }

.tf__decl-body { display: grid; gap: var(--space-3); padding: var(--space-4) var(--space-5); }
.tf__pledge {
  display: flex; align-items: flex-start; gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--border-soft); border-radius: var(--radius-md);
  background: var(--surface-page); cursor: pointer;
  transition: border-color var(--dur-base) var(--ease-standard),
    background var(--dur-base) var(--ease-standard);
}
.tf__pledge:hover { border-color: var(--border-strong); }
.tf__pledge.is-checked {
  border-color: var(--brand-solid);
  background: color-mix(in srgb, var(--brand-solid) 7%, var(--surface-card));
}
.tf__pledge :deep(.drh-check) { flex: none; margin-top: 1px; }
.tf__pledge-ico {
  flex: none; display: inline-flex; margin-top: 1px; color: var(--text-subtle);
  transition: color var(--dur-base) var(--ease-standard);
}
.tf__pledge.is-checked .tf__pledge-ico { color: var(--brand-strong); }
.tf__pledge-txt { font-size: var(--text-sm); line-height: var(--leading-relaxed); color: var(--text-body); }

.tf__declerr {
  display: flex; align-items: center; gap: 6px;
  margin: 0; padding: 0 var(--space-5) var(--space-4);
  font-size: var(--text-xs); color: var(--danger-500);
}

@media (max-width: 640px) {
  .tf__grid--2, .tf__grid--3 { grid-template-columns: 1fr; }
}
</style>
