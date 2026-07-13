import type { Database, TablesInsert } from '~/types/database.types';

export type TripInsert = TablesInsert<'trips'>;
export type PackageInsert = TablesInsert<'packages'>;
export type ItemOptionRow = Database['public']['Tables']['item_options']['Row'];
export type ItemOptionInsert = TablesInsert<'item_options'>;
export type PackageDayRow = Database['public']['Tables']['package_days']['Row'];
export type PackageDayInsert = TablesInsert<'package_days'>;

/** Which content tables carry admin-managed purchasable options. */
export type OptionOwnerType = 'trip' | 'package';

/** Public bucket that holds admin-uploaded editorial photos. */
const CONTENT_BUCKET = 'content';

/**
 * useAdminContent — admin-only writes for the `trips` and `packages` content
 * tables plus photo uploads to the public `content` Storage bucket. All writes
 * are gated server-side by RLS (`is_admin()`), so a non-admin call simply
 * fails; the UI is additionally guarded by the `admin` route middleware.
 */
export function useAdminContent() {
  const client = useSupabaseClient<Database>();

  /**
   * Upload an image to Storage under `<folder>/<slug>-<rand>.<ext>` and return
   * its public URL (stored in the row's `image_url`). Overwrites are disabled
   * (unique name each time), so replacing a photo never hits a cache.
   */
  async function uploadImage(file: File, folder: 'trips' | 'packages', slug: string): Promise<string> {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `${folder}/${slug || 'item'}-${Date.now()}-${rand}.${ext}`;
    const { error } = await client.storage
      .from(CONTENT_BUCKET)
      .upload(path, file, { cacheControl: '31536000', upsert: false });
    if (error) throw error;
    return client.storage.from(CONTENT_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  /** Insert or update a trip (upsert on the text `id`). */
  async function saveTrip(row: TripInsert): Promise<void> {
    const { error } = await client.from('trips').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  async function deleteTrip(id: string): Promise<void> {
    const { error } = await client.from('trips').delete().eq('id', id);
    if (error) throw error;
  }

  /** Insert or update a package (upsert on the text `id`). */
  async function savePackage(row: PackageInsert): Promise<void> {
    const { error } = await client.from('packages').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  async function deletePackage(id: string): Promise<void> {
    const { error } = await client.from('packages').delete().eq('id', id);
    if (error) throw error;
  }

  /* ---------- Item options (per trip / package) ---------- */

  /** All options for one owner item, ordered for display. */
  async function listOptions(itemType: OptionOwnerType, itemId: string): Promise<ItemOptionRow[]> {
    const { data, error } = await client
      .from('item_options')
      .select('*')
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .order('sort', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  /** Insert (no id) or update (with id) a single option. Returns the saved row. */
  async function saveOption(row: ItemOptionInsert): Promise<ItemOptionRow> {
    const { data, error } = await client
      .from('item_options')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteOption(id: string): Promise<void> {
    const { error } = await client.from('item_options').delete().eq('id', id);
    if (error) throw error;
  }

  /* ---------- Package itinerary (day-by-day program) ---------- */

  /** All itinerary days for one package, ordered for display. */
  async function listDays(packageId: string): Promise<PackageDayRow[]> {
    const { data, error } = await client
      .from('package_days')
      .select('*')
      .eq('package_id', packageId)
      .order('sort', { ascending: true })
      .order('day_number', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  /** Insert (no id) or update (with id) a single itinerary day. Returns the saved row. */
  async function saveDay(row: PackageDayInsert): Promise<PackageDayRow> {
    const { data, error } = await client
      .from('package_days')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteDay(id: string): Promise<void> {
    const { error } = await client.from('package_days').delete().eq('id', id);
    if (error) throw error;
  }

  return {
    uploadImage,
    saveTrip,
    deleteTrip,
    savePackage,
    deletePackage,
    listOptions,
    saveOption,
    deleteOption,
    listDays,
    saveDay,
    deleteDay,
  };
}
