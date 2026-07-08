/**
 * Price helpers shared by the storefront and admin.
 *
 * Prices are stored per-locale as display strings (`price_ar` in Arabic-Indic
 * digits, `price_en` in Latin) plus a numeric `price_amount`. These helpers keep
 * those representations consistent: parse any digit script to a number, and
 * render a number back as a nicely grouped, locale-appropriate string.
 */

const AR_TO_LATIN: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

/** Normalise a mixed-script price string/number to a plain number (0 if empty). */
export function parsePriceAmount(input: string | number | null | undefined): number {
  if (input == null) return 0;
  const latin = String(input).replace(/[٠-٩۰-۹]/g, (d) => AR_TO_LATIN[d] ?? d);
  const n = Number(latin.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Format an amount as an Arabic-Indic string with grouping, e.g. 7200 → "٧٬٢٠٠". */
export function formatArabicPrice(input: string | number | null | undefined): string {
  const amount = parsePriceAmount(input);
  if (!amount) return '';
  return new Intl.NumberFormat('ar-SA-u-nu-arab', { maximumFractionDigits: 2 }).format(amount);
}

/** Format an amount as a Latin string with grouping, e.g. 7200 → "7,200". */
export function formatLatinPrice(input: string | number | null | undefined): string {
  const amount = parsePriceAmount(input);
  if (!amount) return '';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount);
}

/** Locale-aware price string for display (Arabic-Indic for `ar`, Latin otherwise). */
export function formatPrice(amount: number, locale: string): string {
  return locale === 'ar' ? formatArabicPrice(amount) : formatLatinPrice(amount);
}

const LATIN_TO_AR = '٠١٢٣٤٥٦٧٨٩';

/**
 * Format an Arabic price field live, as the admin types. Accepts any digit
 * script, groups the integer part with the Arabic thousands separator (٬), and
 * preserves a decimal part still being typed (Arabic decimal separator ٫).
 * e.g. "7200" → "٧٬٢٠٠", "٧٢٠٠.5" → "٧٬٢٠٠٫٥".
 */
export function formatArabicPriceInput(raw: string | number | null | undefined): string {
  if (raw == null) return '';
  const latin = String(raw)
    .replace(/[٠-٩۰-۹]/g, (d) => AR_TO_LATIN[d] ?? d)
    .replace(/[^0-9.]/g, '');
  if (!latin) return '';
  const dot = latin.indexOf('.');
  const intDigits = (dot === -1 ? latin : latin.slice(0, dot)).replace(/^0+(?=\d)/, '');
  const grouped = new Intl.NumberFormat('ar-SA-u-nu-arab').format(Number(intDigits || '0'));
  if (dot === -1) return grouped;
  const decArabic = latin
    .slice(dot + 1)
    .replace(/[0-9]/g, (d) => LATIN_TO_AR[Number(d)]);
  return `${grouped}٫${decArabic}`;
}
