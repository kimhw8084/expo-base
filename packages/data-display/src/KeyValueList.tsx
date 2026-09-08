import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, useDensity } from '@precision-calm/primitives';

export interface KeyValueItem {
  key: string;
  label: string;
  value: ReactNode;
}

export interface KeyValueListProps {
  items: readonly KeyValueItem[];
  testID?: string;
}

export function KeyValueList({ items, testID }: KeyValueListProps) {
  const density = useDensity();
  return (
    <View style={styles.root} testID={testID}>
      {items.map((item) => (
        <View
          key={item.key}
          testID={testID ? `${testID}-${item.key}` : undefined}
          style={[styles.row, density === 'compact' && styles.compact]}
        >
          <Text variant="caption" tone="secondary">{item.label}</Text>
          <View style={styles.value}>
            {typeof item.value === 'string' || typeof item.value === 'number' ? <Text variant="label">{item.value}</Text> : item.value}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { minWidth: 0 },
  row: {
    minWidth: 0,
    minHeight: theme.controlHeights.md,
    flexDirection: { compact: 'column', medium: 'row' },
    alignItems: { compact: 'flex-start', medium: 'center' },
    justifyContent: 'space-between',
    gap: { compact: theme.spacing.xs, medium: theme.spacing.lg },
    borderBottomWidth: theme.strokeWidths.standard,
    borderBottomColor: theme.colors.border.subtle,
    paddingVertical: theme.spacing.sm,
  },
  compact: {
    minHeight: theme.controlHeights.sm,
    paddingVertical: theme.spacing.xs,
  },
  value: {
    minWidth: 0,
    width: { compact: '100%', medium: 'auto' },
    flexShrink: 1,
    alignItems: { compact: 'flex-start', medium: 'flex-end' },
  },
}));
