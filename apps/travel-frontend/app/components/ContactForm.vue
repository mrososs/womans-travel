<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Button, Input, Icon } from '@org/shared-ui';

const { t } = useI18n();

const form = reactive({ name: '', email: '', phone: '', message: '' });
const state = ref<'idle' | 'loading' | 'success' | 'error'>('idle');

async function submit() {
  if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
  state.value = 'loading';
  try {
    await $fetch('/api/contact', { method: 'POST', body: { ...form } });
    state.value = 'success';
    form.name = form.email = form.phone = form.message = '';
  } catch {
    state.value = 'error';
  }
}
</script>

<template>
  <form class="cform" @submit.prevent="submit">
    <div class="cform__row">
      <Input v-model="form.name" :label="t('contact.name')" required />
      <Input v-model="form.email" type="email" :label="t('contact.email')" required />
    </div>
    <Input v-model="form.phone" :label="t('contact.phone')" />
    <div class="cform__field">
      <label class="cform__label" for="cform-msg">{{ t('contact.message') }}</label>
      <textarea id="cform-msg" v-model="form.message" class="cform__textarea" rows="5" required />
    </div>
    <Button type="submit" size="lg" :disabled="state === 'loading'">
      <template #iconStart><Icon name="send" :size="18" /></template>
      {{ state === 'loading' ? t('common.sending') : t('contact.submit') }}
    </Button>
    <p v-if="state === 'success'" class="cform__msg cform__msg--ok">{{ t('contact.success') }}</p>
    <p v-else-if="state === 'error'" class="cform__msg cform__msg--err">{{ t('contact.error') }}</p>
  </form>
</template>

<style scoped>
.cform { display: grid; gap: 16px; }
.cform__row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.cform__field { display: flex; flex-direction: column; gap: 7px; }
.cform__label { font-size: var(--text-sm); font-weight: var(--weight-bold); color: var(--text-strong); }
.cform__textarea {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-strong);
  background: var(--surface-card);
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  resize: vertical;
  transition: border-color var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard);
}
.cform__textarea:focus { outline: none; border-color: var(--brand); box-shadow: var(--ring-brand); }
.cform__msg { margin: 0; font-size: 14px; font-weight: 700; }
.cform__msg--ok { color: var(--success-500); }
.cform__msg--err { color: var(--danger-500); }
@media (max-width: 560px) { .cform__row { grid-template-columns: 1fr; } }
</style>
