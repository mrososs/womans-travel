<script setup lang="ts">
import { Icon } from '@org/shared-ui';
import PageHero from '~/components/PageHero.vue';
import NewsletterBand from '~/components/NewsletterBand.vue';

const { t, locale } = useI18n();
useHead(() => ({ title: `${t('pages.blog.title')} · ${t('brand')}` }));
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('pages.blog.eyebrow')"
      :title="t('pages.blog.title')"
      :description="t('pages.blog.lead')"
      icon="book-open"
      grad="linear-gradient(135deg,#9E5863,#7C444E)"
    />

    <section class="section">
      <div class="container blog-soon">
        <span class="blog-soon__ico"><Icon name="pen-line" :size="40" /></span>
        <h2>{{ locale === 'ar' ? 'قريبًا... قصص وأدلّة سفر مُلهمة' : 'Coming soon… inspiring travel stories & guides' }}</h2>
        <p>
          {{ locale === 'ar'
            ? 'نُعدّ لكِ محتوىً مميّزًا عن أجمل الوجهات ونصائح السفر النسائي. اشتركي ليصلكِ أول مقال فور نشره.'
            : 'We’re preparing standout content on the best destinations and women’s travel tips. Subscribe to get the first article as soon as it’s live.' }}
        </p>
      </div>
    </section>

    <NewsletterBand />
  </div>
</template>

<style scoped>
.blog-soon { max-width: 620px; text-align: center; display: grid; justify-items: center; gap: 14px; }
.blog-soon__ico { color: var(--rose-300); }
.blog-soon h2 { font-family: var(--font-display); font-weight: var(--weight-extrabold); font-size: var(--text-2xl); color: var(--text-strong); margin: 0; }
.blog-soon p { color: var(--text-muted); line-height: var(--leading-relaxed); margin: 0; }
</style>
