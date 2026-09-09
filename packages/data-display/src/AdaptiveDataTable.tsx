import { useCallback, useMemo, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon } from '@precision-calm/icons';
import { Text, VStack, useDensity, useInteractionState } from '@precision-calm/primitives';

export type DataSortDirection = 'asc' | 'desc';

export interface DataSort {
  key: string;
  direction: DataSortDirection;
}

export interface DataColumn<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  primary?: boolean;
  numeric?: boolean;
  weight?: 'sm' | 'md' | 'lg';
  sortable?: boolean;
  sortValue?: ((item: T) => string | number) | undefined;
}

export interface DataSelection<T> {
  selectedKeys: readonly string[];
  onSelectionChange: (keys: readonly string[]) => void;
  getRowLabel?: ((item: T, index: number) => string) | undefined;
}

export interface DataColumnVisibility {
  /** Controlled visible column IDs. Keep preference persistence outside the table. */
  visibleKeys: readonly string[];
  onVisibleKeysChange: (keys: readonly string[]) => void;
}

export interface AdaptiveDataTableProps<T> {
  rows: readonly T[];
  columns: readonly DataColumn<T>[];
  keyExtractor: (item: T, index: number) => string;
  onRowPress?: ((item: T) => void) | undefined;
  selectedKey?: string | undefined;
  sort?: DataSort | undefined;
  onSortChange?: ((sort: DataSort) => void) | undefined;
  selection?: DataSelection<T> | undefined;
  columnVisibility?: DataColumnVisibility | undefined;
  testID?: string | undefined;
}

export function sortDataRows<T>(rows: readonly T[], columns: readonly DataColumn<T>[], sort?: DataSort): T[] {
  if (!sort) return [...rows];
  const column = columns.find((candidate) => candidate.key === sort.key);
  if (!column?.sortable || !column.sortValue) return [...rows];
  const direction = sort.direction === 'asc' ? 1 : -1;

  return rows
    .map((item, index) => ({ item, index, value: column.sortValue?.(item) }))
    .sort((left, right) => {
      const leftValue = left.value;
      const rightValue = right.value;
      if (leftValue === rightValue) return left.index - right.index;
      if (typeof leftValue === 'number' && typeof rightValue === 'number') return (leftValue - rightValue) * direction;
      return String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, { sensitivity: 'base', numeric: true }) * direction;
    })
    .map(({ item }) => item);
}

export function AdaptiveDataTable<T>({
  rows,
  columns,
  keyExtractor,
  onRowPress,
  selectedKey,
  sort,
  onSortChange,
  selection,
  columnVisibility,
  testID,
}: AdaptiveDataTableProps<T>) {
  const density = useDensity();
  const visibleColumns = useMemo(() => columnVisibility
    ? columns.filter((column) => columnVisibility.visibleKeys.includes(column.key))
    : columns, [columnVisibility, columns]);
  const primary = useMemo(() => visibleColumns.find((column) => column.primary) ?? visibleColumns[0], [visibleColumns]);
  const sortedRows = useMemo(() => sortDataRows(rows, columns, sort), [rows, columns, sort]);
  const visibleKeys = useMemo(() => sortedRows.map((item, index) => keyExtractor(item, index)), [keyExtractor, sortedRows]);
  const selectedKeys = selection?.selectedKeys;
  const selectedSet = useMemo(() => new Set(selectedKeys ?? []), [selectedKeys]);
  const visibleSelectedCount = useMemo(() => visibleKeys.filter((key) => selectedSet.has(key)).length, [selectedSet, visibleKeys]);
  const allVisibleSelected = visibleKeys.length > 0 && visibleSelectedCount === visibleKeys.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  const toggleVisible = useCallback(() => {
    if (!selection) return;
    const next = new Set(selection.selectedKeys);
    if (allVisibleSelected) visibleKeys.forEach((key) => next.delete(key));
    else visibleKeys.forEach((key) => next.add(key));
    selection.onSelectionChange([...next]);
  }, [allVisibleSelected, selection, visibleKeys]);

  const toggleRow = useCallback((key: string) => {
    if (!selection) return;
    const next = new Set(selection.selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    selection.onSelectionChange([...next]);
  }, [selection]);

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.compact} testID={testID ? `${testID}-compact` : undefined}>
        {sortedRows.map((item, index) => {
          const key = keyExtractor(item, index);
          const selectionLabel = selection?.getRowLabel?.(item, index) ?? primary?.render(item);
          return (
            <CompactRecord
              key={key}
              item={item}
              columns={visibleColumns}
              primaryKey={primary?.key}
              density={density}
              onPress={onRowPress ? () => onRowPress(item) : undefined}
              selected={selectedKey === key}
              selection={selection ? {
                checked: selectedSet.has(key),
                label: typeof selectionLabel === 'string' ? `Select ${selectionLabel}` : `Select row ${index + 1}`,
                onToggle: () => toggleRow(key),
              } : undefined}
              testID={testID ? `${testID}-compact-row-${key}` : undefined}
            />
          );
        })}
      </View>

      <View role="table" style={styles.expanded} accessibilityLabel="Data table" testID={testID ? `${testID}-expanded` : undefined}>
        <View role="row" style={[styles.headerRow, density === 'compact' && styles.headerCompact]}>
          {selection ? (
            <View role="columnheader" style={styles.selectionCell}>
              <SelectionControl
                checked={someVisibleSelected ? 'mixed' : allVisibleSelected}
                label={allVisibleSelected ? 'Deselect all visible rows' : 'Select all visible rows'}
                onPress={toggleVisible}
                testID={testID ? `${testID}-select-visible` : undefined}
              />
            </View>
          ) : null}
          {visibleColumns.map((column) => (
            <View
              key={column.key}
              role="columnheader"
              {...(column.sortable ? { 'aria-sort': sort?.key === column.key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none' } : {})}
              style={[styles.cell, density === 'compact' && styles.cellCompact, styles[`weight_${column.weight ?? 'md'}`]]}
            >
              {column.sortable && onSortChange ? (
                <SortHeader
                  column={column}
                  activeSort={sort}
                  onSortChange={onSortChange}
                  testID={testID ? `${testID}-sort-${column.key}` : undefined}
                />
              ) : (
                <Text variant="micro" tone="secondary" numberOfLines={2}>{column.label}</Text>
              )}
            </View>
          ))}
        </View>

        {sortedRows.map((item, index) => {
          const key = keyExtractor(item, index);
          const selectionLabel = selection?.getRowLabel?.(item, index) ?? primary?.render(item);
          return (
            <DesktopRecord
              key={key}
              item={item}
              columns={visibleColumns}
              density={density}
              onPress={onRowPress ? () => onRowPress(item) : undefined}
              selected={selectedKey === key}
              selection={selection ? {
                checked: selectedSet.has(key),
                label: typeof selectionLabel === 'string' ? `Select ${selectionLabel}` : `Select row ${index + 1}`,
                onToggle: () => toggleRow(key),
              } : undefined}
              testID={testID ? `${testID}-expanded-row-${key}` : undefined}
            />
          );
        })}
      </View>
    </View>
  );
}

function CompactRecord<T>({
  item,
  columns,
  primaryKey,
  density,
  onPress,
  selected,
  selection,
  testID,
}: {
  item: T;
  columns: readonly DataColumn<T>[];
  primaryKey?: string | undefined;
  density: 'comfortable' | 'compact';
  onPress?: (() => void) | undefined;
  selected: boolean;
  selection?: RowSelectionControl | undefined;
  testID?: string | undefined;
}) {
  const body = (
    <VStack gap={density === 'compact' ? 'sm' : 'md'}>
      {columns.map((column) => (
        <View key={column.key} style={[styles.compactField, column.key === primaryKey && styles.primaryField]}>
          <Text variant={column.key === primaryKey ? 'label' : 'caption'} tone={column.key === primaryKey ? 'primary' : 'secondary'}>{column.label}</Text>
          <View style={styles.compactValue}>{renderValue(column.render(item), column.numeric)}</View>
        </View>
      ))}
    </VStack>
  );

  if (!selection) {
    if (!onPress) return <View testID={testID} style={[styles.compactRecord, density === 'compact' && styles.compactRecordDense, selected && styles.selected]}>{body}</View>;
    return <InteractiveRow testID={testID} onPress={onPress} selected={selected} compact dense={density === 'compact'}>{body}</InteractiveRow>;
  }

  return (
    <View testID={testID ? `${testID}-container` : undefined} style={[styles.compactRecord, density === 'compact' && styles.compactRecordDense, selected && styles.selected]}>
      <View style={styles.compactSelectionLayout}>
        <SelectionControl checked={selection.checked} label={selection.label} onPress={selection.onToggle} />
        {onPress ? <RowContentPressable {...(testID ? { testID } : {})} onPress={onPress} selected={selected} compact>{body}</RowContentPressable> : <View style={styles.rowContent}>{body}</View>}
      </View>
    </View>
  );
}

function DesktopRecord<T>({
  item,
  columns,
  onPress,
  selected,
  density,
  selection,
  testID,
}: {
  item: T;
  columns: readonly DataColumn<T>[];
  onPress?: (() => void) | undefined;
  selected: boolean;
  density: 'comfortable' | 'compact';
  selection?: RowSelectionControl | undefined;
  testID?: string | undefined;
}) {
  const body = <>{columns.map((column) => <View key={column.key} role="cell" style={[styles.cell, density === 'compact' && styles.cellCompact, styles[`weight_${column.weight ?? 'md'}`], column.numeric && styles.numericCell]}>{renderValue(column.render(item), column.numeric)}</View>)}</>;

  if (!selection) {
    if (!onPress) return <View role="row" aria-selected={selected || undefined} testID={testID} style={[styles.desktopRow, density === 'compact' && styles.desktopRowCompact, selected && styles.selected]}>{body}</View>;
    return <InteractiveRow testID={testID} onPress={onPress} selected={selected} dense={density === 'compact'} tableRow>{body}</InteractiveRow>;
  }

  const selectableBody = <>
      <View role="cell" style={styles.selectionCell}>
        <SelectionControl checked={selection.checked} label={selection.label} onPress={selection.onToggle} />
      </View>
      {body}
    </>;
  if (onPress) return <InteractiveRow testID={testID} onPress={onPress} selected={selected} dense={density === 'compact'} tableRow>{selectableBody}</InteractiveRow>;
  return <View role="row" aria-selected={selected || undefined} testID={testID} style={[styles.desktopRow, density === 'compact' && styles.desktopRowCompact, selected && styles.selected]}>{selectableBody}</View>;
}

type RowSelectionControl = { checked: boolean; label: string; onToggle: () => void };

function SortHeader<T>({ column, activeSort, onSortChange, testID }: { column: DataColumn<T>; activeSort?: DataSort | undefined; onSortChange: (sort: DataSort) => void; testID?: string | undefined }) {
  const { hovered, focused, interactionProps } = useInteractionState();
  const active = activeSort?.key === column.key;
  const direction = active ? activeSort.direction : undefined;
  const nextDirection: DataSortDirection = active && direction === 'asc' ? 'desc' : 'asc';
  const stateLabel = direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'not sorted';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Sort by ${column.label}, ${stateLabel}`}
      onPress={() => onSortChange({ key: column.key, direction: nextDirection })}
      testID={testID}
      {...interactionProps}
      style={({ pressed }) => [styles.sortButton, active && styles.sortActive, hovered && styles.sortHovered, focused && styles.focused, pressed && styles.pressed]}
    >
      <Text variant="micro" tone={active ? 'primary' : 'secondary'} numberOfLines={2}>{column.label}</Text>
      <Icon name={direction === 'asc' ? 'chevronUp' : direction === 'desc' ? 'chevronDown' : 'arrowUpDown'} size="xs" tone={active ? 'accent' : 'tertiary'} />
    </Pressable>
  );
}

function SelectionControl({ checked, label, onPress, testID }: { checked: boolean | 'mixed'; label: string; onPress: () => void; testID?: string | undefined }) {
  const { hovered, focused, interactionProps } = useInteractionState();
  const active = checked === true || checked === 'mixed';
  return (
    <Pressable
      accessibilityRole="checkbox"
      role="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      aria-checked={checked}
      onPress={(event) => { event.stopPropagation(); onPress(); }}
      testID={testID}
      {...interactionProps}
      style={({ pressed }) => [styles.selectionTarget, hovered && styles.selectionHovered, focused && styles.focused, pressed && styles.pressed]}
    >
      <View style={[styles.selectionBox, active && styles.selectionBoxOn]}>
        {checked === true ? <Icon name="check" size="xs" tone="onPrimary" strokeWidth="strong" /> : checked === 'mixed' ? <View style={styles.mixedMark} /> : null}
      </View>
    </Pressable>
  );
}

function RowContentPressable({ children, onPress, selected, compact = false, testID }: { children: ReactNode; onPress: () => void; selected: boolean; compact?: boolean; testID?: string }) {
  const { hovered, focused, interactionProps } = useInteractionState();
  return (
    <Pressable
      accessibilityRole="button"
      role="button"
      accessibilityState={{ selected }}
      aria-pressed={selected}
      onPress={onPress}
      testID={testID}
      {...interactionProps}
      style={({ pressed }) => [
        compact ? styles.rowContent : styles.desktopContent,
        styles.contentInteractive,
        hovered && styles.hovered,
        selected && hovered && styles.selectedHovered,
        focused && styles.focused,
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

function InteractiveRow({ children, onPress, selected, compact = false, dense = false, tableRow = false, testID }: { children: ReactNode; onPress: () => void; selected: boolean; compact?: boolean; dense?: boolean; tableRow?: boolean; testID?: string | undefined }) {
  const { hovered, focused, interactionProps } = useInteractionState();
  return (
    <Pressable
      accessibilityRole={tableRow ? undefined : 'button'}
      role={tableRow ? 'row' : 'button'}
      accessibilityState={{ selected }}
      aria-pressed={tableRow ? undefined : selected}
      aria-selected={tableRow ? selected || undefined : undefined}
      onPress={onPress}
      testID={testID}
      {...interactionProps}
      style={({ pressed }) => [
        compact ? styles.compactRecord : styles.desktopRow,
        compact && dense && styles.compactRecordDense,
        dense && !compact && styles.desktopRowCompact,
        styles.interactive,
        selected && styles.selected,
        hovered && styles.hovered,
        selected && hovered && styles.selectedHovered,
        focused && styles.focused,
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

function renderValue(value: ReactNode, numeric?: boolean) {
  return typeof value === 'string' || typeof value === 'number' ? <Text variant="label" numeric={Boolean(numeric)}>{value}</Text> : value;
}

const styles = StyleSheet.create((theme) => ({
  root: { minWidth: 0 },
  compact: { display: { compact: 'flex', medium: 'flex', expanded: 'none' }, gap: theme.spacing.sm },
  expanded: { display: { compact: 'none', medium: 'none', expanded: 'flex' }, minWidth: 0, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.border.default, borderRadius: theme.radii.md, overflow: 'hidden' },
  headerRow: { minWidth: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background.subtle, borderBottomWidth: theme.strokeWidths.standard, borderBottomColor: theme.colors.border.default },
  desktopRow: { minWidth: 0, minHeight: theme.controlHeights.lg, flexDirection: 'row', alignItems: 'center', borderBottomWidth: theme.strokeWidths.standard, borderBottomColor: theme.colors.border.subtle },
  desktopRowCompact: { minHeight: theme.controlHeights.md },
  desktopContent: { minWidth: 0, flex: 1, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center' },
  headerCompact: { minHeight: theme.controlHeights.md },
  cell: { minWidth: 0, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  cellCompact: { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  weight_sm: { flex: 0.7 },
  weight_md: { flex: 1 },
  weight_lg: { flex: 1.5 },
  numericCell: { alignItems: 'flex-end' },
  compactRecord: { minWidth: 0, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.border.default, borderRadius: theme.radii.md, padding: theme.spacing.lg, backgroundColor: theme.colors.background.surface },
  compactRecordDense: { padding: theme.spacing.md },
  compactSelectionLayout: { minWidth: 0, flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  rowContent: { minWidth: 0, flex: 1, borderRadius: theme.radii.sm },
  compactField: { minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.lg },
  primaryField: { paddingBottom: theme.spacing.sm, borderBottomWidth: theme.strokeWidths.standard, borderBottomColor: theme.colors.border.subtle },
  compactValue: { minWidth: 0, flexShrink: 1, alignItems: 'flex-end' },
  selectionCell: { width: theme.controlHeights.lg, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  selectionTarget: { width: theme.controlHeights.md, height: theme.controlHeights.md, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radii.sm, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.transparent },
  selectionHovered: { backgroundColor: theme.colors.interactive.subtleHover },
  selectionBox: { width: theme.formMetrics.checkboxSize, height: theme.formMetrics.checkboxSize, borderRadius: theme.radii.xs, borderWidth: theme.strokeWidths.emphasis, borderColor: theme.colors.border.strong, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background.surface },
  selectionBoxOn: { backgroundColor: theme.colors.interactive.primary, borderColor: theme.colors.interactive.primary },
  mixedMark: { width: theme.formMetrics.radioDotSize, height: theme.strokeWidths.emphasis, borderRadius: theme.radii.full, backgroundColor: theme.colors.interactive.onPrimary },
  sortButton: { minWidth: 0, minHeight: theme.controlHeights.sm, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, paddingHorizontal: theme.spacing.xs, marginHorizontal: -theme.spacing.xs, borderRadius: theme.radii.sm, borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.transparent },
  sortActive: { backgroundColor: theme.colors.interactive.subtle },
  sortHovered: { backgroundColor: theme.colors.interactive.subtleHover },
  interactive: { borderColor: theme.colors.border.default },
  contentInteractive: { borderWidth: theme.strokeWidths.standard, borderColor: theme.colors.transparent },
  selected: { backgroundColor: theme.colors.interactive.subtle },
  hovered: { backgroundColor: theme.colors.interactive.subtleHover },
  selectedHovered: { backgroundColor: theme.colors.interactive.subtlePressed },
  focused: { borderColor: theme.colors.border.focus, boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.border.focus}` },
  pressed: { opacity: theme.interactionFeedback.pressedOpacity },
}));
