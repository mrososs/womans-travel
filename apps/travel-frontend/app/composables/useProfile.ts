import type { Database } from '~/types/database.types';

type ProfileUpdate = Partial<Database['public']['Tables']['profiles']['Update']>;

/**
 * useProfile — the signed-in user's `profiles` row (owner-scoped by RLS),
 * with an `update` helper. Refetches when the user changes.
 */
export function useProfile() {
  const user = useSupabaseUser();
  const client = useSupabaseClient<Database>();

  const { data: profile, refresh, pending } = useAsyncData(
    'current-profile',
    async () => {
      if (!user.value) return null;
      const { data } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single();
      return data;
    },
    { watch: [user] }
  );

  async function update(patch: ProfileUpdate) {
    if (!user.value) return;
    const { error } = await client
      .from('profiles')
      .update(patch)
      .eq('id', user.value.id);
    if (error) throw error;
    await refresh();
  }

  return { profile, pending, refresh, update };
}
