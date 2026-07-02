/**
 * Route middleware: require an authenticated user. Redirects to the localized
 * login page otherwise. Apply via `definePageMeta({ middleware: 'auth' })`.
 */
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser();
  const localePath = useLocalePath();
  if (!user.value) {
    return navigateTo(localePath('/auth/login'));
  }
});
