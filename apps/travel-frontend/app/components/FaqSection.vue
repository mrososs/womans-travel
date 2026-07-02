<script setup lang="ts">
import { computed } from 'vue';
import FaqAccordion from './FaqAccordion.vue';

const { t } = useI18n();
const { pick } = useDbPick();
const { data: faqs } = useFaqs();

const items = computed(() =>
  (faqs.value ?? []).map((f) => ({ q: pick(f, 'question'), a: pick(f, 'answer') }))
);
</script>

<template>
  <section id="faq" class="section faq-section">
    <div class="container">
      <div class="faq-section__head">
        <div class="eyebrow">{{ t('faq.eyebrow') }}</div>
        <h2 class="h-sec">{{ t('faq.title') }}</h2>
      </div>
      <FaqAccordion v-if="items.length" :items="items" />
    </div>
  </section>
</template>

<style scoped>
.faq-section__head { text-align: center; margin-bottom: 40px; }
</style>
