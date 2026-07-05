<script setup lang="ts">
import { computed, ref } from 'vue';
import { Card, Badge, Button, Icon, IconButton } from '@org/shared-ui';
import PackageCard from '~/components/PackageCard.vue';
import type { Database } from '~/types/database.types';
import { INCLUDES } from '~/data/site';

const { t } = useI18n();
const { pick } = useDbPick();
const { lc } = useLocalize();
const localePath = useLocalePath();
const route = useRoute();
const client = useSupabaseClient<Database>();
const { add } = useCart();
const { has, toggle } = useWishlist();
const { isLoggedIn } = useAuth();
const notify = useNotify();

const id = computed(() => String(route.params.id));

const { data: pkg } = await useAsyncData(
  () => `package-${id.value}`,
  async () => {
    const { data } = await client.from('packages').select('*').eq('id', id.value).single();
    return data;
  },
  { watch: [id] }
);

const { data: related } = await useAsyncData('packages-related', async () => {
  const { data } = await client.from('packages').select('*').order('sort');
  return data ?? [];
});

useHead(() => ({ title: pkg.value ? pick(pkg.value, 'title') : t('detail.notFound') }));

const priceAmount = computed(() =>
  pkg.value ? Number((pkg.value.price_en ?? '').replace(/[^0-9.]/g, '')) || 0 : 0
);

const qty = ref(1);
const added = ref(false);

async function addToCart() {
  if (!pkg.value) return;
  await add(
    {
      item_type: 'package',
      item_id: pkg.value.id,
      title: pick(pkg.value, 'title'),
      unit_price: priceAmount.value,
      icon: pkg.value.icon,
      grad: pkg.value.grad,
    },
    qty.value
  );
  added.value = true;
  notify.success(t('cart.added'));
  setTimeout(() => (added.value = false), 2500);
}

async function toggleWishlist() {
  if (!pkg.value) return;
  if (!isLoggedIn.value) {
    notify.error(t('wishlist.loginRequired'));
    return;
  }
  const result = await toggle({
    item_type: 'package',
    item_id: pkg.value.id,
    title: pick(pkg.value, 'title'),
    icon: pkg.value.icon,
    grad: pkg.value.grad,
    price: pick(pkg.value, 'price'),
  });
  if (result === 'added') notify.success(t('wishlist.added'));
  else if (result === 'removed') notify.info(t('wishlist.removed'));
}

const relatedOthers = computed(() =>
  (related.value ?? []).filter((p) => p.id !== id.value).slice(0, 3)
);

function goPackage(pid: string) {
  navigateTo(localePath(`/packages/${pid}`));
}
</script>

<template>
  <div v-if="pkg">
    <nav class="pd-crumb container" aria-label="breadcrumb">
      <NuxtLink :to="localePath('/')">{{ t('trip.breadcrumbHome') }}</NuxtLink>
      <Icon name="chevron-left" :size="14" />
      <NuxtLink :to="localePath('/packages')">{{ t('nav.packages') }}</NuxtLink>
      <Icon name="chevron-left" :size="14" />
      <span class="pd-crumb__current">{{ pick(pkg, 'title') }}</span>
    </nav>

    <section class="container">
      <div class="pd-hero" :style="{ background: pkg.grad }">
        <img v-if="pkg.image_url" class="pd-hero__img" :src="pkg.image_url" :alt="pick(pkg, 'title')" fetchpriority="high">
        <span v-else class="pd-hero__glyph"><Icon :name="pkg.icon" :size="220" :stroke-width="0.8" color="#fff" /></span>
        <div class="pd-hero__scrim" />
        <div class="pd-hero__content">
          <div class="pd-hero__badges">
            <Badge variant="solid">{{ t(`destinations.kinds.${pkg.kind}`) }}</Badge>
            <Badge variant="success" dot>{{ t('detail.availability') }}</Badge>
          </div>
          <h1 class="pd-hero__title">{{ pick(pkg, 'title') }}</h1>
          <p class="pd-hero__sub">{{ pick(pkg, 'desc') }}</p>
        </div>
      </div>
    </section>

    <section class="section pd-body">
      <div class="container">
        <div class="pd-grid">
          <div class="pd-main">
            <h2 class="pd-h2">{{ t('detail.overview') }}</h2>
            <p class="pd-lead">{{ pick(pkg, 'desc') }}</p>

            <Card variant="cream" padding="lg" class="pd-inc-card">
              <div class="pd-inc__title">{{ t('detail.includes') }}</div>
              <div class="pd-inc">
                <div v-for="(inc, i) in INCLUDES" :key="i" class="pd-inc__item">
                  <span class="pd-inc__tick"><Icon name="check" :size="14" /></span>
                  <span>{{ lc(inc) }}</span>
                </div>
              </div>
            </Card>
          </div>

          <Card variant="elevated" padding="lg" class="pd-buy">
            <div class="pd-price">
              <span class="pd-price__amount">{{ pick(pkg, 'price') }}</span>
              <Icon name="saudi-riyal" :size="20" class="pd-price__riyal" />
              <span class="sr-only">{{ t('common.currency') }}</span>
              <span class="pd-price__per">/ {{ t('common.perPerson') }}</span>
            </div>

            <div class="pd-qty">
              <span class="pd-qty__label">{{ t('cart.quantity') }}</span>
              <div class="pd-stepper">
                <button type="button" aria-label="-" @click="qty = Math.max(1, qty - 1)"><Icon name="minus" :size="16" /></button>
                <span class="pd-stepper__val">{{ qty }}</span>
                <button type="button" aria-label="+" @click="qty = qty + 1"><Icon name="plus" :size="16" /></button>
              </div>
            </div>

            <div class="pd-buyrow">
              <Button block size="lg" @click="addToCart">
                <template #iconStart><Icon name="shopping-bag" :size="19" /></template>
                {{ added ? t('cart.added') : t('cart.addToCart') }}
              </Button>
              <IconButton variant="soft" size="lg" :label="t('wishlist.title')" @click="toggleWishlist">
                <Icon name="heart" :size="20" :color="has('package', pkg.id) ? 'var(--brand)' : 'var(--brand-strong)'" />
              </IconButton>
            </div>

            <div class="pd-note">
              <Icon name="shield-check" :size="14" color="var(--success-500)" />
              {{ t('trip.booking.secure') }}
            </div>
          </Card>
        </div>
      </div>
    </section>

    <section v-if="relatedOthers.length" class="section pd-related">
      <div class="container">
        <h2 class="h-sec pd-related__head">{{ t('trip.relatedTitle') }}</h2>
        <div class="pd-cards">
          <PackageCard
            v-for="p in relatedOthers"
            :key="p.id"
            :title="pick(p, 'title')"
            :desc="pick(p, 'desc')"
            :icon="p.icon"
            :grad="p.grad"
            :img="p.image_url"
            :price="pick(p, 'price')"
            :currency="t('common.currency')"
            :from-label="t('common.startingFrom')"
            :kind-label="t(`destinations.kinds.${p.kind}`)"
            :view-label="t('actions.view')"
            @open="goPackage(p.id)"
          />
        </div>
      </div>
    </section>
  </div>

  <div v-else class="section">
    <div class="container pd-empty">
      <p>{{ t('detail.notFound') }}</p>
      <Button variant="outline" @click="navigateTo(localePath('/packages'))">{{ t('detail.backToPackages') }}</Button>
    </div>
  </div>
</template>

<style scoped>
/* Breadcrumb */
.pd-crumb { display: flex; align-items: center; gap: 8px; padding-top: 18px; font-size: var(--text-xs); color: var(--text-muted); }
.pd-crumb a { color: var(--text-muted); text-decoration: none; }
.pd-crumb a:hover { color: var(--brand-strong); }
.pd-crumb__current { color: var(--text-strong); font-weight: 700; }

/* Hero */
.pd-hero {
  position: relative;
  margin-top: 16px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  min-height: clamp(280px, 40vw, 420px);
  display: flex;
  align-items: flex-end;
  box-shadow: var(--shadow-lg);
}
.pd-hero__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.pd-hero__glyph { position: absolute; inset-inline-end: 4%; top: 50%; transform: translateY(-50%); opacity: 0.16; color: #fff; pointer-events: none; }
.pd-hero__scrim { position: absolute; inset: 0; background: var(--grad-scrim); opacity: 0.62; }
.pd-hero__content { position: relative; z-index: 2; padding: clamp(22px, 4vw, 44px); width: 100%; }
.pd-hero__badges { display: flex; gap: 8px; margin-bottom: 14px; }
.pd-hero__title { font-family: var(--font-display); font-weight: 800; font-size: clamp(28px, 5vw, 46px); color: #fff; margin: 0; line-height: 1.2; }
.pd-hero__sub { color: rgba(255, 255, 255, 0.92); font-size: clamp(15px, 2vw, 18px); line-height: 1.8; margin: 12px 0 0; max-width: 52ch; }

/* Layout */
.pd-body { padding-top: 40px; }
.pd-grid { display: grid; grid-template-columns: 1fr; gap: 32px; align-items: start; }
@media (min-width: 940px) { .pd-grid { grid-template-columns: 1.7fr 1fr; } }
.pd-h2 { font-family: var(--font-display); font-weight: 800; font-size: var(--text-2xl); color: var(--text-strong); margin: 0 0 14px; }
.pd-lead { font-size: clamp(15px, 1.6vw, 17px); line-height: 1.9; color: var(--text-body); margin: 0 0 28px; }

/* Includes */
.pd-inc-card { }
.pd-inc__title { font-family: var(--font-display); font-weight: 800; font-size: var(--text-lg); color: var(--text-strong); margin-bottom: 16px; }
.pd-inc { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 560px) { .pd-inc { grid-template-columns: 1fr; } }
.pd-inc__item { display: flex; align-items: center; gap: 10px; }
.pd-inc__item span:last-child { font-size: 14px; color: var(--text-body); }
.pd-inc__tick { flex: none; width: 22px; height: 22px; border-radius: 50%; background: var(--success-100); color: var(--success-500); display: inline-flex; align-items: center; justify-content: center; }

/* Purchase card */
.pd-buy { position: sticky; top: 90px; }
.pd-price { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.pd-price__amount { font-family: var(--font-display); font-weight: 800; font-size: 32px; color: var(--text-strong); }
.pd-price__riyal { width: 0.72em; height: 0.72em; color: var(--text-strong); flex: none; }
.pd-price__per { font-size: 13px; color: var(--text-muted); align-self: flex-end; margin-bottom: 5px; }
.pd-qty { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.pd-qty__label { font-family: var(--font-body); font-weight: 700; font-size: 14px; color: var(--text-strong); }
.pd-stepper { display: inline-flex; align-items: center; gap: 4px; border: 1.5px solid var(--border-default); border-radius: var(--radius-pill); padding: 4px; }
.pd-stepper button { width: 34px; height: 34px; border-radius: 50%; border: none; background: var(--rose-50); color: var(--brand-strong); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background var(--dur-base) var(--ease-standard); }
.pd-stepper button:hover { background: var(--rose-100); }
.pd-stepper__val { min-width: 32px; text-align: center; font-family: var(--font-display); font-weight: 800; font-size: 16px; color: var(--text-strong); }
.pd-buyrow { display: flex; align-items: center; gap: 10px; }
.pd-buyrow > :first-child { flex: 1; }
.pd-note { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 12px; color: var(--text-muted); font-size: 12.5px; }

/* Related */
.pd-related { padding-top: 0; }
.pd-related__head { margin-bottom: 30px; }
.pd-cards { display: grid; grid-template-columns: 1fr; gap: 24px; }
@media (min-width: 620px) { .pd-cards { grid-template-columns: 1fr 1fr; } }
@media (min-width: 980px) { .pd-cards { grid-template-columns: 1fr 1fr 1fr; } }

.pd-empty { text-align: center; display: grid; justify-items: center; gap: 16px; padding: 48px 0; color: var(--text-muted); }
</style>
