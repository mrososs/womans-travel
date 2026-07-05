<script setup lang="ts">
import { ref } from 'vue';
import Button from '../actions/Button.vue';
import Icon from '../display/Icon.vue';
import type { NavLink } from '../../types';

/**
 * Navbar — responsive site header. Inline links on desktop; hamburger drawer
 * on mobile. Brand on the (RTL) right, CTA + language on the left.
 * Emits `navigate` with the href and the click event so the host app can
 * intercept for SPA routing (call `event.preventDefault()` then route).
 */
withDefaults(
  defineProps<{
    brand?: string;
    /** Optional brand mark image (shown before the brand text). */
    logo?: string;
    /** When the logo already contains the wordmark, hide the text brand. */
    logoOnly?: boolean;
    links?: NavLink[];
    active?: string;
    cta?: { label: string; href: string } | null;
    /** Label for the language toggle (e.g. "EN" or "ع"). */
    langLabel?: string;
    /** Cart item count; when defined, a cart button is shown. */
    cartCount?: number;
    cartLabel?: string;
    /** Show a wishlist (heart) button with optional count. */
    showWishlist?: boolean;
    wishlistCount?: number;
    wishlistLabel?: string;
    /** Show a profile (user) button. */
    showProfile?: boolean;
    profileLabel?: string;
    /** Show a "go to dashboard" button (admins only). */
    showDashboard?: boolean;
    dashboardLabel?: string;
  }>(),
  {
    brand: 'رحلات المستقبل الذهبي',
    logo: '',
    logoOnly: false,
    links: () => [],
    active: '',
    cta: () => ({ label: 'احجزي رحلتكِ', href: '#' }),
    langLabel: 'ع',
    cartCount: undefined,
    cartLabel: 'السلة',
    showWishlist: false,
    wishlistCount: 0,
    wishlistLabel: 'المفضّلة',
    showProfile: false,
    profileLabel: 'حسابي',
    showDashboard: false,
    dashboardLabel: 'لوحة التحكم',
  }
);

const emit = defineEmits<{
  navigate: [href: string, event: MouseEvent];
  'toggle-lang': [];
  cart: [];
  wishlist: [];
  profile: [];
  dashboard: [];
}>();

const open = ref(false);

function go(href: string, event: MouseEvent) {
  emit('navigate', href, event);
  open.value = false;
}
</script>

<template>
  <header class="drh-nav">
    <div class="drh-nav__bar">
      <a
        class="drh-nav__brand"
        :href="links[0] ? links[0].href : '#'"
        @click="go(links[0] ? links[0].href : '#', $event)"
      >
        <img
          v-if="logo"
          :src="logo"
          :class="['drh-nav__logo', { 'drh-nav__logo--full': logoOnly }]"
          :alt="brand"
        >
        <b v-if="!logoOnly">{{ brand }}</b>
        <span v-if="!logo" class="drh-nav__diamond" />
      </a>

      <nav class="drh-nav__links">
        <a
          v-for="l in links"
          :key="l.href"
          :href="l.href"
          class="drh-nav__link"
          :aria-current="active === l.href ? 'page' : undefined"
          @click="go(l.href, $event)"
        >{{ l.label }}</a>
      </nav>

      <div class="drh-nav__right">
        <button
          v-if="showDashboard"
          type="button"
          class="drh-nav__cart drh-nav__dashboard"
          :aria-label="dashboardLabel"
          :title="dashboardLabel"
          @click="emit('dashboard')"
        >
          <Icon name="layout-dashboard" :size="20" />
        </button>
        <button
          v-if="showWishlist"
          type="button"
          class="drh-nav__cart"
          :aria-label="wishlistLabel"
          @click="emit('wishlist')"
        >
          <Icon name="heart" :size="20" />
          <span v-if="wishlistCount > 0" class="drh-nav__cartbadge">{{ wishlistCount }}</span>
        </button>
        <button
          v-if="cartCount !== undefined"
          type="button"
          class="drh-nav__cart"
          :aria-label="cartLabel"
          @click="emit('cart')"
        >
          <Icon name="shopping-bag" :size="20" />
          <span v-if="cartCount > 0" class="drh-nav__cartbadge">{{ cartCount }}</span>
        </button>
        <button
          v-if="showProfile"
          type="button"
          class="drh-nav__cart"
          :aria-label="profileLabel"
          @click="emit('profile')"
        >
          <Icon name="user" :size="20" />
        </button>
        <button type="button" class="drh-nav__globe" @click="emit('toggle-lang')">
          <Icon name="globe" :size="17" />{{ langLabel }}
        </button>
        <span v-if="cta" class="drh-nav__cta--desktop">
          <Button size="sm" :href="cta.href" @click="go(cta.href, $event)">{{ cta.label }}</Button>
        </span>
        <button
          class="drh-nav__burger"
          :aria-label="open ? 'إغلاق القائمة' : 'فتح القائمة'"
          @click="open = !open"
        >
          <Icon :name="open ? 'x' : 'menu'" :size="22" />
        </button>
      </div>
    </div>

    <div :class="['drh-nav__drawer', { open }]">
      <div class="drh-nav__drawerinner">
        <a
          v-for="l in links"
          :key="l.href"
          :href="l.href"
          class="drh-nav__link"
          :aria-current="active === l.href ? 'page' : undefined"
          @click="go(l.href, $event)"
        >{{ l.label }}</a>
        <button type="button" class="drh-nav__globe" @click="emit('toggle-lang'); open = false">
          <Icon name="globe" :size="17" />{{ langLabel }}
        </button>
        <div v-if="cta" class="drh-nav__cta">
          <Button block :href="cta.href" @click="go(cta.href, $event)">{{ cta.label }}</Button>
        </div>
      </div>
    </div>
  </header>
</template>

<style>
.drh-nav {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  font-family: var(--font-body);
  background: var(--glass-bg);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border-bottom: 1px solid var(--border-hair);
}
.drh-nav__bar {
  max-width: var(--container-xl);
  margin: 0 auto;
  padding: 0 var(--gutter);
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.drh-nav__brand { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; text-decoration: none; flex-shrink: 0; min-width: 0; }
.drh-nav__logo {
  height: 38px;
  width: auto;
  flex-shrink: 0;
  transition: transform var(--dur-base) var(--ease-out);
}
/* Full lockup (plane + camel + wordmark). Taller than the mark-only variant so
   the baked-in wordmark stays legible; the bar grows to fit it. */
.drh-nav__logo--full {
  height: 70px;
  object-fit: contain;
}
.drh-nav__brand:hover .drh-nav__logo { transform: translateY(-1px) scale(1.04); }
.drh-nav__brand b {
  font-family: var(--font-display);
  font-weight: 800;
  /* Scales with viewport so the (longer) brand name stays on one line
     from mobile up to desktop without crowding the nav links. */
  font-size: clamp(15px, 0.9vw + 8px, 20px);
  line-height: 1.15;
  white-space: nowrap;
  color: var(--navy-900);
  letter-spacing: -0.01em;
}
.drh-nav__diamond {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  background: var(--grad-gold);
  transform: rotate(45deg);
  border-radius: 2px;
  box-shadow: var(--shadow-gold);
}
.drh-nav__links { display: flex; align-items: center; gap: clamp(14px, 1.6vw, 28px); }
.drh-nav__link {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 15px;
  color: var(--text-body);
  text-decoration: none;
  position: relative;
  padding: 6px 0;
  white-space: nowrap;
  transition: color var(--dur-base) var(--ease-standard);
}
.drh-nav__link:hover { color: var(--brand-strong); }
.drh-nav__link[aria-current='page'] { color: var(--brand-strong); }
.drh-nav__link[aria-current='page']::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  bottom: -2px;
  height: 2px;
  background: var(--brand);
  border-radius: 2px;
}
.drh-nav__right { display: flex; align-items: center; gap: 14px; }
.drh-nav__globe {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  border: none;
  background: transparent;
  font-family: inherit;
  padding: 6px 4px;
  transition: color var(--dur-base) var(--ease-standard);
}
.drh-nav__globe:hover { color: var(--brand-strong); }
.drh-nav__globe:focus-visible { outline: none; box-shadow: var(--ring-brand); border-radius: var(--radius-xs); }
.drh-nav__drawer .drh-nav__globe { padding: 14px 0; border-bottom: 1px solid var(--border-hair); }
.drh-nav__cart {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--navy-900);
  cursor: pointer;
  transition: background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard);
}
.drh-nav__cart:hover { background: var(--rose-50); color: var(--brand-strong); }
.drh-nav__cart:focus-visible { outline: none; box-shadow: var(--ring-brand); }
.drh-nav__dashboard { color: var(--brand-strong); background: var(--rose-50); }
.drh-nav__dashboard:hover { background: var(--grad-gold, var(--rose-50)); color: var(--navy-900); }
.drh-nav__cartbadge {
  position: absolute;
  top: 2px;
  inset-inline-start: 2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--radius-pill);
  background: var(--brand-solid);
  color: #fff;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.drh-nav__burger {
  display: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1.5px solid var(--border-default);
  background: var(--surface-card);
  color: var(--navy-900);
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.drh-nav__drawer { display: none; }
.drh-nav__drawer.open { display: block; }
.drh-nav__drawerinner {
  padding: 8px var(--gutter) 22px;
  border-top: 1px solid var(--border-hair);
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--surface-page);
  animation: drh-nav-drop var(--dur-base) var(--ease-out);
}
@keyframes drh-nav-drop { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
.drh-nav__drawer .drh-nav__link { padding: 14px 0; font-size: 17px; border-bottom: 1px solid var(--border-hair); }
.drh-nav__drawer .drh-nav__cta { margin-top: 14px; }

/* Longer brand name needs more room, so the inline links collapse into the
   burger drawer earlier than the original 860px. */
@media (max-width: 1160px) {
  .drh-nav__links { display: none; }
  .drh-nav__right .drh-nav__globe,
  .drh-nav__right .drh-nav__cta--desktop { display: none; }
  .drh-nav__burger { display: inline-flex; }
}

/* On phones the brand name + action icons can't both fit at full size, so
   shrink the name and tighten spacing. It stays flexible (min-width:0 +
   ellipsis) so it can never push the row into horizontal overflow. */
@media (max-width: 560px) {
  .drh-nav__bar { gap: 8px; padding: 0 14px; height: 74px; }
  .drh-nav__brand { flex-shrink: 1; gap: 6px; }
  .drh-nav__brand b {
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
  .drh-nav__diamond { width: 9px; height: 9px; }
  .drh-nav__logo { height: 30px; }
  .drh-nav__logo--full { height: 54px; }
  .drh-nav__right { gap: 8px; }
}
</style>
