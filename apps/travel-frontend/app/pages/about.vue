<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@org/shared-ui';
import PageHero from '~/components/PageHero.vue';

const { t, locale } = useI18n();
useHead(() => ({ title: `${t('pages.about.title')} · ${t('brand')}` }));

const intro = computed(() =>
  locale.value === 'ar'
    ? [
        'رحلات المستقبل الذهبي علامة سعودية وُلدت من شغفٍ بالسفر وإيمانٍ بأن تستحقّ كل امرأة تجربة سفرٍ آمنة وفاخرة ومصمّمة بعناية.',
        'نصمّم قروبات نسائية بالكامل داخل المملكة وخارجها، بترتيبٍ متكامل من التأشيرة إلى الإقامة والتنقل، لتعيشي الرحلة براحةٍ وخصوصيةٍ تامّة.',
      ]
    : [
        'Golden Future Travel is a Saudi brand born from a passion for travel and the belief that every woman deserves a safe, luxurious, and thoughtfully crafted journey.',
        'We design fully women-only groups inside the Kingdom and abroad — arranged end to end from visas to stays and transport — so you can travel in complete comfort and privacy.',
      ]
);

const values = computed(() =>
  locale.value === 'ar'
    ? [
        { icon: 'shield-check', t: 'خصوصية تامّة', d: 'بيئة نسائية بالكامل تحفظ راحتكِ وخصوصيّتكِ طوال الرحلة.' },
        { icon: 'gem', t: 'تجربة فاخرة', d: 'وجهات وإقامة وخدمات مختارة بعناية بمعايير راقية.' },
        { icon: 'map', t: 'ترتيب متكامل', d: 'نتكفّل بكل التفاصيل نيابةً عنكِ، من الحجز حتى العودة.' },
        { icon: 'heart-handshake', t: 'عناية صادقة', d: 'فريق مرافق يهتمّ بكِ ويجعل كل لحظة أسهل وأجمل.' },
      ]
    : [
        { icon: 'shield-check', t: 'Total privacy', d: 'A fully women-only environment that protects your comfort and privacy throughout.' },
        { icon: 'gem', t: 'Luxury experience', d: 'Destinations, stays, and services chosen to elevated standards.' },
        { icon: 'map', t: 'End-to-end care', d: 'We handle every detail for you, from booking to your return.' },
        { icon: 'heart-handshake', t: 'Genuine care', d: 'A companion team that looks after you and makes every moment easier.' },
      ]
);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('pages.about.eyebrow')"
      :title="t('pages.about.title')"
      :description="t('pages.about.lead')"
      icon="sparkles"
      grad="linear-gradient(135deg,#9E5863,#7C444E)"
    />

    <section class="section">
      <div class="container about">
        <div class="about__intro">
          <p v-for="(p, i) in intro" :key="i">{{ p }}</p>
        </div>

        <div class="about__values">
          <div v-for="v in values" :key="v.t" class="about-value">
            <span class="about-value__ico"><Icon :name="v.icon" :size="24" /></span>
            <h3>{{ v.t }}</h3>
            <p>{{ v.d }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about { max-width: 960px; }
.about__intro { max-width: 720px; margin: 0 auto var(--space-10); text-align: center; }
.about__intro p { color: var(--text-body); font-size: var(--text-lg); line-height: var(--leading-relaxed); margin: 0 0 var(--space-4); }
.about__values { display: grid; grid-template-columns: 1fr; gap: 18px; }
@media (min-width: 620px) { .about__values { grid-template-columns: 1fr 1fr; } }
.about-value {
  background: var(--surface-card); border: 1.5px solid var(--border-soft);
  border-radius: var(--radius-lg); padding: var(--space-6); box-shadow: var(--shadow-sm);
}
.about-value__ico {
  width: 48px; height: 48px; border-radius: var(--radius-md); margin-bottom: var(--space-4);
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--rose-100); color: var(--brand-strong);
}
.about-value h3 { font-family: var(--font-display); font-weight: var(--weight-bold); font-size: var(--text-lg); color: var(--text-strong); margin: 0 0 var(--space-2); }
.about-value p { color: var(--text-muted); line-height: var(--leading-relaxed); margin: 0; }
</style>
