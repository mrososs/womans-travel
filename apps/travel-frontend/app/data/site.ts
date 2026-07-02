import type { BadgeVariant } from '@org/shared-ui';

/** A string available in both site locales. */
export interface Loc {
  ar: string;
  en: string;
}

export type CategoryId = 'all' | 'beach' | 'mountain' | 'city' | 'desert';
export type TierKey = 'luxury' | 'exclusive' | 'domestic' | 'popular';

/** A bookable trip. Localizable fields carry both locales; the active one is
 *  selected with the `useLocalize` composable. */
export interface Trip {
  id: string;
  cat: Exclude<CategoryId, 'all'>;
  kind: 'intl' | 'local';
  icon: string;
  grad: string;
  rating: number;
  reviews: number;
  seats: number | null;
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

/** Structural nav entries; labels come from i18n (`nav.<key>`). */
export const NAV: { key: string; path: string; hash?: string }[] = [
  { key: 'home', path: '/' },
  { key: 'destinations', path: '/destinations' },
  { key: 'packages', path: '/packages' },
  { key: 'services', path: '/services' },
  { key: 'products', path: '/products' },
  { key: 'contact', path: '/contact' },
];

export const HERO_SLIDES: HeroSlide[] = [
  { img: '/hero/hero-1.png', icon: 'mountain-snow', grad: 'linear-gradient(120deg,#24314B,#9E5863)' },
  { img: '/hero/hero-2.png', icon: 'sun', grad: 'linear-gradient(120deg,#C6A15B,#B76E79)' },
  { img: '/hero/hero-3.png', icon: 'building-2', grad: 'linear-gradient(120deg,#4E6A8A,#9E5863)' },
];

export const CATEGORIES: Category[] = [
  { id: 'all', icon: 'sparkles' },
  { id: 'beach', icon: 'palmtree' },
  { id: 'mountain', icon: 'mountain' },
  { id: 'city', icon: 'building-2' },
  { id: 'desert', icon: 'sun' },
];

export const TRIPS: Trip[] = [
  {
    id: 'alps', cat: 'mountain', kind: 'intl', icon: 'mountain-snow', grad: 'linear-gradient(155deg,#24314B,#9E5863)',
    rating: 4.8, reviews: 124, seats: 3, tierKey: 'luxury', tierVariant: 'solid',
    region: { ar: 'النمسا', en: 'Austria' },
    title: { ar: 'جبال الألب النمساوية', en: 'The Austrian Alps' },
    duration: { ar: '٧ أيام', en: '7 days' },
    dates: { ar: '١٢–١٨ سبتمبر', en: '12–18 Sep' },
    price: { ar: '٨٬٥٠٠', en: '8,500' },
  },
  {
    id: 'maldives', cat: 'beach', kind: 'intl', icon: 'palmtree', grad: 'linear-gradient(155deg,#C6A15B,#B76E79)',
    rating: 4.9, reviews: 86, seats: null, tierKey: 'exclusive', tierVariant: 'navy',
    region: { ar: 'المالديف', en: 'Maldives' },
    title: { ar: 'منتجع خاص على الجزيرة', en: 'A private island resort' },
    duration: { ar: '٥ أيام', en: '5 days' },
    dates: { ar: '٣–٧ أكتوبر', en: '3–7 Oct' },
    price: { ar: '١٤٬٢٠٠', en: '14,200' },
  },
  {
    id: 'alula', cat: 'mountain', kind: 'local', icon: 'mountain', grad: 'linear-gradient(155deg,#B76E79,#7C444E)',
    rating: 4.7, reviews: 152, seats: 6, tierKey: 'domestic', tierVariant: 'brand',
    region: { ar: 'السعودية · العُلا', en: 'Saudi Arabia · AlUla' },
    title: { ar: 'العُلا الساحرة', en: 'Enchanting AlUla' },
    duration: { ar: '٤ أيام', en: '4 days' },
    dates: { ar: '٢٠–٢٣ نوفمبر', en: '20–23 Nov' },
    price: { ar: '٥٬٩٠٠', en: '5,900' },
  },
  {
    id: 'kyoto', cat: 'city', kind: 'intl', icon: 'flower-2', grad: 'linear-gradient(155deg,#9E5863,#24314B)',
    rating: 4.9, reviews: 64, seats: 4, tierKey: 'luxury', tierVariant: 'solid',
    region: { ar: 'اليابان', en: 'Japan' },
    title: { ar: 'كيوتو الكلاسيكية', en: 'Classic Kyoto' },
    duration: { ar: '٨ أيام', en: '8 days' },
    dates: { ar: '١–٨ أبريل', en: '1–8 Apr' },
    price: { ar: '١١٬٣٠٠', en: '11,300' },
  },
  {
    id: 'santorini', cat: 'beach', kind: 'intl', icon: 'sailboat', grad: 'linear-gradient(155deg,#4E6A8A,#B76E79)',
    rating: 4.8, reviews: 98, seats: 2, tierKey: 'popular', tierVariant: 'gold',
    region: { ar: 'اليونان', en: 'Greece' },
    title: { ar: 'سانتوريني البيضاء', en: 'White Santorini' },
    duration: { ar: '٦ أيام', en: '6 days' },
    dates: { ar: '١٥–٢٠ يونيو', en: '15–20 Jun' },
    price: { ar: '٩٬٧٠٠', en: '9,700' },
  },
  {
    id: 'taif', cat: 'city', kind: 'local', icon: 'flower', grad: 'linear-gradient(155deg,#C88A82,#9E5863)',
    rating: 4.6, reviews: 71, seats: 8, tierKey: 'domestic', tierVariant: 'brand',
    region: { ar: 'السعودية · الطائف', en: 'Saudi Arabia · Taif' },
    title: { ar: 'الطائف والورد', en: 'Taif & the roses' },
    duration: { ar: '٣ أيام', en: '3 days' },
    dates: { ar: '٥–٧ مايو', en: '5–7 May' },
    price: { ar: '٣٬٤٠٠', en: '3,400' },
  },
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
  { icon: 'mountain-snow', grad: 'linear-gradient(135deg,#24314B,#9E5863)', name: { ar: 'نورة السالم', en: 'Noura Al-Salem' }, trip: { ar: 'رحلة النمسا', en: 'Austria trip' }, text: { ar: 'تجربة تفوق الوصف — تنظيم راقٍ وخصوصية جعلتني أستمتع بكل لحظة بأمان تام.', en: 'An experience beyond words — refined organisation and privacy that let me enjoy every moment in complete safety.' } },
  { icon: 'palmtree', grad: 'linear-gradient(135deg,#C6A15B,#B76E79)', name: { ar: 'ريم القحطاني', en: 'Reem Al-Qahtani' }, trip: { ar: 'رحلة المالديف', en: 'Maldives trip' }, text: { ar: 'كل التفاصيل مدروسة بعناية، والمرافِقة كانت لطيفة ومحترفة. سأكرّر التجربة حتمًا.', en: 'Every detail was thoughtfully considered, and the escort was kind and professional. I will absolutely do it again.' } },
  { icon: 'mountain', grad: 'linear-gradient(135deg,#B76E79,#7C444E)', name: { ar: 'الجوهرة العتيبي', en: 'Al-Jawhara Al-Otaibi' }, trip: { ar: 'رحلة العُلا', en: 'AlUla trip' }, text: { ar: 'أجمل ما في التجربة هو الإحساس بالطمأنينة والصحبة الجميلة. فخامة بمعناها الحقيقي.', en: 'The best part was the sense of reassurance and the lovely company. Luxury in its truest sense.' } },
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
  { ar: 'الوجبات الرئيسية', en: 'Main meals' },
  { ar: 'مرافِقة مختصّة طوال الرحلة', en: 'A dedicated escort throughout' },
  { ar: 'جميع التنقلات الداخلية', en: 'All internal transfers' },
  { ar: 'الأنشطة والجولات المذكورة', en: 'Listed activities & tours' },
];

export function findTrip(id: string): Trip | undefined {
  return TRIPS.find((t) => t.id === id);
}
