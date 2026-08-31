import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { listDefaults } from '@precision-calm/platform';
import type { SpacingToken } from '@precision-calm/tokens';

export interface StaticListProps<T> {
  items: readonly T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  gap?: Exclude<SpacingToken, 'none' | 'xxs'>;
}

export function StaticList<T>({ items, keyExtractor, renderItem, gap = 'sm' }: StaticListProps<T>) {
  if (__DEV__ && items.length > listDefaults.staticItemLimit) {
    console.warn(`StaticList received ${items.length} items; use ListScreen for datasets above ${listDefaults.staticItemLimit}.`);
  }
  return <View style={[styles.root, styles[`gap_${gap}`]]}>{items.map((item, index) => <View key={keyExtractor(item, index)}>{renderItem(item, index)}</View>)}</View>;
}

const styles = StyleSheet.create((theme) => ({
  root: { minWidth: 0 },
  gap_xs: { gap: theme.spacing.xs }, gap_sm: { gap: theme.spacing.sm }, gap_md: { gap: theme.spacing.md }, gap_lg: { gap: theme.spacing.lg }, gap_xl: { gap: theme.spacing.xl }, gap_xxl: { gap: theme.spacing.xxl }, gap_xxxl: { gap: theme.spacing.xxxl }, gap_huge: { gap: theme.spacing.huge }, gap_massive: { gap: theme.spacing.massive },
}));
