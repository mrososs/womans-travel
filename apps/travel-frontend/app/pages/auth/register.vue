<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { Card, Input, Button } from '@org/shared-ui';
import OAuthButtons from '~/components/auth/OAuthButtons.vue';

const { t } = useI18n();
const localePath = useLocalePath();
const { user, signUp } = useAuth();
const notify = useNotify();

useHead(() => ({ title: `${t('auth.register')} · ${t('brand')}` }));

const fullName = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const done = ref(false);

watchEffect(() => {
  if (user.value) navigateTo(localePath('/account'));
});

async function submit() {
  if (!email.value || !password.value) return;
  loading.value = true;
  try {
    await signUp(email.value.trim(), password.value, fullName.value.trim() || undefined);
    if (user.value) {
      notify.success(t('auth.created'));
    } else {
      // Email confirmation is on — no session yet.
      done.value = true;
      notify.info(t('auth.checkEmail'));
    }
  } catch {
    notify.error(t('auth.signupError'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-wrap">
    <Card variant="elevated" padding="lg" class="auth-card">
      <h1 class="auth-title">{{ t('auth.register') }}</h1>
      <p class="auth-sub">{{ t('brand') }}</p>

      <form class="auth-form" @submit.prevent="submit">
        <Input v-model="fullName" :label="t('auth.fullName')" :placeholder="t('auth.namePh')" />
        <Input v-model="email" type="email" :label="t('auth.email')" :placeholder="t('auth.emailPh')" required />
        <Input v-model="password" type="password" :label="t('auth.password')" :placeholder="t('auth.passwordPh')" required />
        <Button type="submit" size="lg" block :disabled="loading">
          {{ loading ? t('auth.signingIn') : t('auth.signUp') }}
        </Button>
        <p v-if="done" class="auth-note">{{ t('auth.checkEmail') }}</p>
      </form>

      <div class="auth-divider">{{ t('auth.orContinue') }}</div>
      <OAuthButtons />

      <p class="auth-alt">
        {{ t('auth.haveAccount') }}
        <NuxtLink :to="localePath('/auth/login')">{{ t('auth.toLogin') }}</NuxtLink>
      </p>
    </Card>
  </div>
</template>
