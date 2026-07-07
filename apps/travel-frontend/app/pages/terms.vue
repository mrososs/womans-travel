<script setup lang="ts">
import { computed } from 'vue';
import PageHero from '~/components/PageHero.vue';

/** Terms & Conditions — bilingual long-form content kept in-component. */
const { t, locale } = useI18n();
useHead(() => ({ title: `${t('pages.terms.title')} · ${t('brand')}` }));

const updated = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'ar' ? 'ar-SA' : 'en-GB', { dateStyle: 'long' }).format(
    new Date('2026-07-07')
  )
);

const sections = computed(() =>
  locale.value === 'ar'
    ? [
        { h: 'قبول الشروط', p: 'باستخدامكِ موقع رحلات المستقبل الذهبي وحجز أيٍّ من خدماتنا، فإنكِ توافقين على هذه الشروط والأحكام بالكامل.' },
        { h: 'الحجز والدفع', p: 'يتم تأكيد الحجز بعد إتمام الدفع بنجاح عبر بوابة Moyasar. تُضاف ضريبة القيمة المضافة (15%) إلى الأسعار حسب الأنظمة السعودية.' },
        { h: 'الإلغاء والاسترداد', p: 'يمكنكِ إلغاء الحجز مجّانًا خلال 48 ساعة من إتمامه من صفحة «طلباتي». بعد انتهاء هذه المدّة تُطبَّق سياسة الإلغاء الخاصّة بكل رحلة.' },
        { h: 'مسؤوليات المسافرة', p: 'تلتزم المسافرة بصحّة بياناتها، وصلاحية جواز سفرها لمدّة لا تقل عن 6 أشهر، واحترام سياسات وقوانين الدول المسافر إليها والالتزام مع المجموعة.' },
        { h: 'حدود المسؤولية', p: 'لا نتحمّل مسؤولية التأخير أو الإلغاء الناتج عن ظروف خارجة عن إرادتنا (كقرارات الجهات الرسمية أو الطقس أو شركات الطيران).' },
        { h: 'التعديلات', p: 'قد نُحدّث هذه الشروط من وقتٍ لآخر، ويسري التحديث فور نشره على هذه الصفحة.' },
        { h: 'القانون المطبّق', p: 'تخضع هذه الشروط لأنظمة المملكة العربية السعودية، وتختصّ الجهات المختصّة فيها بالفصل في أي نزاع.' },
      ]
    : [
        { h: 'Acceptance of terms', p: 'By using the Golden Future Travel website and booking any of our services, you agree to these terms and conditions in full.' },
        { h: 'Booking & payment', p: 'A booking is confirmed after a successful payment through the Moyasar gateway. VAT (15%) is added to prices in line with Saudi regulations.' },
        { h: 'Cancellation & refunds', p: 'You may cancel a booking free of charge within 48 hours of purchase from the “My bookings” page. After this window, each trip’s specific cancellation policy applies.' },
        { h: 'Traveller responsibilities', p: 'The traveller is responsible for the accuracy of her details, a passport valid for at least 6 months, and respecting the policies and laws of the destination countries as well as the group.' },
        { h: 'Limitation of liability', p: 'We are not liable for delays or cancellations caused by circumstances beyond our control (such as official decisions, weather, or airlines).' },
        { h: 'Changes', p: 'We may update these terms from time to time; updates take effect as soon as they are published on this page.' },
        { h: 'Governing law', p: 'These terms are governed by the laws of the Kingdom of Saudi Arabia, and its competent authorities have jurisdiction over any dispute.' },
      ]
);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('pages.terms.eyebrow')"
      :title="t('pages.terms.title')"
      :description="t('pages.terms.lead')"
      icon="scroll-text"
      grad="linear-gradient(135deg,#3B4A6B,#232F49)"
    />
    <section class="section">
      <div class="container prose">
        <p class="prose__updated">{{ locale === 'ar' ? 'آخر تحديث:' : 'Last updated:' }} {{ updated }}</p>
        <article v-for="(s, i) in sections" :key="i" class="prose__block">
          <h2>{{ i + 1 }}. {{ s.h }}</h2>
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
