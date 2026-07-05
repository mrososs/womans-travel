<script setup lang="ts">
import { computed, ref } from 'vue';
import { Navbar, Footer } from '@org/shared-ui';
import WhatsappFab from '~/components/WhatsappFab.vue';
import CartDrawer from '~/components/cart/CartDrawer.vue';
import WishlistDrawer from '~/components/wishlist/WishlistDrawer.vue';
import { NAV, CONTACT } from '~/data/site';

const { t, locale } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();
const { isLoggedIn } = useAuth();
const { isAdmin } = useIsAdmin();
const { count: cartCount } = useCart();
const { count: wishlistCount } = useWishlist();
const notify = useNotify();

const active = computed(() => route.path);

const links = computed(() =>
  NAV.map((n) => ({
    label: t(`nav.${n.key}`),
    href: localePath(n.path) + (n.hash ?? ''),
  }))
);

const cta = computed(() => ({ label: t('nav.book'), href: localePath('/destinations') }));
const langLabel = computed(() => (locale.value === 'ar' ? 'EN' : 'ع'));

const footerColumns = computed(() => [
  {
    title: t('footer.colDestinations'),
    links: [
      { label: t('footer.links.intl'), href: localePath('/destinations') },
      { label: t('footer.links.local'), href: localePath('/destinations') },
      { label: t('footer.links.seasonal') },
      { label: t('footer.links.new') },
    ],
  },
  {
    title: t('footer.colAbout'),
    links: [
      { label: t('footer.links.about') },
      { label: t('footer.links.membership') },
      { label: t('footer.links.blog') },
      { label: t('footer.links.careers') },
    ],
  },
  {
    title: t('footer.colHelp'),
    links: [
      { label: t('footer.links.faq') },
      { label: t('footer.links.privacy') },
      { label: t('footer.links.terms') },
      { label: t('footer.links.contact') },
    ],
  },
]);

const cartOpen = ref(false);
const wishlistOpen = ref(false);

function onNavigate(href: string, event: MouseEvent) {
  if (href.startsWith('/')) {
    event.preventDefault();
    navigateTo(href);
  }
}
function toggleLang() {
  navigateTo(switchLocalePath(locale.value === 'ar' ? 'en' : 'ar'));
}
function onProfile() {
  navigateTo(localePath(isLoggedIn.value ? '/account' : '/auth/login'));
}
function onWishlist() {
  if (!isLoggedIn.value) {
    notify.error(t('wishlist.loginRequired'));
    return;
  }
  wishlistOpen.value = true;
}
</script>

<template>
  <div class="app-shell">
    <Navbar
      :brand="t('brand')"
      :links="links"
      :active="active"
      :cta="cta"
      :lang-label="langLabel"
      :cart-count="cartCount"
      :cart-label="t('cart.title')"
      show-wishlist
      :wishlist-count="wishlistCount"
      :wishlist-label="t('wishlist.title')"
      show-profile
      :profile-label="isLoggedIn ? t('auth.myAccount') : t('auth.login')"
      :show-dashboard="isAdmin"
      :dashboard-label="t('nav.dashboard')"
      @navigate="onNavigate"
      @toggle-lang="toggleLang"
      @cart="cartOpen = true"
      @wishlist="onWishlist"
      @profile="onProfile"
      @dashboard="navigateTo(localePath('/dashboard'))"
    />
    <main>
      <slot />
    </main>
    <Footer
      :brand="t('brand')"
      :blurb="t('footer.blurb')"
      :columns="footerColumns"
      :legal="t('footer.legal')"
      :seal="t('footer.seal')"
      :phone="CONTACT.phoneDisplay"
      :phone-href="CONTACT.telHref"
      :whatsapp-href="CONTACT.whatsappHref"
      @navigate="onNavigate"
    />
    <WhatsappFab />
    <CartDrawer v-model:open="cartOpen" />
    <WishlistDrawer v-model:open="wishlistOpen" />
  </div>
</template>
