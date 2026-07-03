<script setup lang="ts">
import { ref, watch } from 'vue';
import { Icon } from '@org/shared-ui';

/**
 * OAuth / email-confirmation landing. supabase-js parses the session from the
 * URL automatically; once the user is populated we redirect to the account.
 * If the provider returns an error (expired/invalid link), surface it instead
 * of spinning forever.
 */
const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const user = useSupabaseUser();

const errored = ref(false);

// Supabase reports failures either as query params (PKCE) or in the URL hash
// (implicit flow) — check both so we never hang on the spinner.
function detectError() {
  if (route.query.error) return true;
  if (import.meta.client && window.location.hash) {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get('error')) return true;
  }
  return false;
}
errored.value = detectError();

useHead(() => ({ title: errored.value ? t('auth.linkExpired') : t('auth.completing') }));

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
    <div v-if="errored" class="auth-callback auth-callback--error">
      <span class="auth-callback__icon"><Icon name="circle-alert" :size="28" /></span>
      <p>{{ t('auth.linkExpired') }}</p>
      <NuxtLink :to="localePath('/auth/login')" class="auth-callback__link">{{ t('auth.backToLogin') }}</NuxtLink>
    </div>
    <div v-else class="auth-callback">
      <span class="auth-callback__spin"><Icon name="loader-circle" :size="28" /></span>
      <p>{{ t('auth.completing') }}</p>
    </div>
  </div>
</template>

<style scoped>
.auth-callback { text-align: center; color: var(--text-muted); display: grid; gap: 12px; justify-items: center; }
.auth-callback__spin { color: var(--brand); display: inline-flex; animation: auth-spin 1s linear infinite; }
.auth-callback--error .auth-callback__icon { color: var(--danger, #d33); display: inline-flex; }
.auth-callback__link { color: var(--brand); font-weight: 600; text-decoration: none; }
.auth-callback__link:hover { text-decoration: underline; }
@keyframes auth-spin { to { transform: rotate(360deg); } }
</style>
