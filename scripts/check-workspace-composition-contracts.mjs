import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];

const toolbar = read('packages/data-display/src/DataToolbar.tsx');
const sectionHeader = read('packages/layouts/src/SectionHeader.tsx');
const pageHeader = read('packages/layouts/src/PageHeader.tsx');
const sidebar = read('packages/navigation/src/SidebarNavigation.tsx');
const dataRoute = read('apps/reference/app/data.tsx');
const listsRoute = read('apps/reference/app/lists.tsx');
const dataIndex = read('packages/data-display/src/index.ts');
const layoutIndex = read('packages/layouts/src/index.ts');
const webTests = read('tests/e2e/web/reference.spec.ts');

for (const marker of [
  'accessibilityRole="toolbar"',
  'role="toolbar"',
  'accessibilityRole="search"',
  'inputMode="search"',
  "width: { compact: '100%', medium: 'auto' }",
  'filters.map((filter)',
  'testID={testID ? `${testID}-summary` : undefined}',
]) {
  if (!toolbar.includes(marker)) failures.push(`DataToolbar missing contract marker: ${marker}`);
}
if (toolbar.includes('role="search"')) failures.push('DataToolbar must use the React Native-supported search accessibility role without an unsupported View role prop.');
if (!dataIndex.includes("export * from './DataToolbar';")) failures.push('DataToolbar must be exported from data-display.');
if (!layoutIndex.includes("export * from './SectionHeader';")) failures.push('SectionHeader must be exported from layouts.');
if (!sectionHeader.includes("flexDirection: { compact: 'column', medium: 'row' }") || !sectionHeader.includes('accessory?: ReactNode')) failures.push('SectionHeader must own responsive copy/accessory hierarchy.');
if (!pageHeader.includes('metadata?: ReactNode') || !pageHeader.includes('styles.metadata')) failures.push('PageHeader must expose supporting metadata hierarchy.');
if (!sidebar.includes('role="navigation"') || !sidebar.includes('accessibilityLabel="Primary navigation"') || !sidebar.includes('aria-label="Primary navigation"') || sidebar.includes('accessibilityRole="navigation"')) failures.push('Expanded sidebar must expose a named web navigation landmark without an unsupported native navigation role.');
for (const marker of ['<DataToolbar', "searchLabel={copy('Search cards')}", "title={copy('No cards match')}", 'testID="card-data-toolbar"', '<SectionHeader']) {
  if (!dataRoute.includes(marker)) failures.push(`Data reference missing workspace marker: ${marker}`);
}
if (!listsRoute.includes('<SectionHeader title="Production list states"') || !listsRoute.includes('<SectionHeader title="Small static groups"')) failures.push('List reference must use semantic section hierarchy.');
for (const marker of ['data workspace search and filters produce deterministic results', 'data toolbar owns compact search composition', 'desktop sidebar exposes a named navigation landmark']) {
  if (!webTests.includes(marker)) failures.push(`Web certification missing: ${marker}.`);
}

if (failures.length) {
  console.error('Workspace composition contract violations:\n' + failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Workspace composition contracts passed (search/filter toolbar, section hierarchy, navigation landmark).');
