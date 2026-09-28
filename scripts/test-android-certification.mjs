import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { classifyAndroidRun, ensureGradleMetaspace, parseAvdConfigIdentity, parseJUnitReports, resolveAndroidLocale, resolveAndroidProfile, validateAndroidDevice } from './android-certification-lib.mjs';
import { prepareAndroidNativeTests } from './generate-android-native-tests.mjs';

const manifest = JSON.parse(readFileSync(new URL('../android.certification.json', import.meta.url), 'utf8'));
const expectedTests = manifest.instrumentation.expectedTests;
const androidSuite = readFileSync(new URL('../tests/native/android/ExpoBaseAndroidNativeTest.java', import.meta.url), 'utf8');
const defaultProfile = resolveAndroidProfile(manifest);
assert.equal(defaultProfile.id, 'pixel-6-api-35-google-apis-x86_64');
assert.deepEqual(resolveAndroidProfile(manifest, defaultProfile.id), defaultProfile);
assert.throws(() => resolveAndroidProfile(manifest, 'missing-profile'), /Unknown Android certification profile/);
assert.throws(() => resolveAndroidProfile({ profiles: [{ id: 'duplicate' }, { id: 'duplicate' }] }), /unique/);
assert.throws(() => resolveAndroidProfile({ profiles: [] }), /no emulator profiles/);
const formErrorSelector = manifest.selectors.find(({ id }) => id === 'form-validation-error-action');
assert.ok(formErrorSelector && androidSuite.includes(`By.desc(${JSON.stringify(formErrorSelector.value)})`), 'Form selector manifest must identify the runtime accessibility action exercised by the suite.');
const lifecycleRouteSelector = manifest.selectors.find(({ id }) => id === 'lifecycle-data-route-landmark');
assert.ok(lifecycleRouteSelector && androidSuite.includes(`By.text(${JSON.stringify(lifecycleRouteSelector.value)})`), 'Lifecycle selector manifest must identify the route landmark exercised by the suite.');
assert.deepEqual(parseAvdConfigIdentity(`avd.ini.encoding=UTF-8\nhw.device.name = pixel_6\nimage.sysdir.1 = system-images/android-35/google_apis/x86_64/\n`), {
  configuredDeviceProfile: 'pixel_6',
  configuredSystemImage: 'system-images/android-35/google_apis/x86_64/',
});
assert.deepEqual(parseAvdConfigIdentity(`hw.device.name: pixel_6\nimage.sysdir.1: system-images/android-35/google_apis/x86_64/\n`), {
  configuredDeviceProfile: 'pixel_6',
  configuredSystemImage: 'system-images/android-35/google_apis/x86_64/',
});
assert.equal(resolveAndroidLocale({ persistedLocale: 'null', systemLocales: 'null', productLocale: 'en-US' }), 'en-US');
assert.equal(resolveAndroidLocale({ persistedLocale: 'fr-FR,en-US', systemLocales: 'en-US', productLocale: 'en-US' }), 'fr-FR');
assert.equal(resolveAndroidLocale({ persistedLocale: 'null', systemLocales: '', productLocale: '' }), '');
const cngGradleProperties = 'org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m\norg.gradle.parallel=true\n';
const boundedGradle = ensureGradleMetaspace(cngGradleProperties, 1024);
assert.equal(boundedGradle.metaspaceMb, 1024);
assert.match(boundedGradle.properties, /-XX:MaxMetaspaceSize=1024m/);
assert.equal(ensureGradleMetaspace(boundedGradle.properties, 1024).properties, boundedGradle.properties, 'Gradle memory setup must be deterministic and idempotent.');
assert.equal(ensureGradleMetaspace('org.gradle.jvmargs=-Xmx2g -XX:MaxMetaspaceSize=1536m\n', 1024).metaspaceMb, 1536, 'A larger generated limit must be retained.');
assert.throws(() => ensureGradleMetaspace('org.gradle.parallel=true\n', 1024), /no org.gradle.jvmargs/);
assert.throws(() => ensureGradleMetaspace('org.gradle.jvmargs=-Xmx2048m\n', 1024), /no explicit MaxMetaspaceSize/);
assert.throws(() => ensureGradleMetaspace(cngGradleProperties, 0), /positive integer/);
const validDevice = {
  apiLevel: String(defaultProfile.apiLevel),
  avdName: defaultProfile.avdName,
  configuredDeviceProfile: 'Pixel 6',
  configuredSystemImage: 'system-images/android-35/google_apis/x86_64/',
  manufacturer: 'Google',
  isEmulator: '1',
  cpuAbi: defaultProfile.architecture,
  locale: 'en-US',
};
assert.deepEqual(validateAndroidDevice(defaultProfile, validDevice), []);
for (const invalidDevice of [
  { ...validDevice, apiLevel: '34' },
  { ...validDevice, avdName: 'Different_AVD' },
  { ...validDevice, configuredDeviceProfile: 'Pixel 7' },
  { ...validDevice, configuredSystemImage: 'system-images/android-34/google_apis/x86_64/' },
  { ...validDevice, manufacturer: 'Unknown' },
  { ...validDevice, isEmulator: '0' },
  { ...validDevice, cpuAbi: 'arm64-v8a' },
  { ...validDevice, locale: '' },
  { ...validDevice, locale: 'fr-FR' },
]) assert.notEqual(validateAndroidDevice(defaultProfile, invalidDevice).length, 0, `Runner accepted an invalid emulator profile: ${JSON.stringify(invalidDevice)}`);

const passingXml = `<testsuite name="native" tests="2" failures="0" errors="0" skipped="0"><testcase classname="Native" name="first"/><testcase classname="Native" name="second"/></testsuite>`;
assert.deepEqual(parseJUnitReports([passingXml]), {
  tests: 2,
  failures: 0,
  errors: 0,
  skipped: 0,
  cases: [{ name: 'first', className: 'Native' }, { name: 'second', className: 'Native' }],
  failureDetails: [],
  errorDetails: [],
  skippedCases: [],
  reportCount: 1,
});
assert.throws(() => parseJUnitReports(['<broken/>']), /no testsuite/);

const goodReport = `<testsuite name="native" tests="${expectedTests.length}" failures="0" errors="0" skipped="0">${expectedTests.map((name) => `<testcase classname="Native" name="${name}"/>`).join('')}</testsuite>`;
const passing = classifyAndroidRun({ buildExitCode: 0, junitReports: [goodReport], expectedTests });
assert.equal(passing.passed, true);
assert.equal(passing.crashDisposition, 'no-fatal-exception-anr-or-uncaught-js-marker');

const failedReport = goodReport.replace('failures="0"', 'failures="1"').replace('<testcase classname="Native" name="' + expectedTests[0] + '"/>', `<testcase classname="Native" name="${expectedTests[0]}"><failure message="selector missing"/></testcase>`);
assert.deepEqual(parseJUnitReports([failedReport]).failureDetails, [{ name: expectedTests[0], className: 'Native', message: 'selector missing', details: '' }]);
const crashedInstrumentationReport = `${goodReport}<system-err>Test run failed to complete. Instrumentation run failed due to Process crashed.</system-err>`;
const crashedInstrumentation = classifyAndroidRun({ buildExitCode: 0, junitReports: [crashedInstrumentationReport], expectedTests });
assert.equal(crashedInstrumentation.passed, false, 'JUnit runner process crash must fail even if no testcase failure or fatal logcat marker was extracted.');
assert.equal(crashedInstrumentation.crashDisposition, 'failed-instrumentation-process-crash');
assert.ok(crashedInstrumentation.failures.some(({ layer }) => layer === 'runtime-crash-or-anr'));
for (const input of [
  { buildExitCode: 1, junitReports: [goodReport] },
  { buildExitCode: 0, junitReports: [] },
  { buildExitCode: 0, junitReports: [failedReport] },
  { buildExitCode: 0, junitReports: [goodReport.replace('skipped="0"', 'skipped="1"')] },
  { buildExitCode: 0, junitReports: [goodReport.replace('errors="0"', 'errors="1"')] },
  { buildExitCode: 0, junitReports: [goodReport.replace(expectedTests[0], 'wrong-test')] },
  { buildExitCode: 0, junitReports: [goodReport], logcat: 'E AndroidRuntime: FATAL EXCEPTION: main' },
  { buildExitCode: 0, junitReports: [goodReport], logcat: 'ActivityManager: ANR in com.expobase.reference' },
  { buildExitCode: 0, junitReports: [goodReport], logcat: 'E ReactNativeJS: TypeError: uncaught failure' },
  { buildExitCode: 0, junitReports: [goodReport], identityErrors: ['candidate SHA mismatch'] },
  { buildExitCode: 0, junitReports: [goodReport], missingEvidence: ['screenshots/dialog-open.png'] },
]) {
  assert.equal(classifyAndroidRun({ expectedTests, ...input }).passed, false, `Runner accepted invalid evidence: ${JSON.stringify(input)}`);
}

const fixture = mkdtempSync(join(tmpdir(), 'expo-base-android-generator-'));
try {
  const fixtureApp = join(fixture, 'app');
  mkdirSync(fixtureApp, { recursive: true });
  const gradlePath = join(fixtureApp, 'build.gradle');
  const sourcePath = join(fixture, 'ExpoBaseAndroidNativeTest.java');
  writeFileSync(gradlePath, `android {\n    namespace 'com.expobase.reference'\n    defaultConfig {\n        applicationId 'com.expobase.reference'\n    }\n}\ndependencies {\n    implementation("com.facebook.react:react-android")\n}\n`);
  writeFileSync(sourcePath, 'package com.expobase.reference.certification;\n');

  const first = prepareAndroidNativeTests(fixture, sourcePath);
  const generatedOnce = readFileSync(gradlePath, 'utf8');
  const generatedSource = readFileSync(first.testDestination, 'utf8');
  const second = prepareAndroidNativeTests(fixture, sourcePath);
  const generatedTwice = readFileSync(gradlePath, 'utf8');
  assert.equal(generatedTwice, generatedOnce, 'Android test generation must be idempotent.');
  assert.equal(generatedSource, 'package com.expobase.reference.certification;\n');
  assert.equal(second.runner, 'androidx.test.runner.AndroidJUnitRunner');
  assert.equal(second.testBuildType, 'release');
  assert.equal((generatedTwice.match(/testInstrumentationRunner/g) ?? []).length, 1);
  assert.equal((generatedTwice.match(/testBuildType "release"/g) ?? []).length, 1);
  for (const dependency of ['androidx.test:runner:1.6.2', 'androidx.test.ext:junit:1.2.1', 'androidx.test.uiautomator:uiautomator:2.3.0']) {
    assert.equal((generatedTwice.match(new RegExp(dependency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length, 1, `${dependency} must be injected once.`);
  }
  assert.throws(() => prepareAndroidNativeTests(join(fixture, 'missing'), sourcePath), /not found/);
  assert.throws(() => prepareAndroidNativeTests(fixture, join(fixture, 'missing.java')), /source is missing/);
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

console.log(`Android certification tests passed: manifest/profile resolution, Gradle resource configuration, generator idempotency, JUnit extraction, and 11 fail-closed evidence controls.`);
