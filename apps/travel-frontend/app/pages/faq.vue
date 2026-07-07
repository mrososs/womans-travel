<script setup lang="ts">
import PageHero from '~/components/PageHero.vue';
import FaqSection from '~/components/FaqSection.vue';

const { t } = useI18n();
useHead(() => ({ title: `${t('pages.faq.title')} · ${t('brand')}` }));
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('pages.faq.eyebrow')"
      :title="t('pages.faq.title')"
      :description="t('pages.faq.lead')"
      icon="help-circle"
      grad="linear-gradient(135deg,#3B4A6B,#232F49)"
    />
    <FaqSection />
  </div>
</template>
