<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { Card, Input, Button, Icon } from '@org/shared-ui';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const localePath = useLocalePath();
const { user, signOut } = useAuth();
const { profile, update } = useProfile();
const notify = useNotify();

useHead(() => ({ title: `${t('account.title')} · ${t('brand')}` }));

const form = reactive({ full_name: '', username: '', phone: '' });
const saving = ref(false);
const saved = ref(false);

watch(
  profile,
  (p) => {
    if (p) {
      form.full_name = p.full_name ?? '';
      form.username = p.username ?? '';
      form.phone = p.phone ?? '';
    }
  },
  { immediate: true }
);

async function save() {
  saving.value = true;
  saved.value = false;
  try {
    const ok = await update({ full_name: form.full_name, username: form.username, phone: form.phone });
    if (ok) {
      saved.value = true;
      notify.success(t('account.saved'));
    } else {
      notify.error(t('account.saveError'));
    }
  } catch {
    notify.error(t('account.saveError'));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="section">
    <div class="container account">
      <div class="account__head">
        <div class="account__avatar">
          <img v-if="profile?.avatar_url" :src="profile.avatar_url" alt="" >
          <Icon v-else name="user" :size="32" />
        </div>
        <div>
          <div class="eyebrow">{{ t('account.welcome') }}</div>
          <h1 class="account__name">{{ form.full_name || form.username || user?.email }}</h1>
        </div>
      </div>

      <div class="account__grid">
        <nav class="account__nav">
          <NuxtLink class="account__navlink account__navlink--active" :to="localePath('/account')">
            <Icon name="user" :size="18" />{{ t('account.title') }}
          </NuxtLink>
          <NuxtLink class="account__navlink" :to="localePath('/account/wishlist')">
            <Icon name="heart" :size="18" />{{ t('account.wishlist') }}
          </NuxtLink>
          <NuxtLink class="account__navlink" :to="localePath('/account/orders')">
            <Icon name="package" :size="18" />{{ t('account.orders') }}
          </NuxtLink>
          <button class="account__navlink account__navlink--signout" @click="signOut">
            <Icon name="log-out" :size="18" />{{ t('account.signOut') }}
          </button>
        </nav>

        <Card variant="elevated" padding="lg" class="account__panel">
          <form class="account__form" @submit.prevent="save">
            <Input v-model="form.username" :label="t('account.username')" />
            <Input v-model="form.full_name" :label="t('account.fullName')" />
            <Input v-model="form.phone" :label="t('account.phone')" />
            <Input :model-value="user?.email ?? ''" :label="t('account.email')" disabled />
            <div class="account__actions">
              <Button type="submit" :disabled="saving">
                {{ saving ? t('common.sending') : t('account.save') }}
              </Button>
              <span v-if="saved" class="account__saved"><Icon name="check" :size="16" />{{ t('account.saved') }}</span>
            </div>
          </form>
        </Card>
      </div>
    </div>
  </section>
</template>

<style scoped>
.account { max-width: 960px; }
.account__head { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.account__avatar {
  width: 64px; height: 64px; border-radius: 50%; overflow: hidden; flex: none;
  background: var(--rose-100); color: var(--brand-strong);
  display: inline-flex; align-items: center; justify-content: center;
}
.account__avatar img { width: 100%; height: 100%; object-fit: cover; }
.account__name { font-family: var(--font-display); font-weight: 800; font-size: var(--text-2xl); color: var(--text-strong); margin: 2px 0 0; }
.account__grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
@media (min-width: 860px) { .account__grid { grid-template-columns: 240px 1fr; } }
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
.account__form { display: grid; gap: 16px; }
.account__actions { display: flex; align-items: center; gap: 14px; }
.account__saved { display: inline-flex; align-items: center; gap: 6px; color: var(--success-500); font-size: 14px; font-weight: 700; }
</style>
