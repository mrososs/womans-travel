<script setup lang="ts">
import { STATS } from '~/data/site';

const { lc } = useLocalize();
</script>

<template>
  <section class="statsband">
    <div class="container">
      <div class="stats">
        <div v-for="s in STATS" :key="s.l.en" class="statsband__item">
          <div class="statsband__n">{{ lc(s.n) }}</div>
          <div class="statsband__l">{{ lc(s.l) }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.statsband { background: var(--grad-navy); padding: 56px 0; }
.statsband__item { text-align: center; }
.statsband__n { font-family: var(--font-display); font-weight: 800; font-size: clamp(30px, 5vw, 44px); color: var(--gold-300); }
.statsband__l { color: var(--text-on-navy-muted); font-size: 14px; margin-top: 4px; }
</style>
