import type { BadgeVariant } from '@org/shared-ui';

/** A string available in both site locales. */
export interface Loc {
  ar: string;
  en: string;
}

export type CategoryId = 'all' | 'beach' | 'mountain' | 'city';
export type TierKey = 'luxury' | 'exclusive' | 'domestic' | 'popular';

/** A bookable trip. Localizable fields carry both locales; the active one is
 *  selected with the `useLocalize` composable. */
export interface Trip {
  id: string;
  cat: Exclude<CategoryId, 'all'>;
  kind: 'intl' | 'local';
  icon: string;
  grad: string;
  /** Editorial card photo (served from /public/trips). Falls back to grad+icon. */
  img?: string;
  rating: number;
  reviews: number;
  seats: number | null;
  /** When true, the trip shows a "coming soon" badge and can't be added to cart. */
  comingSoon: boolean;
  tierKey: TierKey;
  tierVariant: BadgeVariant;
  region: Loc;
  title: Loc;
  duration: Loc;
  dates: Loc;
  price: Loc;
}

export interface Category {
  id: CategoryId;
  icon: string;
}

export interface Feature {
  icon: string;
  title: Loc;
  desc: Loc;
}

export interface Stat {
  n: Loc;
  l: Loc;
}

export interface Review {
  icon: string;
  grad: string;
  name: Loc;
  trip: Loc;
  text: Loc;
}

export interface ItineraryDay {
  day: Loc;
  title: Loc;
  desc: Loc;
}

export interface Highlight {
  icon: string;
  label: Loc;
}

export interface HeroSlide {
  img?: string;
  icon: string;
  grad: string;
}

/** Business contact details — single source of truth for phone/WhatsApp.
 *  `phoneDisplay` is the local Saudi format shown to users; `telHref` and
 *  `whatsappHref` use the international form (country code 966, no leading 0). */
export const CONTACT = {
  phoneDisplay: '0569202654',
  telHref: 'tel:+966569202654',
  whatsappHref: 'https://wa.me/966569202654',
  email: 'info@goldenfuturetravel.com',
  mailtoHref: 'mailto:info@goldenfuturetravel.com',
};

/** Official business registration details, shown in the credentials band above
 *  the footer. `commercialRegister` is the Unified National Number issued on the
 *  Ministry of Commerce سجل تجاري certificate for مؤسسة رحلات المستقبل الذهبي. */
export const BUSINESS = {
  commercialRegister: '7054723015',
};

/** Structural nav entries; labels come from i18n (`nav.<key>`). */
export const NAV: { key: string; path: string; hash?: string }[] = [
  { key: 'home', path: '/' },
  { key: 'destinations', path: '/destinations' },
  { key: 'packages', path: '/packages' },
  { key: 'products', path: '/products' },
  { key: 'contact', path: '/contact' },
];

export const HERO_SLIDES: HeroSlide[] = [
  { img: '/hero/hero-1.webp', icon: 'mountain-snow', grad: 'linear-gradient(120deg,#24314B,#9E5863)' },
  { img: '/hero/hero-2.webp', icon: 'sun', grad: 'linear-gradient(120deg,#C6A15B,#B76E79)' },
  { img: '/hero/hero-3.webp', icon: 'building-2', grad: 'linear-gradient(120deg,#4E6A8A,#9E5863)' },
];

export const CATEGORIES: Category[] = [
  { id: 'all', icon: 'sparkles' },
  { id: 'beach', icon: 'palmtree' },
  { id: 'mountain', icon: 'mountain' },
  { id: 'city', icon: 'building-2' },
];

export const WHY: Feature[] = [
  { icon: 'shield-check', title: { ar: 'خصوصية تامّة', en: 'Complete privacy' }, desc: { ar: 'رحلات نسائية بالكامل، بمرافِقات وطاقم من السيدات.', en: 'Fully women-only trips, with female escorts and staff.' } },
  { icon: 'crown', title: { ar: 'ضيافة راقية', en: 'Refined hospitality' }, desc: { ar: 'إقامة فاخرة وبرامج مصمّمة بعناية لكل التفاصيل.', en: 'Luxury stays and programmes crafted down to every detail.' } },
  { icon: 'users', title: { ar: 'صحبة مختارة', en: 'Curated company' }, desc: { ar: 'مجموعات صغيرة تجمعكِ بسيدات يشاركنكِ الشغف.', en: 'Small groups that connect you with like-minded women.' } },
  { icon: 'headphones', title: { ar: 'دعم متواصل', en: 'Continuous support' }, desc: { ar: 'فريق يرافقكِ قبل الرحلة وأثناءها وبعد عودتكِ.', en: 'A team with you before, during, and after your trip.' } },
];

export const STATS: Stat[] = [
  { n: { ar: '+٤٠', en: '40+' }, l: { ar: 'وجهة حول العالم', en: 'destinations worldwide' } },
  { n: { ar: '+٢٬٥٠٠', en: '2,500+' }, l: { ar: 'مسافرة سعيدة', en: 'happy travellers' } },
  { n: { ar: '٤٫٩', en: '4.9' }, l: { ar: 'متوسط التقييم', en: 'average rating' } },
  { n: { ar: '١٠٠٪', en: '100%' }, l: { ar: 'رحلات نسائية', en: 'women-only trips' } },
];

export const REVIEWS: Review[] = [
  { icon: 'landmark', grad: 'linear-gradient(135deg,#24314B,#9E5863)', name: { ar: 'نورة السالم', en: 'Noura Al-Salem' }, trip: { ar: 'رحلة موسكو', en: 'Moscow trip' }, text: { ar: 'تجربة تفوق الوصف — تنظيم راقٍ وخصوصية جعلتني أستمتع بكل لحظة بأمان تام.', en: 'An experience beyond words — refined organisation and privacy that let me enjoy every moment in complete safety.' } },
  { icon: 'building-2', grad: 'linear-gradient(135deg,#B76E79,#7C444E)', name: { ar: 'ريم القحطاني', en: 'Reem Al-Qahtani' }, trip: { ar: 'رحلة إسطنبول', en: 'Istanbul trip' }, text: { ar: 'كل التفاصيل مدروسة بعناية، والمرافِقة كانت لطيفة ومحترفة. سأكرّر التجربة حتمًا.', en: 'Every detail was thoughtfully considered, and the escort was kind and professional. I will absolutely do it again.' } },
  { icon: 'mountain', grad: 'linear-gradient(135deg,#4E7A5B,#24314B)', name: { ar: 'الجوهرة العتيبي', en: 'Al-Jawhara Al-Otaibi' }, trip: { ar: 'رحلة الباحة', en: 'Al-Baha trip' }, text: { ar: 'أجمل ما في التجربة هو الإحساس بالطمأنينة والصحبة الجميلة. فخامة بمعناها الحقيقي.', en: 'The best part was the sense of reassurance and the lovely company. Luxury in its truest sense.' } },
];

export const HIGHLIGHTS: Highlight[] = [
  { icon: 'bed-double', label: { ar: 'إقامة ٥ نجوم', en: '5-star stay' } },
  { icon: 'plane', label: { ar: 'رحلات مباشرة', en: 'Direct flights' } },
  { icon: 'utensils', label: { ar: 'وجبات فاخرة', en: 'Fine dining' } },
  { icon: 'shield-check', label: { ar: 'نسائي بالكامل', en: 'Fully women-only' } },
];

export const ITINERARY: ItineraryDay[] = [
  { day: { ar: 'اليوم ١', en: 'Day 1' }, title: { ar: 'الوصول والاستقبال', en: 'Arrival & welcome' }, desc: { ar: 'استقبال خاص في المطار ونقل إلى الفندق مع جلسة ترحيب.', en: 'Private airport welcome and transfer to the hotel with a welcome session.' } },
  { day: { ar: 'اليوم ٢', en: 'Day 2' }, title: { ar: 'جولة المدينة القديمة', en: 'Old-town tour' }, desc: { ar: 'زيارة أبرز المعالم برفقة مرشدة سياحية مختصّة.', en: 'Visit the top landmarks with a specialised female guide.' } },
  { day: { ar: 'اليوم ٣', en: 'Day 3' }, title: { ar: 'يوم الطبيعة', en: 'Nature day' }, desc: { ar: 'رحلة إلى المرتفعات وجلسة شاي بانورامية.', en: 'A trip to the highlands and a panoramic tea session.' } },
  { day: { ar: 'اليوم ٤', en: 'Day 4' }, title: { ar: 'تسوّق وأناقة', en: 'Shopping & style' }, desc: { ar: 'وقت حر للتسوّق في أرقى الأسواق المحلية.', en: 'Free time to shop in the finest local markets.' } },
];

export const INCLUDES: Loc[] = [
  { ar: 'تذاكر الطيران ذهابًا وإيابًا', en: 'Round-trip flights' },
  { ar: 'الإقامة الفاخرة', en: 'Luxury accommodation' },
  { ar: 'وجبة الإفطار', en: 'Breakfast' },
  { ar: 'مشرفة على القروب طوال الرحلة', en: 'A group supervisor throughout' },
  { ar: 'جميع التنقلات الداخلية', en: 'All internal transfers' },
  { ar: 'الأنشطة والجولات المذكورة', en: 'Listed activities & tours' },
];
