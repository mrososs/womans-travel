import { toValue, type MaybeRefOrGetter } from 'vue';
import type { Database } from '~/types/database.types';
import type { CategoryId, Trip } from '~/data/site';

export type ItemOption = Database['public']['Tables']['item_options']['Row'];
export type PackageDay = Database['public']['Tables']['package_days']['Row'];

type TripRow = Database['public']['Tables']['trips']['Row'];

/**
 * Map a Supabase `trips` row into the app's bilingual `Trip` shape, so the
 * existing UI (TripGrid, useLocalize) consumes DB-backed data unchanged.
 * Numerics arrive as strings over the wire, so `rating` is coerced.
 */
function mapTrip(r: TripRow): Trip {
  return {
    id: r.id,
    cat: (r.category_id ?? 'city') as Exclude<CategoryId, 'all'>,
    kind: r.kind as Trip['kind'],
    icon: r.icon,
    grad: r.grad,
    img: r.image_url ?? undefined,
    rating: Number(r.rating),
    reviews: r.reviews,
    seats: r.seats,
    comingSoon: r.coming_soon ?? false,
    tierKey: r.tier_key as Trip['tierKey'],
    tierVariant: r.tier_variant as Trip['tierVariant'],
    region: { ar: r.region_ar, en: r.region_en },
    title: { ar: r.title_ar, en: r.title_en },
    duration: { ar: r.duration_ar, en: r.duration_en },
    dates: { ar: r.dates_ar, en: r.dates_en },
    price: { ar: r.price_ar, en: r.price_en },
  };
}

/** Trips (destinations) from Supabase, oldest-first, as bilingual `Trip[]`. */
export function useTrips() {
  const supabase = useSupabaseClient<Database>();
  return useAsyncData<Trip[]>('trips', async () => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapTrip);
  });
}

/**
 * Locale-aware picker for Supabase rows that carry `<base>_ar` / `<base>_en`
 * columns (e.g. pick(row, 'title') → row.title_en when locale is 'en').
 */
export function useDbPick() {
  const { locale } = useI18n();
  const pick = (row: Record<string, unknown>, base: string): string =>
    (row[`${base}_${locale.value}`] as string) ?? (row[`${base}_ar`] as string) ?? '';
  return { pick };
}

/** Packages, ordered by `sort`. */
export function usePackages() {
  const supabase = useSupabaseClient<Database>();
  return useAsyncData('packages', async () => {
    const { data, error } = await supabase.from('packages').select('*').order('sort');
    if (error) throw error;
    return data ?? [];
  });
}

/** Tourism services, ordered by `sort`. */
export function useServices() {
  const supabase = useSupabaseClient<Database>();
  return useAsyncData('services', async () => {
    const { data, error } = await supabase.from('services').select('*').order('sort');
    if (error) throw error;
    return data ?? [];
  });
}

/** Travel products, ordered by `sort`. */
export function useProducts() {
  const supabase = useSupabaseClient<Database>();
  return useAsyncData('products', async () => {
    const { data, error } = await supabase.from('products').select('*').order('sort');
    if (error) throw error;
    return data ?? [];
  });
}

/**
 * Purchasable options (room type, deposit, …) for one trip or package, only the
 * available ones, ordered for display. Keyed + watched on the item id so it
 * refetches when navigating between detail pages.
 */
export function useItemOptions(
  itemType: 'trip' | 'package',
  itemId: MaybeRefOrGetter<string>
) {
  const supabase = useSupabaseClient<Database>();
  return useAsyncData<ItemOption[]>(
    () => `item-options-${itemType}-${toValue(itemId)}`,
    async () => {
      const id = toValue(itemId);
      if (!id) return [];
      const { data, error } = await supabase
        .from('item_options')
        .select('*')
        .eq('item_type', itemType)
        .eq('item_id', id)
        .eq('available', true)
        .order('sort', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    { watch: [() => toValue(itemId)] }
  );
}

/**
 * Day-by-day itinerary for one package, ordered for display. Keyed + watched
 * on the package id so it refetches when navigating between detail pages.
 */
export function usePackageDays(packageId: MaybeRefOrGetter<string>) {
  const supabase = useSupabaseClient<Database>();
  return useAsyncData<PackageDay[]>(
    () => `package-days-${toValue(packageId)}`,
    async () => {
      const id = toValue(packageId);
      if (!id) return [];
      const { data, error } = await supabase
        .from('package_days')
        .select('*')
        .eq('package_id', id)
        .order('sort', { ascending: true })
        .order('day_number', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    { watch: [() => toValue(packageId)] }
  );
}

/** FAQs, ordered by `sort`. */
export function useFaqs() {
  const supabase = useSupabaseClient<Database>();
  return useAsyncData('faqs', async () => {
    const { data, error } = await supabase.from('faqs').select('*').order('sort');
    if (error) throw error;
    return data ?? [];
  });
}
