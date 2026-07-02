<script setup lang="ts">
import { computed } from 'vue';

// Drive <html dir/lang> from the active locale (RTL for ar, LTR for en).
const { locale, locales } = useI18n();
const dir = computed(
  () => locales.value.find((l) => (typeof l === 'string' ? l : l.code) === locale.value)?.dir ?? 'rtl'
);

useHead(() => ({
  htmlAttrs: { lang: locale.value, dir: dir.value },
}));
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
