import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

export function validateAndroidCertification({ manifest, source, generator, resolver, runner, contract }) {
  const failures = [];
  const allowedAutomation = new Set([
    'AUTOMATED_ANDROID_INSTRUMENTATION',
    'AUTOMATED_CONTRACT',
    'PHYSICAL_DEVICE_REQUIRED',
    'SUBJECTIVE_HUMAN_REVIEW',
    'DEVICE_SETTING_REQUIRED',
    'SIGNING_AND_COMMERCIAL_COMPLIANCE_REQUIRED',
    'PROVIDER_BACKEND_REQUIRED',
    'DEPLOYMENT_REQUIRED',
    'DOWNSTREAM_PRODUCT_REQUIRED',
  ]);
  const profileIds = new Set();
  const evidenceIds = new Set(Object.keys(manifest.evidenceRegistry ?? {}));
  const scenarioIds = new Set();

  if (manifest.schemaVersion !== 1) failures.push(`Unsupported schemaVersion: ${manifest.schemaVersion}`);
  if (!manifest.app?.bundleIdentifier || !manifest.app?.instrumentationRunner) failures.push('app.bundleIdentifier and app.instrumentationRunner are required.');
  if (manifest.app?.instrumentationRunner !== 'androidx.test.runner.AndroidJUnitRunner') failures.push('The first-party Android runner must be AndroidJUnitRunner.');
  if (manifest.app?.productLane !== 'Release bundled JavaScript') failures.push('The decisive product lane must be Release bundled JavaScript.');
  if (manifest.app?.smokeLane !== 'runtime:android development build') failures.push('runtime:android must remain a separately named development-build smoke lane.');
  if (!manifest.app?.resultRoot?.startsWith('test-results/android-native-certification')) failures.push('Android evidence must be written below the bounded result root.');
  if (!Array.isArray(manifest.profiles) || manifest.profiles.length === 0) failures.push('At least one Android emulator profile is required.');

  for (const profile of manifest.profiles ?? []) {
    if (!profile.id || profileIds.has(profile.id)) failures.push(`Android profile IDs must be unique: ${profile.id ?? '<missing>'}`);
    profileIds.add(profile.id);
    if (profile.platform !== 'Android Emulator' || !profile.deviceClass || !Number.isInteger(profile.apiLevel)) failures.push(`${profile.id ?? '<missing>'}: semantic platform, deviceClass, and apiLevel are required.`);
    if (!Array.isArray(profile.orientation) || !profile.orientation.includes('portrait') || !profile.orientation.includes('landscape')) failures.push(`${profile.id}: portrait and landscape are required.`);
    if (!Array.isArray(profile.locales) || !profile.locales.includes('en-XA') || !profile.locales.includes('en-XB')) failures.push(`${profile.id}: pseudo-locale coverage is required.`);
    if (!profile.headlessPreferred) failures.push(`${profile.id}: headlessPreferred must be true.`);
    for (const key of Object.keys(profile)) if (/serial|avd|udid|deviceid/i.test(key)) failures.push(`${profile.id}: machine-specific identity ${key} is forbidden in source.`);
  }

  if (!manifest.evidenceRegistry || typeof manifest.evidenceRegistry !== 'object') failures.push('evidenceRegistry is required.');
  for (const [evidenceId, evidence] of Object.entries(manifest.evidenceRegistry ?? {})) {
    if (!evidence?.kind) failures.push(`Evidence ${evidenceId} must declare kind.`);
    if (evidence?.path && !evidence.path.startsWith(manifest.app.resultRoot)) failures.push(`Evidence ${evidenceId} must remain under ${manifest.app.resultRoot}.`);
    if (evidence?.test && !source.includes(`public void ${evidence.test}(`)) failures.push(`Evidence ${evidenceId}: Java test ${evidence.test} is not present.`);
  }

  for (const scenario of manifest.scenarios ?? []) {
    if (!scenario.id || scenarioIds.has(scenario.id)) failures.push(`Scenario IDs must be unique: ${scenario.id ?? '<missing>'}`);
    scenarioIds.add(scenario.id);
    if (!allowedAutomation.has(scenario.automation)) failures.push(`${scenario.id}: unsupported automation disposition ${scenario.automation}`);
    if (!scenario.category || !scenario.route) failures.push(`${scenario.id}: category and route are required.`);
    if (scenario.automation === 'AUTOMATED_ANDROID_INSTRUMENTATION') {
      if (!scenario.test || !source.includes(`public void ${scenario.test}(`)) failures.push(`${scenario.id}: instrumentation test is missing.`);
      if (!Array.isArray(scenario.evidence) || scenario.evidence.length === 0) failures.push(`${scenario.id}: instrumentation scenarios require evidence references.`);
    }
    if (scenario.automation === 'AUTOMATED_CONTRACT') {
      if (!scenario.command || !Array.isArray(scenario.evidence) || scenario.evidence.length === 0) failures.push(`${scenario.id}: contract scenarios require command and evidence references.`);
    }
    for (const evidenceId of scenario.evidence ?? []) if (!evidenceIds.has(evidenceId)) failures.push(`${scenario.id}: evidence reference ${evidenceId} is not registered.`);
  }

  const requiredBoundaries = new Set(['ANDROID-PHYSICAL-HARDWARE', 'ANDROID-TALKBACK-USABILITY', 'ANDROID-FONT-SCALING', 'ANDROID-SIGNING-PLAY', 'ANDROID-PROVIDERS', 'ANDROID-DEPLOYMENT', 'ANDROID-DOWNSTREAM-PRODUCTS']);
  const boundaries = new Map((manifest.boundaries ?? []).map((boundary) => [boundary.id, boundary]));
  for (const id of requiredBoundaries) if (!boundaries.get(id)?.reason) failures.push(`Required Android boundary ${id} is missing a reason.`);
  for (const boundary of manifest.boundaries ?? []) if (!boundary.id || !allowedAutomation.has(boundary.automation) || !boundary.reason) failures.push(`Invalid boundary: ${boundary.id ?? '<missing>'}`);
  if (JSON.stringify(manifest).match(/UNCLASSIFIED|TODO|TBD/)) failures.push('Android certification contains unresolved classification placeholders.');

  for (const [label, text] of [['generator', generator], ['resolver', resolver], ['runner', runner], ['selector contract', contract]]) {
    if (!text) failures.push(`${label} source is required.`);
  }
  if (!runner.includes("expo', 'prebuild") || !runner.includes("'--clean'")) failures.push('Android runner must regenerate native output with fresh Expo prebuild --clean.');
  if (!generator.includes('androidTestImplementation') || !generator.includes('testInstrumentationRunner')) failures.push('Android generator must inject the instrumentation runner and dependencies.');
  if (!runner.includes('connectedReleaseAndroidTest')) failures.push('Android runner must use the release connected instrumentation lane.');
  if (!runner.includes('git') || !runner.includes('write-tree') || !runner.includes('provenance.json')) failures.push('Android runner must record candidate commit/tree provenance.');
  if (!runner.includes('743a8bbf8273f663503dc8dd398135806dccb386') || !runner.includes('2fda05146dabea9bd44756f7c8071228166d40c8')) failures.push('Android runner must enforce the exact authoritative candidate base commit/tree.');
  if (!runner.includes('logcat') || !runner.includes('detectAndroidRuntimeFailures')) failures.push('Android runner must capture diagnostics and fail on runtime markers.');
  if (!resolver.includes('ANDROID_SERIAL') || !resolver.includes('apiLevel')) failures.push('Android profile resolution must be semantic and allow only an environment override.');
  if (!contract.includes("tests', 'native', 'android'") || !source.includes('navigation-item-') || !source.includes('demo-name') || !source.includes('By.descContains')) failures.push('Shared native selector contract must cover Android semantic targets.');
  return failures;
}

function main() {
  const manifest = JSON.parse(readFileSync(join(root, 'android.certification.json'), 'utf8'));
  const read = (file) => readFileSync(join(root, file), 'utf8');
  const failures = validateAndroidCertification({
    manifest,
    source: read('tests/native/android/ExpoBaseNativeAndroidTest.java'),
    generator: read('scripts/generate-android-ui-test-project.mjs'),
    resolver: read('scripts/resolve-android-emulator.mjs'),
    runner: read('scripts/run-android-native-certification.mjs'),
    contract: read('scripts/check-native-ui-selector-contracts.mjs'),
  });
  if (failures.length) {
    console.error(`Android certification manifest failed with ${failures.length} issue(s):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`Android certification manifest passed: ${manifest.scenarios.length} scenarios, ${manifest.boundaries.length} explicit boundaries.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
