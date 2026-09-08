import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];

const keyValue = read('packages/data-display/src/KeyValueList.tsx');
const metric = read('packages/data-display/src/Metric.tsx');
const listRow = read('packages/data-display/src/ListRow.tsx');
const table = read('packages/data-display/src/AdaptiveDataTable.tsx');
const dataControls = read('packages/data-display/src/DataTableControls.tsx');
const filterDrawer = read('packages/patterns/src/FilterDrawer.tsx');
const pagination = read('packages/data-display/src/Pagination.tsx');
const listScreen = read('packages/lists/src/ListScreen.tsx');
const sidebar = read('packages/navigation/src/SidebarNavigation.tsx');
const bottom = read('packages/navigation/src/BottomNavigation.tsx');
const listsRoute = read('apps/reference/app/lists.tsx');
const dataRoute = read('apps/reference/app/data.tsx');
const webTests = read('tests/e2e/web/reference.spec.ts');

if (!keyValue.includes("flexDirection: { compact: 'column', medium: 'row' }")) failures.push('KeyValueList must stack label/value pairs at compact widths.');
if (!keyValue.includes("density === 'compact' && styles.compact")) failures.push('KeyValueList must honor compact density.');
if (!keyValue.includes('testID={testID ? `${testID}-${item.key}` : undefined}')) failures.push('KeyValueList rows must expose deterministic acceptance hooks.');
if (!metric.includes("density === 'compact' && styles.compact") || !metric.includes('compact: { padding: theme.spacing.md }')) failures.push('Metric cards must compress semantic padding under compact density.');
if (!listRow.includes('paddingHorizontal: theme.spacing.sm') || !listRow.includes('testID={testID}')) failures.push('Static and interactive ListRow geometry must share inset ownership and acceptance hooks.');
if (!table.includes('cellCompact: { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs }')) failures.push('Expanded data tables must compress cell spacing under compact density.');
if (!table.includes('compactRecordDense: { padding: theme.spacing.md }')) failures.push('Compact record cards must honor density.');
if (!listScreen.includes('loadingComponent?: ReactNode') || !listScreen.includes('const resolvedEmpty = loading ? loadingComponent : empty')) failures.push('ListScreen must own initial loading versus empty-state selection.');
if (!sidebar.includes('testID="sidebar-navigation-scroll"') || !sidebar.includes('style={styles.scroll}') || !sidebar.includes('scroll: { minHeight: 0, flex: 1 }')) failures.push('Desktop navigation must own an independently scrollable item region.');
if (!bottom.includes('accessibilityLabel="Primary navigation"')) failures.push('Bottom navigation must expose a named primary-navigation landmark.');
if (!listsRoute.includes("type ListMode = 'data' | 'loading' | 'empty'")) failures.push('Reference list lab must exercise live/loading/empty production states.');
if (!listsRoute.includes('<ListRow') || !listsRoute.includes('testID={`activity-row-${item.id}`}')) failures.push('Virtualized activity rows must use dense ListRow composition rather than card-per-row layout.');
if (!dataRoute.includes('testID="selected-record-details"')) failures.push('Data reference must expose compact key/value recomposition acceptance.');
if (!table.includes('columnVisibility?: DataColumnVisibility') || !table.includes('const visibleColumns = useMemo')) failures.push('AdaptiveDataTable must keep column visibility controlled and protect rendering through visible columns.');
if (!dataControls.includes('useDataColumnVisibility') || !dataControls.includes('InfinitePagination') || !filterDrawer.includes('BottomSheet')) failures.push('Data scale owners must expose controlled columns, compact filters, and explicit infinite lifecycle.');
if (!pagination.includes('CursorPagination') || !pagination.includes('accessibilityLabel="Pagination"')) failures.push('Cursor pagination must retain a named semantic toolbar.');
if (!dataRoute.includes('FilterDrawer') || !dataRoute.includes('CursorPagination') || !dataRoute.includes('InfinitePagination')) failures.push('Data reference must demonstrate filter and pagination owners together.');
for (const marker of ['data details stack key/value pairs at compact width', 'virtualized activity list exposes production loading and empty states', 'desktop sidebar navigation stays scrollable at constrained heights', 'data scale owners retain table identity while filter drawer and page controls stay accessible']) {
  if (!webTests.includes(marker)) failures.push(`Web certification missing: ${marker}.`);
}

if (failures.length) {
  console.error('Data/list/navigation composition contract violations:\n' + failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Data/list/navigation composition contracts passed (density, row composition, list states, constrained navigation).');
