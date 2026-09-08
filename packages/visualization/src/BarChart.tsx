import { useState } from 'react';
import { Pressable, StyleSheet as RNStyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { barRects, chartSummary, finiteChartData, type ChartDatum } from '@precision-calm/platform';
import { ChartFrame, type ChartSize, type ChartState } from './ChartFrame';
import { ChartDataTable } from './ChartAnatomy';
import type { VisualizationSeries } from './types';

export interface BarChartProps {
  data: readonly ChartDatum[];
  name?: string;
  size?: Exclude<ChartSize, 'sparkline'>;
  series?: VisualizationSeries;
  selectedIndex?: number | undefined;
  onSelect?: ((datum: ChartDatum, index: number) => void) | undefined;
  state?: ChartState;
  errorMessage?: string | undefined;
  showDataTable?: boolean;
}

export function BarChart({ data, name = 'Bar chart', size = 'standard', series = 'series2', selectedIndex, onSelect, state, errorMessage, showDataTable = false }: BarChartProps) {
  const { theme } = useUnistyles();
  const clean = finiteChartData(data);
  const [internalSelected, setInternalSelected] = useState<number | undefined>();
  const selected = selectedIndex ?? internalSelected;
  const height = size === 'compact' ? theme.visualizationMetrics.compactHeight : size === 'large' ? theme.visualizationMetrics.largeHeight : theme.visualizationMetrics.standardHeight;
  const color = theme.colors.visualization[series];
  const summary = chartSummary(clean, name);
  const derivedState = state ?? (clean.length ? 'ready' : 'empty');

  return (
    <ChartFrame size={size} summary={summary} state={derivedState} errorMessage={errorMessage} interactive={Boolean(onSelect)} dataTable={showDataTable || onSelect ? <ChartDataTable data={clean} label={`${name} data`} selectedIndex={selected} {...(onSelect ? { onSelect: (datum, index) => { setInternalSelected(index); onSelect(datum, index); } } : {})} /> : undefined}>
      {(width) => {
        const rects = barRects(clean, width, height - theme.visualizationMetrics.chartInset, theme.spacing.sm);
        return (
          <View style={[styles.surface, { height }]}>
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              <Line x1={0} x2={width} y1={height - 1} y2={height - 1} stroke={theme.colors.border.subtle} strokeWidth={theme.visualizationMetrics.gridLineWidth} />
              {rects.map((rect, index) => {
                const datum = clean[index];
                if (!datum) return null;
                const active = selected === index;
                return <Rect key={datum.label} x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={theme.radii.xs} fill={color} opacity={active ? 1 : theme.visualizationMetrics.mutedSeriesOpacity} />;
              })}
            </Svg>
            {onSelect ? (
              <View style={RNStyleSheet.absoluteFill} pointerEvents="box-none">
                {rects.map((rect, index) => {
                  const datum = clean[index];
                  if (!datum) return null;
                  return (
                    <Pressable
                      key={`${datum.label}-${index}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${datum.label}: ${datum.value}`}
                      accessibilityState={{ selected: selected === index }}
                      aria-pressed={selected === index}
                      onPress={() => { setInternalSelected(index); onSelect(datum, index); }}
                      style={[styles.hitTarget, { left: rect.x, width: rect.width }]}
                    />
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      }}
    </ChartFrame>
  );
}

const styles = StyleSheet.create(() => ({
  surface: { minWidth: 0, width: '100%', position: 'relative' },
  hitTarget: { position: 'absolute', top: 0, bottom: 0 },
}));
