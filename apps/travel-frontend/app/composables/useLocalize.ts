import type { Loc } from '~/data/site';

/**
 * useLocalize — picks the active-locale string from a bilingual `Loc` value.
 * Reactive: templates using `lc()` re-render when the locale changes.
 */
export function useLocalize() {
  const { locale } = useI18n();

  const lc = (value: Loc): string =>
    value[locale.value as keyof Loc] ?? value.ar;

  return { lc, locale };
}
