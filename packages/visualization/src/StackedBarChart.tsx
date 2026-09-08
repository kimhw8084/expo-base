import { useState } from 'react';
import { Pressable, StyleSheet as RNStyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { stackedBarRects } from '@precision-calm/platform';
import { VStack } from '@precision-calm/primitives';
import { ChartFrame, type ChartSize, type ChartState } from './ChartFrame';
import { ChartLegend, ChartSeriesDataTable } from './ChartAnatomy';
import type { VisualizationSeries } from './types';

export interface StackedBarSeries { key: string; label: string; series: VisualizationSeries; }
export interface StackedBarDatum { label: string; values: Readonly<Record<string, number>>; }

export interface StackedBarChartProps {
  data: readonly StackedBarDatum[];
  series: readonly StackedBarSeries[];
  name?: string;
  size?: Exclude<ChartSize, 'sparkline'>;
  selectedIndex?: number | undefined;
  onSelect?: ((datum: StackedBarDatum, index: number) => void) | undefined;
  state?: ChartState;
  errorMessage?: string | undefined;
  showLegend?: boolean;
  showDataTable?: boolean;
  valueFormatter?: (value: number) => string;
}

/** A bounded six-series chart for non-negative compositional data. */
export function StackedBarChart({ data, series, name = 'Stacked bar chart', size = 'standard', selectedIndex, onSelect, state, errorMessage, showLegend = true, showDataTable = true, valueFormatter = String }: StackedBarChartProps) {
  const { theme } = useUnistyles();
  const cleanSeries = series.filter((item, index, all) => item.key.trim() && all.findIndex((candidate) => candidate.key === item.key) === index).slice(0, 6);
  const cleanData = data.filter((item) => item.label.trim()).map((item) => ({ label: item.label, values: Object.fromEntries(cleanSeries.map((itemSeries) => [itemSeries.key, Math.max(0, Number.isFinite(item.values[itemSeries.key]) ? item.values[itemSeries.key] ?? 0 : 0)])) }));
  const geometryData = cleanData.map((item) => ({ label: item.label, values: cleanSeries.map((itemSeries) => item.values[itemSeries.key] ?? 0) }));
  const [internalSelected, setInternalSelected] = useState<number | undefined>();
  const selected = selectedIndex ?? internalSelected;
  const height = size === 'compact' ? theme.visualizationMetrics.compactHeight : size === 'large' ? theme.visualizationMetrics.largeHeight : theme.visualizationMetrics.standardHeight;
  const derivedState = state ?? (cleanData.length && cleanSeries.length ? 'ready' : 'empty');
  const summary = `${name}. ${cleanData.length} categories and ${cleanSeries.length} series.`;
  const supplemental = showLegend || showDataTable ? <VStack gap="md">{showLegend ? <ChartLegend items={cleanSeries.map(({ label, series: color }) => ({ label, series: color }))} label={`${name} legend`} /> : null}{showDataTable ? <ChartSeriesDataTable rows={cleanData} columns={cleanSeries.map(({ key, label }) => ({ key, label }))} label={`${name} data`} valueFormatter={valueFormatter} /> : null}</VStack> : undefined;
  return (
    <ChartFrame size={size} summary={summary} state={derivedState} errorMessage={errorMessage} interactive={Boolean(onSelect)} dataTable={supplemental}>
      {(width) => {
        const rects = stackedBarRects(geometryData, width, height - theme.visualizationMetrics.chartInset, theme.spacing.sm);
        const slot = cleanData.length ? width / cleanData.length : width;
        return (
          <View style={[styles.surface, { height }]}>
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              <Line x1={0} x2={width} y1={height - 1} y2={height - 1} stroke={theme.colors.border.subtle} strokeWidth={theme.visualizationMetrics.gridLineWidth} />
              {rects.map((rect) => <Rect key={`${rect.categoryIndex}-${rect.seriesIndex}`} x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={theme.radii.xs} fill={theme.colors.visualization[cleanSeries[rect.seriesIndex]?.series ?? 'series1']} opacity={selected === undefined || selected === rect.categoryIndex ? 1 : theme.visualizationMetrics.mutedSeriesOpacity} />)}
            </Svg>
            {onSelect ? <View style={RNStyleSheet.absoluteFill} pointerEvents="box-none">{cleanData.map((datum, index) => <Pressable key={datum.label} accessibilityRole="button" accessibilityLabel={`${datum.label}: ${valueFormatter(Object.values(datum.values).reduce((sum, value) => sum + value, 0))} total`} accessibilityState={{ selected: selected === index }} aria-pressed={selected === index} onPress={() => { setInternalSelected(index); onSelect(datum, index); }} style={[styles.hitTarget, { start: index * slot, width: slot }]} />)}</View> : null}
          </View>
        );
      }}
    </ChartFrame>
  );
}

const styles = StyleSheet.create(() => ({
  surface: { width: '100%', position: 'relative', overflow: 'hidden' },
  hitTarget: { position: 'absolute', top: 0, bottom: 0 },
}));
