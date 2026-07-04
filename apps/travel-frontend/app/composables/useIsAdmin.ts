import { computed } from 'vue';

/**
 * useIsAdmin — reactive admin flag derived from the signed-in user's profile
 * role. Reuses the shared `useProfile()` fetch (no extra query). Use in the UI
 * to gate admin-only affordances (e.g. the navbar dashboard icon).
 */
export function useIsAdmin() {
  const { profile, pending, refresh } = useProfile();
  const isAdmin = computed(() => profile.value?.role === 'admin');
  return { isAdmin, pending, refresh };
}
