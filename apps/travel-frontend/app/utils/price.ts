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

export interface OfferInfo {
  /** True while a discount price exists and seats remain (or the offer has no seat cap). */
  active: boolean;
  /** Remaining discounted seats, or null when the offer is uncapped/inactive. */
  seatsLeft: number | null;
}

/**
 * Resolve whether a trip/package's limited-seats offer is still live. Once
 * `seatsClaimed` reaches `seatsLimit` the offer reverts to the regular price
 * with no separate "active" flag to keep in sync.
 */
export function getOfferInfo(
  seatsLimit: number | null | undefined,
  seatsClaimed: number | null | undefined,
  discountAmount: number | null | undefined
): OfferInfo {
  if (discountAmount == null) return { active: false, seatsLeft: null };
  if (seatsLimit == null) return { active: true, seatsLeft: null };
  const seatsLeft = Math.max(0, seatsLimit - (seatsClaimed ?? 0));
  return { active: seatsLeft > 0, seatsLeft };
}

/**
 * Whether per-option discounts on a trip/package are still live. They ride on
 * the parent's seat cap when it has one, but — unlike `getOfferInfo` — do not
 * require the parent to carry a discounted price of its own: an item may
 * discount only its options (e.g. the Red Sea group's two room types, each
 * marked down by a different amount).
 */
export function optionOffersLive(
  seatsLimit: number | null | undefined,
  seatsClaimed: number | null | undefined
): boolean {
  if (seatsLimit == null) return true;
  return seatsLimit - (seatsClaimed ?? 0) > 0;
}

/** An `item_options` row, as far as pricing is concerned. */
export interface PricedOption {
  price_amount: number | string;
  discount_price_amount?: number | string | null;
}

/**
 * The option's own discounted price, or null when it has none / the offer is
 * over. A discount that isn't actually cheaper is ignored, so a stale value
 * can never price an option above its regular price.
 */
export function getOptionDiscount(
  option: PricedOption | null | undefined,
  live: boolean
): number | null {
  if (!live || !option || option.discount_price_amount == null) return null;
  const discounted = Number(option.discount_price_amount);
  const regular = Number(option.price_amount) || 0;
  return Number.isFinite(discounted) && discounted > 0 && discounted < regular ? discounted : null;
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
