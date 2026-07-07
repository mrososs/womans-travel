<script setup lang="ts">
import { Icon } from '@org/shared-ui';

/**
 * AccountNav — the shared sidebar navigation for the account area. Highlights
 * the entry matching `active` and exposes a sign-out action.
 */
defineProps<{ active: 'profile' | 'wishlist' | 'orders' }>();

const { t } = useI18n();
const localePath = useLocalePath();
const { signOut } = useAuth();
</script>

<template>
  <nav class="account__nav">
    <NuxtLink
      class="account__navlink"
      :class="{ 'account__navlink--active': active === 'profile' }"
      :to="localePath('/account')"
    >
      <Icon name="user" :size="18" />{{ t('account.title') }}
    </NuxtLink>
    <NuxtLink
      class="account__navlink"
      :class="{ 'account__navlink--active': active === 'wishlist' }"
      :to="localePath('/account/wishlist')"
    >
      <Icon name="heart" :size="18" />{{ t('account.wishlist') }}
    </NuxtLink>
    <NuxtLink
      class="account__navlink"
      :class="{ 'account__navlink--active': active === 'orders' }"
      :to="localePath('/account/orders')"
    >
      <Icon name="package" :size="18" />{{ t('account.orders') }}
    </NuxtLink>
    <button class="account__navlink account__navlink--signout" @click="signOut">
      <Icon name="log-out" :size="18" />{{ t('account.signOut') }}
    </button>
  </nav>
</template>

<style scoped>
.account__nav { display: flex; flex-direction: column; gap: 4px; }
.account__navlink {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; border-radius: var(--radius-md);
  font-family: var(--font-body); font-weight: 600; font-size: 15px;
  color: var(--text-body); text-decoration: none; background: transparent;
  border: none; cursor: pointer; text-align: start; width: 100%;
  transition: background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard);
}
.account__navlink:hover { background: var(--rose-50); color: var(--brand-strong); }
.account__navlink--active { background: var(--rose-100); color: var(--brand-strong); }
.account__navlink--signout { color: var(--danger-500); margin-top: 8px; }
.account__navlink--signout:hover { background: var(--danger-100); color: var(--danger-500); }
</style>
