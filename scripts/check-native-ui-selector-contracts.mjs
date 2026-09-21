import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const navigation = readFileSync(join(root, 'packages', 'navigation', 'src', 'NavigationItemButton.tsx'), 'utf8');
const pageHeader = readFileSync(join(root, 'packages', 'layouts', 'src', 'PageHeader.tsx'), 'utf8');
const pagePatterns = readFileSync(join(root, 'packages', 'patterns', 'src', 'PagePatterns.tsx'), 'utf8');
const golden = readFileSync(join(root, 'apps', 'reference', 'app', 'golden.tsx'), 'utf8');
const forms = readFileSync(join(root, 'apps', 'reference', 'app', 'forms.tsx'), 'utf8');
const overlays = readFileSync(join(root, 'apps', 'reference', 'app', 'overlays.tsx'), 'utf8');
const serverState = readFileSync(join(root, 'apps', 'reference', 'app', 'server-state.tsx'), 'utf8');
const generator = readFileSync(join(root, 'scripts', 'generate-android-ui-test-project.mjs'), 'utf8');
const swift = [
  readFileSync(join(root, 'tests', 'native', 'ios', 'ExpoBaseNativeUITests.swift'), 'utf8'),
  readFileSync(join(root, 'tests', 'native', 'ios', 'NativeRobots.swift'), 'utf8'),
].join('\n');
const android = readFileSync(join(root, 'tests', 'native', 'android', 'ExpoBaseNativeAndroidTest.java'), 'utf8');
const appOwnedTestIds = [
  'home-adaptive-section-header',
  'home-metric-group',
  'navigation-item-build',
  'navigation-item-data',
  'navigation-item-patterns',
  'navigation-item-system',
  'navigation-item-home',
  'adapter-form-sections',
  'demo-name',
  'adapter-form-validate',
  'adapter-form-error-summary',
  'demo-email-error',
  'card-data-toolbar',
  'golden-page-header-title',
  'surface-card-default',
  'card-action-menu',
  'overlay-dialog-trigger',
  'overlay-dialog-review-action',
  'overlay-bottom-sheet-trigger',
  'bottom-sheet-panel',
  'analytics-page-header-title',
  'finance-page-header-title',
  'monitoring-page-header-title',
  'card-data-table-compact-row-venture-x',
  'selected-record-details',
  'server-state-load-count',
  'server-state-refresh',
  'server-state-mutation-count',
  'runtime-settings-status',
  'runtime-locale-status',
];
const checks = [
  ['navigation route targets', navigation.includes('testID={`navigation-item-${item.key}`}')],
  ['home landmark', swift.includes('Universal application foundation')],
  ['shared PageHeader native selector', pageHeader.includes("testID = 'page-header-title'") && pageHeader.includes('<Text variant="h1" testID={testID}>')],
  ['Golden pattern header forwards selector ownership', pagePatterns.includes('testID?: string | undefined') && pagePatterns.includes('{ testID }')],
  ['Golden Dashboard route owns a stable header selector', golden.includes("testID:'golden-page-header-title'")],
  ['form name selector', swift.includes('demo-name')],
  ['geometry assertion', swift.includes('frame.width') && swift.includes('frame.height')],
  ['hittability assertion', swift.includes('isHittable')],
  ['generated Android instrumentation includes Espresso', generator.includes("androidx.test.espresso:espresso-core:3.6.1") && generator.includes('androidTestImplementation')],
  ['Android disappearance assertion uses Espresso ViewAssertions', android.includes('import static androidx.test.espresso.assertion.ViewAssertions.doesNotExist;') && !android.includes('import static androidx.test.espresso.matcher.ViewMatchers.doesNotExist;')],
  ['Android app-owned selectors use React Native View tags', android.includes('withTagValue') && android.includes('is((Object) id)') && android.includes('testIdMatcher')],
  ['Android launch still requires the stable home testID', android.includes('launchReleaseProduct') && android.includes('assertTestIdVisible("home-adaptive-section-header"')],
  ['Android home scroll still requires the stable metric-group testID', android.includes('touchScrollReachesHomeContent') && android.includes('assertTestIdVisible("home-metric-group"')],
  ['Android decisive target helpers are Espresso-owned', android.includes('assertTestIdVisible') && android.includes('clickTestId') && android.includes('replaceTextTestId') && android.includes('assertTestIdTextContains')],
  ['Android testID matching excludes hidden duplicate views', android.includes('allOf(testIdMatcher(id), isDisplayed(), isEnabled())')],
  ['Android testID reachability scrolls the owning React Native surface', android.includes('hasDescendant(testIdMatcher(id))') && android.includes('isAssignableFrom(ScrollView.class)') && android.includes('perform(swipeUp())')],
  ['Android testID reachability has bounded no-progress failure', android.includes('MAX_NO_PROGRESS_ATTEMPTS') && android.includes('noProgressAttempts')],
  ['decisive Android route assertions avoid display-text helpers', !android.includes('assertText(') && !android.includes('findSemanticText(') && !android.includes('hasText(')],
  ['Android testID selectors fail closed without text or resource fallback', android.includes('Missing Android testID target') && !android.includes('By.res(') && !android.includes('Missing Android resource-id target') && !android.includes('clickTarget(')],
  ['Android convenience fallback remains separate from decisive testIDs', android.includes('clickAccessibleTarget') && android.includes('scrollToAccessibleTarget') && android.includes('By.descContains(description)') && android.includes('By.textContains(text)')],
  ['Android id-less reachability scrolls a discovered surface', android.includes('By.scrollable(true)') && android.includes('Direction.DOWN') && android.includes('surface.scroll(')],
  ['UI Automator remains device/system-only', android.includes('device.setOrientationLeft()') && android.includes('device.pressBack()') && android.includes('device.swipe(') && android.includes('device.takeScreenshot(')],
  ['every decisive Android target remains in the testID ownership surface', appOwnedTestIds.every((id) => android.includes(id))],
  ['form validation uses stable summary and field ownership', forms.includes('testID="adapter-form-error-summary"') && forms.includes('id="demo-email"') && android.includes('adapter-form-error-summary') && android.includes('demo-email-error') && !android.includes('Enter your email.')],
  ['overlay opening uses stable reference controls', overlays.includes('testID="overlay-dialog-trigger"') && overlays.includes('testID="overlay-bottom-sheet-trigger"') && overlays.includes('testID="overlay-dialog-review-action"') && android.includes('card-action-menu')],
  ['overlay dismissal fails closed on testID disappearance', android.includes('assertTestIdAbsent("overlay-dialog-review-action"') && android.includes('assertTestIdAbsent("bottom-sheet-panel"') && android.includes('doesNotExist()') && !android.includes('Until.gone')],
  ['flagship route identity uses PageHeader testIDs', android.includes('analytics-page-header-title') && android.includes('finance-page-header-title') && android.includes('monitoring-page-header-title')],
  ['server-state uses stable count and control ownership', serverState.includes('testID="server-state-refresh"') && android.includes('server-state-load-count') && android.includes('server-state-refresh') && android.includes('server-state-mutation-count')],
  ['R5 text heuristics and R7 resource-id assumptions cannot return', !android.includes('Expected Android text was not rendered') && !android.includes('findSemanticText') && !android.includes('SystemClock') && !android.includes('By.res(') && !android.includes('Missing Android resource-id')],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(`Native UI selector contract failed: ${failures.join(', ')}`);
  process.exit(1);
}
console.log(`Native UI selector contract passed: ${checks.length} ownership checks.`);
