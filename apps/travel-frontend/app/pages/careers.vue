<script setup lang="ts">
import { computed } from 'vue';
import { Button, Icon } from '@org/shared-ui';
import PageHero from '~/components/PageHero.vue';
import { CONTACT } from '~/data/site';

const { t, locale } = useI18n();
useHead(() => ({ title: `${t('pages.careers.title')} · ${t('brand')}` }));

const perks = computed(() =>
  locale.value === 'ar'
    ? [
        { icon: 'users', t: 'بيئة نسائية داعمة', d: 'فريق يشجّع النمو والتعاون.' },
        { icon: 'plane', t: 'شغف السفر', d: 'اعملي في قلب صناعة السفر الفاخر.' },
        { icon: 'trending-up', t: 'فرص تطوّر', d: 'مسارات واضحة للتعلّم والترقّي.' },
      ]
    : [
        { icon: 'users', t: 'Supportive team', d: 'A culture that encourages growth and collaboration.' },
        { icon: 'plane', t: 'Passion for travel', d: 'Work at the heart of luxury travel.' },
        { icon: 'trending-up', t: 'Growth paths', d: 'Clear routes to learn and advance.' },
      ]
);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('pages.careers.eyebrow')"
      :title="t('pages.careers.title')"
      :description="t('pages.careers.lead')"
      icon="briefcase"
      grad="linear-gradient(135deg,#3B4A6B,#232F49)"
    />

    <section class="section">
      <div class="container careers">
        <div class="careers__perks">
          <div v-for="p in perks" :key="p.t" class="careers-perk">
            <span class="careers-perk__ico"><Icon :name="p.icon" :size="22" /></span>
            <h3>{{ p.t }}</h3>
            <p>{{ p.d }}</p>
          </div>
        </div>

        <div class="careers__cta">
          <h2>{{ locale === 'ar' ? 'لا توجد وظائف شاغرة حاليًا' : 'No open positions right now' }}</h2>
          <p>
            {{ locale === 'ar'
              ? 'لكنّنا نرحّب دائمًا بالمواهب المميّزة. أرسلي سيرتكِ الذاتية وسنتواصل معكِ عند توفّر فرصة مناسبة.'
              : 'But we always welcome great talent. Send us your CV and we’ll reach out when a suitable role opens.' }}
          </p>
          <Button variant="primary" size="lg" :href="CONTACT.mailtoHref" as="a">
            <template #iconStart><Icon name="mail" :size="18" /></template>
            {{ locale === 'ar' ? 'أرسلي سيرتكِ الذاتية' : 'Send your CV' }}
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.careers { max-width: 900px; }
.careers__perks { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 620px) { .careers__perks { grid-template-columns: 1fr 1fr 1fr; } }
.careers-perk {
  background: var(--surface-card); border: 1.5px solid var(--border-soft);
  border-radius: var(--radius-lg); padding: var(--space-5); box-shadow: var(--shadow-sm);
}
.careers-perk__ico {
  width: 44px; height: 44px; border-radius: var(--radius-md); margin-bottom: var(--space-3);
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--rose-100); color: var(--brand-strong);
}
.careers-perk h3 { font-family: var(--font-display); font-weight: var(--weight-bold); font-size: var(--text-base); color: var(--text-strong); margin: 0 0 4px; }
.careers-perk p { color: var(--text-muted); font-size: var(--text-sm); line-height: var(--leading-relaxed); margin: 0; }
.careers__cta {
  text-align: center; margin-top: var(--space-10); padding: var(--space-8);
  background: var(--surface-cream); border-radius: var(--radius-lg);
}
.careers__cta h2 { font-family: var(--font-display); font-weight: var(--weight-extrabold); font-size: var(--text-2xl); color: var(--text-strong); margin: 0 0 var(--space-2); }
.careers__cta p { color: var(--text-muted); max-width: 52ch; margin: 0 auto var(--space-5); line-height: var(--leading-relaxed); }
</style>
