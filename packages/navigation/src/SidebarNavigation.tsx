import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, VStack } from '@precision-calm/primitives';
import { NavigationItemButton } from './NavigationItemButton';
import type { NavigationItem } from './types';

export interface SidebarNavigationProps {
  items: readonly NavigationItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  brand?: string | undefined;
  footer?: ReactNode;
  density?: 'compact' | 'standard';
}

export function SidebarNavigation({ items, activeKey, onNavigate, brand = 'Precision', footer, density = 'standard' }: SidebarNavigationProps) {
  return (
    <View style={[styles.root, density === 'compact' ? styles.compact : styles.standard]}>
      <View style={styles.brand}><View style={styles.brandMark}><Text variant="label" tone="onPrimary">P</Text></View><Text variant="label">{brand}</Text></View>
      <VStack gap="xs">{items.map((item) => <NavigationItemButton key={item.key} item={item} active={item.key === activeKey} mode="sidebar" onPress={() => onNavigate(item.key)} />)}</VStack>
      <View style={styles.spacer} />
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  root: { minHeight: '100%', flexShrink: 0, backgroundColor: theme.colors.background.surface, borderRightWidth: 1, borderRightColor: theme.colors.border.subtle, paddingTop: rt.insets.top + theme.spacing.lg, paddingBottom: rt.insets.bottom + theme.spacing.lg, paddingHorizontal: theme.spacing.sm },
  compact: { width: theme.layoutDimensions.sidebar.compact },
  standard: { width: theme.layoutDimensions.sidebar.standard },
  brand: { minHeight: theme.controlHeights.md, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.sm, marginBottom: theme.spacing.lg },
  brandMark: { width: theme.componentMetrics.brandMark, height: theme.componentMetrics.brandMark, borderRadius: theme.radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.interactive.primary },
  spacer: { flex: 1 },
  footer: { paddingTop: theme.spacing.lg },
}));
