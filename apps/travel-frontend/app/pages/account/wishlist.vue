<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Button, Icon } from '@org/shared-ui';
import AccountNav from '~/components/account/AccountNav.vue';
import type { WishItem } from '~/composables/useWishlist';

/**
 * Account → Wishlist. Lists the favourites the shopper saved (Supabase
 * `wishlists`, owner RLS). Each card links to the item's detail page and can be
 * added straight to the cart or removed.
 */

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const localePath = useLocalePath();
const notify = useNotify();
const { items, remove, hydrate } = useWishlist();
const { add } = useCart();

useHead(() => ({ title: `${t('account.wishlist')} · ${t('brand')}` }));

// The wishlist hydrates client-side (owner-scoped), so refresh on mount and
// show a spinner until the first load resolves to avoid an empty-state flash.
const loading = ref(true);
onMounted(async () => {
  await hydrate();
  loading.value = false;
});

const removingKey = ref<string | null>(null);
const addingKey = ref<string | null>(null);

function keyOf(item: WishItem) {
  return `${item.item_type}:${item.item_id}`;
}

function detailPath(item: WishItem) {
  if (item.item_type === 'package') return `/packages/${item.item_id}`;
  if (item.item_type === 'trip') return `/trip/${item.item_id}`;
  return '/products';
}

function view(item: WishItem) {
  navigateTo(localePath(detailPath(item)));
}

async function addToCart(item: WishItem) {
  addingKey.value = keyOf(item);
  try {
    await add(
      {
        item_type: item.item_type,
        item_id: item.item_id,
        title: item.title,
        unit_price: parsePriceAmount(item.price),
        icon: item.icon,
        grad: item.grad,
      },
      1
    );
    notify.success(t('cart.added'));
  } finally {
    addingKey.value = null;
  }
}

async function removeItem(item: WishItem) {
  removingKey.value = keyOf(item);
  try {
    await remove(item.item_type, item.item_id);
    notify.info(t('wishlist.removed'));
  } finally {
    removingKey.value = null;
  }
}
</script>

<template>
  <section class="section">
    <div class="container account">
      <div class="account__head account__head--simple">
        <div>
          <div class="eyebrow">{{ t('account.welcome') }}</div>
          <h1 class="account__name">{{ t('wishlist.title') }}</h1>
          <p class="account__lead">{{ t('wishlist.subtitle') }}</p>
        </div>
      </div>

      <div class="account__grid">
        <AccountNav active="wishlist" />

        <div class="wl">
          <!-- Loading -->
          <div v-if="loading" class="wl__state">
            <Icon name="loader" :size="26" class="wl__spin" />
            <p>{{ t('common.loading') }}</p>
          </div>

          <!-- Empty -->
          <div v-else-if="!items.length" class="wl__state wl__empty">
            <span class="wl__empty-ico"><Icon name="heart" :size="40" /></span>
            <p>{{ t('wishlist.empty') }}</p>
            <Button variant="outline" @click="navigateTo(localePath('/destinations'))">
              {{ t('wishlist.emptyCta') }}
            </Button>
          </div>

          <!-- Favourites -->
          <ul v-else class="wl__list">
            <li v-for="item in items" :key="keyOf(item)" class="wl-card">
              <button
                type="button"
                class="wl-card__media"
                :style="{ background: item.grad || 'var(--grad-rose)' }"
                :aria-label="item.title"
                @click="view(item)"
              >
                <Icon v-if="item.icon" :name="item.icon" :size="28" :stroke-width="1.2" color="#fff" />
              </button>

              <div class="wl-card__info">
                <button type="button" class="wl-card__title" @click="view(item)">{{ item.title }}</button>
                <div v-if="item.price" class="wl-card__price">
                  {{ item.price }}
                  <Icon name="saudi-riyal" :size="14" />
                  <span class="sr-only">{{ t('common.currency') }}</span>
                </div>
              </div>

              <div class="wl-card__actions">
                <Button
                  size="sm"
                  :disabled="addingKey === keyOf(item)"
                  @click="addToCart(item)"
                >
                  <template #iconStart><Icon name="shopping-bag" :size="16" /></template>
                  {{ t('cart.addToCart') }}
                </Button>
                <button
                  type="button"
                  class="wl-card__remove"
                  :disabled="removingKey === keyOf(item)"
                  :aria-label="t('actions.wishlistRemove')"
                  @click="removeItem(item)"
                >
                  <Icon name="trash-2" :size="18" />
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.account { max-width: 960px; }
.account__head { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.account__name { font-family: var(--font-display); font-weight: 800; font-size: var(--text-2xl); color: var(--text-strong); margin: 2px 0 0; }
.account__lead { color: var(--text-muted); font-size: var(--text-sm); margin: 8px 0 0; max-width: 60ch; line-height: var(--leading-relaxed); }
.account__grid { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
@media (min-width: 860px) { .account__grid { grid-template-columns: 240px 1fr; } }

/* States */
.wl__state { display: grid; justify-items: center; gap: 14px; padding: 64px 0; color: var(--text-muted); text-align: center; }
.wl__spin { color: var(--brand-strong); animation: wl-spin 0.9s linear infinite; }
@keyframes wl-spin { to { transform: rotate(360deg); } }
.wl__empty-ico { color: var(--rose-300); }

/* List */
.wl__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; }
.wl-card {
  display: flex; align-items: center; gap: 16px; padding: 16px 20px;
  border: 1.5px solid var(--border-soft); border-radius: var(--radius-lg);
  background: var(--surface-card); box-shadow: var(--shadow-sm);
  transition: border-color var(--dur-base) var(--ease-standard), box-shadow var(--dur-base) var(--ease-standard);
}
.wl-card:hover { box-shadow: var(--shadow-md); }
.wl-card__media {
  width: 64px; height: 64px; flex: none; border-radius: var(--radius-md);
  display: inline-flex; align-items: center; justify-content: center;
  border: none; padding: 0; cursor: pointer;
}
.wl-card__info { flex: 1; min-width: 0; }
.wl-card__title {
  font-family: var(--font-display); font-weight: 700; font-size: var(--text-base);
  color: var(--text-strong); background: none; border: none; padding: 0; cursor: pointer;
  text-align: start; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;
}
.wl-card__title:hover { color: var(--brand-strong); }
.wl-card__price {
  display: inline-flex; align-items: center; gap: 4px; margin-top: 6px;
  font-family: var(--font-display); font-weight: 700; color: var(--brand-strong); font-size: var(--text-sm);
}
.wl-card__price :deep(svg) { width: 0.82em; height: 0.82em; }
.wl-card__actions { display: inline-flex; align-items: center; gap: 8px; flex: none; }
.wl-card__remove {
  width: 40px; height: 40px; border-radius: var(--radius-md); flex: none;
  border: 1.5px solid var(--border-default); background: var(--surface-card); color: var(--text-subtle);
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  transition: background var(--dur-base) var(--ease-standard), color var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard);
}
.wl-card__remove:hover:not(:disabled) { color: var(--danger-500); border-color: var(--danger-500); background: var(--danger-100); }
.wl-card__remove:disabled { opacity: 0.5; cursor: default; }

@media (max-width: 560px) {
  .wl-card { flex-wrap: wrap; }
  .wl-card__actions { width: 100%; justify-content: space-between; }
}
</style>
