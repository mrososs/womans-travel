<script setup lang="ts">
import { Button, Icon } from '@org/shared-ui';

const emit = defineEmits<{ explore: [] }>();
const { t } = useI18n();
</script>

<template>
  <section class="ctaband">
    <div class="container ctaband__container">
      <div class="ctaband__panel">
        <span class="ctaband__plane"><Icon name="plane" :size="180" color="#fff" /></span>
        <div class="ctaband__content">
          <h2 class="ctaband__title">{{ t('cta.title') }}</h2>
          <p class="ctaband__lead">{{ t('cta.lead') }}</p>
          <Button variant="gold" size="lg" @click="emit('explore')">{{ t('cta.button') }}</Button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ctaband { padding: 0 var(--gutter) 96px; }
.ctaband__container { padding: 0; }
.ctaband__panel {
  position: relative;
  overflow: hidden;
  border-radius: 32px;
  background: var(--grad-rose);
  box-shadow: var(--shadow-rose);
  padding: clamp(36px, 6vw, 64px);
  text-align: center;
}
.ctaband__plane { position: absolute; inset-inline-start: -30px; bottom: -30px; opacity: 0.16; }
.ctaband__content { position: relative; }
.ctaband__title { font-family: var(--font-display); font-weight: 800; font-size: clamp(26px, 4vw, 40px); color: #fff; margin: 0; }
.ctaband__lead { color: rgba(255, 255, 255, 0.92); font-size: 17px; margin: 14px auto 26px; max-width: 48ch; }
</style>
