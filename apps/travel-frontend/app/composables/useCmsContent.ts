import type { SbStory } from '~/types/cms';
import {
  mapFaq,
  mapPackage,
  mapProduct,
  mapService,
  mapSiteSettings,
  mapTrip,
} from '~/types/cms';

/**
 * Storyblok content composables. The space's default language is Arabic;
 * English is a field-level translation, so the CDA is queried with
 * `language` + `fallback_lang: 'default'` and every field arrives already
 * localized (replacing the old `Loc {ar,en}` / `useDbPick` patterns).
 *
 * Both invariants matter for the i18n switcher (it navigates between `/` and
 * `/en` without a reload): the useAsyncData key includes the locale, and the
 * fetch re-runs when it changes.
 */

function useSbParams() {
  const { locale } = useI18n();
  const version = useRuntimeConfig().public.storyblokVersion as 'draft' | 'published';
  const language = computed(() => (locale.value === 'ar' ? 'default' : locale.value));
  return { locale, version, language };
}

/** All stories under a folder, ordered by their Storyblok position. */
function useCmsList<T>(folder: string, mapFn: (story: SbStory) => T) {
  const api = useStoryblokApi();
  const { locale, version, language } = useSbParams();
  return useAsyncData(
    computed(() => `sb-${folder}-${locale.value}`),
    async () => {
      const { data } = await api.get('cdn/stories', {
        starts_with: `${folder}/`,
        version,
        language: language.value,
        fallback_lang: 'default',
        sort_by: 'position:asc',
        per_page: 100,
      });
      return (data.stories as SbStory[]).map(mapFn);
    },
    { watch: [locale] },
  );
}

/**
 * A single story by full slug. In draft mode the Storyblok bridge is
 * registered so the visual editor live-updates the page while editing.
 */
function useCmsStory<T>(fullSlug: string, key: string, mapFn: (story: SbStory) => T) {
  const api = useStoryblokApi();
  const { locale, version, language } = useSbParams();
  const asyncData = useAsyncData(
    computed(() => `sb-${key}-${locale.value}`),
    async () => {
      const { data } = await api.get(`cdn/stories/${fullSlug}`, {
        version,
        language: language.value,
        fallback_lang: 'default',
      });
      return data.story as SbStory;
    },
    { watch: [locale] },
  );

  if (version === 'draft') {
    onMounted(() => {
      const id = asyncData.data.value?.id;
      if (id) {
        useStoryblokBridge(id, (story) => {
          asyncData.data.value = story as unknown as SbStory;
        });
      }
    });
  }

  const item = computed(() => (asyncData.data.value ? mapFn(asyncData.data.value) : null));
  return { ...asyncData, item };
}

export function useCmsTrips() {
  return useCmsList('trips', mapTrip);
}

export function useCmsTrip(slug: string) {
  return useCmsStory(`trips/${slug}`, `trip-${slug}`, mapTrip);
}

export function useCmsPackages() {
  return useCmsList('packages', mapPackage);
}

export function useCmsPackage(slug: string) {
  return useCmsStory(`packages/${slug}`, `package-${slug}`, mapPackage);
}

export function useCmsServices() {
  return useCmsList('services', mapService);
}

export function useCmsProducts() {
  return useCmsList('products', mapProduct);
}

export function useCmsFaqs() {
  return useCmsList('faqs', mapFaq);
}

/** The global `site-settings` story (hero, why, stats, reviews, categories…). */
export function useSiteSettings() {
  return useCmsStory('site-settings', 'site-settings', mapSiteSettings);
}
