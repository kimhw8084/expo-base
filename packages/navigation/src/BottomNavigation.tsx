import { useRef, type ComponentRef } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { usePrecisionDirection } from '@precision-calm/i18n';
import { resolveRovingFocusIndex } from '@precision-calm/platform';
import { useDensity } from '@precision-calm/primitives';
import { NavigationItemButton } from './NavigationItemButton';
import type { NavigationItem } from './types';

type NavigationActivationEvent = {
  altKey?: boolean;
  button?: number;
  ctrlKey?: boolean;
  metaKey?: boolean;
  nativeEvent?: unknown;
  preventDefault?: () => void;
  shiftKey?: boolean;
};

export interface BottomNavigationProps { items: readonly NavigationItem[]; activeKey: string; onNavigate: (key: string, event?: NavigationActivationEvent) => void; onNavigateIntent?: ((key: string) => void) | undefined; }
export function BottomNavigation({ items, activeKey, onNavigate, onNavigateIntent }: BottomNavigationProps) {
  const { rt, theme } = useUnistyles();
  const density = useDensity();
  const horizontalPadding = density === 'compact' ? theme.spacing.xs : theme.spacing.sm;
  const direction = usePrecisionDirection();
  const itemRefs = useRef<Array<ComponentRef<typeof Pressable> | null>>([]);
  const enabled = items.map((item) => !item.disabled);
  const usesRouteLinks = items.some((item) => Boolean(item.href));
  const activeIndex = items.findIndex((item, index) => item.key === activeKey && enabled[index]);
  const tabStopIndex = activeIndex >= 0 ? activeIndex : enabled.findIndex(Boolean);
  const navigate = (index: number, event: { key: string; preventDefault: () => void }) => {
    const next = resolveRovingFocusIndex(event.key, index, enabled, { direction });
    if (next === null) return;
    event.preventDefault();
    itemRefs.current[next]?.focus();
    const item = items[next];
    if (item) onNavigate(item.key);
  };
  const horizontalInsets = direction === 'rtl'
    ? { paddingStart: rt.insets.right + horizontalPadding, paddingEnd: rt.insets.left + horizontalPadding }
    : { paddingStart: rt.insets.left + horizontalPadding, paddingEnd: rt.insets.right + horizontalPadding };
  return (
    <View
      nativeID="precision-bottom-navigation"
      style={[styles.root, horizontalInsets]}
      accessibilityRole="tablist"
      role={usesRouteLinks ? 'navigation' : 'tablist'}
      accessibilityLabel="Primary navigation"
      aria-label="Primary navigation"
    >
      {items.map((item, index) => <NavigationItemButton
        ref={(node) => { itemRefs.current[index] = node; }}
        key={item.key}
        item={item}
        active={item.key === activeKey}
        mode="bottom"
        tabIndex={usesRouteLinks ? undefined : index === tabStopIndex ? 0 as const : -1 as const}
        onKeyDown={usesRouteLinks ? undefined : (event) => navigate(index, event)}
        onIntent={() => onNavigateIntent?.(item.key)}
        onPress={(event) => onNavigate(item.key, event)}
      />)}
    </View>
  );
}
const styles = StyleSheet.create((theme, rt) => ({
  root: { minWidth: 0, flexDirection: 'row', gap: { compact: theme.spacing.xxs, medium: theme.spacing.xs }, paddingTop: theme.spacing.xs, paddingBottom: rt.insets.bottom + theme.spacing.xs, borderTopWidth: theme.strokeWidths.standard, borderTopColor: theme.colors.border.subtle, backgroundColor: theme.colors.background.surface },
}));
