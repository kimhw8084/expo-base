import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const appsRoot = path.join(root, 'apps');
const problems = [];

const forbidden = [
  [/from\s+['"]react-native-reanimated['"]/, 'direct Reanimated usage; use @precision-calm/motion'],
  [/from\s+['"]expo-haptics['"]/, 'direct haptics usage; use @precision-calm/haptics'],
  [/\bAccessibilityInfo\.announceForAccessibility\s*\(/, 'direct accessibility announcement; use @precision-calm/accessibility LiveRegion'],
  [/accessibilityRole\s*=\s*['"]none['"]/, 'suppressing semantics requires accessibility-system review'],
];

const semanticContracts = [
  ['packages/primitives/src/Text.tsx', ['role={resolvedRole}', 'accessibilityRole={resolvedAccessibilityRole}']],
  ['packages/components/src/Button.tsx', ['role="button"', 'aria-label={accessibilityLabel ?? label}', 'aria-disabled={unavailable}', 'aria-busy={loading}']],
  ['packages/components/src/IconButton.tsx', ['role="button"', 'aria-label={label}', 'aria-disabled={disabled}', 'aria-pressed={selected}']],
  ['packages/components/src/Link.tsx', ['role="link"', 'aria-label={accessibilityLabel ?? label}', 'aria-disabled={disabled}']],
  ['packages/components/src/Chip.tsx', ['role="button"', 'aria-pressed={selected}', 'aria-disabled={disabled}']],
  ['packages/components/src/Avatar.tsx', ['role="img"']],
  ['packages/forms/src/Selection.tsx', ['role="checkbox"', 'aria-checked={checked}', 'role="radiogroup"', 'role="radio"', 'aria-checked={selected}', 'resolveRovingFocusIndex', '<Switch', 'accessibilityLabel={label}', 'accessibilityState={{ disabled }}']],
  ['packages/forms/src/SelectField.tsx', ['role="combobox"', 'aria-expanded={open}', 'aria-disabled={disabled}']],
  ['packages/forms/src/ChoiceFields.tsx', ['role="combobox"', 'aria-expanded={open}', "'aria-controls': listboxId", "'aria-activedescendant': activeOptionId", 'Search ${label}', 'aria-live="polite"']],
  ['packages/forms/src/OptionList.tsx', ["role: 'listbox'", 'role="option"', 'aria-selected={selected}']],
  ['packages/forms/src/CodeField.tsx', ['digit ${index + 1} of ${count}', "autoComplete={index === 0 ? 'one-time-code' : 'off'}", 'maxFontSizeMultiplier={2}']],
  ['packages/components/src/Disclosure.tsx', ['aria-expanded={isExpanded}', 'aria-controls={contentId}', 'accessibilityState={{ expanded: isExpanded, disabled }}']],
  ['packages/components/src/SegmentedControl.tsx', ['role="radiogroup"', 'role="radio"', 'aria-checked={selected}', 'resolveRovingFocusIndex']],
  ['packages/media-presentation/src/MediaFrame.tsx', ["accessibilityRole={accessible ? 'image' : undefined}", 'aria-label={accessible ? alt : undefined}', 'accessibilityLiveRegion="polite"']],
  ['packages/visualization/src/ChartAnatomy.tsx', ['role="table"', 'role="columnheader"', 'role="cell"', 'aria-selected={onSelect && selectedIndex === index ? true : undefined}']],
  ['packages/visualization/src/LineChart.tsx', ['accessibilityRole="button"', 'aria-pressed={selected === index}']],
  ['packages/visualization/src/BarChart.tsx', ['accessibilityRole="button"', 'aria-pressed={selected === index}']],
  ['packages/visualization/src/StackedBarChart.tsx', ['accessibilityRole="button"', 'aria-pressed={selected === index}']],
  ['packages/navigation/src/Tabs.tsx', ['role="tablist"', 'role="tab"', 'aria-selected={active}', 'aria-disabled={item.disabled}', 'resolveRovingFocusIndex']],
  ['packages/navigation/src/NavigationItemButton.tsx', ["const role = routeDestination ? 'link' : mode === 'bottom' ? 'tab' : 'button'", "aria-current={routeDestination && active ? 'page' : undefined}", "aria-selected={!routeDestination && mode === 'bottom' ? active : undefined}", "aria-pressed={!routeDestination && mode === 'sidebar' ? active : undefined}", 'aria-disabled={item.disabled}']],
  ['packages/navigation/src/BottomNavigation.tsx', ["role={usesRouteLinks ? 'navigation' : 'tablist'}", 'resolveRovingFocusIndex']],
  ['packages/overlays/src/BottomSheet.tsx', ["role={dismissOnBackdrop ? 'button' : undefined}", 'aria-label={dismissOnBackdrop']],
  ['packages/overlays/src/Menu.tsx', ['role="menuitem"', 'role="menu"', 'aria-disabled={disabled}', 'aria-selected={selected}']],
  ['packages/overlays/src/Dialog.tsx', ['aria-modal', "role={kind === 'alert' ? 'alertdialog' : 'dialog'}", 'ModalSurface']],
  ['packages/overlays/src/OverlayRootProvider.tsx', ['role="button"', 'aria-label="Dismiss notification"']],
  ['packages/data-display/src/ListRow.tsx', ['role="button"', 'aria-pressed={selected}', 'aria-disabled={disabled}']],
  ['packages/data-display/src/AdaptiveDataTable.tsx', ['role="table"', 'role="row"', 'role="columnheader"', 'role="cell"', "'aria-sort'", 'columnVisibility']],
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function walkFeatureCode(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFeatureCode(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      for (const [pattern, label] of forbidden) {
        if (pattern.test(text)) problems.push(`${path.relative(root, full)}: ${label}`);
      }
    }
  }
}

if (fs.existsSync(appsRoot)) {
  for (const app of fs.readdirSync(appsRoot, { withFileTypes: true })) {
    if (app.isDirectory()) walkFeatureCode(path.join(appsRoot, app.name, 'app'));
  }
}

const selectionSource = read('packages/forms/src/Selection.tsx');
const switchBlock = selectionSource.match(/<Switch[\s\S]*?\/>/)?.[0] ?? '';
if (/\b(?:role|accessibilityRole)\s*=/.test(switchBlock) || /\baria-(?:checked|disabled|label)\s*=/.test(switchBlock)) {
  problems.push('packages/forms/src/Selection.tsx: native Switch must not add a second web semantic layer; rely on intrinsic Switch semantics plus native accessibilityLabel/state');
}

for (const [file, markers] of semanticContracts) {
  if (!fs.existsSync(path.join(root, file))) {
    problems.push(`${file}: required shared accessibility primitive is missing`);
    continue;
  }
  const text = read(file);
  for (const marker of markers) {
    if (!text.includes(marker)) problems.push(`${file}: missing universal semantic contract ${marker}`);
  }
}

const resilienceContracts = [
  ['packages/primitives/src/Text.tsx', ['maxFontSizeMultiplier']],
  ['packages/motion/src/MotionRootProvider.tsx', ['useReducedMotion', 'reducedMotion?: boolean']],
  ['packages/motion/src/Reveal.tsx', ['ReduceMotion.Always']],
  ['packages/overlays/src/OverlayRootProvider.tsx', ['usePrecisionReducedMotion']],
  ['packages/overlays/src/Dialog.tsx', ['aria-modal']],
  ['packages/forms/src/FormLifecycle.tsx', ['role="alert"', 'accessibilityLiveRegion="assertive"']],
  ['packages/data-display/src/DataTableControls.tsx', ['accessibilityLiveRegion="polite"', 'InfinitePagination']],
  ['packages/patterns/src/FilterDrawer.tsx', ['BottomSheet', 'role="form"', 'Apply filters']],
];

for (const [file, markers] of resilienceContracts) {
  const text = read(file);
  for (const marker of markers) {
    if (!text.includes(marker)) problems.push(`${file}: missing kernel-resilience contract ${marker}`);
  }
}

if (problems.length) {
  console.error(`Accessibility/motion contract violations:\n${problems.map((problem) => `- ${problem}`).join('\n')}`);
  process.exit(1);
}

console.log(`Accessibility/motion contract check passed (${semanticContracts.length} shared semantic surfaces, ${resilienceContracts.length} resilience owners).`);
