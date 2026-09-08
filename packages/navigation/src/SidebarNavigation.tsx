import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { usePrecisionDirection } from '@precision-calm/i18n';
import { Text, VStack } from '@precision-calm/primitives';
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

export interface SidebarNavigationProps {
  items: readonly NavigationItem[];
  activeKey: string;
  onNavigate: (key: string, event?: NavigationActivationEvent) => void;
  onNavigateIntent?: ((key: string) => void) | undefined;
  brand?: string | undefined;
  brandMark?: string | undefined;
  footer?: ReactNode;
  density?: 'compact' | 'standard';
}

export function SidebarNavigation({ items, activeKey, onNavigate, onNavigateIntent, brand = 'Precision', brandMark, footer, density = 'standard' }: SidebarNavigationProps) {
  const mark = brandMark ?? (brand.trim().charAt(0).toUpperCase() || 'P');
  const { rt, theme } = useUnistyles();
  const direction = usePrecisionDirection();
  const horizontalInsets = direction === 'rtl'
    ? { paddingStart: rt.insets.right + theme.spacing.sm, paddingEnd: theme.spacing.sm }
    : { paddingStart: rt.insets.left + theme.spacing.sm, paddingEnd: theme.spacing.sm };
  return (
    <View style={[styles.root, horizontalInsets, density === 'compact' ? styles.compact : styles.standard]}>
      <View style={styles.brand}>
        <View style={styles.brandMark}><Text variant="label" tone="onPrimary">{mark}</Text></View>
        <Text variant="label" numberOfLines={1}>{brand}</Text>
      </View>
      <ScrollView
        role="navigation"
        accessibilityLabel="Primary navigation"
        aria-label="Primary navigation"
        testID="sidebar-navigation-scroll"
        style={styles.scroll}
        contentContainerStyle={styles.items}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <VStack gap="xs">
          {items.map((item) => <NavigationItemButton key={item.key} item={item} active={item.key === activeKey} mode="sidebar" onIntent={() => onNavigateIntent?.(item.key)} onPress={(event) => onNavigate(item.key, event)} />)}
        </VStack>
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  root: { flex: 1, minHeight: 0, flexShrink: 0, backgroundColor: theme.colors.background.surface, borderEndWidth: theme.strokeWidths.standard, borderEndColor: theme.colors.border.subtle, paddingTop: rt.insets.top + theme.spacing.lg, paddingBottom: rt.insets.bottom + theme.spacing.lg },
  compact: { width: theme.layoutDimensions.sidebar.compact },
  standard: { width: theme.layoutDimensions.sidebar.standard },
  brand: { minHeight: theme.controlHeights.md, flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.sm, marginBottom: theme.spacing.md },
  brandMark: { width: theme.componentMetrics.brandMark, height: theme.componentMetrics.brandMark, borderRadius: theme.radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.interactive.primary },
  scroll: { minHeight: 0, flex: 1 },
  items: { paddingBottom: theme.spacing.lg },
  footer: { flexShrink: 0, paddingTop: theme.spacing.md, borderTopWidth: theme.strokeWidths.standard, borderTopColor: theme.colors.border.subtle },
}));
