import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const navigation = readFileSync(join(root, 'packages', 'navigation', 'src', 'NavigationItemButton.tsx'), 'utf8');
const pageHeader = readFileSync(join(root, 'packages', 'layouts', 'src', 'PageHeader.tsx'), 'utf8');
const pagePatterns = readFileSync(join(root, 'packages', 'patterns', 'src', 'PagePatterns.tsx'), 'utf8');
const golden = readFileSync(join(root, 'apps', 'reference', 'app', 'golden.tsx'), 'utf8');
const forms = readFileSync(join(root, 'apps', 'reference', 'app', 'forms.tsx'), 'utf8');
const overlays = readFileSync(join(root, 'apps', 'reference', 'app', 'overlays.tsx'), 'utf8');
const bottomSheet = readFileSync(join(root, 'packages', 'overlays', 'src', 'BottomSheet.tsx'), 'utf8');
const menu = readFileSync(join(root, 'packages', 'overlays', 'src', 'Menu.tsx'), 'utf8');
const button = readFileSync(join(root, 'packages', 'components', 'src', 'Button.tsx'), 'utf8');
const serverState = readFileSync(join(root, 'apps', 'reference', 'app', 'server-state.tsx'), 'utf8');
const generator = readFileSync(join(root, 'scripts', 'generate-android-ui-test-project.mjs'), 'utf8');
const swift = [
  readFileSync(join(root, 'tests', 'native', 'ios', 'ExpoBaseNativeUITests.swift'), 'utf8'),
  readFileSync(join(root, 'tests', 'native', 'ios', 'NativeRobots.swift'), 'utf8'),
].join('\n');
const android = readFileSync(join(root, 'tests', 'native', 'android', 'ExpoBaseNativeAndroidTest.java'), 'utf8');
const overlayScenarioStart = android.indexOf('public void overlayLifecycleAndSystemBack');
const overlayScenarioEnd = android.indexOf('public void flagshipDataAndServerStateRoutes');
const overlayScenario = android.slice(overlayScenarioStart, overlayScenarioEnd);
const nativeTestCount = (android.match(/@Test\s+public void/g) ?? []).length;
const identityMatcherStart = android.indexOf('private Matcher<View> testIdMatcher');
const identityMatcherEnd = android.indexOf('private Matcher<View> visibleTestIdMatcher');
const testIdIdentity = android.slice(identityMatcherStart, identityMatcherEnd);
const testIdHelperStart = android.indexOf('private ViewInteraction scrollToTestId');
const accessibleHelperStart = android.indexOf('private void clickAccessibleTarget');
const modalAccessibilityHelperStart = android.indexOf('private UiObject2 requireUniqueModalAccessibilityTarget');
const testIdReachabilityHelper = android.slice(testIdHelperStart, accessibleHelperStart);
const accessibleReachabilityHelper = android.slice(accessibleHelperStart, modalAccessibilityHelperStart);
const formScenarioStart = android.indexOf('public void formInputKeyboardAndValidation');
const formScenarioEnd = android.indexOf('public void touchScrollReachesHomeContent');
const formScenario = android.slice(formScenarioStart, formScenarioEnd);
const replaceTextHelperStart = android.indexOf('private void replaceTextTestId');
const replaceTextHelperEnd = android.indexOf('private void assertTestIdTextContains');
const replaceTextHelper = android.slice(replaceTextHelperStart, replaceTextHelperEnd);
const activityRootHelper = android.slice(android.indexOf('private ViewInteraction scrollToTestId'), android.indexOf('private void clickAccessibleTarget'));
const modalAccessibilityHelperEnd = android.indexOf('private Matcher<View> accessibleTargetMatcher');
const modalAccessibilityHelper = android.slice(modalAccessibilityHelperStart, modalAccessibilityHelperEnd);
const modalAbsentHelperStart = android.indexOf('private void assertModalAccessibilityAbsent');
const modalAbsentHelperEnd = android.indexOf('private void clickHomeRoute');
const modalAbsentHelper = android.slice(modalAbsentHelperStart, modalAbsentHelperEnd);
const absentTargetBranchStart = testIdReachabilityHelper.indexOf('catch (NoMatchingViewException | AssertionError failure)');
const absentTargetBranchEnd = testIdReachabilityHelper.indexOf('      try {', absentTargetBranchStart);
const absentTargetBranch = testIdReachabilityHelper.slice(absentTargetBranchStart, absentTargetBranchEnd);
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
  ['modal accessibility path keeps the existing UiAutomator 2.3.0 dependency', generator.includes("androidx.test.uiautomator:uiautomator:2.3.0")],
  ['Android allOf combinator uses Hamcrest', android.includes('import static org.hamcrest.Matchers.allOf;') && !android.includes('import static androidx.test.espresso.matcher.ViewMatchers.allOf;')],
  ['Android modal disappearance uses UI Automator semantics', !android.includes('doesNotExist()') && !android.includes('import static androidx.test.espresso.matcher.ViewMatchers.doesNotExist;')],
  ['Android app-owned selectors use React Native View tags', android.includes('withTagValue') && android.includes('is((Object) id)') && android.includes('testIdMatcher')],
  ['Android launch still requires the stable home testID', android.includes('launchReleaseProduct') && android.includes('assertTestIdVisible("home-adaptive-section-header"')],
  ['Android home scroll still requires the stable metric-group testID', android.includes('touchScrollReachesHomeContent') && android.includes('assertTestIdVisible("home-metric-group"')],
  ['Android decisive target helpers are Espresso-owned', android.includes('assertTestIdVisible') && android.includes('clickTestId') && android.includes('replaceTextTestId') && android.includes('assertTestIdTextContains')],
  ['Android testID identity excludes hidden zero-size duplicates without screen-state matching', testIdIdentity.includes('view.isShown()') && testIdIdentity.includes('getWidth() > 0') && testIdIdentity.includes('getHeight() > 0') && !testIdIdentity.includes('isDisplayed()') && !testIdIdentity.includes('isEnabled()')],
  ['Android ordinary visibility stays distinct from click readiness', android.includes('visibleTestIdMatcher') && android.includes('allOf(testIdMatcher(id), isDisplayed())') && !testIdIdentity.includes('isDisplayed()') && !testIdIdentity.includes('isEnabled()')],
  ['Android Espresso click readiness matches the 90-percent enabled constraint', android.includes('allOf(testIdMatcher(id), isDisplayingAtLeast(90), isEnabled())') && android.includes('scrollToTestId(id, description, clickReadyTestIdMatcher(id)).perform(click())') && android.includes('target.check(matches(readinessMatcher))')],
  ['Forms closes the IME through replaceTextTestId without a redundant system Back', replaceTextHelper.includes('replaceText(value), closeSoftKeyboard()') && formScenario.includes('replaceTextTestId("demo-name"') && formScenario.includes('assertTestIdVisible("adapter-form-sections"') && !formScenario.includes('device.pressBack()')],
  ['Android testID reachability distinguishes absent targets from present targets', testIdReachabilityHelper.includes('target.check(matches(testIdMatcher(id)))') && absentTargetBranch.includes('device.waitForIdle(POLL_MS);') && absentTargetBranch.includes('continue;') && !absentTargetBranch.includes('noProgressAttempts')],
  ['Android testID reachability requests the exact target rectangle through its React Native ScrollView', testIdReachabilityHelper.includes('requestTestIdRectangleOnScreen(id)') && android.includes('requestRectangleOnScreen(new Rect(0, 0, view.getWidth(), view.getHeight()), false)') && android.includes('instanceof ScrollView')],
  ['Android testID reachability has bounded no-progress only after present-target scrolling', testIdReachabilityHelper.indexOf('target.check(matches(readinessMatcher))') < testIdReachabilityHelper.indexOf('requestTestIdRectangleOnScreen(id)') && android.includes('MAX_NO_PROGRESS_ATTEMPTS') && android.includes('noProgressAttempts')],
  ['Android testID reachability has no generic coordinate-swipe fallback', !testIdReachabilityHelper.includes('swipeUp') && !testIdReachabilityHelper.includes('device.swipe(')],
  ['decisive Android route assertions avoid display-text helpers', !android.includes('assertText(') && !android.includes('findSemanticText(') && !android.includes('hasText(')],
  ['Android testID selectors fail closed without text or resource fallback', android.includes('Missing Android testID target') && !android.includes('By.res(') && !android.includes('Missing Android resource-id target') && !android.includes('clickTarget(')],
  ['Android convenience fallback remains separate from decisive testIDs', android.includes('clickAccessibleTarget') && android.includes('scrollToAccessibleTarget') && android.includes('withContentDescription') && android.includes('withText(containsString(text))')],
  ['Android id-less reachability uses Espresso target exposure through the owning React Native ScrollView', accessibleReachabilityHelper.includes('requestAccessibleRectangleOnScreen(description, text)') && android.includes('onView(targetMatcher)') && android.includes('hasReactNativeScrollSurface') && !accessibleReachabilityHelper.includes('By.') && !accessibleReachabilityHelper.includes('UiObject2')],
  ['Android id-less reachability is not dependent on UI Automator scroll surfaces', !android.includes('By.scrollable(true)') && !android.includes('Direction.DOWN') && !android.includes('surface.scroll(')],
  ['UI Automator remains device/system-only', android.includes('UiDevice') && android.includes('device.setOrientationLeft()') && android.includes('device.pressBack()') && android.includes('device.swipe(') && android.includes('device.takeScreenshot(')],
  ['every decisive Android target remains in the testID ownership surface', appOwnedTestIds.every((id) => android.includes(id))],
  ['form validation uses stable summary and field ownership', forms.includes('testID="adapter-form-error-summary"') && forms.includes('id="demo-email"') && android.includes('adapter-form-error-summary') && android.includes('demo-email-error') && !android.includes('Enter your email.')],
  ['Android modal-hosted targets use active-window UI Automator accessibility selectors', !android.includes('RootMatchers.isDialog') && !android.includes('isDialog()') && !android.includes('NoMatchingRootException') && !android.includes('Matcher<Root>') && !android.includes('import androidx.test.espresso.Root;') && modalAccessibilityHelper.includes('UiObject2') && modalAccessibilityHelper.includes('By.descContains') && modalAccessibilityHelper.includes('By.textContains') && modalAccessibilityHelper.includes('device.findObjects') && !modalAccessibilityHelper.includes('.isVisible()') && modalAccessibilityHelper.includes('Rect visibleBounds = candidate.getVisibleBounds();') && modalAccessibilityHelper.includes('visibleBounds.width() > 0') && modalAccessibilityHelper.includes('visibleBounds.height() > 0') && modalAccessibilityHelper.includes('candidate.isEnabled()')],
  ['ActionMenu presence, click, and disappearance use its unique Edit card accessibility child', overlayScenario.includes('clickTestId("overlay-action-menu-trigger"') && overlayScenario.includes('UiObject2 editCardAction = assertModalAccessibilityVisible("card-action-menu", "Edit card", null, "Edit card action");') && overlayScenario.includes('editCardAction.click();') && overlayScenario.includes('assertModalAccessibilityAbsent("card-action-menu", "Edit card", null, "Edit card action");') && overlayScenario.includes('assertTestIdVisible("overlay-action-menu-trigger"') && !overlayScenario.includes('"Card actions"') && !overlayScenario.includes('"Quick actions"') && menu.includes('accessibilityLabel={label}')],
  ['Dialog and BottomSheet Back dismissal use their unique actionable child accessibility labels', overlayScenario.includes('clickTestId("overlay-dialog-trigger"') && overlayScenario.includes('assertModalAccessibilityVisible("overlay-dialog-review-action", "Review", null, "Dialog Review action")') && overlayScenario.includes('assertModalAccessibilityAbsent("overlay-dialog-review-action", "Review", null, "Dialog Review action")') && overlayScenario.includes('assertTestIdVisible("overlay-dialog-trigger"') && overlayScenario.includes('clickTestId("overlay-bottom-sheet-trigger"') && overlayScenario.includes('assertModalAccessibilityVisible("bottom-sheet-panel", "Compare cards", null, "BottomSheet Compare cards action")') && overlayScenario.includes('assertModalAccessibilityAbsent("bottom-sheet-panel", "Compare cards", null, "BottomSheet Compare cards action")') && overlayScenario.includes('assertTestIdVisible("overlay-bottom-sheet-trigger"') && (overlayScenario.match(/device\.pressBack\(\);/g) ?? []).length === 2 && !overlayScenario.includes('"Card actions"') && !overlayScenario.includes('"Quick actions"') && button.includes('accessibilityLabel={accessibilityLabel ?? label}')],
  ['Activity-root route targets remain on the ordinary Espresso root', activityRootHelper.includes('onViewInActivityRoot') && !activityRootHelper.includes('UiObject2') && !activityRootHelper.includes('By.') && android.includes('private void clickHomeRoute') && android.includes('clickTestId("home-route-" + route, label)')],
  ['overlay opening controls and existing Product testID owners remain unchanged', overlays.includes('testID="overlay-action-menu-trigger"') && overlays.includes('testID="card-action-menu"') && overlays.includes('testID="overlay-dialog-trigger"') && overlays.includes('testID="overlay-dialog-review-action"') && overlays.includes('testID="overlay-bottom-sheet-trigger"') && bottomSheet.includes('testID="bottom-sheet-panel"')],
  ['modal accessibility targets retain bounded unique visible-enabled polling and bounded disappearance', modalAccessibilityHelper.includes('matches.size() > 1') && modalAccessibilityHelper.includes('WAIT_MS / POLL_MS') && modalAccessibilityHelper.includes('Missing Android modal accessibility target') && modalAccessibilityHelper.includes('Rect visibleBounds = candidate.getVisibleBounds();') && modalAccessibilityHelper.includes('visibleBounds.width() > 0') && modalAccessibilityHelper.includes('visibleBounds.height() > 0') && modalAccessibilityHelper.includes('candidate.isEnabled()') && modalAbsentHelper.includes('WAIT_MS / POLL_MS') && modalAbsentHelper.includes('if (matches.isEmpty()) return;') && modalAbsentHelper.includes('device.waitForIdle(POLL_MS);') && modalAbsentHelper.includes('remained after dismissal') && !modalAccessibilityHelper.includes('sleep(') && !modalAbsentHelper.includes('sleep(') && !android.includes('Until.gone') && !android.includes('device.click(')],
  ['native Android certification retains all eight scenarios', nativeTestCount === 8],
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
