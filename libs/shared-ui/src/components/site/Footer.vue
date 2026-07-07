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
    /** Optional brand lockup image; shown on a light chip in place of the text wordmark. */
    logo?: string;
    blurb?: string;
    columns?: FooterColumn[];
    socials?: string[];
    legal?: string;
    seal?: string;
    /** Display phone number (e.g. local format). */
    phone?: string;
    /** tel: link for the phone number. */
    phoneHref?: string;
    /** wa.me link for WhatsApp contact. */
    whatsappHref?: string;
    /** Display email address (e.g. info@example.com). */
    email?: string;
    /** mailto: link for the email address. */
    emailHref?: string;
    /** Show the accepted-payment-methods strip (mada / Visa / Mastercard). */
    showPayments?: boolean;
    /** Label shown above the payment brand marks. */
    paymentsLabel?: string;
  }>(),
  {
    brand: 'رحلات المستقبل الذهبي',
    logo: '',
    blurb: '',
    columns: () => [],
    socials: () => ['instagram', 'twitter', 'facebook'],
    legal: '',
    seal: 'رحلات نسائية بالكامل · خصوصية تامّة',
    phone: '',
    phoneHref: '',
    whatsappHref: '',
    email: '',
    emailHref: '',
    showPayments: false,
    paymentsLabel: 'ندعم الدفع الآمن والسريع',
  }
);

const emit = defineEmits<{ navigate: [href: string, event: MouseEvent] }>();
</script>

<template>
  <footer id="footer" class="drh-footer">
    <div class="drh-footer__inner">
      <div class="drh-footer__top">
        <div class="drh-footer__brand">
          <span v-if="logo" class="drh-footer__logo">
            <img :src="logo" :alt="brand" loading="lazy">
          </span>
          <b v-else>{{ brand }}<span class="d" /></b>
          <p v-if="blurb">{{ blurb }}</p>
          <div v-if="phone || email" class="drh-footer__contact">
            <a v-if="phoneHref" class="drh-footer__contactrow" :href="phoneHref">
              <Icon name="phone" :size="16" color="var(--gold-400)" />
              <span dir="ltr">{{ phone }}</span>
            </a>
            <a
              v-if="whatsappHref"
              class="drh-footer__contactrow"
              :href="whatsappHref"
              target="_blank"
              rel="noopener"
            >
              <Icon name="message-circle" :size="16" color="var(--gold-400)" />
              <span dir="ltr">{{ phone }}</span>
            </a>
            <a v-if="email" class="drh-footer__contactrow" :href="emailHref || `mailto:${email}`">
              <Icon name="mail" :size="16" color="var(--gold-400)" />
              <span dir="ltr">{{ email }}</span>
            </a>
          </div>
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
          <h2>{{ col.title }}</h2>
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

      <div v-if="showPayments" class="drh-footer__pay">
        <span class="drh-footer__pay-label">
          <Icon name="lock" :size="14" color="var(--gold-400)" />{{ paymentsLabel }}
        </span>
        <ul class="drh-footer__pay-marks">
          <!-- mada -->
          <li class="drh-pay" aria-label="mada">
            <svg viewBox="0 0 60 24" role="img" aria-hidden="true">
              <text x="30" y="11" text-anchor="middle" font-family="Tahoma, Arial, sans-serif"
                    font-size="9" font-weight="700" fill="#231F20">مدى</text>
              <text x="30" y="21" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
                    font-size="9" font-weight="800" letter-spacing="0.5" fill="#84B740">mada</text>
            </svg>
          </li>
          <!-- Visa -->
          <li class="drh-pay" aria-label="Visa">
            <svg viewBox="0 0 60 24" role="img" aria-hidden="true">
              <text x="30" y="17" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
                    font-size="15" font-style="italic" font-weight="800" letter-spacing="1"
                    fill="#1434CB">VISA</text>
            </svg>
          </li>
          <!-- Mastercard -->
          <li class="drh-pay" aria-label="Mastercard">
            <svg viewBox="0 0 60 24" role="img" aria-hidden="true">
              <circle cx="25" cy="12" r="8" fill="#EB001B" />
              <circle cx="35" cy="12" r="8" fill="#F79E1B" />
              <path d="M30 6.1a8 8 0 0 0 0 11.8 8 8 0 0 0 0-11.8Z" fill="#FF5F00" />
            </svg>
          </li>
        </ul>
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
  font-size: clamp(20px, 1.2vw + 12px, 28px);
  line-height: 1.2;
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.drh-footer__brand .d { width: 12px; height: 12px; flex-shrink: 0; background: var(--grad-gold); transform: rotate(45deg); border-radius: 2px; }
.drh-footer__logo {
  display: inline-flex;
  padding: 14px 18px;
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
.drh-footer__logo img { display: block; height: 68px; width: auto; }
.drh-footer__brand p { color: var(--text-on-navy-muted); font-size: 14px; line-height: 1.8; margin: 14px 0 0; max-width: 320px; }
.drh-footer__contact { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
.drh-footer__contactrow {
  display: inline-flex; align-items: center; gap: 10px;
  color: var(--text-on-navy); font-size: 14px; text-decoration: none;
  transition: color var(--dur-base) var(--ease-standard);
}
.drh-footer__contactrow:hover { color: var(--gold-300); }
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
.drh-footer__col h2 { font-family: var(--font-display); font-weight: 700; font-size: 14px; color: #fff; margin: 0 0 16px; }
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

.drh-footer__pay {
  margin-top: var(--space-12);
  padding-top: var(--space-6);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.drh-footer__pay-label {
  display: inline-flex; align-items: center; gap: 7px;
  color: var(--text-on-navy-muted); font-size: 13px; font-weight: 700;
}
.drh-footer__pay-marks { display: flex; align-items: center; gap: 10px; list-style: none; margin: 0; padding: 0; }
.drh-pay {
  display: inline-flex; align-items: center; justify-content: center;
  width: 56px; height: 34px; background: #fff; border-radius: 7px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}
.drh-pay svg { width: 48px; height: 22px; display: block; }
/* When the payments strip is present it owns the top divider; drop the bar's. */
.drh-footer__pay + .drh-footer__bar { margin-top: var(--space-6); border-top: none; padding-top: 0; }

@media (max-width: 860px) {
  .drh-footer__top { grid-template-columns: 1fr 1fr; gap: 32px; }
  .drh-footer__brand { grid-column: 1 / -1; }
}
@media (max-width: 520px) {
  .drh-footer__top { grid-template-columns: 1fr; }
}
</style>
