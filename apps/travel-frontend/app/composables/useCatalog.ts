import type { Database } from '~/types/database.types';

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

/** FAQs, ordered by `sort`. */
export function useFaqs() {
  const supabase = useSupabaseClient<Database>();
  return useAsyncData('faqs', async () => {
    const { data, error } = await supabase.from('faqs').select('*').order('sort');
    if (error) throw error;
    return data ?? [];
  });
}
