// Public type contracts for the Durrah design-system components.

export type BadgeVariant =
  | 'brand' | 'gold' | 'navy' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'solid';

export interface TripTier {
  label: string;
  variant?: BadgeVariant;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface TabItem {
  id: string;
  label: string;
  /** Optional Lucide icon name (kebab-case). */
  icon?: string;
}

export interface BottomNavItem {
  id: string;
  label: string;
  /** Lucide icon name (kebab-case). */
  icon: string;
  fab?: boolean;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: { label: string; href?: string }[];
}

export interface SocialLink {
  /** Icon name — a Lucide kebab-case glyph, or `snapchat` for the built-in brand mark. */
  icon: string;
  /** External profile URL. When omitted the icon renders as a non-navigating placeholder. */
  href?: string;
  /** Accessible label (falls back to the icon name). */
  label?: string;
}
