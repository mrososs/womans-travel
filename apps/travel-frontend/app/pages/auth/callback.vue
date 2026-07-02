<script setup lang="ts">
import { watch } from 'vue';
import { Icon } from '@org/shared-ui';

/**
 * OAuth / email-confirmation landing. supabase-js parses the session from the
 * URL automatically; once the user is populated we redirect to the account.
 */
const { t } = useI18n();
const localePath = useLocalePath();
const user = useSupabaseUser();

useHead(() => ({ title: t('auth.completing') }));

watch(
  user,
  (u) => {
    if (u) navigateTo(localePath('/account'), { replace: true });
  },
  { immediate: true }
);
</script>

<template>
  <div class="auth-wrap">
    <div class="auth-callback">
      <span class="auth-callback__spin"><Icon name="loader-circle" :size="28" /></span>
      <p>{{ t('auth.completing') }}</p>
    </div>
  </div>
</template>

<style scoped>
.auth-callback { text-align: center; color: var(--text-muted); display: grid; gap: 12px; justify-items: center; }
.auth-callback__spin { color: var(--brand); display: inline-flex; animation: auth-spin 1s linear infinite; }
@keyframes auth-spin { to { transform: rotate(360deg); } }
</style>
