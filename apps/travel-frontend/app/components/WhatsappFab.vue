<script setup lang="ts">
import { Icon } from '@org/shared-ui';
import { CONTACT } from '~/data/site';

const { t } = useI18n();

const href = CONTACT.whatsappHref;
</script>

<template>
  <a
    class="wa-fab"
    :href="href"
    target="_blank"
    rel="noopener"
    :aria-label="t('whatsapp.label')"
  >
    <Icon name="message-circle" :size="26" color="#fff" />
  </a>
</template>

<style scoped>
.wa-fab {
  position: fixed;
  inset-block-end: 22px;
  inset-inline-start: 22px;
  z-index: var(--z-toast);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--brand-solid);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-rose);
  transition: transform var(--dur-fast) var(--ease-standard), background var(--dur-base) var(--ease-standard);
}
.wa-fab:hover { background: var(--brand-strong); transform: translateY(-2px); }
.wa-fab:active { transform: scale(0.94); }
.wa-fab:focus-visible { outline: none; box-shadow: var(--ring-brand); }
</style>
