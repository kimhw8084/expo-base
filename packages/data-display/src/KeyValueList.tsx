import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@precision-calm/primitives';

export interface KeyValueItem { key: string; label: string; value: ReactNode; }
export function KeyValueList({ items }: { items: readonly KeyValueItem[] }) {
  return <View style={styles.root}>{items.map((item) => <View key={item.key} style={styles.row}><Text variant="caption" tone="secondary">{item.label}</Text><View style={styles.value}>{typeof item.value === 'string' || typeof item.value === 'number' ? <Text variant="label">{item.value}</Text> : item.value}</View></View>)}</View>;
}
const styles = StyleSheet.create((theme) => ({
  root: { minWidth: 0 },
  row: { minWidth: 0, minHeight: theme.controlHeights.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle, paddingVertical: theme.spacing.sm },
  value: { minWidth: 0, flexShrink: 1, alignItems: 'flex-end' },
}));
