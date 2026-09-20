import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { detectAndroidRuntimeFailures } from './android-certification-lib.mjs';
import { validateAndroidCertification } from './check-android-certification-manifest.mjs';
import { certificationGradleJvmArgs, resolveAndroidGradleInvocation, withCertificationGradleJvmArgs } from './run-android-native-certification.mjs';
import { parseAdbDevices, parseGetprop, resolveAndroidProfile } from './resolve-android-emulator.mjs';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'android.certification.json'), 'utf8'));
const read = (file) => readFileSync(join(root, file), 'utf8');
const workflow = read('.github/workflows/android-native-certification.yml');
const runner = read('scripts/run-android-native-certification.mjs');

const validFailures = validateAndroidCertification({
  manifest,
  source: read('tests/native/android/ExpoBaseNativeAndroidTest.java'),
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

const machineBoundManifest = structuredClone(manifest);
machineBoundManifest.profiles[0].serial = 'emulator-5554';
const machineBoundFailures = validateAndroidCertification({
  manifest: machineBoundManifest,
  source: read('tests/native/android/ExpoBaseNativeAndroidTest.java'),
  generator: read('scripts/generate-android-ui-test-project.mjs'),
  resolver: read('scripts/resolve-android-emulator.mjs'),
  runner: read('scripts/run-android-native-certification.mjs'),
  contract: read('scripts/check-native-ui-selector-contracts.mjs'),
});
assert.ok(machineBoundFailures.some((failure) => failure.includes('machine-specific identity serial')));

console.log('Android certification tests passed: manifest, runner contracts, semantic profile resolution, and fail-closed diagnostics.');
