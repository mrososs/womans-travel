import type { Database } from '~/types/database.types';

/**
 * Route middleware: require an authenticated user with role = 'admin'.
 * Unauthenticated users go to the localized login page; authenticated
 * non-admins are bounced to the home page. Apply after `auth`, e.g.
 * `definePageMeta({ middleware: ['auth', 'admin'] })`.
 */
export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser();
  const localePath = useLocalePath();

  if (!user.value) {
    return navigateTo(localePath('/auth/login'));
  }

  const uid = useAuthUserId().value;
  if (!uid) {
    return navigateTo(localePath('/'));
  }

  const client = useSupabaseClient<Database>();
  const { data } = await client
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .single();

  if (data?.role !== 'admin') {
    return navigateTo(localePath('/'));
  }
});
