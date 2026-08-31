import { useState } from 'react';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { useUnistyles } from 'react-native-unistyles';
import { areaPath, chartPoints, chartSummary, finiteChartData, linePath, type ChartDatum } from '@precision-calm/platform';
import { ChartEmptyState, ChartFrame, type ChartSize } from './ChartFrame';
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
}

export function LineChart({ data, name = 'Line chart', size = 'standard', series = 'series1', area = false, showGrid = true, selectedIndex, onSelect }: LineChartProps) {
  const { theme } = useUnistyles();
  const clean = finiteChartData(data);
  const [internalSelected, setInternalSelected] = useState<number | undefined>(undefined);
  const selected = selectedIndex ?? internalSelected;
  const height = size === 'sparkline' ? theme.visualizationMetrics.sparklineHeight : size === 'compact' ? theme.visualizationMetrics.compactHeight : size === 'large' ? theme.visualizationMetrics.largeHeight : theme.visualizationMetrics.standardHeight;
  const inset = theme.visualizationMetrics.chartInset;
  const color = theme.colors.visualization[series];
  const summary = chartSummary(clean, name);
  if (clean.length === 0) return <ChartFrame size={size} summary={summary}>{() => <ChartEmptyState />}</ChartFrame>;

  return (
    <ChartFrame size={size} summary={summary}>
      {(width) => {
        const points = chartPoints(clean, width, height, inset);
        const path = linePath(points);
        const baseline = height - inset;
        return (
          <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {showGrid && size !== 'sparkline' ? [0.25, 0.5, 0.75].map((ratio) => <Line key={ratio} x1={0} x2={width} y1={height * ratio} y2={height * ratio} stroke={theme.colors.border.subtle} strokeWidth={theme.visualizationMetrics.gridLineWidth} />) : null}
            {area ? <Path d={areaPath(points, baseline)} fill={color} opacity={theme.visualizationMetrics.areaOpacity} /> : null}
            <Path d={path} fill="none" stroke={color} strokeWidth={theme.visualizationMetrics.lineWidth} strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point, index) => {
              const datum = clean[index];
              if (!datum) return null;
              const active = selected === index;
              const slotLeft = index === 0 ? 0 : (points[index - 1]!.x + point.x) / 2;
              const slotRight = index === points.length - 1 ? width : (point.x + points[index + 1]!.x) / 2;
              return (
                <G key={`${datum.label}-${index}`}>
                  {active ? <Circle cx={point.x} cy={point.y} r={theme.visualizationMetrics.pointRadius} fill={theme.colors.background.surface} stroke={color} strokeWidth={theme.visualizationMetrics.lineWidth} /> : null}
                  {onSelect ? <Rect x={slotLeft} y={0} width={Math.max(1, slotRight - slotLeft)} height={height} fill="transparent" onPress={() => { setInternalSelected(index); onSelect(datum, index); }} /> : null}
                </G>
              );
            })}
          </Svg>
        );
      }}
    </ChartFrame>
  );
}
