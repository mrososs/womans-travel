<script setup lang="ts">
import { ref } from 'vue';
import { Button, Input, Icon } from '@org/shared-ui';

const { t, locale } = useI18n();

const email = ref('');
const state = ref<'idle' | 'loading' | 'success' | 'error'>('idle');

async function submit() {
  if (!email.value.trim()) return;
  state.value = 'loading';
  try {
    await $fetch('/api/newsletter', {
      method: 'POST',
      body: { email: email.value.trim(), locale: locale.value },
    });
    state.value = 'success';
    email.value = '';
  } catch {
    state.value = 'error';
  }
}
</script>

<template>
  <section class="news">
    <div class="container">
      <div class="news__panel">
        <div class="news__text">
          <h2 class="news__title">{{ t('newsletter.title') }}</h2>
          <p class="news__lead">{{ t('newsletter.lead') }}</p>
        </div>
        <form class="news__form" @submit.prevent="submit">
          <div class="news__field">
            <Input
              v-model="email"
              type="email"
              :placeholder="t('newsletter.placeholder')"
              :aria-label="t('newsletter.placeholder')"
            >
              <template #iconStart><Icon name="mail" :size="18" /></template>
            </Input>
          </div>
          <Button type="submit" variant="gold" :disabled="state === 'loading'">
            {{ state === 'loading' ? t('common.sending') : t('newsletter.submit') }}
          </Button>
        </form>
        <p v-if="state === 'success'" class="news__msg news__msg--ok">{{ t('newsletter.success') }}</p>
        <p v-else-if="state === 'error'" class="news__msg news__msg--err">{{ t('newsletter.error') }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.news { padding: 0 var(--gutter) 96px; }
.news__panel {
  max-width: var(--container-xl);
  margin: 0 auto;
  background: var(--grad-navy);
  border-radius: 32px;
  padding: clamp(32px, 5vw, 56px);
  color: var(--text-on-navy);
  text-align: center;
}
.news__title { font-family: var(--font-display); font-weight: 800; font-size: clamp(24px, 3.5vw, 34px); color: #fff; margin: 0; }
.news__lead { color: var(--text-on-navy-muted); margin: 12px auto 24px; max-width: 46ch; }
.news__form { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.news__field { flex: 1 1 320px; max-width: 380px; text-align: start; }
.news__msg { margin: 14px 0 0; font-size: 14px; font-weight: 700; }
.news__msg--ok { color: var(--gold-300); }
.news__msg--err { color: #F6C9C4; }
</style>
