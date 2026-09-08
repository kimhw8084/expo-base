import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { chartSummary, donutSegments, finiteChartData, type ChartDatum } from '@precision-calm/platform';
import { ChartDataTable, ChartLegend } from './ChartAnatomy';
import { ChartFrame, type ChartSize, type ChartState } from './ChartFrame';
import type { VisualizationSeries } from './types';

export interface DonutChartProps {
  data: readonly ChartDatum[];
  name?: string;
  size?: Exclude<ChartSize, 'sparkline'>;
  series?: readonly VisualizationSeries[];
  state?: ChartState;
  errorMessage?: string | undefined;
  selectedIndex?: number | undefined;
  onSelect?: ((datum: ChartDatum, index: number) => void) | undefined;
  showLegend?: boolean;
  showDataTable?: boolean;
}

/** A bounded categorical composition chart, not a general-purpose pie engine. */
export function DonutChart({ data, name = 'Donut chart', size = 'standard', series = ['series1', 'series2', 'series3', 'series4', 'series5', 'series6'], state, errorMessage, selectedIndex, onSelect, showLegend = true, showDataTable = false }: DonutChartProps) {
  const { theme } = useUnistyles();
  const clean = finiteChartData(data).filter((datum) => datum.value > 0);
  const [internalSelected, setInternalSelected] = useState<number | undefined>();
  const selected = selectedIndex ?? internalSelected;
  const derivedState = state ?? (clean.length ? 'ready' : 'empty');
  const summary = chartSummary(clean, name);
  const height = size === 'compact' ? theme.visualizationMetrics.compactHeight : size === 'large' ? theme.visualizationMetrics.largeHeight : theme.visualizationMetrics.standardHeight;
  const exposeDataTable = showDataTable || Boolean(onSelect);
  const anatomy = showLegend || exposeDataTable ? <View style={styles.anatomy}>{showLegend ? <ChartLegend items={clean.map((datum, index) => ({ label: datum.label, series: series[index % series.length] ?? 'series1' }))} /> : null}{exposeDataTable ? <ChartDataTable data={clean} label={`${name} data`} selectedIndex={selected} {...(onSelect ? { onSelect: (datum, index) => { setInternalSelected(index); onSelect(datum, index); } } : {})} /> : null}</View> : undefined;
  return <ChartFrame size={size} summary={summary} state={derivedState} errorMessage={errorMessage} interactive={Boolean(onSelect)} dataTable={anatomy}>{(width) => {
    const radius = Math.max(12, Math.min(width, height) / 2 - theme.visualizationMetrics.chartInset);
    const centerX = width / 2; const centerY = height / 2;
    const segments = donutSegments(clean);
    return <View style={[styles.surface, { height }]}><Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {segments.map((segment, index) => {
        const datum = clean[segment.datumIndex]; if (!datum) return null;
        const color = theme.colors.visualization[series[index % series.length] ?? 'series1'];
        const active = selected === segment.datumIndex;
        const press = onSelect ? () => { setInternalSelected(segment.datumIndex); onSelect(datum, segment.datumIndex); } : undefined;
        return segment.endAngle - segment.startAngle >= Math.PI * 2 - 0.001
          ? <Circle key={datum.label} cx={centerX} cy={centerY} r={radius} fill={color} opacity={active || selected === undefined ? 1 : theme.visualizationMetrics.mutedSeriesOpacity} {...(press ? { onPress: press } : {})} />
          : <Path key={datum.label} d={arcPath(centerX, centerY, radius, segment.startAngle, segment.endAngle)} fill={color} opacity={active || selected === undefined ? 1 : theme.visualizationMetrics.mutedSeriesOpacity} {...(press ? { onPress: press } : {})} />;
      })}
      <Circle cx={centerX} cy={centerY} r={radius * 0.58} fill={theme.colors.background.surface} />
    </Svg></View>;
  }}</ChartFrame>;
}

function arcPath(cx: number, cy: number, radius: number, start: number, end: number): string {
  const startPoint = polar(cx, cy, radius, end); const endPoint = polar(cx, cy, radius, start);
  const large = end - start > Math.PI ? 1 : 0;
  return `M${cx},${cy} L${startPoint.x},${startPoint.y} A${radius},${radius} 0 ${large} 0 ${endPoint.x},${endPoint.y} Z`;
}
function polar(cx: number, cy: number, radius: number, angle: number) { return { x: cx + radius * Math.cos(angle - Math.PI / 2), y: cy + radius * Math.sin(angle - Math.PI / 2) }; }

const styles = StyleSheet.create((theme) => ({ surface: { minWidth: 0, width: '100%', position: 'relative' }, anatomy: { minWidth: 0, gap: theme.spacing.md, paddingTop: theme.spacing.md } }));
