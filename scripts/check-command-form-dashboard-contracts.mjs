import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];

const menu = read('packages/overlays/src/Menu.tsx');
const actionMenu = read('packages/overlays/src/ActionMenu.tsx');
const overlayIndex = read('packages/overlays/src/index.ts');
const formLayout = read('packages/forms/src/FormLayout.tsx');
const formsRoute = read('apps/reference/app/forms.tsx');
const overlaysRoute = read('apps/reference/app/overlays.tsx');
const home = read('apps/reference/app/index.tsx');
const packageJson = read('package.json');

if (!menu.includes('accessibilityLabel?: string') || !menu.includes('accessibilityRole="menu"')) failures.push('MenuGroup must expose a nameable semantic menu surface.');
if (!actionMenu.includes('export function ActionMenu') || !actionMenu.includes('onOpenChange(false);') || !actionMenu.includes('item.shortcut') || !actionMenu.includes('section.label')) failures.push('ActionMenu must own grouping, shortcut hints, and close-before-action behavior.');
if (!overlayIndex.includes("export * from './ActionMenu';")) failures.push('ActionMenu must be exported from overlays.');
if (!formLayout.includes('export function FormRow') || !formLayout.includes("flexDirection: { compact: 'column', medium: 'row' }") || !formLayout.includes('fieldCell: { minWidth: 0, flex: 1 }')) failures.push('FormRow must own responsive paired-field composition.');
if (!formsRoute.includes('<FormRow testID="adapter-identity-row">')) failures.push('Forms reference must demonstrate the shared responsive FormRow.');
if (!overlaysRoute.includes('<ActionMenu') || !overlaysRoute.includes("label: 'General'") || !overlaysRoute.includes("label: 'Danger zone'") || !overlaysRoute.includes("shortcut: 'E'")) failures.push('Overlay reference must demonstrate grouped command-menu hierarchy.');
if (!home.includes('testID="home-adaptive-section-header"') || !home.includes('<SectionHeader') || !home.includes('metadata={(') || !home.includes('<Card variant="elevated">') || !home.includes('<Card variant="subtle">')) failures.push('Home dashboard must expose shared section hierarchy, metadata, and semantic surface priority.');
if (!packageJson.includes('check:command-form-dashboard-contracts') || !packageJson.includes('npm run check:command-form-dashboard-contracts')) failures.push('Command/form/dashboard contract must be wired into runtime verification.');

if (failures.length) {
  console.error('Command/form/dashboard contract violations:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Command/form/dashboard contracts passed (action menu, responsive form rows, dashboard hierarchy).');
