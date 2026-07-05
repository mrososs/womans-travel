<script setup lang="ts">
import { Card, Icon } from '@org/shared-ui';
import PageHero from '~/components/PageHero.vue';
import ContactForm from '~/components/ContactForm.vue';
import { CONTACT } from '~/data/site';

const { t } = useI18n();
useHead(() => ({ title: `${t('contact.title')} · ${t('brand')}` }));

interface ContactRow {
  icon: string;
  label: string;
  value: string;
  dir?: string;
  href?: string;
  external?: boolean;
}

const info: ContactRow[] = [
  { icon: 'phone', label: 'contact.phoneLabel', value: CONTACT.phoneDisplay, dir: 'ltr', href: CONTACT.telHref },
  { icon: 'message-circle', label: 'contact.whatsappLabel', value: CONTACT.phoneDisplay, dir: 'ltr', href: CONTACT.whatsappHref, external: true },
  { icon: 'mail', label: 'contact.emailLabel', value: 'hello@durrah.travel', dir: 'ltr', href: 'mailto:hello@durrah.travel' },
  { icon: 'clock', label: 'contact.hoursLabel', value: 'contact.hoursValue' },
];
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('contact.eyebrow')"
      :title="t('contact.title')"
      :description="t('contact.lead')"
      icon="message-circle"
      grad="var(--grad-navy)"
    />

    <section class="section">
      <div class="container">
        <div class="contact-grid">
          <Card variant="elevated" padding="lg">
            <ContactForm />
          </Card>

          <div class="contact-info">
            <h2 class="contact-info__title">{{ t('contact.infoTitle') }}</h2>
            <div v-for="row in info" :key="row.label" class="contact-info__row">
              <span class="contact-info__icon"><Icon :name="row.icon" :size="20" /></span>
              <div>
                <div class="contact-info__label">{{ t(row.label) }}</div>
                <a
                  v-if="row.href"
                  class="contact-info__value contact-info__value--link"
                  :href="row.href"
                  :dir="row.dir"
                  :target="row.external ? '_blank' : undefined"
                  :rel="row.external ? 'noopener' : undefined"
                >{{ row.value }}</a>
                <div v-else class="contact-info__value" :dir="row.dir">
                  {{ row.value.startsWith('contact.') ? t(row.value) : row.value }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.contact-grid { display: grid; grid-template-columns: 1fr; gap: 32px; align-items: start; }
@media (min-width: 860px) { .contact-grid { grid-template-columns: 1.4fr 1fr; } }
.contact-info__title { font-family: var(--font-display); font-weight: 800; font-size: var(--text-xl); color: var(--text-strong); margin-bottom: 20px; }
.contact-info__row { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
.contact-info__icon {
  flex: none; width: 46px; height: 46px; border-radius: 14px;
  background: var(--rose-100); color: var(--brand-strong);
  display: inline-flex; align-items: center; justify-content: center;
}
.contact-info__label { font-family: var(--font-display); font-weight: 700; font-size: 14px; color: var(--text-strong); }
.contact-info__value { font-size: 14px; color: var(--text-muted); margin-top: 2px; }
.contact-info__value--link { display: inline-block; text-decoration: none; transition: color var(--dur-base) var(--ease-standard); }
.contact-info__value--link:hover { color: var(--brand-strong); }
</style>
