import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const problems = [];

function read(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) {
    problems.push(`${relativePath}: required interaction owner is missing`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
}

const foundations = read('packages/tokens/src/foundations.ts');
if (!foundations.includes('sm: 36') || !foundations.includes('md: 44') || !foundations.includes('compactHitSlop: 4')) {
  problems.push('packages/tokens/src/foundations.ts: compact controls must preserve a 36px visual control plus 4px hit slop to reach the 44px minimum target');
}

const compactTargetContracts = [
  ['packages/components/src/Button.tsx', 'hitSlop={size === \'sm\' ? theme.interactionFeedback.compactHitSlop : undefined}'],
  ['packages/components/src/Chip.tsx', 'hitSlop={theme.interactionFeedback.compactHitSlop}'],
  ['packages/components/src/Link.tsx', 'hitSlop={theme.interactionFeedback.compactHitSlop}'],
  ['packages/navigation/src/Tabs.tsx', 'hitSlop={theme.interactionFeedback.compactHitSlop}'],
];

for (const [file, marker] of compactTargetContracts) {
  const text = read(file);
  if (text && !text.includes(marker)) problems.push(`${file}: compact interactive control must use tokenized hit slop`);
}

const focusRingContracts = [
  'packages/components/src/Button.tsx',
  'packages/components/src/Chip.tsx',
  'packages/components/src/IconButton.tsx',
  'packages/components/src/Link.tsx',
  'packages/forms/src/Selection.tsx',
  'packages/forms/src/SelectField.tsx',
  'packages/navigation/src/NavigationItemButton.tsx',
  'packages/navigation/src/Tabs.tsx',
  'packages/overlays/src/Menu.tsx',
  'packages/primitives/src/PressableSurface.tsx',
  'packages/data-display/src/ListRow.tsx',
  'packages/data-display/src/AdaptiveDataTable.tsx',
];

const focusRingMarker = 'boxShadow: `0 0 0 ${theme.interactionFeedback.focusRingWidth}px ${theme.colors.border.focus}`';
for (const file of focusRingContracts) {
  const text = read(file);
  if (text && !text.includes(focusRingMarker)) problems.push(`${file}: keyboard focus must use the shared tokenized focus ring`);
}

const surface = read('packages/primitives/src/PressableSurface.tsx');
for (const marker of ['role="button"', 'aria-label={label}', 'aria-pressed={selected}', 'aria-disabled={disabled}']) {
  if (surface && !surface.includes(marker)) problems.push(`packages/primitives/src/PressableSurface.tsx: missing universal pressable semantic ${marker}`);
}

if (problems.length) {
  console.error(`Interaction contract violations:\n${problems.map((problem) => `- ${problem}`).join('\n')}`);
  process.exit(1);
}

console.log(`Interaction contract check passed (${compactTargetContracts.length} compact target owners + ${focusRingContracts.length} focus-ring owners).`);
