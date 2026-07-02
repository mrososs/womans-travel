<script setup lang="ts">
import { computed } from 'vue';
import { Navbar, Footer } from '@org/shared-ui';
import WhatsappFab from '~/components/WhatsappFab.vue';
import { NAV } from '~/data/site';

const { t, locale } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();
const { isLoggedIn } = useAuth();

const active = computed(() => route.path);

const links = computed(() => {
  const base = NAV.map((n) => ({
    label: t(`nav.${n.key}`),
    href: localePath(n.path) + (n.hash ?? ''),
  }));
  base.push(
    isLoggedIn.value
      ? { label: t('auth.myAccount'), href: localePath('/account') }
      : { label: t('auth.login'), href: localePath('/auth/login') }
  );
  return base;
});

const cta = computed(() => ({ label: t('nav.book'), href: localePath('/destinations') }));

// Show the language you'll switch TO.
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

function onNavigate(href: string, event: MouseEvent) {
  if (href.startsWith('/')) {
    event.preventDefault();
    navigateTo(href);
  }
}

function toggleLang() {
  navigateTo(switchLocalePath(locale.value === 'ar' ? 'en' : 'ar'));
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
      @navigate="onNavigate"
      @toggle-lang="toggleLang"
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
      @navigate="onNavigate"
    />
    <WhatsappFab />
  </div>
</template>
