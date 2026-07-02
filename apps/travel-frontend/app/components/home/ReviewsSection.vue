<script setup lang="ts">
import { Card, Icon } from '@org/shared-ui';
import TripPhoto from '../TripPhoto.vue';
import { REVIEWS } from '~/data/site';

const { t } = useI18n();
const { lc } = useLocalize();
</script>

<template>
  <section id="reviews" class="section">
    <div class="container">
      <div class="reviews__head">
        <div class="eyebrow">{{ t('reviewsSection.eyebrow') }}</div>
        <h2 class="h-sec">{{ t('reviewsSection.title') }}</h2>
      </div>
      <div class="grid-rev">
        <Card v-for="r in REVIEWS" :key="r.name.en" variant="elevated" padding="lg" class="review" data-reveal>
          <div class="review__stars">
            <Icon v-for="i in 5" :key="i" name="star" :size="16" color="var(--gold-500)" />
          </div>
          <p class="review__text">«{{ lc(r.text) }}»</p>
          <div class="review__author">
            <span class="review__avatar"><TripPhoto :grad="r.grad" :icon="r.icon" :icon-size="26" /></span>
            <div>
              <div class="review__name">{{ lc(r.name) }}</div>
              <div class="review__trip">{{ lc(r.trip) }}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </section>
</template>

<style scoped>
.reviews__head { text-align: center; margin-bottom: 44px; }
.review__stars { color: var(--gold-400); display: flex; gap: 2px; margin-bottom: 12px; }
.review__text { font-size: 15.5px; line-height: 1.9; color: var(--text-body); margin: 0 0 18px; }
.review__author { display: flex; align-items: center; gap: 12px; }
.review__avatar { width: 46px; height: 46px; border-radius: 50%; overflow: hidden; flex: none; display: block; }
.review__name { font-family: var(--font-display); font-weight: 800; font-size: 15px; color: var(--text-strong); }
.review__trip { font-size: 12.5px; color: var(--text-muted); }
</style>
