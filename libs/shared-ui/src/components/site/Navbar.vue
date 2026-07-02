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
    links?: NavLink[];
    active?: string;
    cta?: { label: string; href: string } | null;
    /** Label for the language toggle (e.g. "EN" or "ع"). */
    langLabel?: string;
  }>(),
  {
    brand: 'دُرّة',
    links: () => [],
    active: '',
    cta: () => ({ label: 'احجزي رحلتكِ', href: '#' }),
    langLabel: 'ع',
  }
);

const emit = defineEmits<{
  navigate: [href: string, event: MouseEvent];
  'toggle-lang': [];
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
        <b>{{ brand }}</b><span class="drh-nav__diamond" />
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
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.drh-nav__brand { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; text-decoration: none; }
.drh-nav__brand b {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 26px;
  color: var(--navy-900);
  letter-spacing: -0.01em;
}
.drh-nav__diamond {
  width: 12px;
  height: 12px;
  background: var(--grad-gold);
  transform: rotate(45deg);
  border-radius: 2px;
  box-shadow: var(--shadow-gold);
}
.drh-nav__links { display: flex; align-items: center; gap: 28px; }
.drh-nav__link {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 15px;
  color: var(--text-body);
  text-decoration: none;
  position: relative;
  padding: 6px 0;
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

@media (max-width: 860px) {
  .drh-nav__links { display: none; }
  .drh-nav__right .drh-nav__globe,
  .drh-nav__right .drh-nav__cta--desktop { display: none; }
  .drh-nav__burger { display: inline-flex; }
}
</style>
