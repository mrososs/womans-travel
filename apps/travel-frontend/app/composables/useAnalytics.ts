declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** A GA4 `items[]` entry. */
export interface GaItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
}

/** Anything with the shape of a cart line / order line. */
export interface AnalyticsLine {
  item_type: string;
  item_id: string;
  title?: string | null;
  unit_price?: number | null;
  quantity?: number | null;
}

const CURRENCY = 'SAR';

/**
 * Map cart/order lines to GA4 `items[]`. The id is namespaced by type because
 * a trip and a package can legitimately share an id (e.g. both "red-sea") and
 * would otherwise be merged into one product in the GA reports.
 */
export function toGaItems(lines: readonly AnalyticsLine[]): GaItem[] {
  return lines.map((l) => ({
    item_id: `${l.item_type}:${l.item_id}`,
    item_name: l.title ?? l.item_id,
    item_category: l.item_type,
    price: Number(l.unit_price ?? 0),
    quantity: Math.max(1, Number(l.quantity ?? 1)),
  }));
}

function valueOf(items: readonly GaItem[]): number {
  return Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
}

/**
 * useAnalytics — the single entry point for Google Analytics 4 events.
 *
 * Every method is a no-op when gtag is absent (SSR, development, an ad
 * blocker, or a missing measurement ID), so call sites never need to guard.
 * The commerce helpers follow GA4's recommended e-commerce event names, which
 * is what makes the Monetisation reports — revenue, funnel, coupon
 * performance — populate rather than staying empty.
 */
export function useAnalytics() {
  function track(event: string, params: Record<string, unknown> = {}) {
    if (import.meta.server) return;
    window.gtag?.('event', event, params);
  }

  return {
    track,

    viewItem(line: AnalyticsLine) {
      const items = toGaItems([line]);
      track('view_item', { currency: CURRENCY, value: valueOf(items), items });
    },

    addToCart(line: AnalyticsLine) {
      const items = toGaItems([line]);
      track('add_to_cart', { currency: CURRENCY, value: valueOf(items), items });
    },

    removeFromCart(line: AnalyticsLine) {
      const items = toGaItems([line]);
      track('remove_from_cart', { currency: CURRENCY, value: valueOf(items), items });
    },

    viewCart(lines: readonly AnalyticsLine[]) {
      const items = toGaItems(lines);
      track('view_cart', { currency: CURRENCY, value: valueOf(items), items });
    },

    beginCheckout(lines: readonly AnalyticsLine[], coupon?: string | null) {
      const items = toGaItems(lines);
      track('begin_checkout', {
        currency: CURRENCY,
        value: valueOf(items),
        ...(coupon ? { coupon } : {}),
        items,
      });
    },

    /** `paymentType` is the method the shopper picked (moyasar / tabby / …). */
    addPaymentInfo(lines: readonly AnalyticsLine[], paymentType: string, coupon?: string | null) {
      const items = toGaItems(lines);
      track('add_payment_info', {
        currency: CURRENCY,
        value: valueOf(items),
        payment_type: paymentType,
        ...(coupon ? { coupon } : {}),
        items,
      });
    },

    /**
     * `transactionId` must be the order id: GA4 de-duplicates purchases on it,
     * so a shopper refreshing the success page cannot double-count revenue.
     */
    purchase(input: {
      transactionId: string;
      value: number;
      tax?: number;
      discount?: number;
      coupon?: string | null;
      lines: readonly AnalyticsLine[];
    }) {
      track('purchase', {
        transaction_id: input.transactionId,
        currency: CURRENCY,
        value: input.value,
        ...(input.tax != null ? { tax: input.tax } : {}),
        ...(input.discount ? { discount: input.discount } : {}),
        ...(input.coupon ? { coupon: input.coupon } : {}),
        items: toGaItems(input.lines),
      });
    },
  };
}
