<script setup lang="ts">
import { computed } from 'vue';

// Drive <html dir/lang> from the active locale (RTL for ar, LTR for en).
const { locale, locales } = useI18n();
const dir = computed(
  () => locales.value.find((l) => (typeof l === 'string' ? l : l.code) === locale.value)?.dir ?? 'rtl'
);

// Browser-tab title: pages set their own title (page name); this appends the
// brand and provides a default, so every route has a proper tab title.
useHead(() => ({
  htmlAttrs: { lang: locale.value, dir: dir.value },
  titleTemplate: (title?: string) => {
    const brand = locale.value === 'ar' ? 'دُرّة' : 'Durrah';
    const home = locale.value === 'ar' ? 'دُرّة · سفر نسائي فاخر' : 'Durrah · Women’s luxury travel';
    if (!title) return home;
    return title.includes('دُرّة') || title.includes('Durrah') ? title : `${title} · ${brand}`;
  },
}));
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
