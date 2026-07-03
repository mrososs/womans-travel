<script setup lang="ts">
import { Button, Icon } from '@org/shared-ui';
import SideDrawer from '~/components/SideDrawer.vue';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const { t } = useI18n();
const localePath = useLocalePath();
const { items, subtotal, setQuantity, remove } = useCart();

const nf = new Intl.NumberFormat('en-US');

function close() {
  emit('update:open', false);
}
function goCart() {
  close();
  navigateTo(localePath('/cart'));
}
</script>

<template>
  <SideDrawer :open="open" :title="t('cart.title')" @update:open="emit('update:open', $event)">
    <div v-if="!items.length" class="cd-empty">
      <Icon name="shopping-bag" :size="40" />
      <p>{{ t('cart.empty') }}</p>
    </div>

    <div v-else class="cd-list">
      <div v-for="item in items" :key="`${item.item_type}:${item.item_id}`" class="cd-line">
        <div class="cd-line__media" :style="{ background: item.grad || 'var(--grad-rose)' }">
          <Icon v-if="item.icon" :name="item.icon" :size="24" :stroke-width="1.2" color="#fff" />
        </div>
        <div class="cd-line__body">
          <div class="cd-line__title">{{ item.title }}</div>
          <div class="cd-line__price">
            {{ nf.format(item.unit_price) }} <Icon name="saudi-riyal" :size="13" />
          </div>
          <div class="cd-line__stepper">
            <button type="button" aria-label="-" @click="setQuantity(item, item.quantity - 1)"><Icon name="minus" :size="14" /></button>
            <span>{{ item.quantity }}</span>
            <button type="button" aria-label="+" @click="setQuantity(item, item.quantity + 1)"><Icon name="plus" :size="14" /></button>
          </div>
        </div>
        <button class="cd-line__remove" aria-label="X" @click="remove(item)"><Icon name="trash-2" :size="17" /></button>
      </div>
    </div>

    <template v-if="items.length" #footer>
      <div class="cd-subtotal">
        <span>{{ t('cart.subtotal') }}</span>
        <span class="cd-total">{{ nf.format(subtotal) }} <Icon name="saudi-riyal" :size="15" /></span>
      </div>
      <Button block size="lg" @click="goCart">
        <template #iconStart><Icon name="shopping-bag" :size="18" /></template>
        {{ t('cart.viewCart') }}
      </Button>
      <button class="cd-continue" @click="close">{{ t('cart.continue') }}</button>
    </template>
  </SideDrawer>
</template>

<style scoped>
.cd-empty { display: grid; justify-items: center; gap: 12px; padding: 48px 0; color: var(--text-muted); }
.cd-empty :deep(svg) { color: var(--rose-300); }
.cd-list { display: grid; gap: 14px; }
.cd-line { display: flex; align-items: center; gap: 12px; }
.cd-line__media { width: 60px; height: 60px; border-radius: var(--radius-md); flex: none; display: inline-flex; align-items: center; justify-content: center; }
.cd-line__body { flex: 1; min-width: 0; }
.cd-line__title { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--text-strong); }
.cd-line__price { display: inline-flex; align-items: center; gap: 3px; color: var(--text-muted); font-size: 13px; margin: 2px 0 6px; }
.cd-line__stepper { display: inline-flex; align-items: center; gap: 2px; }
.cd-line__stepper button { width: 26px; height: 26px; border-radius: 50%; border: none; background: var(--rose-50); color: var(--brand-strong); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.cd-line__stepper span { min-width: 24px; text-align: center; font-weight: 700; color: var(--text-strong); font-size: 14px; }
.cd-line__remove { border: none; background: transparent; color: var(--text-subtle); cursor: pointer; padding: 6px; border-radius: 50%; flex: none; }
.cd-line__remove:hover { color: var(--danger-500); background: var(--danger-100); }
.cd-subtotal { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; color: var(--text-body); }
.cd-total { display: inline-flex; align-items: center; gap: 4px; font-family: var(--font-display); font-weight: 800; font-size: var(--text-xl); color: var(--text-strong); }
.cd-continue { display: block; width: 100%; text-align: center; margin-top: 12px; background: none; border: none; cursor: pointer; color: var(--text-brand); font-weight: 700; font-size: 14px; font-family: var(--font-body); }
</style>
