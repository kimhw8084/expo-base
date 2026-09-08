import { useState } from 'react';
import { Pressable, StyleSheet as RNStyleSheet, View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { bandScale, formatCompactNumber, linearScale, numericDomain, waterfallRects, type ChartDatum, type WaterfallDatum } from '@precision-calm/platform';
import { ChartAxes, ChartFrame, ChartLegend, ChartSeriesDataTable, type ChartSize, type ChartState, type ChartValueFormatter, type VisualizationSeries } from '@precision-calm/visualization';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface AdvancedSeriesDefinition { key: string; label: string; series: VisualizationSeries; }
export interface AdvancedSeriesDatum { label: string; values: Readonly<Record<string, number>>; }
export interface AdvancedSeriesChartProps {
  data: readonly AdvancedSeriesDatum[];
  series: readonly AdvancedSeriesDefinition[];
  name?: string;
  size?: Exclude<ChartSize, 'sparkline'>;
  state?: ChartState;
  errorMessage?: string;
  selectedIndex?: number;
  onSelect?: (datum: AdvancedSeriesDatum, index: number) => void;
  showLegend?: boolean;
  showDataTable?: boolean;
  valueFormatter?: ChartValueFormatter;
}

export function GroupedBarChart(props: AdvancedSeriesChartProps) {
  return <CategoricalSeriesChart {...props} mode="grouped" />;
}

export function DivergingBarChart(props: AdvancedSeriesChartProps) {
  return <CategoricalSeriesChart {...props} mode="diverging" />;
}

export function NormalizedStackedBarChart(props: AdvancedSeriesChartProps) {
  return <CategoricalSeriesChart {...props} mode="normalized" />;
}

function CategoricalSeriesChart({ data, series, name = 'Categorical chart', size = 'standard', state, errorMessage, selectedIndex, onSelect, showLegend = true, showDataTable = true, valueFormatter = formatCompactNumber, mode }: AdvancedSeriesChartProps & { mode: 'grouped' | 'diverging' | 'normalized' }) {
  const { theme } = useUnistyles();
  const cleanSeries = cleanSeriesDefinitions(series);
  const cleanData = cleanSeries.length ? data.filter((datum) => datum.label.trim()).map((datum) => ({ label: datum.label, values: Object.fromEntries(cleanSeries.map((item) => [item.key, finiteValue(datum.values[item.key])])) })) : [];
  const [internalSelected, setInternalSelected] = useState<number>();
  const selected = selectedIndex ?? internalSelected;
  const height = chartHeight(theme, size);
  const summary = `${name}. ${cleanData.length} categories and ${cleanSeries.length} series.`;
  const tableRows = mode === 'normalized' ? cleanData.map((datum) => ({ label: datum.label, values: normalizedValues(datum.values, cleanSeries) })) : cleanData;
  const supplemental = <View style={styles.supplemental}>{showLegend ? <ChartLegend items={cleanSeries.map((item) => ({ label: item.label, series: item.series }))} label={`${name} legend`} /> : null}{showDataTable ? <ChartSeriesDataTable rows={tableRows} columns={cleanSeries.map((item) => ({ key: item.key, label: item.label }))} label={`${name} data`} valueFormatter={valueFormatter} /> : null}</View>;
  return <ChartFrame size={size} summary={summary} state={state ?? (cleanData.length ? 'ready' : 'empty')} errorMessage={errorMessage} interactive={Boolean(onSelect)} dataTable={supplemental}>
    {(width) => {
      const inset = theme.visualizationMetrics.chartInset;
      const plotHeight = Math.max(1, height - inset * 2);
      const domain = numericDomain(cleanData.flatMap((datum) => Object.values(mode === 'normalized' ? normalizedValues(datum.values, cleanSeries) : datum.values)), mode !== 'normalized');
      const scale = linearScale(mode === 'normalized' ? { min: 0, max: 1, span: 1 } : domain, { min: height - inset, max: inset });
      const band = bandScale(cleanData.length, Math.max(1, width - inset * 2), 0.28, 0.05);
      const seriesWidth = mode === 'grouped' ? Math.max(1, band.bandwidth / Math.max(1, cleanSeries.length)) : band.bandwidth;
      return <View style={[styles.surface, { height }]} testID={`advanced-${mode}-bar-chart`}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {cleanData.map((datum, index) => cleanSeries.map((item, seriesIndex) => {
            const values = mode === 'normalized' ? normalizedValues(datum.values, cleanSeries) : datum.values;
            const value = finiteValue(values[item.key]);
            const zero = scale(mode === 'normalized' ? 0 : 0);
            const yValue = scale(value);
            const y = Math.min(zero, yValue);
            const barHeight = Math.max(1, Math.abs(yValue - zero));
            const x = inset + band.position(index) + (mode === 'grouped' ? seriesIndex * seriesWidth : 0);
            return <Rect key={`${datum.label}-${item.key}`} x={x} y={y} width={Math.max(1, seriesWidth - (mode === 'grouped' ? theme.spacing.xxs : 0))} height={barHeight} rx={theme.radii.xs} fill={theme.colors.visualization[item.series]} opacity={selected === undefined || selected === index ? 1 : theme.visualizationMetrics.mutedSeriesOpacity} />;
          }))}
          <Line x1={inset} x2={width - inset} y1={scale(0)} y2={scale(0)} stroke={theme.colors.border.default} strokeWidth={theme.visualizationMetrics.gridLineWidth} />
        </Svg>
        <View pointerEvents="none" style={RNStyleSheet.absoluteFill}><ChartAxes width={width} height={height} xLabels={cleanData.map((datum) => datum.label)} yDomain={mode === 'normalized' ? { min: 0, max: 1, span: 1 } : domain} yFormatter={valueFormatter} inset={inset} testID={`advanced-${mode}-axes`} /></View>
        {onSelect ? <View style={RNStyleSheet.absoluteFill} pointerEvents="box-none">{cleanData.map((datum, index) => <Pressable key={`${datum.label}-${index}`} accessibilityRole="button" accessibilityLabel={`${datum.label}: ${valueFormatter(Object.values(tableRows[index]?.values ?? {}).reduce((sum, value) => sum + value, 0))}`} accessibilityState={{ selected: selected === index }} aria-pressed={selected === index} onPress={() => { setInternalSelected(index); onSelect(datum, index); }} style={[styles.categoryTarget, { start: inset + band.position(index), width: band.bandwidth }]} />)}</View> : null}
        <View style={[styles.plotHitArea, { height: plotHeight }]} pointerEvents="none" />
      </View>;
    }}
  </ChartFrame>;
}

export interface HorizontalBarChartProps extends Omit<AdvancedSeriesChartProps, 'data' | 'series'> { data: readonly ChartDatum[]; series?: VisualizationSeries; }
export function HorizontalBarChart({ data, series = 'series2', name = 'Horizontal bar chart', size = 'standard', state, errorMessage, selectedIndex, onSelect, showDataTable = true, valueFormatter = formatCompactNumber }: HorizontalBarChartProps) {
  const { theme } = useUnistyles();
  const clean = data.filter((datum) => datum.label.trim() && Number.isFinite(datum.value));
  const [internalSelected, setInternalSelected] = useState<number>();
  const selected = selectedIndex ?? internalSelected;
  return <ChartFrame size={size} summary={`${name}. ${clean.length} ranked categories.`} state={state ?? (clean.length ? 'ready' : 'empty')} errorMessage={errorMessage} interactive={Boolean(onSelect)} dataTable={showDataTable ? <ChartSeriesDataTable rows={clean.map((datum) => ({ label: datum.label, values: { value: datum.value } }))} columns={[{ key: 'value', label: 'Value' }]} label={`${name} data`} valueFormatter={valueFormatter} /> : undefined}>
    {(width) => { const height = chartHeight(theme, size); const inset = theme.visualizationMetrics.chartInset; const scale = linearScale(numericDomain(clean.map((datum) => datum.value), true), { min: inset, max: Math.max(inset, width - inset) }); const row = (height - inset * 2) / Math.max(1, clean.length); return <View style={[styles.surface, { height }]} testID="advanced-horizontal-bar-chart"><Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>{clean.map((datum, index) => { const zero = scale(0); const end = scale(datum.value); return <Rect key={`${datum.label}-${index}`} x={Math.min(zero, end)} y={inset + index * row + theme.spacing.xs} width={Math.max(1, Math.abs(end - zero))} height={Math.max(1, row - theme.spacing.sm)} rx={theme.radii.xs} fill={theme.colors.visualization[series]} opacity={selected === undefined || selected === index ? 1 : theme.visualizationMetrics.mutedSeriesOpacity} />; })}</Svg><View pointerEvents="none" style={RNStyleSheet.absoluteFill}><ChartAxes width={width} height={height} yDomain={numericDomain(clean.map((datum) => datum.value), true)} xDomain={numericDomain(clean.map((datum) => datum.value), true)} xFormatter={valueFormatter} inset={inset} /></View>{onSelect ? <View style={RNStyleSheet.absoluteFill} pointerEvents="box-none">{clean.map((datum, index) => <Pressable key={`${datum.label}-${index}`} accessibilityRole="button" accessibilityLabel={`${datum.label}: ${valueFormatter(datum.value)}`} accessibilityState={{ selected: selected === index }} aria-pressed={selected === index} onPress={() => { setInternalSelected(index); onSelect(datum as unknown as AdvancedSeriesDatum, index); }} style={[styles.categoryTarget, { top: inset + index * row, height: row }]} />)}</View> : null}</View>; }}
  </ChartFrame>;
}

export interface MultiLineChartProps extends AdvancedSeriesChartProps { }
export function MultiLineChart({ data, series, name = 'Multi-line chart', size = 'standard', state, errorMessage, selectedIndex, onSelect, showLegend = true, showDataTable = true, valueFormatter = formatCompactNumber }: MultiLineChartProps) {
  const { theme } = useUnistyles();
  const cleanSeries = cleanSeriesDefinitions(series);
  const cleanData = data.filter((datum) => datum.label.trim()).map((datum) => ({ label: datum.label, values: Object.fromEntries(cleanSeries.map((item) => [item.key, finiteValue(datum.values[item.key])])) }));
  const [internalSelected, setInternalSelected] = useState<number>();
  const selected = selectedIndex ?? internalSelected;
  return <ChartFrame size={size} summary={`${name}. ${cleanData.length} x positions and ${cleanSeries.length} series.`} state={state ?? (cleanData.length && cleanSeries.length ? 'ready' : 'empty')} errorMessage={errorMessage} interactive={Boolean(onSelect)} dataTable={<View style={styles.supplemental}>{showLegend ? <ChartLegend items={cleanSeries.map((item) => ({ label: item.label, series: item.series }))} label={`${name} legend`} /> : null}{showDataTable ? <ChartSeriesDataTable rows={cleanData} columns={cleanSeries.map((item) => ({ key: item.key, label: item.label }))} label={`${name} data`} valueFormatter={valueFormatter} /> : null}</View>}>
    {(width) => { const height = chartHeight(theme, size); const inset = theme.visualizationMetrics.chartInset; const domain = numericDomain(cleanData.flatMap((datum) => Object.values(datum.values)), true); const scale = linearScale(domain, { min: height - inset, max: inset }); const step = (width - inset * 2) / Math.max(1, cleanData.length - 1); return <View style={[styles.surface, { height }]} testID="advanced-multi-line-chart"><Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>{cleanSeries.map((item) => { const points = cleanData.map((datum, index) => `${inset + index * step},${scale(datum.values[item.key] ?? 0)}`); return <Path key={item.key} d={points.length ? `M ${points[0]} ${points.slice(1).map((point) => `L ${point}`).join(' ')}` : ''} fill="none" stroke={theme.colors.visualization[item.series]} strokeWidth={theme.visualizationMetrics.lineWidth} strokeLinecap="round" strokeLinejoin="round" />; })}</Svg><View pointerEvents="none" style={RNStyleSheet.absoluteFill}><ChartAxes width={width} height={height} xLabels={cleanData.map((datum) => datum.label)} yDomain={domain} yFormatter={valueFormatter} inset={inset} /></View>{onSelect ? <View style={RNStyleSheet.absoluteFill} pointerEvents="box-none">{cleanData.map((datum, index) => <Pressable key={`${datum.label}-${index}`} accessibilityRole="button" accessibilityLabel={`${datum.label}: ${valueFormatter(Object.values(datum.values).reduce((sum, value) => sum + value, 0))}`} accessibilityState={{ selected: selected === index }} aria-pressed={selected === index} onPress={() => { setInternalSelected(index); onSelect(datum, index); }} style={[styles.categoryTarget, { start: Math.max(0, inset + index * step - step / 2), width: Math.min(width, step) }]} />)}</View> : null}</View>; }}
  </ChartFrame>;
}

export interface WaterfallChartProps { data: readonly WaterfallDatum[]; name?: string; size?: Exclude<ChartSize, 'sparkline'>; state?: ChartState; errorMessage?: string; showDataTable?: boolean; valueFormatter?: ChartValueFormatter; }
export function WaterfallChart({ data, name = 'Waterfall chart', size = 'standard', state, errorMessage, showDataTable = true, valueFormatter = formatCompactNumber }: WaterfallChartProps) {
  const { theme } = useUnistyles();
  const clean = data.filter((datum) => datum.label.trim() && Number.isFinite(datum.value));
  return <ChartFrame size={size} summary={`${name}. ${clean.length} changes.`} state={state ?? (clean.length ? 'ready' : 'empty')} errorMessage={errorMessage} dataTable={showDataTable ? <ChartSeriesDataTable rows={clean.map((datum) => ({ label: datum.label, values: { value: datum.value } }))} columns={[{ key: 'value', label: 'Change' }]} label={`${name} data`} valueFormatter={valueFormatter} /> : undefined}>{(width) => { const height = chartHeight(theme, size); const rects = waterfallRects(clean, width, height - theme.visualizationMetrics.chartInset); return <View style={[styles.surface, { height }]} testID="advanced-waterfall-chart"><Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>{rects.map((rect, index) => <Rect key={`${rect.label}-${index}`} x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={theme.radii.xs} fill={theme.colors.visualization[rect.kind === 'decrease' ? 'series3' : 'series1']} />)}</Svg><View pointerEvents="none" style={RNStyleSheet.absoluteFill}><ChartAxes width={width} height={height} xLabels={clean.map((datum) => datum.label)} yDomain={numericDomain(rects.flatMap((rect) => [rect.start, rect.end]), true)} yFormatter={valueFormatter} inset={theme.visualizationMetrics.chartInset} /></View></View>; }}</ChartFrame>;
}

export interface RangeBarDatum { label: string; min: number; max: number; }
export function RangeBarChart({ data, name = 'Range bar chart', size = 'standard', state, errorMessage, showDataTable = true, valueFormatter = formatCompactNumber }: { data: readonly RangeBarDatum[]; name?: string; size?: Exclude<ChartSize, 'sparkline'>; state?: ChartState; errorMessage?: string; showDataTable?: boolean; valueFormatter?: ChartValueFormatter }) {
  const { theme } = useUnistyles();
  const clean = data.filter((datum) => datum.label.trim() && Number.isFinite(datum.min) && Number.isFinite(datum.max) && datum.max >= datum.min);
  return <ChartFrame size={size} summary={`${name}. ${clean.length} intervals.`} state={state ?? (clean.length ? 'ready' : 'empty')} errorMessage={errorMessage} dataTable={showDataTable ? <ChartSeriesDataTable rows={clean.map((datum) => ({ label: datum.label, values: { min: datum.min, max: datum.max } }))} columns={[{ key: 'min', label: 'Minimum' }, { key: 'max', label: 'Maximum' }]} label={`${name} data`} valueFormatter={valueFormatter} /> : undefined}>{(width) => { const height = chartHeight(theme, size); const inset = theme.visualizationMetrics.chartInset; const domain = numericDomain(clean.flatMap((datum) => [datum.min, datum.max]), true); const scale = linearScale(domain, { min: inset, max: width - inset }); const row = (height - inset * 2) / Math.max(1, clean.length); return <View style={[styles.surface, { height }]} testID="advanced-range-bar-chart"><Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>{clean.map((datum, index) => <Rect key={`${datum.label}-${index}`} x={scale(datum.min)} y={inset + index * row + theme.spacing.xs} width={Math.max(1, scale(datum.max) - scale(datum.min))} height={Math.max(1, row - theme.spacing.sm)} rx={theme.radii.xs} fill={theme.colors.visualization.series4} />)}</Svg><View pointerEvents="none" style={RNStyleSheet.absoluteFill}><ChartAxes width={width} height={height} xDomain={domain} xFormatter={valueFormatter} inset={inset} /></View></View>; }}</ChartFrame>;
}

export interface BulletChartProps { value: number; target: number; ranges: readonly number[]; name?: string; size?: Exclude<ChartSize, 'sparkline'>; state?: ChartState; errorMessage?: string; valueFormatter?: ChartValueFormatter; }
export function BulletChart({ value, target, ranges, name = 'Bullet chart', size = 'compact', state, errorMessage, valueFormatter = formatCompactNumber }: BulletChartProps) {
  const { theme } = useUnistyles();
  const domain = numericDomain([...ranges, value, target], true);
  return <ChartFrame size={size} summary={`${name}. Value ${valueFormatter(value)}, target ${valueFormatter(target)}.`} state={state ?? 'ready'} errorMessage={errorMessage} dataTable={<ChartSeriesDataTable rows={[{ label: name, values: { value, target } }]} columns={[{ key: 'value', label: 'Value' }, { key: 'target', label: 'Target' }]} label={`${name} data`} valueFormatter={valueFormatter} />}>{(width) => { const height = chartHeight(theme, size); const inset = theme.visualizationMetrics.chartInset; const scale = linearScale(domain, { min: inset, max: width - inset }); return <View style={[styles.surface, { height }]} testID="advanced-bullet-chart"><Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}><Rect x={inset} y={height / 2 - 10} width={Math.max(1, scale(ranges[ranges.length - 1] ?? domain.max) - inset)} height={20} rx={theme.radii.xs} fill={theme.colors.background.subtle} /><Rect x={inset} y={height / 2 - 4} width={Math.max(1, scale(value) - inset)} height={8} rx={theme.radii.xs} fill={theme.colors.visualization.series1} /><Line x1={scale(target)} x2={scale(target)} y1={height / 2 - 15} y2={height / 2 + 15} stroke={theme.colors.feedback.negative} strokeWidth={theme.strokeWidths.emphasis} /></Svg></View>; }}</ChartFrame>;
}

function cleanSeriesDefinitions(series: readonly AdvancedSeriesDefinition[]) { return series.filter((item, index, all) => item.key.trim() && all.findIndex((candidate) => candidate.key === item.key) === index).slice(0, 6); }
function finiteValue(value: number | undefined) { return Number.isFinite(value) ? value as number : 0; }
function normalizedValues(values: Readonly<Record<string, number>>, series: readonly AdvancedSeriesDefinition[]) { const total = series.reduce((sum, item) => sum + Math.max(0, finiteValue(values[item.key])), 0); return Object.fromEntries(series.map((item) => [item.key, total ? Math.max(0, finiteValue(values[item.key])) / total : 0])); }
function chartHeight(theme: ReturnType<typeof useUnistyles>['theme'], size: Exclude<ChartSize, 'sparkline'>): number { return size === 'compact' ? theme.visualizationMetrics.compactHeight : size === 'large' ? theme.visualizationMetrics.largeHeight : theme.visualizationMetrics.standardHeight; }
function finiteValueSum(values: Readonly<Record<string, number>>) { return Object.values(values).reduce((sum, value) => sum + finiteValue(value), 0); }

const styles = StyleSheet.create(() => ({ surface: { minWidth: 0, width: '100%', position: 'relative', overflow: 'hidden' }, supplemental: { minWidth: 0, gap: 12 }, categoryTarget: { position: 'absolute', top: 0, bottom: 0, minWidth: 44 }, plotHitArea: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 }, }));
