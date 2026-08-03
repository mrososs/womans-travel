<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@org/shared-ui';

const { t, locale } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();
const { user, signOut } = useAuth();
const { profile } = useProfile();

const langLabel = computed(() => (locale.value === 'ar' ? 'English' : 'العربية'));
function toggleLang() {
  navigateTo(switchLocalePath(locale.value === 'ar' ? 'en' : 'ar'));
}

const nav = computed(() => [
  { key: 'overview', to: localePath('/dashboard'), icon: 'layout-dashboard' },
  { key: 'orders', to: localePath('/dashboard/orders'), icon: 'package' },
  { key: 'deposits', to: localePath('/dashboard/deposits'), icon: 'wallet' },
  { key: 'trips', to: localePath('/dashboard/trips'), icon: 'compass' },
  { key: 'packages', to: localePath('/dashboard/packages'), icon: 'crown' },
  { key: 'settings', to: localePath('/dashboard/settings'), icon: 'building-2' },
]);

function isActive(to: string) {
  return route.path === to;
}
</script>

<template>
  <div class="dash">
    <aside class="dash__side">
      <NuxtLink :to="localePath('/')" class="dash__brand">
        <span class="dash__logo"><img src="/brand/logo-mark.png" :alt="t('brand')"></span>
        <b>{{ t('brand') }}</b>
      </NuxtLink>
      <div class="dash__eyebrow">{{ t('dashboard.adminArea') }}</div>
      <nav class="dash__nav">
        <NuxtLink
          v-for="item in nav"
          :key="item.key"
          :to="item.to"
          :class="['dash__navlink', { 'dash__navlink--active': isActive(item.to) }]"
        >
          <Icon :name="item.icon" :size="18" />{{ t(`dashboard.nav.${item.key}`) }}
        </NuxtLink>
      </nav>
      <div class="dash__spacer" />
      <NuxtLink :to="localePath('/')" class="dash__navlink">
        <Icon name="arrow-left" :size="18" />{{ t('dashboard.backToSite') }}
      </NuxtLink>
      <button type="button" class="dash__navlink dash__navlink--signout" @click="signOut">
        <Icon name="log-out" :size="18" />{{ t('account.signOut') }}
      </button>
    </aside>

    <div class="dash__main">
      <header class="dash__topbar">
        <div>
          <div class="eyebrow">{{ t('dashboard.adminArea') }}</div>
          <h1 class="dash__title">{{ t('dashboard.title') }}</h1>
        </div>
        <div class="dash__user">
          <button type="button" class="dash__lang" :aria-label="langLabel" @click="toggleLang">
            <Icon name="globe" :size="17" />{{ langLabel }}
          </button>
          <div class="dash__username">{{ profile?.full_name || user?.email }}</div>
          <div class="dash__avatar"><Icon name="user" :size="18" /></div>
        </div>
      </header>
      <main class="dash__content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.dash { display: flex; min-height: 100vh; background: var(--surface-page); }
.dash__side {
  flex: none; width: 248px;
  background: var(--surface-navy, var(--navy-900)); color: var(--text-on-navy, #fff);
  padding: 24px 16px; display: flex; flex-direction: column; gap: 6px;
  position: sticky; top: 0; height: 100vh;
}
.dash__brand { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: #fff; }
.dash__brand b { font-family: var(--font-display); font-weight: 800; font-size: 20px; }
.dash__logo { display: inline-flex; padding: 5px 7px; background: #fff; border-radius: var(--radius-sm); flex: none; }
.dash__logo img { display: block; height: 30px; width: auto; }
.dash__diamond { width: 10px; height: 10px; background: var(--grad-gold, var(--gold-500)); transform: rotate(45deg); border-radius: 2px; }
.dash__eyebrow {
  font-family: var(--font-display); font-weight: 800; font-size: 12px;
  color: var(--gold-300); letter-spacing: 0.04em; margin: 18px 4px 8px;
}
.dash__nav { display: flex; flex-direction: column; gap: 4px; }
.dash__spacer { flex: 1; }
.dash__navlink {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 13px; border-radius: var(--radius-md);
  font-family: var(--font-body); font-weight: 600; font-size: 15px;
  color: rgba(255,255,255,0.8); text-decoration: none; background: transparent;
  border: none; cursor: pointer; text-align: start; width: 100%;
  transition: background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard);
}
.dash__navlink:hover { background: rgba(255,255,255,0.08); color: #fff; }
.dash__navlink--active { background: var(--brand); color: #fff; }
.dash__navlink--signout { color: var(--rose-200); }
.dash__navlink--signout:hover { background: rgba(255,255,255,0.08); color: #fff; }

.dash__main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.dash__topbar {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 22px clamp(16px, 3vw, 40px);
  background: var(--surface-card); border-bottom: 1px solid var(--border-hair);
}
.dash__title { font-family: var(--font-display); font-weight: 800; font-size: var(--text-2xl); color: var(--text-strong); margin: 2px 0 0; }
.dash__user { display: flex; align-items: center; gap: 12px; }
.dash__lang {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: var(--radius-pill);
  border: 1.5px solid var(--border-default); background: var(--surface-card);
  color: var(--text-body); font-family: var(--font-body); font-weight: 700; font-size: 13px;
  cursor: pointer; transition: background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard);
}
.dash__lang:hover { background: var(--rose-50); color: var(--brand-strong); border-color: var(--brand); }
.dash__lang:focus-visible { outline: none; box-shadow: var(--ring-brand); }
.dash__username { font-size: 14px; font-weight: 600; color: var(--text-body); }

@media (max-width: 620px) {
  .dash__username { display: none; }
}
.dash__avatar {
  width: 40px; height: 40px; border-radius: 50%; flex: none;
  background: var(--rose-100); color: var(--brand-strong);
  display: inline-flex; align-items: center; justify-content: center;
}
.dash__content { padding: clamp(16px, 3vw, 40px); flex: 1; }

@media (max-width: 860px) {
  .dash { flex-direction: column; }
  .dash__side {
    width: 100%; height: auto; position: static;
    flex-direction: row; align-items: center; flex-wrap: wrap; gap: 8px; padding: 14px 16px;
  }
  .dash__eyebrow { display: none; }
  .dash__spacer { display: none; }
  .dash__nav { flex-direction: row; }
  .dash__brand { margin-inline-end: auto; }
}
</style>

<!-- Global print rules: strip the app chrome so the report prints cleanly to PDF -->
<style>
.print-only { display: none; }

@media print {
  .dash__side,
  .dash__topbar,
  .no-print { display: none !important; }

  .dash,
  .dash__main,
  .dash__content {
    display: block !important;
    height: auto !important;
    padding: 0 !important;
    background: #fff !important;
  }

  .print-only { display: flex !important; }

  /* Preserve brand colours (charts, cards, badges) in the printed PDF */
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

  /* Keep cards from splitting awkwardly across pages */
  .drh-card { box-shadow: none !important; border: 1px solid var(--border-soft) !important; break-inside: avoid; }

  @page { margin: 14mm; }
}
</style>
