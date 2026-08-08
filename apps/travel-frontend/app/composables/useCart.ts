import { computed } from 'vue';
import type { Database } from '~/types/database.types';

export type ItemType = 'trip' | 'package' | 'product';

export interface CartItem {
  item_type: ItemType;
  item_id: string;
  title: string;
  unit_price: number;
  quantity: number;
  icon?: string | null;
  grad?: string | null;
}

const STORAGE_KEY = 'durrah-cart';
const keyOf = (i: { item_type: string; item_id: string }) => `${i.item_type}:${i.item_id}`;

/**
 * useCart — reactive cart shared via useState.
 * Guests persist to localStorage; signed-in users persist to Supabase
 * `cart_items` (owner-scoped RLS). On login the local cart is merged into the DB.
 */
export function useCart() {
  const items = useState<CartItem[]>('durrah-cart', () => []);
  const userId = useAuthUserId();
  const client = useSupabaseClient<Database>();
  const analytics = useAnalytics();

  const count = computed(() => items.value.reduce((n, i) => n + i.quantity, 0));
  const subtotal = computed(() => items.value.reduce((s, i) => s + i.quantity * i.unit_price, 0));

  function saveLocal() {
    if (import.meta.client && !userId.value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value));
    }
  }
  function readLocal(): CartItem[] {
    if (!import.meta.client) return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as CartItem[];
    } catch {
      return [];
    }
  }

  async function upsertDb(i: CartItem) {
    const uid = userId.value;
    if (!uid) return;
    await client.from('cart_items').upsert(
      {
        user_id: uid,
        item_type: i.item_type,
        item_id: i.item_id,
        title: i.title,
        icon: i.icon ?? null,
        grad: i.grad ?? null,
        unit_price: i.unit_price,
        quantity: i.quantity,
      },
      { onConflict: 'user_id,item_type,item_id' }
    );
  }
  async function deleteDb(i: CartItem) {
    const uid = userId.value;
    if (!uid) return;
    await client
      .from('cart_items')
      .delete()
      .eq('user_id', uid)
      .eq('item_type', i.item_type)
      .eq('item_id', i.item_id);
  }

  async function add(item: Omit<CartItem, 'quantity'>, quantity = 1) {
    const existing = items.value.find((x) => keyOf(x) === keyOf(item));
    if (existing) existing.quantity += quantity;
    else items.value.push({ ...item, quantity });
    saveLocal();
    // Reported here rather than at each call site so every "add to cart"
    // button in the app is measured by construction.
    analytics.addToCart({ ...item, quantity });
    await upsertDb(items.value.find((x) => keyOf(x) === keyOf(item))!);
  }

  async function setQuantity(item: CartItem, quantity: number) {
    if (quantity <= 0) return remove(item);
    item.quantity = quantity;
    saveLocal();
    await upsertDb(item);
  }

  async function remove(item: CartItem) {
    items.value = items.value.filter((x) => keyOf(x) !== keyOf(item));
    saveLocal();
    analytics.removeFromCart(item);
    await deleteDb(item);
  }

  async function clear() {
    const previous = items.value;
    items.value = [];
    saveLocal();
    const uid = userId.value;
    if (uid) await client.from('cart_items').delete().eq('user_id', uid);
    return previous;
  }

  /** Load the cart for the current auth state; merge local → DB on login. */
  async function hydrate() {
    if (!import.meta.client) return;
    const uid = userId.value;
    if (uid) {
      const local = readLocal();
      for (const i of local) await upsertDb(i);
      if (local.length) localStorage.removeItem(STORAGE_KEY);
      const { data } = await client.from('cart_items').select('*').eq('user_id', uid);
      items.value = (data ?? []).map((r) => ({
        item_type: r.item_type as ItemType,
        item_id: r.item_id,
        title: r.title ?? r.item_id,
        unit_price: Number(r.unit_price ?? 0),
        quantity: r.quantity,
        icon: r.icon,
        grad: r.grad,
      }));
    } else {
      items.value = readLocal();
    }
  }

  return { items, count, subtotal, add, setQuantity, remove, clear, hydrate };
}
