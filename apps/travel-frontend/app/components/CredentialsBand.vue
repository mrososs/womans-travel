<script setup lang="ts">
import { BUSINESS } from '~/data/site';

/**
 * CredentialsBand — brand intro line + official Commercial Register badge,
 * shown site-wide just above the footer.
 */
const { t } = useI18n();
</script>

<template>
  <section class="creds" aria-labelledby="creds-heading">
    <div class="container creds__inner">
      <h2 id="creds-heading" class="creds__heading">{{ t('credentials.heading') }}</h2>
      <p class="creds__desc">{{ t('credentials.desc') }}</p>

      <div class="creds__badges">
        <div class="creds__badge">
          <img
            class="creds__badge-icon"
            src="/commercial-register.avif"
            :alt="t('credentials.crLabel')"
            width="52"
            height="52"
            loading="lazy"
          >
          <span class="creds__badge-text">
            <span class="creds__badge-label">{{ t('credentials.crLabel') }}</span>
            <span class="creds__badge-num" dir="ltr">{{ BUSINESS.commercialRegister }}</span>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.creds {
  background: var(--surface-cream);
  border-top: 1px solid var(--border-soft);
  padding: var(--space-14) var(--gutter);
}
.creds__inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.creds__heading {
  font-family: var(--font-display);
  font-weight: var(--weight-bold);
  font-size: clamp(20px, 1.4vw + 14px, 28px);
  line-height: var(--leading-snug);
  color: var(--text-strong);
  margin: 0;
  max-width: 60ch;
}
.creds__desc {
  color: var(--text-muted);
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  margin: 0;
  max-width: 72ch;
}
.creds__badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-top: var(--space-3);
}
.creds__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-5);
  background: var(--surface-navy);
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
.creds__badge-icon {
  width: 52px;
  height: 52px;
  object-fit: contain;
  border-radius: var(--radius-xs);
  background: #fff;
  padding: 4px;
  flex-shrink: 0;
}
.creds__badge-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.creds__badge-label {
  font-family: var(--font-display);
  font-weight: var(--weight-semibold);
  font-size: var(--text-sm);
  color: var(--gold-300);
}
.creds__badge-num {
  font-family: var(--font-num);
  font-weight: var(--weight-bold);
  font-size: var(--text-xl);
  letter-spacing: var(--tracking-wide);
  color: #fff;
}

@media (max-width: 620px) {
  .creds { padding: var(--space-12) var(--gutter); }
  .creds__badge { width: 100%; }
}
</style>
