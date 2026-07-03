<script setup lang="ts">
import { Button, Icon } from '@org/shared-ui';
import SideDrawer from '~/components/SideDrawer.vue';
import type { WishItem } from '~/composables/useWishlist';

defineProps<{ open: boolean }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const { t } = useI18n();
const localePath = useLocalePath();
const { items, remove } = useWishlist();

function close() {
  emit('update:open', false);
}
function view(item: WishItem) {
  const path =
    item.item_type === 'package'
      ? `/packages/${item.item_id}`
      : item.item_type === 'trip'
        ? `/trip/${item.item_id}`
        : '/products';
  close();
  navigateTo(localePath(path));
}
</script>

<template>
  <SideDrawer :open="open" :title="t('wishlist.title')" @update:open="emit('update:open', $event)">
    <div v-if="!items.length" class="wd-empty">
      <Icon name="heart" :size="40" />
      <p>{{ t('wishlist.empty') }}</p>
    </div>

    <div v-else class="wd-list">
      <div v-for="item in items" :key="`${item.item_type}:${item.item_id}`" class="wd-line">
        <button class="wd-line__media" :style="{ background: item.grad || 'var(--grad-rose)' }" @click="view(item)">
          <Icon v-if="item.icon" :name="item.icon" :size="24" :stroke-width="1.2" color="#fff" />
        </button>
        <div class="wd-line__body">
          <button class="wd-line__title" @click="view(item)">{{ item.title }}</button>
          <div v-if="item.price" class="wd-line__price">
            {{ item.price }} <Icon name="saudi-riyal" :size="13" />
          </div>
        </div>
        <button class="wd-line__remove" aria-label="X" @click="remove(item.item_type, item.item_id)">
          <Icon name="trash-2" :size="17" />
        </button>
      </div>
    </div>

    <template v-if="items.length" #footer>
      <Button variant="outline" block @click="close(); navigateTo(localePath('/account/wishlist'))">
        {{ t('wishlist.viewAll') }}
      </Button>
    </template>
  </SideDrawer>
</template>

<style scoped>
.wd-empty { display: grid; justify-items: center; gap: 12px; padding: 48px 0; color: var(--text-muted); }
.wd-empty :deep(svg) { color: var(--rose-300); }
.wd-list { display: grid; gap: 14px; }
.wd-line { display: flex; align-items: center; gap: 12px; }
.wd-line__media { width: 60px; height: 60px; border-radius: var(--radius-md); flex: none; display: inline-flex; align-items: center; justify-content: center; border: none; cursor: pointer; padding: 0; }
.wd-line__body { flex: 1; min-width: 0; }
.wd-line__title { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--text-strong); background: none; border: none; padding: 0; cursor: pointer; text-align: start; }
.wd-line__title:hover { color: var(--brand-strong); }
.wd-line__price { display: inline-flex; align-items: center; gap: 3px; color: var(--text-muted); font-size: 13px; margin-top: 4px; }
.wd-line__remove { border: none; background: transparent; color: var(--text-subtle); cursor: pointer; padding: 6px; border-radius: 50%; flex: none; }
.wd-line__remove:hover { color: var(--danger-500); background: var(--danger-100); }
</style>
