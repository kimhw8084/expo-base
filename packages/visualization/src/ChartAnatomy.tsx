import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text, VStack } from '@precision-calm/primitives';
import type { ChartDatum, ChartValueFormatter } from './types';
import type { VisualizationSeries } from './types';

export interface ChartLegendItem { id?: string; label: string; series: VisualizationSeries; }

/** Shared legend anatomy for the small Precision chart set. Products decide what each series means. */
export function ChartLegend({ items, label = 'Chart legend', testID, interactive = false, selectedIds, onToggle }: { items: readonly ChartLegendItem[]; label?: string; testID?: string | undefined; interactive?: boolean; selectedIds?: readonly string[]; onToggle?: ((id: string) => void) | undefined }) {
  const { theme } = useUnistyles();
  return <View accessibilityRole="list" role="list" accessibilityLabel={label} style={styles.legend} testID={testID}>{items.map((item) => { const id = item.id ?? item.label; const selected = selectedIds ? selectedIds.includes(id) : true; const content = <><View style={[styles.swatch, { backgroundColor: theme.colors.visualization[item.series] }]} /><Text variant="caption">{item.label}</Text></>; return interactive && onToggle ? <Pressable key={id} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected }} aria-pressed={selected} onPress={() => onToggle(id)} style={styles.legendItem}>{content}</Pressable> : <View key={id} role="listitem" style={styles.legendItem}>{content}</View>; })}</View>;
}

/** Optional visible data fallback. Non-interactive charts also announce their summary automatically. */
export function ChartDataTable({ data, label = 'Chart data', valueFormatter = String, selectedIndex, onSelect, testID }: { data: readonly ChartDatum[]; label?: string; valueFormatter?: ChartValueFormatter; selectedIndex?: number | undefined; onSelect?: ((datum: ChartDatum, index: number) => void) | undefined; testID?: string | undefined }) {
  return <View role="table" accessibilityLabel={label} style={styles.table} testID={testID}><View role="row" style={styles.tableRow}><Text role="columnheader" variant="micro" tone="secondary">Label</Text><Text role="columnheader" variant="micro" tone="secondary" numeric align="end">Value</Text></View>{data.map((datum, index) => <View key={`${datum.label}-${index}`} role="row" aria-selected={onSelect && selectedIndex === index ? true : undefined} style={[styles.tableRow, onSelect && selectedIndex === index && styles.selectedRow]}><Text role="cell" variant="caption">{datum.label}</Text><Text role="cell" variant="caption" numeric align="end">{valueFormatter(datum.value)}</Text></View>)}</View>;
}

export interface XYChartTableRow { id: string; label: string; x: number; y: number; }

export function XYChartDataTable({ rows, xLabel = 'X', yLabel = 'Y', xFormatter = String, yFormatter = String, label = 'Chart data', testID }: { rows: readonly XYChartTableRow[]; xLabel?: string; yLabel?: string; xFormatter?: ChartValueFormatter; yFormatter?: ChartValueFormatter; label?: string; testID?: string | undefined }) {
  return <View role="table" accessibilityLabel={label} style={styles.table} testID={testID}><View role="row" style={styles.tableRow}><Text role="columnheader" variant="micro" tone="secondary">Observation</Text><Text role="columnheader" variant="micro" tone="secondary" numeric align="end">{xLabel}</Text><Text role="columnheader" variant="micro" tone="secondary" numeric align="end">{yLabel}</Text></View>{rows.map((row) => <View key={row.id} role="row" style={styles.tableRow}><Text role="cell" variant="caption">{row.label}</Text><Text role="cell" variant="caption" numeric align="end">{xFormatter(row.x)}</Text><Text role="cell" variant="caption" numeric align="end">{yFormatter(row.y)}</Text></View>)}</View>;
}

export interface ChartSeriesTableColumn { key: string; label: string; }
export interface ChartSeriesTableRow { label: string; values: Readonly<Record<string, number>>; }

export function ChartSeriesDataTable({ rows, columns, label = 'Chart data', valueFormatter = String, testID }: { rows: readonly ChartSeriesTableRow[]; columns: readonly ChartSeriesTableColumn[]; label?: string; valueFormatter?: ChartValueFormatter; testID?: string | undefined }) {
  return (
    <View role="table" accessibilityLabel={label} style={styles.table} testID={testID}>
      <View role="row" style={styles.tableRow}><Text role="columnheader" variant="micro" tone="secondary">Label</Text>{columns.map((column) => <Text role="columnheader" key={column.key} variant="micro" tone="secondary" numeric align="end">{column.label}</Text>)}</View>
      {rows.map((row) => <View key={row.label} role="row" style={styles.tableRow}><Text role="cell" variant="caption">{row.label}</Text>{columns.map((column) => <Text role="cell" key={column.key} variant="caption" numeric align="end">{valueFormatter(row.values[column.key] ?? 0)}</Text>)}</View>)}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  legend: { minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  legendItem: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  swatch: { width: theme.spacing.md, height: theme.spacing.md, borderRadius: theme.radii.full },
  table: { minWidth: 0, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.border.subtle, borderRadius: theme.radii.md, overflow: 'hidden' },
  tableRow: { minWidth: 0, flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderBottomWidth: theme.strokeWidths.standard, borderBottomColor: theme.colors.border.subtle },
  selectedRow: { backgroundColor: theme.colors.background.subtle },
}));
