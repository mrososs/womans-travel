import { computed } from 'vue';

/**
 * Resolves the authenticated user's UUID as a reactive computed.
 *
 * @nuxtjs/supabase v2 (with the new publishable/asymmetric-JWT keys) populates
 * `useSupabaseUser()` from `getClaims()` — the decoded JWT payload — where the
 * user id lives in `sub`, not `id`. Older/full `User` objects expose `id`.
 * Reading `.id` blindly yields `undefined`, which is what leaks onto the wire as
 * `user_id=eq.undefined` (invalid UUID → 400). Always resolve the id through here.
 */
export function useAuthUserId() {
  const user = useSupabaseUser();
  return computed<string | undefined>(() => {
    const u = user.value as (Record<string, unknown> | null);
    const id = (u?.id ?? u?.sub) as string | undefined;
    return id || undefined;
  });
}
