<script setup lang="ts">
import { computed } from 'vue';
import { Button, Icon } from '@org/shared-ui';
import PageHero from '~/components/PageHero.vue';

const { t, locale } = useI18n();
const localePath = useLocalePath();
useHead(() => ({ title: `${t('pages.membership.title')} · ${t('brand')}` }));

const benefits = computed(() =>
  locale.value === 'ar'
    ? [
        { icon: 'zap', t: 'أولوية الحجز', d: 'احجزي مقعدكِ في القروبات الأكثر طلبًا قبل الجميع.' },
        { icon: 'tag', t: 'أسعار خاصّة', d: 'خصومات حصرية على الرحلات والبكجات على مدار العام.' },
        { icon: 'concierge-bell', t: 'كونسيرج مخصّص', d: 'فريق دعم خاص يرتّب تفاصيل رحلتكِ حسب تفضيلاتكِ.' },
        { icon: 'sparkles', t: 'رحلات حصرية', d: 'وصول إلى وجهات وتجارب مخصّصة للعضوات فقط.' },
        { icon: 'bell', t: 'وصول مبكّر', d: 'إشعارات مبكّرة بالعروض والوجهات الجديدة قبل إطلاقها.' },
        { icon: 'gift', t: 'هدايا الترحيب', d: 'مفاجآت ولمسات ترحيب في كل رحلة تنضمّين إليها.' },
      ]
    : [
        { icon: 'zap', t: 'Priority booking', d: 'Reserve your seat in the most in-demand groups before everyone else.' },
        { icon: 'tag', t: 'Special rates', d: 'Exclusive discounts on trips and packages all year round.' },
        { icon: 'concierge-bell', t: 'Dedicated concierge', d: 'A private support team arranging your trip to your preferences.' },
        { icon: 'sparkles', t: 'Exclusive trips', d: 'Access to destinations and experiences reserved for members.' },
        { icon: 'bell', t: 'Early access', d: 'Early notice of offers and new destinations before launch.' },
        { icon: 'gift', t: 'Welcome gifts', d: 'Surprises and welcome touches on every trip you join.' },
      ]
);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('pages.membership.eyebrow')"
      :title="t('pages.membership.title')"
      :description="t('pages.membership.lead')"
      icon="crown"
      grad="linear-gradient(135deg,#C6A34E,#9C7C2E)"
    />

    <section class="section">
      <div class="container mb">
        <div class="mb__grid">
          <div v-for="b in benefits" :key="b.t" class="mb-card">
            <span class="mb-card__ico"><Icon :name="b.icon" :size="22" /></span>
            <div>
              <h3>{{ b.t }}</h3>
              <p>{{ b.d }}</p>
            </div>
          </div>
        </div>

        <div class="mb__cta">
          <h2>{{ locale === 'ar' ? 'هل أنتِ مستعدّة للانضمام؟' : 'Ready to join?' }}</h2>
          <p>{{ locale === 'ar' ? 'تواصلي معنا وسيسعد فريقنا بتفعيل عضويتكِ الذهبية.' : 'Get in touch and our team will be glad to activate your Golden Membership.' }}</p>
          <Button variant="gold" size="lg" @click="navigateTo(localePath('/contact'))">
            <template #iconStart><Icon name="crown" :size="18" /></template>
            {{ locale === 'ar' ? 'اطلبي العضوية' : 'Request membership' }}
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.mb { max-width: 960px; }
.mb__grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 620px) { .mb__grid { grid-template-columns: 1fr 1fr; } }
@media (min-width: 960px) { .mb__grid { grid-template-columns: 1fr 1fr 1fr; } }
.mb-card {
  display: flex; align-items: flex-start; gap: 14px;
  background: var(--surface-card); border: 1.5px solid var(--border-soft);
  border-radius: var(--radius-lg); padding: var(--space-5); box-shadow: var(--shadow-sm);
}
.mb-card__ico {
  width: 44px; height: 44px; flex: none; border-radius: var(--radius-md);
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--gold-100, #f6ecd2); color: var(--gold-600, #9c7c2e);
}
.mb-card h3 { font-family: var(--font-display); font-weight: var(--weight-bold); font-size: var(--text-base); color: var(--text-strong); margin: 0 0 4px; }
.mb-card p { color: var(--text-muted); font-size: var(--text-sm); line-height: var(--leading-relaxed); margin: 0; }
.mb__cta {
  text-align: center; margin-top: var(--space-10); padding: var(--space-8);
  background: var(--surface-cream); border-radius: var(--radius-lg);
}
.mb__cta h2 { font-family: var(--font-display); font-weight: var(--weight-extrabold); font-size: var(--text-2xl); color: var(--text-strong); margin: 0 0 var(--space-2); }
.mb__cta p { color: var(--text-muted); margin: 0 0 var(--space-5); }
</style>
