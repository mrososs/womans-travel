// @org/shared-ui — Durrah women's luxury travel design system (Vue 3 SFCs).
// Ported from the claude.ai/design "Ashwaq — Women's Luxury Travel" project.

// Public type contracts
export type {
  BadgeVariant,
  TripTier,
  SelectOption,
  TabItem,
  BottomNavItem,
  NavLink,
  FooterColumn,
  SocialLink,
} from './types';

// actions
export { default as Button } from './components/actions/Button.vue';
export { default as IconButton } from './components/actions/IconButton.vue';

// display
export { default as Icon } from './components/display/Icon.vue';
export { default as Badge } from './components/display/Badge.vue';
export { default as Tag } from './components/display/Tag.vue';
export { default as Rating } from './components/display/Rating.vue';
export { default as Card } from './components/display/Card.vue';
export { default as TripCard } from './components/display/TripCard.vue';

// forms
export { default as Input } from './components/forms/Input.vue';
export { default as Select } from './components/forms/Select.vue';
export { default as Checkbox } from './components/forms/Checkbox.vue';
export { default as Radio } from './components/forms/Radio.vue';
export { default as Switch } from './components/forms/Switch.vue';

// feedback
export { default as Dialog } from './components/feedback/Dialog.vue';
export { default as Toast } from './components/feedback/Toast.vue';
export { default as Tooltip } from './components/feedback/Tooltip.vue';
export { default as Skeleton } from './components/feedback/Skeleton.vue';

// navigation
export { default as Tabs } from './components/navigation/Tabs.vue';
export { default as BottomNav } from './components/navigation/BottomNav.vue';

// site
export { default as Navbar } from './components/site/Navbar.vue';
export { default as Footer } from './components/site/Footer.vue';
