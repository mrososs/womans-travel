<script setup lang="ts">
import { onMounted } from 'vue';
import { Card, Button, Icon } from '@org/shared-ui';

const { t } = useI18n();
const localePath = useLocalePath();
const { items, subtotal, setQuantity, remove, hydrate } = useCart();
const { isLoggedIn } = useAuth();
const analytics = useAnalytics();

// The cart plugin hydrates without awaiting, so re-await it here (as
// CheckoutPayment does) before reporting — otherwise view_cart would fire
// against an empty list on a cold load.
onMounted(async () => {
  await hydrate();
  analytics.viewCart(items.value);
});

useHead(() => ({ title: `${t('cart.title')} · ${t('brand')}` }));

const nf = new Intl.NumberFormat('en-US');

function checkout() {
  if (!isLoggedIn.value) {
    navigateTo(localePath('/auth/login'));
    return;
  }
  navigateTo(localePath('/checkout'));
}
</script>

<template>
  <section class="section">
    <div class="container cart">
      <h1 class="h-sec cart__title">{{ t('cart.title') }}</h1>

      <div v-if="!items.length" class="cart__empty">
        <Icon name="shopping-bag" :size="44" />
        <p>{{ t('cart.empty') }}</p>
        <Button variant="outline" @click="navigateTo(localePath('/packages'))">
          {{ t('cart.emptyCta') }}
        </Button>
      </div>

      <div v-else class="cart__grid">
        <div class="cart__items">
          <Card
            v-for="item in items"
            :key="`${item.item_type}:${item.item_id}`"
            variant="outline"
            padding="none"
            class="cart-line"
          >
            <div class="cart-line__media" :style="{ background: item.grad || 'var(--grad-rose)' }">
              <Icon v-if="item.icon" :name="item.icon" :size="30" :stroke-width="1.2" color="#fff" />
            </div>
            <div class="cart-line__body">
              <div class="cart-line__title">{{ item.title }}</div>
              <div class="cart-line__price">
                {{ nf.format(item.unit_price) }}
                <Icon name="saudi-riyal" :size="14" />
                <span class="sr-only">{{ t('common.currency') }}</span>
              </div>
            </div>
            <div class="cart-line__stepper">
              <button type="button" aria-label="-" @click="setQuantity(item, item.quantity - 1)"><Icon name="minus" :size="15" /></button>
              <span>{{ item.quantity }}</span>
              <button type="button" aria-label="+" @click="setQuantity(item, item.quantity + 1)"><Icon name="plus" :size="15" /></button>
            </div>
            <button class="cart-line__remove" :aria-label="t('cart.title')" @click="remove(item)">
              <Icon name="trash-2" :size="18" />
            </button>
          </Card>
        </div>

        <Card variant="elevated" padding="lg" class="cart__summary">
          <div class="cart__summary-row">
            <span>{{ t('cart.subtotal') }}</span>
            <span class="cart__total">
              {{ nf.format(subtotal) }}
              <Icon name="saudi-riyal" :size="16" />
              <span class="sr-only">{{ t('common.currency') }}</span>
            </span>
          </div>
          <Button block size="lg" @click="checkout">
            <template #iconStart><Icon name="shield-check" :size="19" /></template>
            {{ isLoggedIn ? t('cart.checkout') : t('cart.loginToCheckout') }}
          </Button>
          <NuxtLink class="cart__continue" :to="localePath('/packages')">{{ t('cart.continue') }}</NuxtLink>
        </Card>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cart { max-width: 1000px; }
.cart__title { margin-bottom: 28px; }
.cart__empty { display: grid; justify-items: center; gap: 14px; padding: 56px 0; color: var(--text-muted); }
.cart__empty :deep(svg) { color: var(--rose-300); }
.cart__grid { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
@media (min-width: 900px) { .cart__grid { grid-template-columns: 1.7fr 1fr; } }
.cart__items { display: grid; gap: 14px; }

.cart-line { display: flex; align-items: center; gap: 14px; padding: 12px; }
.cart-line__media { width: 72px; height: 72px; border-radius: var(--radius-md); flex: none; display: inline-flex; align-items: center; justify-content: center; }
.cart-line__body { flex: 1; min-width: 0; }
.cart-line__title { font-family: var(--font-display); font-weight: 700; font-size: var(--text-base); color: var(--text-strong); }
.cart-line__price { display: inline-flex; align-items: center; gap: 4px; color: var(--text-muted); font-size: 14px; margin-top: 4px; }
.cart-line__stepper { display: inline-flex; align-items: center; gap: 2px; border: 1.5px solid var(--border-default); border-radius: var(--radius-pill); padding: 3px; flex: none; }
.cart-line__stepper button { width: 30px; height: 30px; border-radius: 50%; border: none; background: var(--rose-50); color: var(--brand-strong); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.cart-line__stepper span { min-width: 26px; text-align: center; font-weight: 700; color: var(--text-strong); }
.cart-line__remove { border: none; background: transparent; color: var(--text-subtle); cursor: pointer; padding: 8px; border-radius: 50%; flex: none; transition: color var(--dur-fast), background var(--dur-fast); }
.cart-line__remove:hover { color: var(--danger-500); background: var(--danger-100); }

.cart__summary { position: sticky; top: 90px; }
.cart__summary-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.cart__total { display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-display); font-weight: 800; font-size: var(--text-2xl); color: var(--text-strong); }
.cart__note { text-align: center; color: var(--text-muted); font-size: 13px; margin: 12px 0 0; }
.cart__continue { display: block; text-align: center; margin-top: 14px; color: var(--text-brand); font-weight: 700; font-size: 14px; }
</style>
