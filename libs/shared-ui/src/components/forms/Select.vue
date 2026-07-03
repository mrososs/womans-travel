<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import Icon from '../display/Icon.vue';
import type { SelectOption } from '../../types';

/**
 * Select — custom accessible dropdown (listbox) styled with the design system.
 * Native <select> option menus are OS-rendered and can't be themed, so this
 * uses a fully styled popup instead. Same API as before: v-model + `options`,
 * with `label`, `placeholder`, `error`, `hint`, and the `iconStart` slot.
 */
const props = withDefaults(
  defineProps<{
    label?: string;
    id?: string;
    options?: SelectOption[] | null;
    placeholder?: string;
    error?: string;
    hint?: string;
  }>(),
  { options: null, error: '', hint: '' }
);

const model = defineModel<string>({ default: '' });

const generatedId = useId();
const rid = computed(() => props.id || `drh-select-${generatedId}`);
const message = computed(() => props.error || props.hint);
const classes = computed(() => ['drh-select', props.error ? 'drh-select--error' : '']);

const opts = computed<SelectOption[]>(() => props.options ?? []);
const selected = computed(() => opts.value.find((o) => o.value === model.value) ?? null);
const isPlaceholder = computed(() => !selected.value);
const displayLabel = computed(() => selected.value?.label ?? props.placeholder ?? '');

const root = ref<HTMLElement | null>(null);
const wrap = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const menu = ref<HTMLElement | null>(null);
const open = ref(false);
const active = ref(-1);
const optId = (i: number) => `${rid.value}-opt-${i}`;

/**
 * The menu is teleported to <body> and positioned as `fixed` so it escapes any
 * ancestor with `overflow: hidden`/`clip` (e.g. the hero, or a Dialog) that
 * would otherwise clip it. Position is recomputed on open + scroll + resize.
 */
const menuStyle = ref<Record<string, string>>({});

function updatePosition() {
  const w = wrap.value;
  if (!w || typeof window === 'undefined') return;
  const r = w.getBoundingClientRect();
  const gap = 6;
  const maxH = 264;
  const below = window.innerHeight - r.bottom;
  const flipUp = below < Math.min(maxH, 160) && r.top > below;
  const style: Record<string, string> = {
    position: 'fixed',
    left: `${Math.round(r.left)}px`,
    width: `${Math.round(r.width)}px`,
    maxHeight: `${Math.round(Math.min(maxH, (flipUp ? r.top : below) - gap - 8))}px`,
  };
  if (flipUp) style.bottom = `${Math.round(window.innerHeight - r.top + gap)}px`;
  else style.top = `${Math.round(r.bottom + gap)}px`;
  menuStyle.value = style;
}

function openMenu() {
  if (open.value) return;
  const i = opts.value.findIndex((o) => o.value === model.value);
  active.value = i >= 0 ? i : 0;
  // Compute position from the (already-rendered) trigger box BEFORE the menu
  // paints, so the teleported <ul> never flashes as a static block at the
  // bottom of <body> (below the footer).
  updatePosition();
  open.value = true;
  nextTick(scrollActiveIntoView);
}

function closeMenu(focusTrigger = false) {
  if (!open.value) return;
  open.value = false;
  active.value = -1;
  if (focusTrigger) trigger.value?.focus();
}

function toggle() {
  open.value ? closeMenu() : openMenu();
}

function choose(i: number) {
  const o = opts.value[i];
  if (!o) return;
  model.value = o.value;
  closeMenu(true);
}

function move(delta: number) {
  const n = opts.value.length;
  if (!n) return;
  active.value = active.value < 0 ? 0 : (active.value + delta + n) % n;
  scrollActiveIntoView();
}

function scrollActiveIntoView() {
  const el = menu.value?.querySelector<HTMLElement>(`#${CSS.escape(optId(active.value))}`);
  el?.scrollIntoView({ block: 'nearest' });
}

function onKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      open.value ? move(1) : openMenu();
      break;
    case 'ArrowUp':
      e.preventDefault();
      open.value ? move(-1) : openMenu();
      break;
    case 'Home':
      if (open.value) { e.preventDefault(); active.value = 0; scrollActiveIntoView(); }
      break;
    case 'End':
      if (open.value) { e.preventDefault(); active.value = opts.value.length - 1; scrollActiveIntoView(); }
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      open.value ? choose(active.value) : openMenu();
      break;
    case 'Escape':
      if (open.value) { e.preventDefault(); closeMenu(true); }
      break;
    case 'Tab':
      closeMenu();
      break;
  }
}

function onDocPointer(e: PointerEvent) {
  const t = e.target as Node;
  const inRoot = root.value?.contains(t);
  const inMenu = menu.value?.contains(t);
  if (!inRoot && !inMenu) closeMenu();
}

function onReposition() {
  if (open.value) updatePosition();
}

function bindGlobal() {
  if (typeof document === 'undefined') return;
  document.addEventListener('pointerdown', onDocPointer, true);
  window.addEventListener('scroll', onReposition, true);
  window.addEventListener('resize', onReposition);
}

function unbindGlobal() {
  if (typeof document === 'undefined') return;
  document.removeEventListener('pointerdown', onDocPointer, true);
  window.removeEventListener('scroll', onReposition, true);
  window.removeEventListener('resize', onReposition);
}

watch(open, (v) => (v ? bindGlobal() : unbindGlobal()));

onBeforeUnmount(unbindGlobal);
</script>

<template>
  <div :class="classes" ref="root">
    <label v-if="label" class="drh-select__label" :for="rid">{{ label }}</label>
    <div ref="wrap" class="drh-select__wrap" :class="{ 'drh-select__wrap--open': open }">
      <span v-if="$slots.iconStart" class="drh-select__ico"><slot name="iconStart" /></span>
      <button
        :id="rid"
        ref="trigger"
        type="button"
        class="drh-select__control"
        :class="{ 'drh-select__control--placeholder': isPlaceholder }"
        role="combobox"
        :aria-label="label || placeholder || undefined"
        aria-haspopup="listbox"
        :aria-expanded="open"
        :aria-controls="`${rid}-list`"
        :aria-activedescendant="open && active >= 0 ? optId(active) : undefined"
        @click="toggle"
        @keydown="onKeydown"
      >
        <span class="drh-select__value">{{ displayLabel }}</span>
      </button>
      <span class="drh-select__chev" :class="{ 'drh-select__chev--open': open }">
        <Icon name="chevron-down" :size="18" />
      </span>

      <Teleport to="body">
        <transition name="drh-select-pop">
          <ul
            v-if="open"
            :id="`${rid}-list`"
            ref="menu"
            class="drh-select__menu"
            role="listbox"
            :aria-label="label || placeholder"
            :style="menuStyle"
          >
            <li
              v-for="(o, i) in opts"
              :id="optId(i)"
              :key="o.value"
              class="drh-select__opt"
              :class="{
                'drh-select__opt--active': i === active,
                'drh-select__opt--selected': o.value === model,
              }"
              role="option"
              :aria-selected="o.value === model"
              @click="choose(i)"
              @pointermove="active = i"
            >
              <span class="drh-select__opt-label">{{ o.label }}</span>
              <Icon v-if="o.value === model" name="check" :size="16" class="drh-select__opt-check" />
            </li>
          </ul>
        </transition>
      </Teleport>
    </div>
    <span v-if="message" class="drh-select__msg">{{ message }}</span>
  </div>
</template>

<style>
.drh-select { display: flex; flex-direction: column; gap: 7px; font-family: var(--font-body); }
.drh-select__label { font-size: var(--text-sm); font-weight: var(--weight-bold); color: var(--text-strong); }
.drh-select__wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--surface-card);
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
  height: var(--tap-comfort);
  padding: 0 16px;
  transition: border-color var(--dur-base) var(--ease-standard),
    box-shadow var(--dur-base) var(--ease-standard);
}
.drh-select__wrap:hover { border-color: var(--border-strong); }
.drh-select__wrap:focus-within,
.drh-select__wrap--open { border-color: var(--brand); box-shadow: var(--ring-brand); }
.drh-select__control {
  appearance: none;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-strong);
  flex: 1;
  height: 100%;
  padding: 0;
  padding-inline-end: 26px;
  cursor: pointer;
  min-width: 0;
  display: flex;
  align-items: center;
  text-align: start;
}
.drh-select__value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* --text-muted (not --text-subtle) so the placeholder meets WCAG AA contrast. */
.drh-select__control--placeholder { color: var(--text-muted); }

.drh-select__chev {
  position: absolute;
  inset-inline-end: 14px;
  pointer-events: none;
  color: var(--text-muted);
  display: inline-flex;
  transition: transform var(--dur-base) var(--ease-standard);
}
.drh-select__chev--open { transform: rotate(180deg); }
.drh-select__chev svg { width: 18px; height: 18px; }
.drh-select__ico { display: inline-flex; color: var(--text-muted); margin-inline-end: 10px; flex: none; }
.drh-select__ico svg { width: 19px; height: 19px; }
.drh-select__msg { font-size: var(--text-xs); color: var(--text-muted); }
.drh-select--error .drh-select__wrap { border-color: var(--danger-500); }
.drh-select--error .drh-select__msg { color: var(--danger-500); }

/* Custom option menu — fully themed (OS can't style native <option>).
   Teleported to <body> and positioned via inline `fixed` styles so no
   ancestor `overflow: hidden` (hero, dialog) can clip it. */
.drh-select__menu {
  /* `fixed` (not `absolute`) so the teleported menu escapes ancestor overflow;
     exact left/top/width are set inline via `menuStyle`. Do NOT add
     top/left/inset here — an `inset-inline-*` would resolve to `right` in RTL
     and over-constrain the inline `left`, pinning the menu to the edge. */
  position: fixed;
  max-height: 264px;
  z-index: var(--z-modal);
  margin: 0;
  padding: 6px;
  list-style: none;
  overflow-y: auto;
  background: var(--surface-card);
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  -webkit-overflow-scrolling: touch;
}
.drh-select__opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  color: var(--text-strong);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard);
}
.drh-select__opt-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.drh-select__opt--active { background: var(--surface-sand); }
.drh-select__opt--selected { color: var(--brand); font-weight: var(--weight-bold); }
.drh-select__opt--selected.drh-select__opt--active { background: var(--brand-tint); }
.drh-select__opt-check { color: var(--brand); flex: none; }

.drh-select-pop-enter-active,
.drh-select-pop-leave-active {
  transition: opacity var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard);
  transform-origin: top center;
}
.drh-select-pop-enter-from,
.drh-select-pop-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }

@media (prefers-reduced-motion: reduce) {
  .drh-select__chev,
  .drh-select-pop-enter-active,
  .drh-select-pop-leave-active { transition: none; }
}
</style>
