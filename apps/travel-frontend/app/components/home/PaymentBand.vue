<script setup lang="ts">
import { Icon } from '@org/shared-ui';

/**
 * PaymentBand — home-page reassurance band advertising interest-free
 * instalments (تقسيط) via Tabby and Tamara. Mirrors the brand marks used on
 * the checkout page (mint-green Tabby, violet Tamara).
 */
const { t } = useI18n();
</script>

<template>
  <section class="payband">
    <div class="container">
      <div class="payband__panel">
        <div class="payband__head">
          <span class="payband__eyebrow">{{ t('homePay.eyebrow') }}</span>
          <h2 class="payband__title">{{ t('homePay.title') }}</h2>
          <p class="payband__lead">{{ t('homePay.lead') }}</p>
          <ul class="payband__perks">
            <li><Icon name="percent" :size="16" /> {{ t('homePay.noInterest') }}</li>
            <li><Icon name="badge-check" :size="16" /> {{ t('homePay.noFees') }}</li>
            <li><Icon name="shield-check" :size="16" /> {{ t('homePay.shariah') }}</li>
          </ul>
        </div>

        <div class="payband__brands">
          <div class="payband__brand payband__brand--tabby">
            <span class="payband__logo payband__logo--tabby" aria-hidden="true">tabby</span>
            <span class="payband__brand-desc">{{ t('homePay.tabbyDesc') }}</span>
          </div>
          <div class="payband__brand payband__brand--tamara">
            <span class="payband__logo payband__logo--tamara" aria-hidden="true">tamara</span>
            <span class="payband__brand-desc">{{ t('homePay.tamaraDesc') }}</span>
          </div>
        </div>
      </div>

      <p class="payband__note">
        <Icon name="info" :size="14" /> {{ t('homePay.note') }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.payband { padding: 0 var(--gutter) clamp(48px, 7vw, 88px); }
.payband__panel {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: clamp(24px, 4vw, 48px);
  align-items: center;
  background: var(--surface-card);
  border: 1.5px solid var(--border-soft);
  border-radius: 28px;
  box-shadow: var(--shadow-md);
  padding: clamp(28px, 4vw, 48px);
}
.payband__eyebrow {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.04em;
  color: var(--text-gold);
}
.payband__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(22px, 3vw, 34px);
  color: var(--text-strong);
  margin: 8px 0 12px;
}
.payband__lead { color: var(--text-muted); font-size: 16px; line-height: 1.8; margin: 0; max-width: 52ch; }
.payband__perks {
  list-style: none; margin: 20px 0 0; padding: 0;
  display: flex; flex-wrap: wrap; gap: 10px 20px;
}
.payband__perks li {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: var(--font-display); font-weight: 700; font-size: 14px; color: var(--text-strong);
}
.payband__perks :deep(svg) { color: var(--success-500); flex: none; }

.payband__brands { display: grid; gap: 16px; }
.payband__brand {
  display: flex; align-items: center; gap: 16px;
  padding: 20px 22px; border-radius: var(--radius-lg); border: 1.5px solid transparent;
}
.payband__brand--tabby { background: #edfcf8; border-color: #bff0e5; }
.payband__brand--tamara { background: #f6f1ff; border-color: #e2d6ff; }
.payband__logo {
  font-family: var(--font-display); font-weight: 800; letter-spacing: -0.02em;
  border-radius: 8px; padding: 6px 14px; line-height: 1.2; font-size: 20px; flex: none;
}
.payband__logo--tabby { color: #001e1e; background: #3fddc5; }
.payband__logo--tamara { color: #fff; background: #6d28d9; }
.payband__brand-desc { font-size: 15px; font-weight: 700; color: var(--text-body); font-family: var(--font-display); }

.payband__note {
  display: flex; align-items: center; gap: 6px; justify-content: center;
  margin: 18px 0 0; font-size: 13px; color: var(--text-muted);
}
.payband__note :deep(svg) { color: var(--text-brand); flex: none; }

@media (max-width: 760px) {
  .payband__panel { grid-template-columns: 1fr; }
}
</style>
