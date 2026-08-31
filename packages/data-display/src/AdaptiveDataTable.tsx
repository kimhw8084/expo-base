import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text, VStack, useDensity, useInteractionState } from '@precision-calm/primitives';

export interface DataColumn<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  primary?: boolean;
  numeric?: boolean;
  weight?: 'sm' | 'md' | 'lg';
}
export interface AdaptiveDataTableProps<T> {
  rows: readonly T[];
  columns: readonly DataColumn<T>[];
  keyExtractor: (item: T, index: number) => string;
  onRowPress?: ((item: T) => void) | undefined;
  selectedKey?: string | undefined;
}

export function AdaptiveDataTable<T>({ rows, columns, keyExtractor, onRowPress, selectedKey }: AdaptiveDataTableProps<T>) {
  const density = useDensity();
  const primary = columns.find((column) => column.primary) ?? columns[0];
  return (
    <View style={styles.root}>
      <View style={styles.compact}>{rows.map((item, index) => { const key = keyExtractor(item, index); return <CompactRecord key={key} item={item} columns={columns} primaryKey={primary?.key} onPress={onRowPress ? () => onRowPress(item) : undefined} selected={selectedKey === key} />; })}</View>
      <View style={styles.expanded} accessibilityLabel="Data table">
        <View style={[styles.headerRow, density === 'compact' && styles.headerCompact]}>{columns.map((column) => <View key={column.key} style={[styles.cell, styles[`weight_${column.weight ?? 'md'}`]]}><Text variant="micro" tone="secondary">{column.label}</Text></View>)}</View>
        {rows.map((item, index) => { const key = keyExtractor(item, index); return <DesktopRecord key={key} item={item} columns={columns} density={density} onPress={onRowPress ? () => onRowPress(item) : undefined} selected={selectedKey === key} />; })}
      </View>
    </View>
  );
}

function CompactRecord<T>({ item, columns, primaryKey, onPress, selected }: { item: T; columns: readonly DataColumn<T>[]; primaryKey?: string | undefined; onPress?: (() => void) | undefined; selected: boolean }) {
  const body = <VStack gap="md">{columns.map((column) => <View key={column.key} style={[styles.compactField, column.key === primaryKey && styles.primaryField]}><Text variant={column.key === primaryKey ? 'label' : 'caption'} tone={column.key === primaryKey ? 'primary' : 'secondary'}>{column.label}</Text><View style={styles.compactValue}>{renderValue(column.render(item), column.numeric)}</View></View>)}</VStack>;
  if (!onPress) return <View style={[styles.compactRecord, selected && styles.selected]}>{body}</View>;
  return <InteractiveRow onPress={onPress} selected={selected} compact>{body}</InteractiveRow>;
}
function DesktopRecord<T>({ item, columns, onPress, selected, density }: { item: T; columns: readonly DataColumn<T>[]; onPress?: (() => void) | undefined; selected: boolean; density: 'comfortable' | 'compact' }) {
  const body = <>{columns.map((column) => <View key={column.key} style={[styles.cell, styles[`weight_${column.weight ?? 'md'}`], column.numeric && styles.numericCell]}>{renderValue(column.render(item), column.numeric)}</View>)}</>;
  if (!onPress) return <View style={[styles.desktopRow, density === 'compact' && styles.desktopRowCompact, selected && styles.selected]}>{body}</View>;
  return <InteractiveRow onPress={onPress} selected={selected} dense={density === 'compact'}>{body}</InteractiveRow>;
}
function InteractiveRow({ children, onPress, selected, compact = false, dense = false }: { children: ReactNode; onPress: () => void; selected: boolean; compact?: boolean; dense?: boolean }) {
  const { hovered, focused, interactionProps } = useInteractionState();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} {...interactionProps} style={({ pressed }) => [compact ? styles.compactRecord : styles.desktopRow, dense && !compact && styles.desktopRowCompact, styles.interactive, selected && styles.selected, hovered && styles.hovered, focused && styles.focused, pressed && styles.pressed]}>{children}</Pressable>;
}
function renderValue(value: ReactNode, numeric?: boolean) { return typeof value === 'string' || typeof value === 'number' ? <Text variant="label" numeric={numeric}>{value}</Text> : value; }

const styles = StyleSheet.create((theme) => ({
  root: { minWidth: 0 },
  compact: { display: { compact: 'flex', medium: 'flex', expanded: 'none' }, gap: theme.spacing.sm },
  expanded: { display: { compact: 'none', medium: 'none', expanded: 'flex' }, minWidth: 0, borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radii.md, overflow: 'hidden' },
  headerRow: { minWidth: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background.subtle, borderBottomWidth: 1, borderBottomColor: theme.colors.border.default },
  desktopRow: { minWidth: 0, minHeight: theme.controlHeights.lg, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle },
  desktopRowCompact: { minHeight: theme.controlHeights.md },
  headerCompact: { minHeight: theme.controlHeights.md },
  cell: { minWidth: 0, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  weight_sm: { flex: 0.7 }, weight_md: { flex: 1 }, weight_lg: { flex: 1.5 }, numericCell: { alignItems: 'flex-end' },
  compactRecord: { minWidth: 0, borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radii.md, padding: theme.spacing.lg, backgroundColor: theme.colors.background.surface },
  compactField: { minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.lg },
  primaryField: { paddingBottom: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle },
  compactValue: { minWidth: 0, flexShrink: 1, alignItems: 'flex-end' },
  interactive: { borderColor: theme.colors.border.default }, selected: { backgroundColor: theme.colors.interactive.subtle }, hovered: { backgroundColor: theme.colors.interactive.subtleHover }, focused: { borderColor: theme.colors.border.focus }, pressed: { opacity: theme.interactionFeedback.pressedOpacity },
}));
