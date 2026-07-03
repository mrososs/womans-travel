import type { Database } from '~/types/database.types';

type ProfileUpdate = Partial<Database['public']['Tables']['profiles']['Update']>;

/**
 * useProfile — the signed-in user's `profiles` row (owner-scoped by RLS),
 * with an `update` helper. Refetches when the user changes.
 */
export function useProfile() {
  const userId = useAuthUserId();
  const client = useSupabaseClient<Database>();

  const { data: profile, refresh, pending } = useAsyncData(
    'current-profile',
    async () => {
      const uid = userId.value;
      if (!uid) return null;
      const { data } = await client
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      return data;
    },
    { watch: [userId] }
  );

  /** Returns true when the row was updated; false if there's no signed-in user. */
  async function update(patch: ProfileUpdate): Promise<boolean> {
    const uid = userId.value;
    if (!uid) return false;
    const { error } = await client
      .from('profiles')
      .update(patch)
      .eq('id', uid);
    if (error) throw error;
    await refresh();
    return true;
  }

  return { profile, pending, refresh, update };
}
