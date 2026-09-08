import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { formatCompactNumber } from '@precision-calm/platform';
import { Text, VStack } from '@precision-calm/primitives';
import type { ChartValueFormatter, VisualizationSeries } from './types';

export interface ChartInspectorValue { id: string; label: string; value: number; series?: VisualizationSeries; formatter?: ChartValueFormatter; }

/** Non-modal chart inspector that works for hover previews, keyboard focus, and persistent touch selection. */
export function ChartInspector({ title, context, values, testID }: { title: string; context?: string; values: readonly ChartInspectorValue[]; testID?: string }) {
  const { theme } = useUnistyles();
  return <View role="status" aria-live="polite" accessibilityLabel={`${title}${context ? `, ${context}` : ''}`} style={styles.root} testID={testID}><VStack gap="xs"><Text variant="micro" tone="secondary">{title}</Text>{context ? <Text variant="caption">{context}</Text> : null}{values.map((entry) => <View key={entry.id} style={styles.row}><View style={[styles.marker, { backgroundColor: entry.series ? theme.colors.visualization[entry.series] : theme.colors.interactive.primary }]} /><Text variant="caption">{entry.label}</Text><Text variant="label" numeric>{(entry.formatter ?? formatCompactNumber)(entry.value)}</Text></View>)}</VStack></View>;
}

const styles = StyleSheet.create((theme) => ({ root: { position: 'absolute', top: theme.spacing.sm, end: theme.spacing.sm, maxWidth: '75%', padding: theme.spacing.sm, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.border.default, borderRadius: theme.radii.sm, backgroundColor: theme.colors.background.elevated, ...theme.elevation.low }, row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }, marker: { width: theme.spacing.xs, height: theme.spacing.xs, borderRadius: theme.radii.full, flexShrink: 0 } }));
