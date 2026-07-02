<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button, Select, Icon } from '@org/shared-ui';

/** HeroSearch — the hero booking search bar. Emits `search` on submit. */
const emit = defineEmits<{ search: [] }>();

const { t } = useI18n();

const destination = ref('');
const month = ref('');
const travellers = ref('');

const destinationOptions = computed(() => [
  { value: 'intl', label: t('hero.search.dest.intl') },
  { value: 'local', label: t('hero.search.dest.local') },
  { value: 'any', label: t('hero.search.dest.any') },
]);
const monthOptions = computed(() => [
  { value: '9', label: t('hero.search.months.9') },
  { value: '10', label: t('hero.search.months.10') },
  { value: '11', label: t('hero.search.months.11') },
]);
const travellerOptions = computed(() => [
  { value: '1', label: t('hero.search.pax.1') },
  { value: '2', label: t('hero.search.pax.2') },
  { value: '3', label: t('hero.search.pax.3') },
]);
</script>

<template>
  <div class="searchbar">
    <Select v-model="destination" :placeholder="t('hero.search.destination')" :options="destinationOptions">
      <template #iconStart><Icon name="map-pin" :size="18" /></template>
    </Select>
    <Select v-model="month" :placeholder="t('hero.search.month')" :options="monthOptions" />
    <Select v-model="travellers" :placeholder="t('hero.search.travellers')" :options="travellerOptions" />
    <span class="cta">
      <Button block size="lg" @click="emit('search')">
        <template #iconStart><Icon name="search" :size="19" /></template>
        {{ t('hero.search.submit') }}
      </Button>
    </span>
  </div>
</template>
