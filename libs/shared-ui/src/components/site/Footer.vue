<script setup lang="ts">
import Icon from '../display/Icon.vue';
import type { FooterColumn } from '../../types';

/**
 * Footer — responsive navy site footer with brand blurb, link columns,
 * socials, and a legal bar.
 */
withDefaults(
  defineProps<{
    brand?: string;
    blurb?: string;
    columns?: FooterColumn[];
    socials?: string[];
    legal?: string;
    seal?: string;
  }>(),
  {
    brand: 'test',
    blurb: '',
    columns: () => [],
    socials: () => ['instagram', 'twitter', 'facebook'],
    legal: '',
    seal: 'رحلات نسائية بالكامل · خصوصية تامّة',
  }
);

const emit = defineEmits<{ navigate: [href: string, event: MouseEvent] }>();
</script>

<template>
  <footer id="footer" class="drh-footer">
    <div class="drh-footer__inner">
      <div class="drh-footer__top">
        <div class="drh-footer__brand">
          <b>{{ brand }}<span class="d" /></b>
          <p v-if="blurb">{{ blurb }}</p>
          <div class="drh-footer__socials">
            <a
              v-for="s in socials"
              :key="s"
              class="drh-footer__soc"
              :aria-label="s"
              href="#"
              @click.prevent
            ><Icon :name="s" :size="18" /></a>
          </div>
        </div>
        <div v-for="col in columns" :key="col.title" class="drh-footer__col">
          <h4>{{ col.title }}</h4>
          <ul>
            <li v-for="l in col.links" :key="l.label">
              <a
                :href="l.href || '#'"
                @click="l.href ? emit('navigate', l.href, $event) : $event.preventDefault()"
              >{{ l.label }}</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="drh-footer__bar">
        <span>{{ legal || `© ${brand}. جميع الحقوق محفوظة.` }}</span>
        <span class="drh-footer__seal">
          <Icon name="shield-check" :size="15" color="var(--gold-400)" />{{ seal }}
        </span>
      </div>
    </div>
  </footer>
</template>

<style>
.drh-footer { background: var(--surface-navy); color: var(--text-on-navy); font-family: var(--font-body); }
.drh-footer__inner { max-width: var(--container-xl); margin: 0 auto; padding: var(--space-16) var(--gutter) var(--space-8); }
.drh-footer__top { display: grid; grid-template-columns: 1.6fr repeat(3, 1fr); gap: 40px; }
.drh-footer__brand b {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 28px;
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.drh-footer__brand .d { width: 12px; height: 12px; background: var(--grad-gold); transform: rotate(45deg); border-radius: 2px; }
.drh-footer__brand p { color: var(--text-on-navy-muted); font-size: 14px; line-height: 1.8; margin: 14px 0 0; max-width: 320px; }
.drh-footer__socials { display: flex; gap: 10px; margin-top: 20px; }
.drh-footer__soc {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: var(--text-on-navy);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--dur-base) var(--ease-standard), border-color var(--dur-base);
}
.drh-footer__soc:hover { background: rgba(255, 255, 255, 0.1); border-color: var(--gold-400); color: var(--gold-300); }
.drh-footer__col h4 { font-family: var(--font-display); font-weight: 700; font-size: 14px; color: #fff; margin: 0 0 16px; }
.drh-footer__col ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 11px; }
.drh-footer__col a { color: var(--text-on-navy-muted); font-size: 14px; text-decoration: none; transition: color var(--dur-base) var(--ease-standard); }
.drh-footer__col a:hover { color: var(--gold-300); }
.drh-footer__bar {
  margin-top: var(--space-12);
  padding-top: var(--space-6);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--text-on-navy-muted);
  font-size: 13px;
}
.drh-footer__seal { display: inline-flex; align-items: center; gap: 6px; }

@media (max-width: 860px) {
  .drh-footer__top { grid-template-columns: 1fr 1fr; gap: 32px; }
  .drh-footer__brand { grid-column: 1 / -1; }
}
@media (max-width: 520px) {
  .drh-footer__top { grid-template-columns: 1fr; }
}
</style>
