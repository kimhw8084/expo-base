import type { ReactNode } from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, VStack } from '@precision-calm/primitives';

export type ChartSize = 'sparkline' | 'compact' | 'standard' | 'large';
export type ChartState = 'ready' | 'loading' | 'refreshing' | 'stale' | 'error' | 'empty';

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
        {(state === 'ready' || state === 'refreshing' || state === 'stale') && width > 0 ? children(width) : null}
        {state === 'loading' ? <ChartLoadingState /> : null}
        {state === 'refreshing' ? <ChartRefreshingState /> : null}
        {state === 'stale' ? <ChartStaleState /> : null}
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
  return <View accessibilityLiveRegion="polite" aria-live="polite" accessibilityLabel={message} style={styles.state}><VStack gap="sm" justify="center"><View style={styles.loadingPlot} accessibilityElementsHidden><View style={[styles.loadingBar, styles.loadingBarShort]} /><View style={[styles.loadingBar, styles.loadingBarTall]} /><View style={[styles.loadingBar, styles.loadingBarMedium]} /><View style={[styles.loadingBar, styles.loadingBarTall]} /><View style={[styles.loadingBar, styles.loadingBarShort]} /></View><Text variant="caption" tone="secondary" align="center">{message}</Text></VStack></View>;
}

export function ChartRefreshingState({ message = 'Refreshing chart data.' }: { message?: string }) {
  return <View accessibilityLiveRegion="polite" aria-live="polite" accessibilityLabel={message} style={styles.refreshing}><View style={styles.refreshingBar} /><Text variant="micro" tone="secondary">{message}</Text></View>;
}

export function ChartStaleState({ message = 'Showing previously loaded chart data.' }: { message?: string }) {
  return <View accessibilityLiveRegion="polite" aria-live="polite" accessibilityLabel={message} style={styles.stale}><Text variant="micro" tone="secondary">{message}</Text></View>;
}

export function ChartErrorState({ message = 'Unable to load chart data.' }: { message?: string }) {
  return <View accessibilityLiveRegion="polite" aria-live="polite" accessibilityRole="alert" style={styles.state}><VStack gap="sm" align="center" justify="center"><View style={styles.errorMark} accessibilityElementsHidden><Text variant="label" tone="negative">!</Text></View><Text variant="caption" tone="negative" align="center">{message}</Text></VStack></View>;
}

const styles = StyleSheet.create((theme) => ({
  root: { minWidth: 0, width: '100%' },
  frame: { minWidth: 0, width: '100%', overflow: 'hidden' },
  size_sparkline: { height: theme.visualizationMetrics.sparklineHeight },
  size_compact: { height: theme.visualizationMetrics.compactHeight },
  size_standard: { height: theme.visualizationMetrics.standardHeight },
  size_large: { height: theme.visualizationMetrics.largeHeight },
  state: { flex: 1, alignItems: 'stretch', justifyContent: 'center', padding: theme.spacing.md },
  refreshing: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'flex-start', gap: theme.spacing.xs, paddingTop: theme.spacing.xs, pointerEvents: 'none' },
  refreshingBar: { width: '30%', height: theme.strokeWidths.emphasis, borderRadius: theme.radii.full, backgroundColor: theme.colors.interactive.primary },
  stale: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'flex-end', padding: theme.spacing.xs, pointerEvents: 'none' },
  loadingPlot: { height: theme.spacing.xxxl, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: theme.spacing.xs, paddingHorizontal: theme.spacing.xl },
  loadingBar: { width: theme.spacing.sm, minHeight: theme.spacing.xs, borderRadius: theme.radii.xs, backgroundColor: theme.colors.background.subtle },
  loadingBarShort: { height: '36%' },
  loadingBarMedium: { height: '58%' },
  loadingBarTall: { height: '82%' },
  errorMark: { alignSelf: 'center', width: theme.spacing.xl, height: theme.spacing.xl, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radii.full, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.feedback.negative },
}));
