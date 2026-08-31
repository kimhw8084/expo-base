import type { PropsWithChildren, ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, VStack } from '@precision-calm/primitives';

export interface MetricProps extends PropsWithChildren {
  label: string;
  value: string;
  trend?: string | undefined;
  trendTone?: 'positive' | 'negative' | 'secondary';
  accessory?: ReactNode;
}
export function Metric({ label, value, trend, trendTone = 'secondary', accessory }: MetricProps) {
  return (
    <View style={styles.metric}>
      <VStack gap="xs"><Text variant="caption" tone="secondary">{label}</Text><Text variant="h2" numeric>{value}</Text>{trend ? <Text variant="micro" tone={trendTone}>{trend}</Text> : null}</VStack>
      {accessory}
    </View>
  );
}
export function MetricGroup({ children }: PropsWithChildren) { return <View style={styles.group}>{children}</View>; }
const styles = StyleSheet.create((theme) => ({
  group: { minWidth: 0, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  metric: { minWidth: { compact: '100%', medium: 220 }, flexGrow: 1, flexBasis: 0, padding: theme.spacing.lg, borderRadius: theme.radii.md, backgroundColor: theme.colors.background.subtle, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing.md },
}));
