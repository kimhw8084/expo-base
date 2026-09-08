import type { ReactNode } from 'react';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, VStack } from '@precision-calm/primitives';

export type ChartSize = 'sparkline' | 'compact' | 'standard' | 'large';
export type ChartState = 'ready' | 'loading' | 'error' | 'empty';

export interface ChartFrameProps {
  size?: ChartSize;
  summary: string;
  state?: ChartState;
  errorMessage?: string | undefined;
  empty?: ReactNode;
  interactive?: boolean;
  children: (width: number) => ReactNode;
  dataTable?: ReactNode;
}

export function ChartFrame({ size = 'standard', summary, state = 'ready', errorMessage = 'Unable to load chart data.', empty, interactive = false, children, dataTable }: ChartFrameProps) {
  const [width, setWidth] = useState(0);
  const accessibilityProps = interactive ? {} : { accessible: true as const, accessibilityLabel: summary };
  return (
    <View style={styles.root}>
      <View
        {...accessibilityProps}
        onLayout={(event) => setWidth(Math.max(0, Math.round(event.nativeEvent.layout.width)))}
        style={[styles.frame, styles[`size_${size}`]]}
      >
        {state === 'ready' && width > 0 ? children(width) : null}
        {state === 'loading' ? <ChartLoadingState /> : null}
        {state === 'error' ? <ChartErrorState message={errorMessage} /> : null}
        {state === 'empty' ? empty ?? <ChartEmptyState /> : null}
      </View>
      {dataTable}
    </View>
  );
}

export function ChartEmptyState({ message = 'No chart data available.' }: { message?: string }) {
  return <VStack align="center" justify="center"><Text variant="caption" tone="secondary">{message}</Text></VStack>;
}

export function ChartLoadingState({ message = 'Loading chart data.' }: { message?: string }) {
  return <View accessibilityLiveRegion="polite" aria-live="polite" style={styles.state}><VStack gap="sm" align="center" justify="center"><ActivityIndicator /><Text variant="caption" tone="secondary">{message}</Text></VStack></View>;
}

export function ChartErrorState({ message = 'Unable to load chart data.' }: { message?: string }) {
  return <View accessibilityLiveRegion="polite" aria-live="polite" style={styles.state}><VStack gap="sm" align="center" justify="center"><Text variant="caption" tone="negative">{message}</Text></VStack></View>;
}

const styles = StyleSheet.create((theme) => ({
  root: { minWidth: 0, width: '100%' },
  frame: { minWidth: 0, width: '100%', overflow: 'hidden' },
  size_sparkline: { height: theme.visualizationMetrics.sparklineHeight },
  size_compact: { height: theme.visualizationMetrics.compactHeight },
  size_standard: { height: theme.visualizationMetrics.standardHeight },
  size_large: { height: theme.visualizationMetrics.largeHeight },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.md },
}));
