import { watch } from 'vue';

/**
 * Hydrate cart + wishlist on load, and re-hydrate on auth change
 * (merges the guest cart into the DB on login).
 */
export default defineNuxtPlugin(() => {
  const { hydrate: hydrateCart } = useCart();
  const { hydrate: hydrateWishlist } = useWishlist();
  const user = useSupabaseUser();

  hydrateCart();
  hydrateWishlist();

  watch(user, () => {
    hydrateCart();
    hydrateWishlist();
  });
});
