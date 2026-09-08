import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];

const table = read('packages/data-display/src/AdaptiveDataTable.tsx');
const selectionBar = read('packages/data-display/src/SelectionBar.tsx');
const dataIndex = read('packages/data-display/src/index.ts');
const formLayout = read('packages/forms/src/FormLayout.tsx');
const dataRoute = read('apps/reference/app/data.tsx');
const formsRoute = read('apps/reference/app/forms.tsx');
const metric = read('packages/data-display/src/Metric.tsx');
const home = read('apps/reference/app/index.tsx');
const packageJson = read('package.json');

if (!table.includes('export interface DataSort') || !table.includes('export function sortDataRows') || !table.includes('sortValue?:')) {
  failures.push('AdaptiveDataTable must expose controlled, stable shared sorting semantics.');
}
if (!table.includes('export interface DataSelection') || !table.includes('accessibilityRole="checkbox"') || !table.includes('aria-checked={checked}') || !table.includes("checked={someVisibleSelected ? 'mixed' : allVisibleSelected}")) {
  failures.push('AdaptiveDataTable must own row selection, mixed select-all state, and checkbox semantics.');
}
if (!table.includes('RowContentPressable') || !table.includes('styles.desktopContent') || !table.includes('styles.compactSelectionLayout')) {
  failures.push('Selectable rows must keep selection controls as siblings of row-action pressables rather than nesting interactive controls.');
}
if (!selectionBar.includes('export function SelectionBar') || !selectionBar.includes('accessibilityRole="toolbar"') || !selectionBar.includes("flexDirection: { compact: 'column', medium: 'row' }") || !selectionBar.includes('Clear selection')) {
  failures.push('SelectionBar must own responsive bulk-action hierarchy and clear behavior.');
}
if (!dataIndex.includes("export * from './SelectionBar';")) failures.push('SelectionBar must be exported from data-display.');
if (!/sortDataRows\(\s*filteredRows\s*,\s*[A-Za-z_$][\w$]*\s*,\s*sort\s*\)/.test(dataRoute) || !dataRoute.includes('selection={{ selectedKeys') || !dataRoute.includes('<SelectionBar') || !dataRoute.includes('variant: \'danger\'')) {
  failures.push('Data reference must demonstrate shared sorting, multi-selection, and destructive bulk-action hierarchy.');
}
if (!formLayout.includes('export function FormSectionGroup') || !formLayout.includes('accessibilityRole="header"') || !formLayout.includes('sectionSeparated') || !formLayout.includes('theme.formMetrics.sectionGap')) {
  failures.push('Forms must own semantic grouped-section hierarchy with tokenized separation.');
}
if (!formsRoute.includes('<FormSectionGroup testID="adapter-form-sections">') || !formsRoute.includes("'Profile information'") || !formsRoute.includes("'Account security'") || !formsRoute.includes("'Terms and consent'")) {
  failures.push('Forms reference must demonstrate production section grouping.');
}
if (!metric.includes('export interface MetricGroupProps') || !metric.includes('testID={testID}') || !home.includes('<MetricGroup accessibilityLabel="Foundation metrics" testID="home-metric-group">')) {
  failures.push('Dashboard metrics must expose one shared, testable composition owner.');
}
if (!packageJson.includes('check:workflow-hardening-contracts') || !packageJson.includes('npm run check:workflow-hardening-contracts')) {
  failures.push('Workflow hardening contract must be wired into runtime verification.');
}

if (failures.length) {
  console.error('Workflow hardening contract violations:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Workflow hardening contracts passed (sorting, bulk selection, form sections, dashboard metrics).');
