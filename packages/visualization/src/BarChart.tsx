import { useState } from 'react';
import Svg, { Line, Rect } from 'react-native-svg';
import { useUnistyles } from 'react-native-unistyles';
import { barRects, chartSummary, finiteChartData, type ChartDatum } from '@precision-calm/platform';
import { ChartEmptyState, ChartFrame, type ChartSize } from './ChartFrame';
import type { VisualizationSeries } from './types';

export interface BarChartProps {
  data: readonly ChartDatum[];
  name?: string;
  size?: Exclude<ChartSize, 'sparkline'>;
  series?: VisualizationSeries;
  selectedIndex?: number | undefined;
  onSelect?: ((datum: ChartDatum, index: number) => void) | undefined;
}

export function BarChart({ data, name = 'Bar chart', size = 'standard', series = 'series2', selectedIndex, onSelect }: BarChartProps) {
  const { theme } = useUnistyles();
  const clean = finiteChartData(data);
  const [internalSelected, setInternalSelected] = useState<number | undefined>();
  const selected = selectedIndex ?? internalSelected;
  const height = size === 'compact' ? theme.visualizationMetrics.compactHeight : size === 'large' ? theme.visualizationMetrics.largeHeight : theme.visualizationMetrics.standardHeight;
  const color = theme.colors.visualization[series];
  const summary = chartSummary(clean, name);
  if (clean.length === 0) return <ChartFrame size={size} summary={summary}>{() => <ChartEmptyState />}</ChartFrame>;

  return (
    <ChartFrame size={size} summary={summary}>
      {(width) => {
        const rects = barRects(clean, width, height - theme.visualizationMetrics.chartInset, theme.spacing.sm);
        return (
          <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <Line x1={0} x2={width} y1={height - 1} y2={height - 1} stroke={theme.colors.border.subtle} strokeWidth={theme.visualizationMetrics.gridLineWidth} />
            {rects.map((rect, index) => {
              const datum = clean[index];
              if (!datum) return null;
              const active = selected === index;
              return <Rect key={datum.label} x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={theme.radii.xs} fill={color} opacity={active ? 1 : theme.visualizationMetrics.mutedSeriesOpacity} onPress={onSelect ? () => { setInternalSelected(index); onSelect(datum, index); } : undefined} />;
            })}
          </Svg>
        );
      }}
    </ChartFrame>
  );
}
