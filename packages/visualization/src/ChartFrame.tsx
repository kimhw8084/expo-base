import type { ReactNode } from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, VStack } from '@precision-calm/primitives';

export type ChartSize = 'sparkline' | 'compact' | 'standard' | 'large';

export interface ChartFrameProps {
  size?: ChartSize;
  summary: string;
  empty?: ReactNode;
  children: (width: number) => ReactNode;
}

export function ChartFrame({ size = 'standard', summary, empty, children }: ChartFrameProps) {
  const [width, setWidth] = useState(0);
  return (
    <View
      accessible
      accessibilityLabel={summary}
      onLayout={(event) => setWidth(Math.max(0, Math.round(event.nativeEvent.layout.width)))}
      style={[styles.frame, styles[`size_${size}`]]}
    >
      {width > 0 ? children(width) : null}
      {empty}
    </View>
  );
}

export function ChartEmptyState({ message = 'No chart data available.' }: { message?: string }) {
  return <VStack align="center" justify="center"><Text variant="caption" tone="secondary">{message}</Text></VStack>;
}

const styles = StyleSheet.create((theme) => ({
  frame: { minWidth: 0, width: '100%', overflow: 'hidden' },
  size_sparkline: { height: theme.visualizationMetrics.sparklineHeight },
  size_compact: { height: theme.visualizationMetrics.compactHeight },
  size_standard: { height: theme.visualizationMetrics.standardHeight },
  size_large: { height: theme.visualizationMetrics.largeHeight },
}));
