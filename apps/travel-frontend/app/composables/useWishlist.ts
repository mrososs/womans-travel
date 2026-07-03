import { computed } from 'vue';
import type { Database } from '~/types/database.types';
import type { ItemType } from './useCart';

export interface WishItem {
  item_type: ItemType;
  item_id: string;
  title: string;
  icon?: string | null;
  grad?: string | null;
  price?: string | null;
}

/**
 * useWishlist — DB-backed favourites (Supabase `wishlists`, owner RLS).
 * Requires an authenticated user; guest calls to `toggle`/`add` return false
 * so the caller can prompt sign-in.
 */
export function useWishlist() {
  const items = useState<WishItem[]>('durrah-wishlist', () => []);
  const userId = useAuthUserId();
  const client = useSupabaseClient<Database>();

  const count = computed(() => items.value.length);
  const has = (type: ItemType, id: string) =>
    items.value.some((i) => i.item_type === type && i.item_id === id);

  async function hydrate() {
    const uid = userId.value;
    if (!import.meta.client || !uid) {
      items.value = [];
      return;
    }
    const { data } = await client.from('wishlists').select('*').eq('user_id', uid);
    items.value = (data ?? []).map((r) => ({
      item_type: r.item_type as ItemType,
      item_id: r.item_id,
      title: r.title ?? r.item_id,
      icon: r.icon,
      grad: r.grad,
      price: r.price,
    }));
  }

  async function add(item: WishItem) {
    const uid = userId.value;
    if (!uid) return false;
    if (!has(item.item_type, item.item_id)) items.value = [...items.value, item];
    await client.from('wishlists').upsert(
      {
        user_id: uid,
        item_type: item.item_type,
        item_id: item.item_id,
        title: item.title,
        icon: item.icon ?? null,
        grad: item.grad ?? null,
        price: item.price ?? null,
      },
      { onConflict: 'user_id,item_type,item_id' }
    );
    return true;
  }

  async function remove(type: ItemType, id: string) {
    items.value = items.value.filter((i) => !(i.item_type === type && i.item_id === id));
    const uid = userId.value;
    if (uid) {
      await client
        .from('wishlists')
        .delete()
        .eq('user_id', uid)
        .eq('item_type', type)
        .eq('item_id', id);
    }
  }

  /** Returns 'added' | 'removed' | false (false = not signed in). */
  async function toggle(item: WishItem): Promise<'added' | 'removed' | false> {
    if (!userId.value) return false;
    if (has(item.item_type, item.item_id)) {
      await remove(item.item_type, item.item_id);
      return 'removed';
    }
    await add(item);
    return 'added';
  }

  return { items, count, has, add, remove, toggle, hydrate };
}
