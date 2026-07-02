import { computed } from 'vue';
import type { Database } from '~/types/database.types';

type OAuthProvider = 'google' | 'facebook';

/**
 * useAuth — thin wrapper over Supabase Auth (via @nuxtjs/supabase).
 * Email/password + Google/Facebook OAuth. `user` is reactive.
 */
export function useAuth() {
  const user = useSupabaseUser();
  const client = useSupabaseClient<Database>();
  const localePath = useLocalePath();

  const isLoggedIn = computed(() => !!user.value);

  const callbackUrl = () =>
    `${window.location.origin}${localePath('/auth/callback')}`;

  async function signInWithPassword(email: string, password: string) {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, fullName?: string) {
    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: fullName ? { full_name: fullName } : undefined,
        emailRedirectTo: callbackUrl(),
      },
    });
    if (error) throw error;
  }

  async function signInWithOAuth(provider: OAuthProvider) {
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl() },
    });
    if (error) throw error;
  }

  async function signOut() {
    await client.auth.signOut();
    await navigateTo(localePath('/'));
  }

  return {
    user,
    isLoggedIn,
    signInWithPassword,
    signUp,
    signInWithOAuth,
    signOut,
  };
}
