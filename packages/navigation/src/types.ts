import type { IconName } from '@precision-calm/icons';

export interface NavigationItem {
  key: string;
  label: string;
  icon: IconName;
  badge?: string | undefined;
  disabled?: boolean | undefined;
}
