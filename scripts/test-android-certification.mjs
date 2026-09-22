import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { detectAndroidRuntimeFailures, primaryAndroidCertificationFailure } from './android-certification-lib.mjs';
import { validateAndroidCertification } from './check-android-certification-manifest.mjs';
import { certificationGradleJvmArgs, resolveAndroidGradleInvocation, withCertificationGradleJvmArgs } from './run-android-native-certification.mjs';
import { parseAdbDevices, parseGetprop, resolveAndroidProfile } from './resolve-android-emulator.mjs';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'android.certification.json'), 'utf8'));
const read = (file) => readFileSync(join(root, file), 'utf8');
const androidSource = read('tests/native/android/ExpoBaseNativeAndroidTest.java');
const pageHeaderSource = read('packages/layouts/src/PageHeader.tsx');
const pagePatternsSource = read('packages/patterns/src/PagePatterns.tsx');
const goldenSource = read('apps/reference/app/golden.tsx');
const formsSource = read('apps/reference/app/forms.tsx');
const overlaysSource = read('apps/reference/app/overlays.tsx');
const bottomSheetSource = read('packages/overlays/src/BottomSheet.tsx');
const menuSource = read('packages/overlays/src/Menu.tsx');
const buttonSource = read('packages/components/src/Button.tsx');
const serverStateSource = read('apps/reference/app/server-state.tsx');
const androidGenerator = read('scripts/generate-android-ui-test-project.mjs');
const workflow = read('.github/workflows/android-native-certification.yml');
const runner = read('scripts/run-android-native-certification.mjs');
const androidJob = workflow.slice(workflow.indexOf('  android-native:'));

const validFailures = validateAndroidCertification({
  manifest,
  source: androidSource,
  generator: read('scripts/generate-android-ui-test-project.mjs'),
  resolver: read('scripts/resolve-android-emulator.mjs'),
  runner: read('scripts/run-android-native-certification.mjs'),
  contract: read('scripts/check-native-ui-selector-contracts.mjs'),
});
assert.deepEqual(validFailures, [], 'The checked-in Android certification contract must validate.');
assert.match(workflow, /- name: Checkout candidate[\s\S]*?uses: actions\/checkout@v4[\s\S]*?with:[\s\S]*?fetch-depth: 0/);
assert.match(workflow, /repository: \$\{\{ github\.event_name == 'pull_request' && github\.event\.pull_request\.head\.repo\.full_name \|\| github\.repository \}\}/);
assert.match(workflow, /ref: \$\{\{ github\.event_name == 'pull_request' && github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
assert.ok(workflow.indexOf('ref: ${{') < workflow.indexOf('script: npm run android:verify'), 'Exact PR-head checkout must happen before android:verify.');
assert.ok(workflow.indexOf('fetch-depth: 0') < workflow.indexOf('script: npm run android:verify'), 'Android certification must obtain full Git history before android:verify.');
assert.ok(workflow.includes('github.event.pull_request.head.sha') && workflow.includes('github.sha'), 'Checkout must have exact pull-request-head and workflow-dispatch fallback expressions.');
assert.match(androidJob, /timeout-minutes:\s+75[\s\S]*script: npm run android:verify/, 'Android certification must retain a bounded 75-minute timeout on the job that runs android:verify.');
const kvmStep = workflow.indexOf('- name: Enable KVM group perms');
const javaSetup = workflow.indexOf('- name: Java 17');
const emulatorStep = workflow.indexOf('- name: Android emulator release certification');
assert.ok(javaSetup >= 0 && javaSetup < kvmStep && kvmStep < emulatorStep, 'Linux KVM preparation must run after Java setup and before the emulator runner.');
assert.match(workflow, /- name: Enable KVM group perms[\s\S]*?echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS\+="static_node=kvm"' \| sudo tee \/etc\/udev\/rules\.d\/99-kvm4all\.rules[\s\S]*?sudo udevadm control --reload-rules[\s\S]*?sudo udevadm trigger --name-match=kvm/);
assert.match(androidJob, /uses: reactivecircus\/android-emulator-runner@v2[\s\S]*?disable-animations:\s*false[\s\S]*?script: npm run android:verify/, 'The emulator action must leave post-boot animation mutations disabled.');
assert.equal((workflow.match(/script: npm run android:verify/g) ?? []).length, 1, 'Android certification must execute the candidate command exactly once.');
assert.ok(runner.includes('743a8bbf8273f663503dc8dd398135806dccb386'));
assert.ok(runner.includes('2fda05146dabea9bd44756f7c8071228166d40c8'));
assert.ok(runner.includes("git(['rev-parse', `${authoritativeBase}^{tree}`])"), 'Android certification must resolve the authoritative base tree.');
assert.ok(runner.includes("['merge-base', '--is-ancestor', authoritativeBase, 'HEAD']"), 'Android certification must retain the authoritative-base ancestry check.');

const generatedAndroidRoot = join(root, 'apps', 'reference', 'android');
assert.deepEqual(resolveAndroidGradleInvocation('linux'), { command: './gradlew', cwd: generatedAndroidRoot });
assert.deepEqual(resolveAndroidGradleInvocation('win32'), { command: 'gradlew.bat', cwd: generatedAndroidRoot });
assert.notEqual(resolveAndroidGradleInvocation('linux').cwd, root, 'Gradle must not run with repository-root cwd.');
assert.ok(runner.includes("{ cwd: gradleCwd, logFile: gradleLog"), 'Release instrumentation must run the generated Android wrapper from its project directory.');
assert.match(certificationGradleJvmArgs, /-XX:MaxMetaspaceSize=1g/);
assert.match(withCertificationGradleJvmArgs('org.gradle.parallel=true\n'), /org\.gradle\.parallel=true\norg\.gradle\.jvmargs=-Xmx2g -Dfile\.encoding=UTF-8 -XX:MaxMetaspaceSize=1g\n/);
assert.match(withCertificationGradleJvmArgs('org.gradle.jvmargs=-Xmx2g -XX:MaxMetaspaceSize=512m\n'), /org\.gradle\.jvmargs=-Xmx2g -XX:MaxMetaspaceSize=1g\n/);
assert.ok(!runner.match(/-x\s+lint/), 'Certification must not skip release lint.');
assert.ok(runner.includes('gradle.properties'), 'The bounded JVM adjustment must be scoped to the generated Android project.');
assert.ok(runner.includes('connectedReleaseAndroidTest'), 'The release instrumentation task must remain the decisive Gradle path.');

const gradleInvocation = runner.indexOf('gradleStatus = run(');
const evidenceCollection = runner.indexOf('certificationEvidence = collectCertificationEvidence(', gradleInvocation);
const gradleFailureCheck = runner.indexOf('if (gradleStatus !== 0)', gradleInvocation);
assert.ok(gradleInvocation >= 0 && evidenceCollection > gradleInvocation && gradleFailureCheck > evidenceCollection, 'Gradle status must be checked after best-effort evidence collection.');
assert.ok(runner.includes('failureArtifacts(certificationEvidence, gradleLog)'), 'Failure summaries must retain collected JUnit/APK/screenshot/logcat evidence.');
assert.ok(runner.includes('required logcat evidence could not be collected'), 'A successful Gradle run must fail closed when required logcat evidence is missing.');
assert.ok(runner.includes('primaryAndroidCertificationFailure') && runner.includes('evidenceCollectionErrors') && runner.includes('if (result.status !== 0) throw new Error'), 'Evidence collection failures must remain separate from the primary instrumentation result.');

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
assert.ok(pageHeaderSource.includes("testID = 'page-header-title'") && pageHeaderSource.includes('<Text variant="h1" testID={testID}>'), 'PageHeader must own the deterministic native title selector.');
assert.ok(pagePatternsSource.includes('testID?: string | undefined') && pagePatternsSource.includes('{ testID }'), 'Golden patterns must forward PageHeader selector ownership.');
assert.ok(goldenSource.includes("testID:'golden-page-header-title'"), 'Golden Dashboard must receive stable PageHeader selector ownership.');
assert.ok(androidGenerator.includes("androidTestImplementation 'androidx.test.espresso:espresso-core:3.6.1'"), 'Generated Android instrumentation must include the aligned Espresso dependency.');
assert.ok(androidGenerator.includes("androidx.test.uiautomator:uiautomator:2.3.0"), 'Modal accessibility must use the existing UiAutomator 2.3.0 dependency.');
assert.ok(androidSource.includes('import static org.hamcrest.Matchers.allOf;') && !androidSource.includes('import static androidx.test.espresso.matcher.ViewMatchers.allOf;'), 'Android allOf must import the Hamcrest matcher combinator.');
assert.ok(!androidSource.includes('doesNotExist()') && !androidSource.includes('import static androidx.test.espresso.matcher.ViewMatchers.doesNotExist;'), 'Android modal disappearance must not depend on Espresso doesNotExist.');
assert.ok(androidSource.includes('withTagValue') && androidSource.includes('is((Object) id)') && androidSource.includes('testIdMatcher'), 'Android app-owned testIDs must match the ordinary React Native View tag.');
assert.ok(androidSource.includes('launchReleaseProduct') && androidSource.includes('assertTestIdVisible("home-adaptive-section-header"'), 'Android launch must prove home through a stable testID landmark.');
assert.ok(androidSource.includes('assertTestIdVisible("home-metric-group"'), 'Android home scroll must use the existing metric-group testID.');
assert.ok(appOwnedTestIds.every((id) => androidSource.includes(id)), 'Every decisive app-owned Android target must retain its existing testID.');
assert.ok(!androidSource.includes('assertText(') && !androidSource.includes('findSemanticText(') && !androidSource.includes('hasText('), 'Decisive Android route assertions must not use generic display-text helpers.');
assert.ok(androidSource.includes('assertTestIdVisible') && androidSource.includes('clickTestId') && androidSource.includes('replaceTextTestId') && androidSource.includes('assertTestIdTextContains'), 'Decisive Android interactions must use Espresso testID helpers.');
const identityMatcherStart = androidSource.indexOf('private Matcher<View> testIdMatcher');
const identityMatcherEnd = androidSource.indexOf('private Matcher<View> visibleTestIdMatcher');
const testIdIdentity = androidSource.slice(identityMatcherStart, identityMatcherEnd);
const testIdHelperStart = androidSource.indexOf('private ViewInteraction scrollToTestId');
const accessibleHelperStart = androidSource.indexOf('private void clickAccessibleTarget');
const modalAccessibilityHelperStart = androidSource.indexOf('private UiObject2 requireUniqueModalAccessibilityTarget');
const testIdReachabilityHelper = androidSource.slice(testIdHelperStart, accessibleHelperStart);
const accessibleReachabilityHelper = androidSource.slice(accessibleHelperStart, modalAccessibilityHelperStart);
const formScenarioStart = androidSource.indexOf('public void formInputKeyboardAndValidation');
const formScenarioEnd = androidSource.indexOf('public void touchScrollReachesHomeContent');
const formScenario = androidSource.slice(formScenarioStart, formScenarioEnd);
const replaceTextHelperStart = androidSource.indexOf('private void replaceTextTestId');
const replaceTextHelperEnd = androidSource.indexOf('private void assertTestIdTextContains');
const replaceTextHelper = androidSource.slice(replaceTextHelperStart, replaceTextHelperEnd);
const overlayScenarioStart = androidSource.indexOf('public void overlayLifecycleAndSystemBack');
const overlayScenarioEnd = androidSource.indexOf('public void flagshipDataAndServerStateRoutes');
const overlayScenario = androidSource.slice(overlayScenarioStart, overlayScenarioEnd);
const modalAccessibilityHelperEnd = androidSource.indexOf('private Matcher<View> accessibleTargetMatcher');
const modalAccessibilityHelper = androidSource.slice(modalAccessibilityHelperStart, modalAccessibilityHelperEnd);
const modalAbsentHelperStart = androidSource.indexOf('private void assertModalAccessibilityAbsent');
const modalAbsentHelperEnd = androidSource.indexOf('private void clickHomeRoute');
const modalAbsentHelper = androidSource.slice(modalAbsentHelperStart, modalAbsentHelperEnd);
const absentTargetBranchStart = testIdReachabilityHelper.indexOf('catch (NoMatchingViewException | AssertionError failure)');
const absentTargetBranchEnd = testIdReachabilityHelper.indexOf('      try {', absentTargetBranchStart);
const absentTargetBranch = testIdReachabilityHelper.slice(absentTargetBranchStart, absentTargetBranchEnd);
assert.ok(testIdIdentity.includes('view.isShown()') && testIdIdentity.includes('getWidth() > 0') && testIdIdentity.includes('getHeight() > 0'), 'Regression: zero-size hidden duplicate testIDs must not be identity candidates.');
assert.ok(!testIdIdentity.includes('isDisplayed()') && !testIdIdentity.includes('isEnabled()'), 'Regression: partially visible and disabled targets must remain discoverable before action readiness.');
assert.ok(androidSource.includes('visibleTestIdMatcher') && androidSource.includes('allOf(testIdMatcher(id), isDisplayed())'), 'Regression: ordinary visibility must remain distinct from click readiness.');
assert.ok(androidSource.includes('allOf(testIdMatcher(id), isDisplayingAtLeast(90), isEnabled())') && androidSource.includes('scrollToTestId(id, description, clickReadyTestIdMatcher(id)).perform(click())') && androidSource.includes('target.check(matches(readinessMatcher))'), 'Regression: click readiness must match Espresso\'s 90-percent enabled constraint.');
assert.ok(replaceTextHelper.includes('replaceText(value), closeSoftKeyboard()') && formScenario.includes('replaceTextTestId("demo-name"') && formScenario.includes('assertTestIdVisible("adapter-form-sections"') && !formScenario.includes('device.pressBack()'), 'Regression: Forms must not press system Back after replaceTextTestId has already closed the IME.');
assert.ok(absentTargetBranch.includes('device.waitForIdle(POLL_MS);') && absentTargetBranch.includes('continue;') && !absentTargetBranch.includes('noProgressAttempts') && androidSource.includes('MAX_SCROLL_ATTEMPTS'), 'Regression: delayed route targets after navigation must receive the full bounded absence wait.');
assert.ok(overlayScenario.includes('clickTestId("overlay-action-menu-trigger"') && overlayScenario.includes('UiObject2 editCardAction = assertModalAccessibilityVisible("card-action-menu", "Edit card", null, "Edit card action");') && overlayScenario.includes('editCardAction.click();') && overlayScenario.includes('assertModalAccessibilityAbsent("card-action-menu", "Edit card", null, "Edit card action");') && !overlayScenario.includes('"Card actions"') && !overlayScenario.includes('"Quick actions"'), 'Regression: ActionMenu runtime presence and dismissal must use the unique actionable Edit card label, not a container or title landmark.');
assert.ok(testIdReachabilityHelper.indexOf('target.check(matches(readinessMatcher))') < testIdReachabilityHelper.indexOf('requestTestIdRectangleOnScreen(id)') && androidSource.includes('requestRectangleOnScreen(new Rect(0, 0, view.getWidth(), view.getHeight()), false') && androidSource.includes('instanceof ScrollView'), 'Regression: present targets must use exact target-directed rectangle requests through the owning React Native ScrollView.');
assert.ok(androidSource.includes('requestTestIdRectangleOnScreen(id)') && androidSource.includes('MAX_NO_PROGRESS_ATTEMPTS') && androidSource.includes('noProgressAttempts'), 'Regression: present targets that cannot move must fail closed on bounded no-progress attempts.');
assert.ok(!testIdReachabilityHelper.includes('swipeUp') && !testIdReachabilityHelper.includes('device.swipe('), 'Regression: generic testID reachability must not use blind full-surface or coordinate swipes.');
assert.ok(!androidSource.includes('By.res(') && !androidSource.includes('Missing Android resource-id target') && !androidSource.includes('scrollToStableResource'), 'React Native testIDs must not return to Android resource-id lookup.');
assert.ok(androidSource.includes('clickAccessibleTarget') && androidSource.includes('scrollToAccessibleTarget') && androidSource.includes('withContentDescription') && androidSource.includes('withText(containsString(text))'), 'Only id-less convenience interactions may use the text/content-description fallback.');
assert.ok(accessibleReachabilityHelper.includes('requestAccessibleRectangleOnScreen(description, text)') && androidSource.includes('onView(targetMatcher)') && androidSource.includes('hasReactNativeScrollSurface') && !accessibleReachabilityHelper.includes('By.') && !accessibleReachabilityHelper.includes('UiObject2'), 'Regression: off-screen id-less targets must use the actual React Native ScrollView through Espresso, not UI Automator scrollability.');
assert.ok(!androidSource.includes('By.scrollable(true)') && !androidSource.includes('Direction.DOWN') && !androidSource.includes('surface.scroll('), 'Id-less reachability must not depend on a UI Automator scroll surface.');
assert.ok(androidSource.includes('device.setOrientationLeft()') && androidSource.includes('device.pressBack()') && androidSource.includes('device.swipe(') && androidSource.includes('device.takeScreenshot('), 'UI Automator must remain for device/system behavior and evidence.');
const touchScenarioStart = androidSource.indexOf('public void touchScrollReachesHomeContent');
const touchScenarioEnd = androidSource.indexOf('public void orientationRoundTripPreservesHome');
const touchScenario = androidSource.slice(touchScenarioStart, touchScenarioEnd);
const helperStart = androidSource.indexOf('private ViewInteraction scrollToTestId');
assert.ok(touchScenario.includes('device.swipe(') && !androidSource.slice(helperStart).includes('device.swipe('), 'Coordinate swipes must remain limited to the explicit touch certification scenario.');
assert.ok(formsSource.includes('testID="adapter-form-error-summary"') && androidSource.includes('assertTestIdVisible("adapter-form-error-summary"') && androidSource.includes('assertTestIdVisible("demo-email-error"') && androidSource.includes('replaceTextTestId("demo-name"') && !androidSource.includes('Enter your email.'), 'Form input and validation must use stable testID ownership.');
assert.ok(overlaysSource.includes('testID="overlay-action-menu-trigger"') && overlaysSource.includes('testID="card-action-menu"') && overlaysSource.includes('testID="overlay-dialog-trigger"') && overlaysSource.includes('testID="overlay-dialog-review-action"') && overlaysSource.includes('testID="overlay-bottom-sheet-trigger"') && bottomSheetSource.includes('testID="bottom-sheet-panel"'), 'Overlay reference and shared BottomSheet Product testID owners must remain present.');
assert.ok(overlaysSource.includes("label: 'Edit card'") && menuSource.includes('accessibilityLabel={label}') && overlaysSource.includes('label={copy(\'Review\')}') && buttonSource.includes('accessibilityLabel={accessibilityLabel ?? label}') && overlaysSource.includes('label="Compare cards"'), 'ActionMenu, Dialog, and BottomSheet child actions must retain their explicit accessible labels.');
assert.ok(!androidSource.includes('RootMatchers.isDialog') && !androidSource.includes('isDialog()') && !androidSource.includes('NoMatchingRootException') && !androidSource.includes('Matcher<Root>') && !androidSource.includes('import androidx.test.espresso.Root;') && modalAccessibilityHelper.includes('UiObject2') && modalAccessibilityHelper.includes('By.descContains') && modalAccessibilityHelper.includes('By.textContains') && modalAccessibilityHelper.includes('device.findObjects') && !modalAccessibilityHelper.includes('.isVisible()') && modalAccessibilityHelper.includes('Rect visibleBounds = candidate.getVisibleBounds();') && modalAccessibilityHelper.includes('visibleBounds.width() > 0') && modalAccessibilityHelper.includes('visibleBounds.height() > 0') && modalAccessibilityHelper.includes('candidate.isEnabled()'), 'Regression: React Native Modal content must use active-window UI Automator bounds and enabled readiness semantics.');
assert.ok(overlayScenario.includes('clickTestId("overlay-dialog-trigger"') && overlayScenario.includes('assertModalAccessibilityVisible("overlay-dialog-review-action", "Review", null, "Dialog Review action")') && overlayScenario.includes('device.pressBack();') && overlayScenario.includes('assertModalAccessibilityAbsent("overlay-dialog-review-action", "Review", null, "Dialog Review action")') && overlayScenario.includes('assertTestIdVisible("overlay-dialog-trigger"') && overlayScenario.includes('clickTestId("overlay-bottom-sheet-trigger"') && overlayScenario.includes('assertModalAccessibilityVisible("bottom-sheet-panel", "Compare cards", null, "BottomSheet Compare cards action")') && overlayScenario.includes('assertModalAccessibilityAbsent("bottom-sheet-panel", "Compare cards", null, "BottomSheet Compare cards action")') && overlayScenario.includes('assertTestIdVisible("overlay-bottom-sheet-trigger"') && (overlayScenario.match(/device\.pressBack\(\);/g) ?? []).length === 2 && !overlayScenario.includes('"Card actions"') && !overlayScenario.includes('"Quick actions"'), 'Regression: Dialog and BottomSheet system Back dismissal must use unique actionable child accessibility labels, not container or title landmarks.');
assert.ok(modalAccessibilityHelper.includes('matches.size() > 1') && modalAccessibilityHelper.includes('WAIT_MS / POLL_MS') && modalAccessibilityHelper.includes('Missing Android modal accessibility target') && modalAbsentHelper.includes('WAIT_MS / POLL_MS') && modalAbsentHelper.includes('if (matches.isEmpty()) return;') && modalAbsentHelper.includes('device.waitForIdle(POLL_MS);') && modalAbsentHelper.includes('remained after dismissal') && !modalAccessibilityHelper.includes('sleep(') && !modalAbsentHelper.includes('sleep(') && !androidSource.includes('device.click(') && !androidSource.includes('Until.gone'), 'Overlay lifecycle must fail closed on ambiguity, persistent presence, and persistent absence with bounded polling.');
assert.equal((androidSource.match(/@Test\s+public void/g) ?? []).length, 8, 'All eight native scenarios must remain covered.');
assert.ok(androidSource.includes('private ViewInteraction scrollToTestId(String id, String description)') && androidSource.includes('visibleTestIdMatcher(id)') && androidSource.includes('onViewInActivityRoot') && androidSource.includes('private void clickHomeRoute') && androidSource.includes('clickTestId("home-route-" + route, label)'), 'Regression: ordinary activity-root route targets must remain Espresso/testID-owned.');
assert.ok(androidSource.includes('analytics-page-header-title') && androidSource.includes('finance-page-header-title') && androidSource.includes('monitoring-page-header-title'), 'Flagship route identity must use governed PageHeader testIDs.');
assert.ok(serverStateSource.includes('testID="server-state-refresh"') && androidSource.includes('server-state-load-count') && androidSource.includes('server-state-refresh') && androidSource.includes('server-state-mutation-count'), 'Server-state acceptance must use stable count and control selectors.');
assert.ok(androidSource.includes('assertTestIdTextContains("runtime-settings-status"') && androidSource.includes('assertTestIdTextContains("runtime-locale-status"') && !androidSource.includes('getText()'), 'Runtime status text must be asserted through Espresso matchers on the testID-tagged views.');
assert.ok(!androidSource.includes('Expected Android text was not rendered') && !androidSource.includes('SystemClock') && !androidSource.includes('By.res('), 'The failed R5 generic display-text and R7 resource-id strategies must not silently return.');

const devices = parseAdbDevices(`List of devices attached
emulator-5554 device product:sdk_gphone_x86_64 model:Pixel_7 transport_id:1
physical-serial device product:generic model:phone transport_id:2
`);
assert.equal(devices.length, 2);
assert.equal(devices[0].isEmulator, true);
assert.equal(devices[1].isEmulator, false);
const properties = parseGetprop('[ro.build.version.sdk]: [35]\n[ro.product.model]: [Pixel_7]\n[ro.boot.qemu.avd_name]: [semantic-api-35]\n');
const resolved = resolveAndroidProfile(manifest.profiles[0], [{ ...devices[0], apiLevel: properties['ro.build.version.sdk'], model: properties['ro.product.model'], avdName: properties['ro.boot.qemu.avd_name'], abi: 'x86_64' }]);
assert.equal(resolved.profileId, 'standard-phone-api-35');
assert.equal(resolved.serial, 'emulator-5554');
assert.throws(() => resolveAndroidProfile(manifest.profiles[0], [{ ...devices[0], apiLevel: '34' }]), /No Android emulator matches/);
assert.throws(() => resolveAndroidProfile(manifest.profiles[0], [{ ...devices[0], apiLevel: '35' }], 'emulator-9999'), /ANDROID_SERIAL=emulator-9999/);

const runtimeFailures = detectAndroidRuntimeFailures([
  'I ExpoBase: test completed',
  'E AndroidRuntime: FATAL EXCEPTION: main',
  'E AndroidRuntime: Process: com.expobase.reference, PID: 1234',
  'E ActivityManager: ANR in com.expobase.reference',
  'E ReactNativeJS: TypeError: broken',
].join('\n'));
assert.equal(runtimeFailures.length, 3);
assert.deepEqual(detectAndroidRuntimeFailures([
  'E ActivityManager: ANR in com.android.phone',
  'E ActivityManager: ANR in com.android.launcher3',
  'E ActivityManager: ANR in com.android.documentsui',
  'E ActivityManager: ANR in com.android.providers.media.module',
].join('\n')), [], 'Unrelated system-process ANRs must not fail the tested application.');
assert.deepEqual(detectAndroidRuntimeFailures([
  'E AndroidRuntime: FATAL EXCEPTION: main',
  'E AndroidRuntime: Process: com.android.phone, PID: 22',
].join('\n')), [], 'Unrelated system-process fatal blocks must not fail the tested application.');
assert.equal(detectAndroidRuntimeFailures([
  'E AndroidRuntime: FATAL EXCEPTION: main',
  'E AndroidRuntime: Process: com.expobase.reference, PID: 1234',
].join('\n')).length, 1, 'Target-application fatal blocks must fail closed.');
assert.equal(detectAndroidRuntimeFailures('E com.expobase.reference: uncaught exception in release runtime').length, 1);
assert.equal(detectAndroidRuntimeFailures('E Instrumentation: instrumentation failed: target crashed').length, 1);
assert.deepEqual(detectAndroidRuntimeFailures('I ExpoBase: clean release run'), []);
assert.equal(
  primaryAndroidCertificationFailure({ gradleStatus: 17, fallbackFailure: 'secondary failure', evidenceCollectionErrors: ['logcat: adb unavailable'] }),
  'Android instrumentation failed with exit 17. Evidence collection incomplete: logcat: adb unavailable',
  'A Gradle/instrumentation failure must remain primary when evidence collection also fails.',
);
assert.equal(
  primaryAndroidCertificationFailure({ gradleStatus: 0, fallbackFailure: 'required logcat evidence could not be collected.', evidenceCollectionErrors: ['logcat: adb unavailable'] }),
  'required logcat evidence could not be collected. Evidence collection incomplete: logcat: adb unavailable',
  'A successful Gradle run must still fail closed when required evidence is missing.',
);

const machineBoundManifest = structuredClone(manifest);
machineBoundManifest.profiles[0].serial = 'emulator-5554';
const machineBoundFailures = validateAndroidCertification({
  manifest: machineBoundManifest,
  source: androidSource,
  generator: read('scripts/generate-android-ui-test-project.mjs'),
  resolver: read('scripts/resolve-android-emulator.mjs'),
  runner: read('scripts/run-android-native-certification.mjs'),
  contract: read('scripts/check-native-ui-selector-contracts.mjs'),
});
assert.ok(machineBoundFailures.some((failure) => failure.includes('machine-specific identity serial')));

console.log('Android certification tests passed: manifest, runner contracts, semantic profile resolution, and fail-closed diagnostics.');
