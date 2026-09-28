import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'android.certification.json'), 'utf8'));
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const referencePackage = JSON.parse(readFileSync(join(root, 'apps', 'reference', 'package.json'), 'utf8'));
const suitePath = join(root, 'tests', 'native', 'android', 'ExpoBaseAndroidNativeTest.java');
const suite = readFileSync(suitePath, 'utf8');
const workflowPath = join(root, '.github', 'workflows', 'android-native-certification.yml');
const workflow = readFileSync(workflowPath, 'utf8');
const androidRunnerPath = join(root, 'scripts', 'run-android-native-certification.mjs');
const androidRunner = readFileSync(androidRunnerPath, 'utf8');
const failures = [];

if (manifest.schemaVersion !== 1) failures.push(`Unsupported Android manifest schemaVersion ${manifest.schemaVersion}.`);
if (manifest.claim?.baseCommit !== '3eb76c5ea0bee26881326fc8f87c12f0cbc8ce73' || manifest.claim?.baseTree !== '23a3a6ba2511cd97fb7940b581feea0d52b55625') failures.push('Android evidence must bind the exact protected v1.1.0 base commit and tree.');
if (manifest.claim?.releaseVersionClaim !== null) failures.push('The Android candidate must not claim retroactive v1.1.0 certification.');
if (manifest.app?.applicationId !== 'com.expobase.reference' || manifest.app?.workspace !== 'apps/reference') failures.push('Android certification app identity is not the first-party reference application.');
if (manifest.app?.nativeProject !== 'fresh-clean-expo-cng' || manifest.app?.buildVariant !== 'release' || manifest.app?.javascript !== 'bundled-in-release-apk') failures.push('Android certification must build a fresh CNG release APK with bundled JavaScript.');
if (referencePackage.dependencies?.expo !== manifest.app.expoVersion || referencePackage.dependencies?.['react-native'] !== manifest.app.reactNativeVersion) failures.push('Android manifest Expo/RN versions do not match the current reference app.');
for (const evidenceId of ['summary', 'junit', 'logcat', 'home-screenshot', 'modal-screenshot', 'form-invalid-screenshot', 'server-state-error-screenshot', 'release-apk', 'native-identity', 'avd-profile-config', 'gradle-config']) {
  if (!manifest.evidenceRegistry?.[evidenceId]) failures.push(`Android evidence registry is missing required evidence ${evidenceId}.`);
}

if (!Array.isArray(manifest.profiles) || manifest.profiles.length === 0) failures.push('At least one semantic Android emulator profile is required.');
if (!Number.isInteger(manifest.buildExecution?.maxGradleWorkers) || manifest.buildExecution.maxGradleWorkers < 1 || manifest.buildExecution.maxGradleWorkers > 2) failures.push('Android Gradle worker concurrency must be explicitly bounded to one or two workers.');
if (!Number.isInteger(manifest.buildExecution?.minimumMetaspaceMb) || manifest.buildExecution.minimumMetaspaceMb < 1024) failures.push('Android Gradle must retain at least 1024 MB metaspace for release analysis.');
const profileIds = new Set();
for (const profile of manifest.profiles ?? []) {
  if (!profile.id || profileIds.has(profile.id)) failures.push(`Android profile IDs must be unique: ${profile.id ?? '<missing>'}.`);
  profileIds.add(profile.id);
  if (!profile.avdName || !profile.deviceProfile || !profile.manufacturer || !Number.isInteger(profile.apiLevel) || !profile.systemImage || !profile.architecture || !profile.locale || !Array.isArray(profile.orientations)) failures.push(`${profile.id ?? '<missing>'}: emulator, API, system image, device, manufacturer, architecture, locale, and orientation are required.`);
}

const expectedTests = manifest.instrumentation?.expectedTests;
if (!Array.isArray(expectedTests) || expectedTests.length === 0 || new Set(expectedTests).size !== expectedTests.length) failures.push('Instrumentation must declare a nonempty list of unique required test methods.');
for (const testName of expectedTests ?? []) {
  if (!suite.includes(`void ${testName}(`)) failures.push(`Instrumentation test method ${testName} is missing from the repository-owned suite.`);
}
const scenarios = manifest.scenarios ?? [];
if (scenarios.length !== expectedTests?.length) failures.push('Every required instrumentation method must have one risk scenario entry.');
const scenarioIds = new Set();
for (const scenario of scenarios) {
  if (!scenario.id || scenarioIds.has(scenario.id)) failures.push(`Android scenario IDs must be unique: ${scenario.id ?? '<missing>'}.`);
  scenarioIds.add(scenario.id);
  if (!expectedTests?.includes(scenario.test)) failures.push(`${scenario.id}: test is not in instrumentation.expectedTests.`);
  if (!Array.isArray(scenario.evidence) || scenario.evidence.length === 0) failures.push(`${scenario.id}: raw evidence references are required.`);
  for (const evidenceId of scenario.evidence ?? []) {
    if (!manifest.evidenceRegistry?.[evidenceId]) failures.push(`${scenario.id}: evidence ${evidenceId} is not registered.`);
  }
}

for (const selector of manifest.selectors ?? []) {
  if (!selector.id || !selector.owner || !selector.positiveControl || !selector.negativeControl) failures.push(`Selector ${selector.id ?? '<missing>'} needs an owner and runtime positive/negative controls.`);
  if (selector.owner && !existsSync(join(root, selector.owner))) failures.push(`${selector.id}: owner ${selector.owner} does not exist.`);
  if (selector.positiveControl && !suite.includes(`void ${selector.positiveControl}(`)) failures.push(`${selector.id}: positive-control test is not in the Android suite.`);
  if (!selector.negativeControl?.trim()) failures.push(`${selector.id}: negative control is required.`);
}

for (const [evidenceId, evidence] of Object.entries(manifest.evidenceRegistry ?? {})) {
  if (!evidence?.kind || !evidence?.path) failures.push(`Evidence ${evidenceId} needs a kind and durable path.`);
}
for (const requiredBoundary of ['talkback-review', 'physical-device-variance', 'release-and-production', 'v1.1.0']) {
  if (!manifest.boundaries?.some((boundary) => boundary.id === requiredBoundary)) failures.push(`Explicit claim boundary ${requiredBoundary} is missing.`);
}
if (manifest.boundaries?.some((boundary) => !boundary.status || !boundary.claim)) failures.push('Every Android claim boundary must state status and scope.');

const overlayOwner = readFileSync(join(root, 'apps', 'reference', 'app', 'overlays.tsx'), 'utf8');
for (const id of ['overlay-dialog-open', 'overlay-dialog-review', 'overlay-sheet-open', 'overlay-sheet-compare']) {
  if (!overlayOwner.includes(`testID="${id}"`)) failures.push(`Current reference overlay owner is missing ${id}.`);
}
if (!readFileSync(join(root, 'packages', 'navigation', 'src', 'NavigationItemButton.tsx'), 'utf8').includes('testID={`navigation-item-${item.key}`}')) failures.push('Primary navigation no longer owns the established navigation-item testID.');
if (!readFileSync(join(root, 'packages', 'forms', 'src', 'TextField.tsx'), 'utf8').includes('testID={testID ?? id}')) failures.push('TextField no longer exposes its established field ID through the shared owner.');
if (suite.includes('.isVisible(')) failures.push('UiObject2.isVisible() is not a supported API in the pinned UI Automator 2.3.0 contract.');
if (/androidTestImplementation\([^\n]*espresso|isDialog\(\)/i.test(suite)) failures.push('Android Modal oracle must not depend on Espresso dialog roots.');
if (!suite.includes('getVisibleBounds()') || !suite.includes('By.res(Pattern.compile')) failures.push('Android UI Automator selectors must use supported visibility bounds and exact native resource IDs.');
if (!suite.includes('device.pressBack()') || !suite.includes('UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())')) failures.push('Android suite must exercise system Back through repository-owned UI Automator instrumentation.');

const androidVerify = packageJson.scripts?.['android:verify'] ?? '';
if (!androidVerify.includes('check:android-certification') || !androidVerify.includes('test:android-certification') || !androidVerify.includes('run-android-native-certification.mjs')) failures.push('android:verify must run manifest validation, deterministic tests, and native certification.');
for (const required of ["'--clean'", "'--platform', 'android'", ':app:connectedReleaseAndroidTest', '`--max-workers=${manifest.buildExecution.maxGradleWorkers}`', 'ensureGradleMetaspace(', 'candidateIdentity()', 'generatedAndroidIdentity()', 'classifyAndroidRun(', 'parseAvdConfigIdentity(', 'resolveAndroidLocale(']) {
  if (!androidRunner.includes(required)) failures.push(`Android runner is missing required clean-generation/build/evidence behavior: ${required}.`);
}
if (packageJson.scripts?.['runtime:android'] !== 'node scripts/runtime-native.mjs android') failures.push('runtime:android must remain a distinct development-build command.');
if (!workflow.includes("'codex/**'") || !workflow.includes('pull_request:') || !workflow.includes('branches: [main]') || !workflow.includes('workflow_dispatch:')) failures.push('Android workflow must run on codex/** pushes, PRs to main, and support optional manual maintenance runs.');
if (!/uses:\s*actions\/checkout@v4[\s\S]*?fetch-depth:\s*0/.test(workflow)) failures.push('Android workflow must fetch full Git history to verify the protected base and release tag identity.');
if (!/uses:\s*android-actions\/setup-android@v3\s*\n\s*with:\s*\n\s*packages:\s*''/.test(workflow)) failures.push('Android SDK setup must skip the removed legacy tools package; the workflow installs the pinned SDK set explicitly.');
if (!workflow.includes('"$ANDROID_SDK_ROOT/emulator/emulator"')) failures.push('Android workflow must invoke the emulator from the installed SDK root, not assume it is on PATH.');
if (!workflow.includes('timeout 120s adb -e wait-for-device') || !workflow.includes('deadline=$((SECONDS + 360))')) failures.push('Android workflow must bound device connection and boot polling and collect startup diagnostics on timeout.');
if (!workflow.includes('sudo chown "$USER" /dev/kvm') || !workflow.includes('GitHub runner does not expose /dev/kvm')) failures.push('Android workflow must establish job-user KVM access and fail with a clear prerequisite diagnostic when KVM is absent.');
const requiredWorkflowPaths = [
  'android.certification.json', 'package.json', 'package-lock.json', 'apps/reference/**', 'tests/native/android/**',
  'scripts/android-certification-lib.mjs', 'scripts/check-android-certification.mjs', 'scripts/check-node-version.mjs',
  'scripts/generate-android-native-tests.mjs', 'scripts/run-android-native-certification.mjs', 'scripts/test-android-certification.mjs',
  ...['accessibility', 'adapters', 'auth', 'authorization', 'capabilities', 'components', 'data-display', 'device', 'feedback', 'form-rhf', 'forms', 'haptics', 'i18n', 'icons', 'layouts', 'linking', 'linking-expo', 'lists', 'local-auth', 'media', 'media-presentation', 'motion', 'navigation', 'navigation-router', 'notifications', 'observability', 'overlays', 'patterns', 'platform', 'preferences', 'primitives', 'runtime', 'runtime-capabilities', 'secure-storage', 'server-state', 'session-security', 'sharing', 'tokens', 'ui', 'updates', 'visualization', 'visualization-advanced'].map((name) => `packages/${name}/**`),
];
for (const path of requiredWorkflowPaths) {
  if (!workflow.includes(path)) failures.push(`Android workflow path filters omit ${path}.`);
}
if (workflow.includes('      - packages/**') || workflow.includes('      - scripts/**')) failures.push('Android workflow path filters must stay scoped to native-relevant packages and Android certification scripts.');
if (/if:.*codex\//.test(workflow)) failures.push('Android workflow must not contain a one-off branch-name execution exception.');
if (workflow.includes('merge_group:')) failures.push('Android lane must remain scoped to relevant pushes and pull requests.');

if (failures.length) {
  console.error(`Android certification contract failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Android certification contract passed: ${expectedTests.length} emulator scenarios, ${manifest.profiles.length} profile, ${manifest.selectors.length} observable selector contracts.`);
