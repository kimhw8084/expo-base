import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];

const colors = read('packages/tokens/src/colors.ts');
const text = read('packages/primitives/src/Text.tsx');
const button = read('packages/components/src/Button.tsx');
const iconButton = read('packages/components/src/IconButton.tsx');
const link = read('packages/components/src/Link.tsx');
const listRow = read('packages/data-display/src/ListRow.tsx');
const dataTable = read('packages/data-display/src/AdaptiveDataTable.tsx');
const navigationItem = read('packages/navigation/src/NavigationItemButton.tsx');
const bottomSheet = read('packages/overlays/src/BottomSheet.tsx');
const systemRoute = read('apps/reference/app/system.tsx');
const overlayRoute = read('apps/reference/app/overlays.tsx');
const webTests = read('tests/e2e/web/reference.spec.ts');

for (const token of ['negativeHover', 'negativePressed', 'negativeSurfaceHover', 'negativeSurfacePressed']) {
  const occurrences = colors.split(`${token}:`).length - 1;
  if (occurrences < 3) failures.push(`Feedback palette must type and define ${token} in both themes.`);
}

if (!text.includes("| 'accent'")) failures.push('Text must expose a brand-accent tone for action copy.');
if (!text.includes('tone_accent: { color: theme.colors.interactive.primary }')) failures.push('Accent text must consume the brand interactive primary token.');

if (!button.includes("variant === 'primary' || variant === 'danger' ? theme.colors.interactive.onPrimary")) failures.push('Danger loading indicators must use the same on-primary foreground as danger button copy.');
if (!button.includes('dangerHover: { backgroundColor: theme.colors.feedback.negativeHover')) failures.push('Danger buttons must own semantic hover colors.');
if (!button.includes('dangerPressed: { backgroundColor: theme.colors.feedback.negativePressed')) failures.push('Danger buttons must own semantic pressed colors.');

if (!iconButton.includes("hitSlop={size === 'sm' ? theme.interactionFeedback.compactHitSlop : undefined}")) failures.push('Small icon buttons must preserve a 44pt effective target through tokenized hit slop.');
if (!iconButton.includes('sm: { width: theme.controlHeights.sm, height: theme.controlHeights.sm')) failures.push('Small icon buttons must be visually compact instead of duplicating medium geometry.');
if (!iconButton.includes('dangerHovered: { backgroundColor: theme.colors.feedback.negativeSurfaceHover')) failures.push('Danger icon buttons must retain destructive hover semantics.');
if (!iconButton.includes('dangerPressed: { backgroundColor: theme.colors.feedback.negativeSurfacePressed')) failures.push('Danger icon buttons must retain destructive pressed semantics.');

if (!link.includes('<Text variant="label" tone="accent">')) failures.push('Links must follow the active brand accent rather than the informational feedback palette.');
if (!link.includes('hovered: { backgroundColor: theme.colors.interactive.subtleHover }')) failures.push('Link hover surfaces must follow brand interaction tokens.');

if (!listRow.includes('aria-pressed={selected}') || listRow.includes('aria-selected={selected}')) failures.push('Selectable button rows must expose pressed state rather than tab/listbox selected state.');
if (!dataTable.includes('accessibilityState={{ selected }}') || !dataTable.includes('aria-pressed={selected}') || dataTable.includes('aria-selected={selected}')) failures.push('Interactive data rows must expose native selected state and web button pressed state.');
if (!navigationItem.includes("aria-selected={!routeDestination && mode === 'bottom' ? active : undefined}")) failures.push('Only generic compact tab controls may own aria-selected.');
if (!navigationItem.includes("aria-current={routeDestination && active ? 'page' : undefined}")) failures.push('Route destinations must expose current-page state instead of toggle semantics.');
if (!navigationItem.includes("aria-pressed={!routeDestination && mode === 'sidebar' ? active : undefined}")) failures.push('Only generic sidebar buttons may expose current toggle state with aria-pressed.');

if (!bottomSheet.includes('ScrollView')) failures.push('Bottom sheets must own scrolling for constrained long content.');
if (!bottomSheet.includes('testID="bottom-sheet-scroll"')) failures.push('Bottom-sheet scrolling must have an acceptance hook.');
if (!bottomSheet.includes('keyboardDismissMode="on-drag"')) failures.push('Bottom-sheet scrolling must own keyboard dismissal while dragging.');
if (!bottomSheet.includes('keyboardShouldPersistTaps="handled"')) failures.push('Bottom-sheet actions must remain tappable with the keyboard present.');
if (!bottomSheet.includes('scroll: { minWidth: 0, flexShrink: 1 }')) failures.push('Bottom-sheet scroll content must shrink inside the bounded sheet viewport.');

if (!systemRoute.includes('label="Removing" variant="danger" loading')) failures.push('System lab must expose destructive loading state.');
if (!systemRoute.includes('label="Compact search" size="sm"')) failures.push('System lab must expose compact icon-button geometry.');
if (!overlayRoute.includes("'Open long sheet'")) failures.push('Overlay lab must expose constrained long-sheet content through localized or direct copy.');
if (!overlayRoute.includes('label="Finish long-sheet review"')) failures.push('Long-sheet acceptance content must include a terminal action.');
if (!webTests.includes('long bottom sheet keeps content scrollable within the viewport')) failures.push('Web certification must prove constrained bottom-sheet scrolling.');

if (failures.length) {
  console.error('Component polish contract violations:\n' + failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Component polish contracts passed (destructive states, compact controls, branded links, semantic selection, scrollable sheets).');
