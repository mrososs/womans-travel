<script setup lang="ts">
import { computed } from 'vue';
import PageHero from '~/components/PageHero.vue';

/** Privacy Policy — bilingual long-form content kept in-component. */
const { t, locale } = useI18n();
useHead(() => ({ title: `${t('pages.privacy.title')} · ${t('brand')}` }));

const updated = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-SA' : 'en-GB', { dateStyle: 'long' }).format(
    new Date('2026-07-07')
  )
);

const sections = computed(() =>
  locale.value === 'ar'
    ? [
        { h: 'المعلومات التي نجمعها', p: 'نجمع البيانات التي تقدّمينها عند إنشاء حساب أو إتمام حجز، مثل الاسم ورقم الجوال والبريد الإلكتروني وبيانات جواز السفر اللازمة لترتيب الرحلة.' },
        { h: 'كيف نستخدم معلوماتكِ', p: 'نستخدم بياناتكِ لتأكيد الحجوزات، وترتيب خدمات السفر، والتواصل معكِ بخصوص رحلاتكِ، وتحسين تجربتكِ على الموقع.' },
        { h: 'أمن البيانات والمدفوعات', p: 'تُعالَج المدفوعات عبر بوابة الدفع السعودية Moyasar، ولا يتم تخزين بيانات بطاقتكِ البنكية على خوادمنا إطلاقًا. نطبّق إجراءات تقنية وتنظيمية لحماية بياناتكِ.' },
        { h: 'مشاركة المعلومات', p: 'لا نبيع بياناتكِ. قد نشاركها فقط مع مزوّدي الخدمات الضروريين لإتمام رحلتكِ (كشركات الطيران والفنادق) أو عند الالتزام القانوني.' },
        { h: 'حقوقكِ', p: 'يحق لكِ الوصول إلى بياناتكِ أو تصحيحها أو طلب حذفها، وذلك بالتواصل معنا عبر قنوات الدعم الموضّحة أدناه.' },
        { h: 'التواصل', p: 'لأي استفسار يخص الخصوصية، تواصلي معنا عبر البريد info@goldenfuturetravel.com أو صفحة تواصلي معنا.' },
      ]
    : [
        { h: 'Information we collect', p: 'We collect the data you provide when creating an account or completing a booking — name, phone, email, and the passport details needed to arrange your trip.' },
        { h: 'How we use your information', p: 'We use your data to confirm bookings, arrange travel services, communicate about your trips, and improve your experience on the site.' },
        { h: 'Data & payment security', p: 'Payments are processed through the Saudi payment gateway Moyasar; your bank card details are never stored on our servers. We apply technical and organisational measures to protect your data.' },
        { h: 'Sharing information', p: 'We do not sell your data. We only share it with service providers necessary to fulfil your trip (such as airlines and hotels) or where legally required.' },
        { h: 'Your rights', p: 'You may access, correct, or request deletion of your data by contacting us through the support channels below.' },
        { h: 'Contact', p: 'For any privacy enquiry, reach us at info@goldenfuturetravel.com or via the Contact page.' },
      ]
);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('pages.privacy.eyebrow')"
      :title="t('pages.privacy.title')"
      :description="t('pages.privacy.lead')"
      icon="shield-check"
      grad="linear-gradient(135deg,#3B4A6B,#232F49)"
    />
    <section class="section">
      <div class="container prose">
        <p class="prose__updated">{{ locale === 'ar' ? 'آخر تحديث:' : 'Last updated:' }} {{ updated }}</p>
        <article v-for="(s, i) in sections" :key="i" class="prose__block">
          <h2>{{ s.h }}</h2>
          <p>{{ s.p }}</p>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.prose { max-width: 760px; }
.prose__updated { color: var(--text-subtle); font-size: var(--text-sm); margin: 0 0 var(--space-6); }
.prose__block { margin-bottom: var(--space-6); }
.prose__block h2 {
  font-family: var(--font-display); font-weight: var(--weight-bold);
  font-size: var(--text-xl); color: var(--text-strong); margin: 0 0 var(--space-2);
}
.prose__block p { color: var(--text-body); line-height: var(--leading-relaxed); margin: 0; }
</style>
