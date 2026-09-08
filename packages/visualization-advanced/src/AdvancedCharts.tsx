import { useState } from 'react';
import { Pressable, StyleSheet as RNStyleSheet, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { bandScale, heatmapCells, histogramBins, linearScale, numericDomain, type HeatmapCell, type HeatmapDatum } from '@precision-calm/platform';
import { Text } from '@precision-calm/primitives';
import { ChartAxes, ChartDataTable, ChartFrame, ChartInspector, XYChartDataTable, type ChartSize, type ChartState, type ChartValueFormatter, type VisualizationSeries } from '@precision-calm/visualization';

export interface ScatterDatum { id: string; x: number; y: number; label?: string; }
export interface ScatterPlotProps {
  data: readonly ScatterDatum[];
  name?: string;
  size?: Exclude<ChartSize, 'sparkline'>;
  series?: VisualizationSeries;
  state?: ChartState;
  errorMessage?: string;
  selectedId?: string;
  onSelect?: (datum: ScatterDatum) => void;
  xLabel?: string;
  yLabel?: string;
  xFormatter?: ChartValueFormatter;
  yFormatter?: ChartValueFormatter;
  showDataTable?: boolean;
}

/** Optional, dependency-free scatter plot. It intentionally consumes the core ChartFrame and table contract. */
export function ScatterPlot({ data, name = 'Scatter plot', size = 'standard', series = 'series1', state, errorMessage, selectedId, onSelect, xLabel = 'X', yLabel = 'Y', xFormatter = formatNumber, yFormatter = formatNumber, showDataTable = true }: ScatterPlotProps) {
  const { theme } = useUnistyles();
  const clean = data.filter((datum) => datum.id.trim() && Number.isFinite(datum.x) && Number.isFinite(datum.y));
  const [internalSelected, setInternalSelected] = useState<string | undefined>();
  const selected = selectedId ?? internalSelected;
  const summary = `${name}. ${clean.length} points. X domain ${formatDomain(clean.map((datum) => datum.x))}; Y domain ${formatDomain(clean.map((datum) => datum.y))}.`;
  const derivedState = state ?? (clean.length ? 'ready' : 'empty');
  return <ChartFrame size={size} summary={summary} state={derivedState} errorMessage={errorMessage} interactive={Boolean(onSelect)} dataTable={showDataTable ? <XYChartDataTable rows={clean.map((datum) => ({ id: datum.id, label: datum.label ?? datum.id, x: datum.x, y: datum.y }))} xLabel={xLabel} yLabel={yLabel} xFormatter={xFormatter} yFormatter={yFormatter} label={`${name} data`} /> : undefined}>
    {(width) => {
      const height = chartHeight(theme, size);
      const inset = theme.visualizationMetrics.chartInset;
      const xDomain = numericDomain(clean.map((datum) => datum.x), true);
      const yDomain = numericDomain(clean.map((datum) => datum.y), true);
      const x = linearScale(xDomain, { min: inset, max: Math.max(inset, width - inset) });
      const y = linearScale(yDomain, { min: height - inset, max: inset });
      return <View style={[styles.surface, { height }]} testID="advanced-scatter-plot">
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {clean.map((datum) => <Circle key={datum.id} cx={x(datum.x)} cy={y(datum.y)} r={selected === datum.id ? theme.visualizationMetrics.pointRadius + 2 : theme.visualizationMetrics.pointRadius} fill={theme.colors.visualization[series]} opacity={selected === undefined || selected === datum.id ? 1 : theme.visualizationMetrics.mutedSeriesOpacity} />)}
        </Svg>
        <View pointerEvents="none" style={RNStyleSheet.absoluteFill}><ChartAxes width={width} height={height} xDomain={xDomain} yDomain={yDomain} xFormatter={xFormatter} yFormatter={yFormatter} inset={inset} testID="advanced-scatter-axes" /></View>
        {selected ? <ChartInspector title={name} context={selected} values={[{ id: `${selected}-x`, label: xLabel, value: clean.find((datum) => datum.id === selected)?.x ?? 0, formatter: xFormatter }, { id: `${selected}-y`, label: yLabel, value: clean.find((datum) => datum.id === selected)?.y ?? 0, series, formatter: yFormatter }]} testID="advanced-chart-inspector" /> : null}
        {onSelect ? <ScatterInteraction clean={clean} x={x} y={y} {...(selected === undefined ? {} : { selected })} onSelect={(datum) => { setInternalSelected(datum.id); onSelect(datum); }} width={width} height={height} /> : null}
      </View>;
    }}
  </ChartFrame>;
}

export interface HistogramProps {
  data: readonly number[];
  name?: string;
  bins?: number;
  size?: Exclude<ChartSize, 'sparkline'>;
  series?: VisualizationSeries;
  state?: ChartState;
  errorMessage?: string;
  showDataTable?: boolean;
}

export function Histogram({ data, name = 'Histogram', bins = 8, size = 'standard', series = 'series2', state, errorMessage, showDataTable = true }: HistogramProps) {
  const { theme } = useUnistyles();
  const clean = data.filter(Number.isFinite);
  const histogram = histogramBins(clean, bins);
  const tableData = histogram.map((bin) => ({ label: `${formatNumber(bin.start)}–${formatNumber(bin.end)}`, value: bin.count }));
  const derivedState = state ?? (histogram.length ? 'ready' : 'empty');
  return <ChartFrame size={size} summary={`${name}. ${clean.length} values across ${histogram.length} bins.`} state={derivedState} errorMessage={errorMessage} dataTable={showDataTable ? <ChartDataTable data={tableData} label={`${name} data`} /> : undefined}>
    {(width) => {
      const height = chartHeight(theme, size);
      const max = Math.max(1, ...histogram.map((bin) => bin.count));
      const band = bandScale(histogram.length, width, 0.16, 0.04);
      const xDomain = histogram.length ? numericDomain([histogram[0]!.start, histogram[histogram.length - 1]!.end]) : { min: 0, max: 1, span: 1 };
      return <View style={[styles.surface, { height }]} testID="advanced-histogram">
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {histogram.map((bin, index) => <Rect key={`${bin.start}-${index}`} x={band.position(index)} y={height - (bin.count / max) * (height - theme.visualizationMetrics.chartInset)} width={band.bandwidth} height={Math.max(1, (bin.count / max) * (height - theme.visualizationMetrics.chartInset))} rx={theme.radii.xs} fill={theme.colors.visualization[series]} />)}
        </Svg>
        <View pointerEvents="none" style={RNStyleSheet.absoluteFill}><ChartAxes width={width} height={height} xDomain={xDomain} yDomain={numericDomain([0, max])} xFormatter={formatNumber} yFormatter={formatNumber} inset={theme.visualizationMetrics.chartInset} testID="advanced-histogram-axes" /></View>
      </View>;
    }}
  </ChartFrame>;
}

export interface HeatmapProps {
  data: readonly HeatmapDatum[];
  name?: string;
  size?: Exclude<ChartSize, 'sparkline'>;
  state?: ChartState;
  errorMessage?: string;
  selectedId?: string;
  onSelect?: (datum: HeatmapDatum) => void;
  showDataTable?: boolean;
}

export function Heatmap({ data, name = 'Heatmap', size = 'standard', state, errorMessage, selectedId, onSelect, showDataTable = true }: HeatmapProps) {
  const { theme } = useUnistyles();
  const clean = data.filter((datum) => datum.row.trim() && datum.column.trim() && Number.isFinite(datum.value));
  const [internalSelected, setInternalSelected] = useState<string | undefined>();
  const selected = selectedId ?? internalSelected;
  const tableData = clean.map((datum) => ({ label: `${datum.row}, ${datum.column}`, value: datum.value }));
  const derivedState = state ?? (clean.length ? 'ready' : 'empty');
  return <ChartFrame size={size} summary={`${name}. ${clean.length} cells.`} state={derivedState} errorMessage={errorMessage} interactive={Boolean(onSelect)} dataTable={showDataTable ? <ChartDataTable data={tableData} label={`${name} data`} /> : undefined}>
    {(width) => {
      const height = chartHeight(theme, size);
      const cells = heatmapCells(clean, width, height);
      const datumByCell = new Map<string, HeatmapDatum>(clean.map((datum) => [`${datum.row}:${datum.column}`, datum]));
      const values = numericDomain(clean.map((datum) => datum.value));
      const colorScale = linearScale(values, { min: 0.18, max: 1 });
      return <View style={[styles.surface, { height }]} testID="advanced-heatmap">
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {cells.map((cell) => { const id = `${cell.row}:${cell.column}`; return <Rect key={id} x={cell.x} y={cell.y} width={cell.width} height={cell.height} rx={theme.radii.xs} fill={theme.colors.visualization.series3} opacity={selected === undefined || selected === id ? colorScale(cell.value) : theme.visualizationMetrics.mutedSeriesOpacity} />; })}
        </Svg>
        {onSelect ? <HeatmapInteraction cells={cells} datumByCell={datumByCell} {...(selected === undefined ? {} : { selected })} onSelect={(datum, id) => { setInternalSelected(id); onSelect(datum); }} /> : null}
      </View>;
    }}
  </ChartFrame>;
}

function HeatmapInteraction({ cells, datumByCell, selected, onSelect }: { cells: readonly HeatmapCell[]; datumByCell: ReadonlyMap<string, HeatmapDatum>; selected?: string; onSelect: (datum: HeatmapDatum, id: string) => void }) {
  const directTargets = cells.length <= 100 && cells.every((cell) => cell.width >= 44 && cell.height >= 44);
  if (!directTargets) {
    const first = cells[0];
    const datum = first ? datumByCell.get(`${first.row}:${first.column}`) : undefined;
    return <Pressable accessibilityRole="button" accessibilityLabel="Select heatmap cell" accessibilityHint="Use the data table for individual dense heatmap values." onPress={() => { if (datum && first) onSelect(datum, `${first.row}:${first.column}`); }} style={styles.chartInteraction} />;
  }
  return <View style={RNStyleSheet.absoluteFill} pointerEvents="box-none">{cells.map((cell) => { const id = `${cell.row}:${cell.column}`; const datum = datumByCell.get(id); if (!datum) return null; return <Pressable key={id} accessibilityRole="button" accessibilityLabel={`${datum.row}, ${datum.column}: ${datum.value}`} accessibilityState={{ selected: selected === id }} aria-pressed={selected === id} onPress={() => onSelect(datum, id)} style={{ position: 'absolute', left: cell.x, top: cell.y, width: cell.width, height: cell.height }} />; })}</View>;
}

function chartHeight(theme: ReturnType<typeof useUnistyles>['theme'], size: Exclude<ChartSize, 'sparkline'>): number {
  return size === 'compact' ? theme.visualizationMetrics.compactHeight : size === 'large' ? theme.visualizationMetrics.largeHeight : theme.visualizationMetrics.standardHeight;
}
function formatNumber(value: number): string { return Number.isInteger(value) ? String(value) : value.toFixed(2); }
function formatDomain(values: readonly number[]): string { const finite = values.filter(Number.isFinite); if (!finite.length) return 'empty'; return `${formatNumber(Math.min(...finite))} to ${formatNumber(Math.max(...finite))}`; }

function ScatterInteraction({ clean, x, y, selected, onSelect, width, height }: { clean: readonly ScatterDatum[]; x: (value: number) => number; y: (value: number) => number; selected?: string; onSelect: (datum: ScatterDatum) => void; width: number; height: number }) {
  if (clean.length > 100) {
    const nearest = clean[0];
    return <Pressable accessibilityRole="button" accessibilityLabel="Select nearest scatter point" onPress={() => { if (nearest) onSelect(nearest); }} style={styles.chartInteraction} />;
  }
  return <View style={RNStyleSheet.absoluteFill} pointerEvents="box-none">{clean.map((datum) => <Pressable key={datum.id} accessibilityRole="button" accessibilityLabel={`${datum.label ?? datum.id}: ${datum.y}`} accessibilityState={{ selected: selected === datum.id }} aria-pressed={selected === datum.id} onPress={() => onSelect(datum)} style={[styles.pointTarget, { left: Math.max(0, Math.min(width - 44, x(datum.x) - 22)), top: Math.max(0, Math.min(height - 44, y(datum.y) - 22)) }]} />)}</View>;
}

const styles = StyleSheet.create(() => ({ surface: { minWidth: 0, width: '100%', position: 'relative' }, pointTarget: { position: 'absolute', width: 44, height: 44, borderRadius: 22 }, chartInteraction: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0 } }));
