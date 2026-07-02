<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@org/shared-ui';

const { t } = useI18n();
const { signInWithOAuth } = useAuth();

const loading = ref<'' | 'google' | 'facebook'>('');

async function go(provider: 'google' | 'facebook') {
  loading.value = provider;
  try {
    await signInWithOAuth(provider);
  } catch {
    loading.value = '';
  }
}
</script>

<template>
  <div class="oauth">
    <Button variant="outline" block :disabled="loading !== ''" @click="go('google')">
      <template #iconStart>
        <svg class="oauth__icon" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.9 6.1C12.3 13.2 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-3.9 6.8-9.7 6.8-17.4z" />
          <path fill="#FBBC05" d="M10.4 28.3c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C.9 16.1 0 19.9 0 23.7s.9 7.6 2.5 10.7l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.6 2.3-8.6 2.3-6.3 0-11.7-3.7-13.6-9.8l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
        </svg>
      </template>
      {{ t('auth.google') }}
    </Button>

    <Button variant="outline" block :disabled="loading !== ''" @click="go('facebook')">
      <template #iconStart>
        <svg class="oauth__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
        </svg>
      </template>
      {{ t('auth.facebook') }}
    </Button>
  </div>
</template>

<style scoped>
.oauth { display: grid; gap: 12px; }
.oauth__icon { width: 20px; height: 20px; }
</style>
