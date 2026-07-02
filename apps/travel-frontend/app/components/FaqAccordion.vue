<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@org/shared-ui';

defineProps<{ items: { q: string; a: string }[] }>();

const open = ref<number | null>(0);
function toggle(i: number) {
  open.value = open.value === i ? null : i;
}
</script>

<template>
  <div class="faq">
    <div v-for="(item, i) in items" :key="i" class="faq__item" :class="{ open: open === i }">
      <button type="button" class="faq__q" :aria-expanded="open === i" @click="toggle(i)">
        <span>{{ item.q }}</span>
        <Icon name="chevron-down" :size="20" class="faq__chev" />
      </button>
      <div v-show="open === i" class="faq__a">{{ item.a }}</div>
    </div>
  </div>
</template>

<style scoped>
.faq { display: grid; gap: 12px; max-width: 760px; margin: 0 auto; }
.faq__item {
  background: var(--surface-card);
  border: 1px solid var(--border-hair);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: box-shadow var(--dur-base) var(--ease-standard);
}
.faq__item.open { box-shadow: var(--shadow-sm); }
.faq__q {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--text-base);
  color: var(--text-strong);
  text-align: start;
}
.faq__q:focus-visible { outline: none; box-shadow: var(--ring-brand); }
.faq__chev { flex: none; color: var(--text-muted); transition: transform var(--dur-base) var(--ease-standard); }
.faq__item.open .faq__chev { transform: rotate(180deg); color: var(--brand); }
.faq__a { padding: 0 20px 18px; color: var(--text-muted); font-size: 14.5px; line-height: 1.85; }
</style>
