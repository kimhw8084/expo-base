import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const unistyles = read('apps/reference/unistyles.ts');
const themeSync = read('apps/reference/ThemeRuntimeSync.tsx');
const formScreen = read('packages/layouts/src/FormScreen.tsx');
const bottomNavigation = read('packages/navigation/src/BottomNavigation.tsx');
const sidebarNavigation = read('packages/navigation/src/SidebarNavigation.tsx');
const dialog = read('packages/overlays/src/Dialog.tsx');
const bottomSheet = read('packages/overlays/src/BottomSheet.tsx');
const overlayRoot = read('packages/overlays/src/OverlayRootProvider.tsx');
const generator = read('packages/create-precision-app/bin/create-precision-app.mjs');

const nativeInitialTheme = "Platform.OS === 'web' ? 'light' : Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'";
if (!unistyles.includes(nativeInitialTheme)) failures.push('Reference bootstrap must use system appearance for the native initial theme while keeping deterministic light SSR on web.');
if (!themeSync.includes('StatusBar') || !themeSync.includes("effectiveTheme === 'dark' ? 'light-content' : 'dark-content'")) failures.push('Reference theme synchronization must keep native status-bar contrast aligned with the effective app theme.');
if (!formScreen.includes("const nativeKeyboardDismissMode = Platform.OS === 'ios' ? 'interactive' : 'on-drag'") || !formScreen.includes("const keyboardDismissMode = Platform.OS === 'web' ? 'none' : nativeKeyboardDismissMode") || !formScreen.includes('keyboardDismissMode={keyboardDismissMode}')) failures.push('FormScreen must own native keyboard drag dismissal and keep web focus transitions from dismissing the keyboard.');
if (!formScreen.includes('KeyboardToolbar insets={{ left: rt.insets.left, right: rt.insets.right }}')) failures.push('FormScreen keyboard toolbar must respect horizontal safe-area insets.');
if (!bottomNavigation.includes('usePrecisionDirection') || !bottomNavigation.includes('paddingStart: rt.insets.right') || !bottomNavigation.includes('paddingStart: rt.insets.left') || !bottomNavigation.includes('paddingEnd: rt.insets.right') || !bottomNavigation.includes('paddingEnd: rt.insets.left')) failures.push('Bottom navigation must map both physical safe-area edges to RTL-aware logical padding.');
if (!sidebarNavigation.includes('usePrecisionDirection') || !sidebarNavigation.includes('paddingStart: rt.insets.right') || !sidebarNavigation.includes('paddingStart: rt.insets.left')) failures.push('Sidebar navigation must map the leading safe-area edge through RTL-aware logical padding.');
if (!dialog.includes('paddingTop: rt.insets.top + theme.spacing.lg') || !dialog.includes('paddingLeft: rt.insets.left + theme.spacing.lg') || !dialog.includes('paddingRight: rt.insets.right + theme.spacing.lg')) failures.push('Dialogs must stay within native safe-area edges.');
if (!bottomSheet.includes('paddingLeft: rt.insets.left + theme.spacing.lg') || !bottomSheet.includes('paddingRight: rt.insets.right + theme.spacing.lg')) failures.push('Bottom sheets must protect horizontal safe-area edges.');
if (!overlayRoot.includes('paddingLeft: rt.insets.left + theme.spacing.lg') || !overlayRoot.includes('paddingRight: rt.insets.right + theme.spacing.lg')) failures.push('Toast surfaces must protect horizontal safe-area edges.');
if (!generator.includes(nativeInitialTheme) || !generator.includes('StatusBar animated barStyle=')) failures.push('Generated apps must inherit native initial-theme and status-bar parity.');

if (failures.length) {
  console.error('Native shell contract violations:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Native shell contracts passed.');
