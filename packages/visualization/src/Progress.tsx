import { StyleSheet as RNStyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { clampProgress } from '@precision-calm/platform';
import { Text, VStack } from '@precision-calm/primitives';
import type { VisualizationSeries } from './types';

export function ProgressBar({ value, label, series = 'series1' }: { value: number; label?: string; series?: VisualizationSeries }) {
  const { theme } = useUnistyles();
  const progress = clampProgress(value);
  return (
    <VStack gap="sm">
      {label ? <Text variant="caption" tone="secondary">{label}</Text> : null}
      <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }} style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: theme.colors.visualization[series] }]} />
      </View>
    </VStack>
  );
}

export function ProgressRing({ value, label, size = 'md', series = 'series1' }: { value: number; label?: string; size?: 'sm' | 'md' | 'lg'; series?: VisualizationSeries }) {
  const { theme } = useUnistyles();
  const progress = clampProgress(value);
  const diameter = size === 'sm' ? theme.visualizationMetrics.ringSizeSm : size === 'lg' ? theme.visualizationMetrics.ringSizeLg : theme.visualizationMetrics.ringSizeMd;
  const stroke = theme.visualizationMetrics.ringStroke;
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }} style={{ width: diameter, height: diameter }}>
      <Svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
        <Circle cx={diameter / 2} cy={diameter / 2} r={radius} fill="none" stroke={theme.colors.background.subtle} strokeWidth={stroke} />
        <Circle cx={diameter / 2} cy={diameter / 2} r={radius} fill="none" stroke={theme.colors.visualization[series]} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - progress)} transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`} />
      </Svg>
      <View style={[styles.ringLabel, { pointerEvents: 'none' }]}><Text variant="label" numeric>{Math.round(progress * 100)}%</Text></View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: { width: '100%', height: theme.visualizationMetrics.progressHeight, borderRadius: theme.radii.full, overflow: 'hidden', backgroundColor: theme.colors.background.subtle },
  fill: { height: '100%', borderRadius: theme.radii.full },
  ringLabel: { ...RNStyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
}));
