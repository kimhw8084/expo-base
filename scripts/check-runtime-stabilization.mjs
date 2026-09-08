import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const pageHeader = read('packages/layouts/src/PageHeader.tsx');
if (!pageHeader.includes('copy: { minWidth: 0, flex: 1, maxWidth: theme.contentWidths.reading }')) failures.push('PageHeader copy must own flexible width.');

const actionBar = read('packages/layouts/src/PriorityActionBar.tsx');
if (!actionBar.includes('theme.actionMetrics.barWidth.medium')) failures.push('PriorityActionBar must own a responsive width budget.');

const screen = read('packages/layouts/src/Screen.tsx');
const formScreen = read('packages/layouts/src/FormScreen.tsx');
if (!screen.includes("width: '100%'")) failures.push('ScrollScreen content must own viewport width.');
if (!formScreen.includes("width: '100%'")) failures.push('FormScreen content must own viewport width.');
if (!formScreen.includes("Platform.OS !== 'web'")) failures.push('FormScreen must keep the native keyboard toolbar off web.');

const interactionState = read('packages/primitives/src/useInteractionState.ts');
if (!interactionState.includes('webKeyboardModality')) failures.push('Interaction focus rings must be keyboard-modality aware on web.');

const button = read('packages/components/src/Button.tsx');
if (!button.includes('fullWidth?: boolean')) failures.push('Button must expose semantic fullWidth instead of stretching implicitly.');
if (!button.includes("responsiveWidth?: 'auto' | 'compact-full'")) failures.push('Button must support semantic compact-only full width.');
if (!button.includes('styles.compactFull')) failures.push('Button compact-full behavior must remain system-owned.');
if (!button.includes("alignSelf: 'flex-start'")) failures.push('Button must be intrinsic-width by default.');
if (!button.includes('styles.loadingContent') || !button.includes('styles.loadingIndicator')) failures.push('Button loading must preserve its content geometry while placing the indicator over the stable action surface.');

const asyncAction = read('packages/runtime/src/usePrecisionAsyncAction.ts');
if (!asyncAction.includes('active.current') || !asyncAction.includes('started !== revision.current') || !asyncAction.includes('mounted.current = false')) failures.push('Shared async actions must single-flight repeated taps and ignore late completions after reset/unmount.');

const navRouter = read('packages/navigation-router/src/index.tsx');
if (!navRouter.includes('backOr: (fallback: Href)')) failures.push('Router adapter must provide safe back fallback.');

for (const file of fs.readdirSync(path.join(root, 'apps/reference/app')).filter((name) => name.endsWith('.tsx'))) {
  const text = read(`apps/reference/app/${file}`);
  if (/label="Back"[^>]*onPress=\{router\.back\}/s.test(text) || /label="Back"[^>]*router\.back\(\)/s.test(text)) failures.push(`${file} uses unsafe direct router.back for a Back control.`);
  if (/<Avatar\s+label=/.test(text)) failures.push(`${file} uses obsolete Avatar label prop.`);
}

const sheet = read('packages/overlays/src/BottomSheet.tsx');
if (/animationType="slide"/.test(sheet)) failures.push('BottomSheet must not slide the entire Modal/backdrop.');
if (!sheet.includes('Animated.View')) failures.push('BottomSheet panel must own its animation independently.');
if (!sheet.includes('expanded: theme.componentMetrics.sheetMaxWidth')) failures.push('Desktop bottom sheet must use its dedicated semantic max width.');
if (!sheet.includes("role={dismissOnBackdrop ? 'button' : undefined}") || !sheet.includes('aria-label={dismissOnBackdrop')) failures.push('BottomSheet backdrop must expose explicit React Native Web button semantics.');

const toast = read('packages/overlays/src/OverlayRootProvider.tsx');
if (!toast.includes('Dismiss notification')) failures.push('Toast requires an explicit dismiss control.');
if (!toast.includes('toastLayer')) failures.push('Toast must use a centered positioning layer.');
if (!toast.includes('ToastLifetime')) failures.push('Toast must expose a visible remaining-lifetime indicator.');
if (!toast.includes('toastLifetimeValue')) failures.push('Toast lifetime indicator must be system-owned.');
if (!toast.includes('theme.feedbackMetrics.toastMaxWidth')) failures.push('Toast must use its dedicated semantic max-width token.');

for (const file of ['packages/visualization/src/LineChart.tsx', 'packages/visualization/src/BarChart.tsx']) {
  const text = read(file);
  if (/<(?:Rect|Path|Circle)[^>]*onPress=/s.test(text)) failures.push(`${file} attaches responder events directly to SVG shapes.`);
  if (!text.includes('<Pressable')) failures.push(`${file} must use RN Pressable hit targets outside SVG.`);
}

const avatar = read('packages/components/src/Avatar.tsx');
if (!avatar.includes("typeof name === 'string'")) failures.push('Avatar must fail safely for malformed runtime data.');

const listRow = read('packages/data-display/src/ListRow.tsx');
if (!listRow.includes('disclosure?: boolean')) failures.push('Interactive ListRow must own semantic disclosure behavior.');
const listRowAst = ts.createSourceFile('ListRow.tsx', listRow, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let listRowTitleOwnsLongContent = false;
const inspectListRow = (node) => {
  if (ts.isJsxElement(node) && node.openingElement.tagName.getText(listRowAst) === 'Text') {
    const attributes = node.openingElement.attributes.properties;
    const variant = attributes.find((attribute) => ts.isJsxAttribute(attribute) && attribute.name.text === 'variant');
    const numberOfLines = attributes.find((attribute) => ts.isJsxAttribute(attribute) && attribute.name.text === 'numberOfLines');
    const rendersTitle = node.children.some((child) => ts.isJsxExpression(child) && child.expression?.getText(listRowAst) === 'title');
    const linePolicy = ts.isJsxAttribute(numberOfLines)
      && ts.isJsxExpression(numberOfLines.initializer)
      && ts.isConditionalExpression(numberOfLines.initializer.expression)
      && numberOfLines.initializer.expression.whenTrue.getText(listRowAst) === '2';
    if (ts.isJsxAttribute(variant) && variant.initializer?.getText(listRowAst) === '"label"' && rendersTitle && linePolicy) {
      listRowTitleOwnsLongContent = true;
    }
  }
  ts.forEachChild(node, inspectListRow);
};
inspectListRow(listRowAst);
if (!listRowTitleOwnsLongContent) failures.push('ListRow titles must tolerate long product names through a semantic content policy.');
if (!listRow.includes('selectedHovered')) failures.push('Selected ListRow must retain selected semantics while hovered.');
if (!listRow.includes('boxShadow')) failures.push('Interactive ListRow must expose a visible keyboard focus ring.');

const home = read('apps/reference/app/index.tsx');
if (home.includes('Open forms gate') || home.includes('Open navigation gate')) failures.push('Reference home must not regress to the diagnostic button wall.');
if (!home.includes('Explore Expo Base')) failures.push('Reference home must expose the structured Expo Base route index.');
if (!home.includes('responsive-regime-compact')) failures.push('Reference home must expose an unambiguous compact-regime acceptance target.');
if (!home.includes('ListRow title="Venture X"')) failures.push('Master/detail acceptance must use the real ListRow pattern.');


const runtimeSettings = read('apps/reference/ReferenceRuntimeSettings.tsx');
const runtimeControls = read('apps/reference/ReferenceRuntimeControls.tsx');
const rootLayout = read('apps/reference/app/_layout.tsx');
const themeSync = read('apps/reference/ThemeRuntimeSync.tsx');
if (!runtimeSettings.includes("ReferenceThemeMode = 'system' | 'light' | 'dark'")) failures.push('Reference app must expose system/light/dark runtime theme modes.');
if (!runtimeControls.includes('runtime-settings-status')) failures.push('Reference runtime controls must expose a testable active-state summary.');
if (!runtimeControls.includes('Theme: ${capitalize(mode)}') || !runtimeControls.includes('Density: Compact')) failures.push('Reference runtime controls must use contextual accessibility labels that cannot collide with shell destinations.');
if (!rootLayout.includes('density={density}')) failures.push('Reference runtime density control must feed PrecisionRuntimeProvider.');
if (!themeSync.includes("mode === 'system'")) failures.push('Theme synchronizer must honor explicit reference theme overrides without losing system mode.');

const formLayout = read('packages/forms/src/FormLayout.tsx');
if (!formLayout.includes("compact: 'column-reverse'")) failures.push('Form actions must stack safely on compact layouts.');
const formsRoute = read('apps/reference/app/forms.tsx');
if ((formsRoute.match(/responsiveWidth="compact-full"/g) ?? []).length < 2) failures.push('Reference form must exercise compact-full primary and secondary actions.');

const foundations = read('packages/tokens/src/foundations.ts');
if (!foundations.includes('sheetMaxWidth: 640')) failures.push('Sheet max width must be a dedicated semantic token.');


const adaptiveNav = read('packages/navigation/src/AdaptiveNavigationShell.tsx');
const sidebarNav = read('packages/navigation/src/SidebarNavigation.tsx');
const navButton = read('packages/navigation/src/NavigationItemButton.tsx');
if (!rootLayout.includes('RouterNavigationShell')) failures.push('Reference app must exercise the real adaptive navigation shell.');
if (!rootLayout.includes('brand="Expo Base"') || !rootLayout.includes('brandMark="E"')) failures.push('Reference shell must use Expo Base branding.');
if (!rootLayout.includes("enabled={access === 'granted'}")) failures.push('Reference shell must stay hidden during public/auth bootstrap states.');
if (!navRouter.includes('matchPaths?: readonly string[]')) failures.push('Router navigation items must support grouped acceptance-route matching.');
if (!navRouter.includes('mouse?.metaKey || mouse?.ctrlKey || mouse?.shiftKey || mouse?.altKey')) failures.push('Router-owned web links must preserve modifier-click navigation behavior.');
if (!adaptiveNav.includes('enabled = true')) failures.push('Adaptive navigation shell must support a stable bypass state for public routes.');
if ((adaptiveNav.match(/\{children\}/g) ?? []).length !== 2) failures.push('Adaptive navigation shell must render route content exactly once per enabled/bypass branch; never duplicate a mounted navigator across responsive shells.');
if (adaptiveNav.includes('compactShell') || adaptiveNav.includes('desktopShell')) failures.push('Adaptive navigation shell must not duplicate route content into parallel compact/desktop branches.');
if (!sidebarNav.includes('brandMark')) failures.push('Sidebar navigation must own a configurable semantic brand mark.');
if (!navButton.includes('activeHovered')) failures.push('Selected navigation destinations must retain hierarchy while hovered.');
if (!navButton.includes("const routeDestination = Platform.OS === 'web' && Boolean(item.href)")) failures.push('Navigation destinations must distinguish router-owned web links from generic in-place controls.');
if (!navButton.includes("const role = routeDestination ? 'link' : mode === 'bottom' ? 'tab' : 'button'")) failures.push('Router-owned navigation destinations must expose link semantics on web while generic compact controls retain tabs.');
if (!navButton.includes('aria-current={routeDestination && active ? \'page\' : undefined}')) failures.push('Active web route destinations must expose aria-current page state.');
if (!navButton.includes("aria-selected={!routeDestination && mode === 'bottom' ? active : undefined}")) failures.push('Only generic in-place compact tabs may emit aria-selected.');
if (!navButton.includes("aria-pressed={!routeDestination && mode === 'sidebar' ? active : undefined}")) failures.push('Only generic in-place sidebar buttons may emit aria-pressed.');
if (!navButton.includes("numberOfLines={mode === 'bottom' ? 3 : 1}")) failures.push('Compact route labels must retain a controlled multi-line legibility policy under localization stress.');
const bottomNavigation = read('packages/navigation/src/BottomNavigation.tsx');
if (!bottomNavigation.includes('compact: theme.spacing.xxs')) failures.push('Compact bottom navigation must tighten token-owned gaps at narrow widths.');
if (!navButton.includes('paddingHorizontal: { compact: theme.spacing.xxs')) failures.push('Compact bottom navigation labels must retain enough width at 320px.');
if (!bottomNavigation.includes("role={usesRouteLinks ? 'navigation' : 'tablist'}")) failures.push('Route-destination bottom navigation must expose a named navigation landmark instead of a false tablist.');

const textPrimitive = read('packages/primitives/src/Text.tsx');
if (!textPrimitive.includes('fontSize: { compact: theme.typographyMetrics.compact.h1.fontSize')) failures.push('Heading typography must consume compact typography tokens.');
if (!textPrimitive.includes('lineHeight: { compact: theme.typographyMetrics.compact.h1.lineHeight')) failures.push('Heading line height must consume compact typography tokens.');
if (!foundations.includes('h1: { fontSize: 28, lineHeight: 34 }')) failures.push('Compact H1 typography token must preserve the certified 28/34 geometry.');
if (!textPrimitive.includes("const resolvedRole = role ?? (heading ? 'heading' : undefined)")) failures.push('Heading typography must emit semantic heading roles on web.');
if (!textPrimitive.includes("const resolvedAccessibilityRole = accessibilityRole ?? (heading ? 'header' : undefined)")) failures.push('Heading typography must retain native header semantics.');
if (!pageHeader.includes("flexDirection: { compact: 'column', expanded: 'row' }")) failures.push('PageHeader must not force side-by-side actions before expanded layouts.');
if (!button.includes("maxWidth: '100%'")) failures.push('Buttons must stay bounded by their container.');

const runtimeTestWeb = read('scripts/runtime-test-web.mjs');
if (!runtimeTestWeb.includes("expo', 'export'")) failures.push('Runtime browser certification must test the static Expo export.');
if (!runtimeTestWeb.includes('PLAYWRIGHT WEB CERTIFICATION')) failures.push('Runtime browser certification must execute Playwright.');
if (!runtimeTestWeb.includes("serve-static-web.mjs', 'apps/reference/dist', '0'")) failures.push('Runtime browser certification must use an OS-assigned static-server port.');
if (!runtimeTestWeb.includes("runningServer.child.kill('SIGKILL')") || !runtimeTestWeb.includes("process.once('SIGINT'")) failures.push('Runtime browser certification must force-clean the child server on failure and signals.');
const staticServer = read('scripts/serve-static-web.mjs');
if (!staticServer.includes('server.address()') || !staticServer.includes('boundPort')) failures.push('Static web serving must report the actual bound port for isolated certification.');

const runtimeTsconfig = read('tsconfig.runtime-ui.json');
if (!runtimeTsconfig.includes('packages/*/src/**/*.tsx')) failures.push('Runtime typecheck must compile UI packages and the reference app in one program.');
const packageJson = JSON.parse(read('package.json'));
if (packageJson.scripts?.['typecheck:runtime-ui'] !== 'tsc -p tsconfig.runtime-ui.json --noEmit') failures.push('Runtime UI typecheck must use the aggregate Unistyles-aware TypeScript program.');

if (failures.length) {
  console.error('Runtime stabilization contract violations:\n' + failures.map((f) => `- ${f}`).join('\n'));
  process.exit(1);
}
console.log('Runtime stabilization contracts passed.');
