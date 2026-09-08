import type { IconName } from '@precision-calm/icons';

export interface NavigationItem {
  key: string;
  label: string;
  icon: IconName;
  /**
   * A web-safe destination owned by a router adapter. When supplied, navigation
   * renders a real link on web and keeps the native pressable representation.
   * Generic in-place navigation intentionally omits this value.
   */
  href?: string | undefined;
  badge?: string | undefined;
  disabled?: boolean | undefined;
}
