import { useState } from 'react';
import { Pressable, StyleSheet as RNStyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { areaPath, chartPoints, chartSummary, downsampleMinMax, finiteChartData, linePath, numericDomain, type ChartDatum } from '@precision-calm/platform';
import { ChartFrame, type ChartSize, type ChartState } from './ChartFrame';
import { ChartDataTable } from './ChartAnatomy';
import { ChartAxes } from './ChartAxes';
import type { VisualizationSeries } from './types';

export interface LineChartProps {
  data: readonly ChartDatum[];
  name?: string;
  size?: ChartSize;
  series?: VisualizationSeries;
  area?: boolean;
  showGrid?: boolean;
  selectedIndex?: number | undefined;
  onSelect?: ((datum: ChartDatum, index: number) => void) | undefined;
  state?: ChartState;
  errorMessage?: string | undefined;
  showDataTable?: boolean;
  maxPoints?: number;
}

export function LineChart({ data, name = 'Line chart', size = 'standard', series = 'series1', area = false, showGrid = true, selectedIndex, onSelect, state, errorMessage, showDataTable = false, maxPoints = 800 }: LineChartProps) {
  const { theme } = useUnistyles();
  const clean = finiteChartData(data);
  const renderData = downsampleMinMax(clean, maxPoints);
  const [internalSelected, setInternalSelected] = useState<number | undefined>(undefined);
  const selected = selectedIndex ?? internalSelected;
  const height = size === 'sparkline' ? theme.visualizationMetrics.sparklineHeight : size === 'compact' ? theme.visualizationMetrics.compactHeight : size === 'large' ? theme.visualizationMetrics.largeHeight : theme.visualizationMetrics.standardHeight;
  const inset = theme.visualizationMetrics.chartInset;
  const color = theme.colors.visualization[series];
  const summary = chartSummary(clean, name);
  const derivedState = state ?? (clean.length ? 'ready' : 'empty');

  return (
    <ChartFrame size={size} summary={summary} state={derivedState} errorMessage={errorMessage} interactive={Boolean(onSelect)} dataTable={showDataTable || onSelect ? <ChartDataTable data={clean} label={`${name} data`} selectedIndex={selected} {...(onSelect ? { onSelect: (datum, index) => { setInternalSelected(index); onSelect(datum, index); } } : {})} /> : undefined}>
      {(width) => {
        const points = chartPoints(renderData, width, height, inset);
        const path = linePath(points);
        const baseline = height - inset;
        return (
          <View style={[styles.surface, { height }]}>
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              {showGrid && size !== 'sparkline' ? [0.25, 0.5, 0.75].map((ratio) => <Line key={ratio} x1={0} x2={width} y1={height * ratio} y2={height * ratio} stroke={theme.colors.border.subtle} strokeWidth={theme.visualizationMetrics.gridLineWidth} />) : null}
              {area ? <Path d={areaPath(points, baseline)} fill={color} opacity={theme.visualizationMetrics.areaOpacity} /> : null}
              <Path d={path} fill="none" stroke={color} strokeWidth={theme.visualizationMetrics.lineWidth} strokeLinecap="round" strokeLinejoin="round" />
              {points.map((point, index) => selected === index ? <Circle key={`selected-${index}`} cx={point.x} cy={point.y} r={theme.visualizationMetrics.pointRadius} fill={theme.colors.background.surface} stroke={color} strokeWidth={theme.visualizationMetrics.lineWidth} /> : null)}
            </Svg>
            {showGrid && size !== 'sparkline' ? <View pointerEvents="none" style={RNStyleSheet.absoluteFill}><ChartAxes width={width} height={height} xLabels={clean.map((datum) => datum.label)} yDomain={numericDomain(clean.map((datum) => datum.value), true)} inset={inset} testID="line-chart-axes" /></View> : null}
            {onSelect ? (
              <View style={RNStyleSheet.absoluteFill} pointerEvents="box-none">
                {points.map((point, index) => {
                  const datum = renderData[index];
                  if (!datum) return null;
                  const slotLeft = index === 0 ? 0 : (points[index - 1]!.x + point.x) / 2;
                  const slotRight = index === points.length - 1 ? width : (point.x + points[index + 1]!.x) / 2;
                  return (
                    <Pressable
                      key={`${datum.label}-${index}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${datum.label}: ${datum.value}`}
                      accessibilityState={{ selected: selected === index }}
                      aria-pressed={selected === index}
                      onPress={() => { setInternalSelected(index); onSelect(datum, index); }}
                      style={[styles.hitTarget, { left: slotLeft, width: Math.max(1, slotRight - slotLeft) }]}
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
