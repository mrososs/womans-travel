<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { Card, Input, Button } from '@org/shared-ui';
import OAuthButtons from '~/components/auth/OAuthButtons.vue';

const { t } = useI18n();
const localePath = useLocalePath();
const { user, signInWithPassword } = useAuth();
const notify = useNotify();

useHead(() => ({ title: `${t('auth.login')} · ${t('brand')}` }));

const email = ref('');
const password = ref('');
const loading = ref(false);

watchEffect(() => {
  if (user.value) navigateTo(localePath('/account'));
});

async function submit() {
  if (!email.value || !password.value) return;
  loading.value = true;
  try {
    await signInWithPassword(email.value.trim(), password.value);
    notify.success(t('auth.welcome'));
    await navigateTo(localePath('/account'));
  } catch {
    notify.error(t('auth.loginError'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-wrap">
    <Card variant="elevated" padding="lg" class="auth-card">
      <h1 class="auth-title">{{ t('auth.login') }}</h1>
      <p class="auth-sub">{{ t('brand') }}</p>

      <form class="auth-form" @submit.prevent="submit">
        <Input v-model="email" type="email" :label="t('auth.email')" :placeholder="t('auth.emailPh')" required />
        <Input v-model="password" type="password" :label="t('auth.password')" :placeholder="t('auth.passwordPh')" required />
        <Button type="submit" size="lg" block :disabled="loading">
          {{ loading ? t('auth.signingIn') : t('auth.signIn') }}
        </Button>
      </form>

      <div class="auth-divider">{{ t('auth.orContinue') }}</div>
      <OAuthButtons />

      <p class="auth-alt">
        {{ t('auth.noAccount') }}
        <NuxtLink :to="localePath('/auth/register')">{{ t('auth.toRegister') }}</NuxtLink>
      </p>
    </Card>
  </div>
</template>
