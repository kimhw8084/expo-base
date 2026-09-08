import type { PropsWithChildren, ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, VStack, useDensity } from '@precision-calm/primitives';

export interface MetricProps extends PropsWithChildren {
  label: string;
  value: string;
  trend?: string | undefined;
  trendTone?: 'positive' | 'negative' | 'secondary';
  accessory?: ReactNode;
}
export function Metric({ label, value, trend, trendTone = 'secondary', accessory }: MetricProps) {
  const density = useDensity();
  return (
    <View style={[styles.metric, density === 'compact' && styles.compact]}>
      <VStack gap="xs"><Text variant="caption" tone="secondary">{label}</Text><Text variant="h2" numeric>{value}</Text>{trend ? <Text variant="micro" tone={trendTone}>{trend}</Text> : null}</VStack>
      {accessory}
    </View>
  );
}
export interface MetricGroupProps extends PropsWithChildren {
  accessibilityLabel?: string | undefined;
  testID?: string | undefined;
}
export function MetricGroup({ children, accessibilityLabel, testID }: MetricGroupProps) {
  return <View style={styles.group} accessibilityLabel={accessibilityLabel} testID={testID}>{children}</View>;
}
const styles = StyleSheet.create((theme) => ({
  group: { minWidth: 0, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  metric: { minWidth: { compact: '100%', medium: theme.componentMetrics.metricMinWidth }, flexGrow: 1, flexBasis: 0, padding: theme.spacing.lg, borderRadius: theme.radii.md, backgroundColor: theme.colors.background.subtle, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing.md },
  compact: { padding: theme.spacing.md },
}));
