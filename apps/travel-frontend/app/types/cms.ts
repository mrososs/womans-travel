import type { BadgeVariant } from '@org/shared-ui';

/**
 * Single-locale shapes for Storyblok-driven content. The CDA is queried with
 * `language` + `fallback_lang`, so every field arrives already localized —
 * these types replace the bilingual `Loc {ar,en}` pattern from app/data/site.ts.
 * The mappers below isolate components from the raw Storyblok story shape.
 */

export type CategoryId = 'all' | 'beach' | 'mountain' | 'city' | 'desert';
export type TripCategory = Exclude<CategoryId, 'all'>;
export type TripKind = 'intl' | 'local';
export type TierKey = 'luxury' | 'exclusive' | 'domestic' | 'popular';

/** Minimal slice of a Storyblok story we rely on. */
export interface SbStory {
  id: number;
  uuid: string;
  slug: string;
  full_slug: string;
  content: Record<string, any>;
}

export interface CmsHighlight {
  icon: string;
  label: string;
}

export interface CmsItineraryDay {
  day: string;
  title: string;
  desc: string;
}

export interface CmsTrip {
  slug: string;
  uuid: string;
  cat: TripCategory;
  kind: TripKind;
  icon: string;
  grad: string;
  image?: string;
  rating: number;
  reviews: number;
  seats: number | null;
  tierKey: TierKey;
  tierVariant: BadgeVariant;
  region: string;
  title: string;
  duration: string;
  dates: string;
  priceDisplay: string;
  priceAmount: number;
  featured: boolean;
  highlights: CmsHighlight[];
  itinerary: CmsItineraryDay[];
  /** Empty ⇒ fall back to SiteSettings.defaultIncludes. */
  includes: string[];
}

export interface CmsPackage {
  slug: string;
  uuid: string;
  kind: TripKind;
  icon: string;
  grad: string;
  title: string;
  description: string;
  priceDisplay: string;
  priceAmount: number;
  includes: string[];
}

export interface CmsService {
  slug: string;
  uuid: string;
  icon: string;
  title: string;
  description: string;
}

export interface CmsProduct {
  slug: string;
  uuid: string;
  icon: string;
  grad: string;
  title: string;
  description: string;
  priceDisplay: string;
  priceAmount: number;
}

export interface CmsFaq {
  slug: string;
  uuid: string;
  question: string;
  answer: string;
}

export interface CmsHeroSlide {
  img?: string;
  icon: string;
  grad: string;
}

export interface CmsFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface CmsStat {
  n: string;
  l: string;
}

export interface CmsReview {
  icon: string;
  grad: string;
  name: string;
  trip: string;
  text: string;
}

export interface CmsCategory {
  id: TripCategory;
  icon: string;
  label: string;
}

export interface SiteSettings {
  heroSlides: CmsHeroSlide[];
  why: CmsFeature[];
  stats: CmsStat[];
  reviews: CmsReview[];
  categories: CmsCategory[];
  defaultIncludes: string[];
}

// ---------- mappers ----------

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const bloks = (v: unknown): Record<string, any>[] => (Array.isArray(v) ? v : []);

export function mapTrip(story: SbStory): CmsTrip {
  const c = story.content;
  return {
    slug: story.slug,
    uuid: story.uuid,
    cat: (c.category || 'city') as TripCategory,
    kind: (c.kind || 'intl') as TripKind,
    icon: str(c.icon),
    grad: str(c.grad),
    image: c.image?.filename || undefined,
    rating: num(c.rating),
    reviews: num(c.reviews_count),
    seats: c.seats === '' || c.seats == null ? null : num(c.seats),
    tierKey: (c.tier_key || 'popular') as TierKey,
    tierVariant: (c.tier_variant || 'solid') as BadgeVariant,
    region: str(c.region),
    title: str(c.title),
    duration: str(c.duration),
    dates: str(c.dates),
    priceDisplay: str(c.price_display),
    priceAmount: num(c.price_amount),
    featured: !!c.featured,
    highlights: bloks(c.highlights).map((b) => ({ icon: str(b.icon), label: str(b.label) })),
    itinerary: bloks(c.itinerary).map((b) => ({ day: str(b.day), title: str(b.title), desc: str(b.desc) })),
    includes: bloks(c.includes).map((b) => str(b.label)),
  };
}

export function mapPackage(story: SbStory): CmsPackage {
  const c = story.content;
  return {
    slug: story.slug,
    uuid: story.uuid,
    kind: (c.kind || 'intl') as TripKind,
    icon: str(c.icon),
    grad: str(c.grad),
    title: str(c.title),
    description: str(c.description),
    priceDisplay: str(c.price_display),
    priceAmount: num(c.price_amount),
    includes: bloks(c.includes).map((b) => str(b.label)),
  };
}

export function mapService(story: SbStory): CmsService {
  const c = story.content;
  return {
    slug: story.slug,
    uuid: story.uuid,
    icon: str(c.icon),
    title: str(c.title),
    description: str(c.description),
  };
}

export function mapProduct(story: SbStory): CmsProduct {
  const c = story.content;
  return {
    slug: story.slug,
    uuid: story.uuid,
    icon: str(c.icon),
    grad: str(c.grad),
    title: str(c.title),
    description: str(c.description),
    priceDisplay: str(c.price_display),
    priceAmount: num(c.price_amount),
  };
}

export function mapFaq(story: SbStory): CmsFaq {
  const c = story.content;
  return {
    slug: story.slug,
    uuid: story.uuid,
    question: str(c.question),
    answer: str(c.answer),
  };
}

export function mapSiteSettings(story: SbStory): SiteSettings {
  const c = story.content;
  return {
    heroSlides: bloks(c.hero_slides).map((b) => ({
      img: str(b.image) || undefined,
      icon: str(b.icon),
      grad: str(b.grad),
    })),
    why: bloks(c.why_items).map((b) => ({ icon: str(b.icon), title: str(b.title), desc: str(b.desc) })),
    stats: bloks(c.stats).map((b) => ({ n: str(b.value), l: str(b.label) })),
    reviews: bloks(c.reviews).map((b) => ({
      icon: str(b.icon),
      grad: str(b.grad),
      name: str(b.name),
      trip: str(b.trip),
      text: str(b.text),
    })),
    categories: bloks(c.categories).map((b) => ({
      id: (b.cat_id || 'city') as TripCategory,
      icon: str(b.icon),
      label: str(b.label),
    })),
    defaultIncludes: bloks(c.default_includes).map((b) => str(b.label)),
  };
}
