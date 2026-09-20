import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { detectAndroidRuntimeFailures } from './android-certification-lib.mjs';
import { validateAndroidCertification } from './check-android-certification-manifest.mjs';
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
assert.match(workflow, /- name: Checkout candidate[\s\S]*?uses: actions\/checkout@v4[\s\S]*?with:\n\s+fetch-depth: 0/);
assert.ok(workflow.indexOf('fetch-depth: 0') < workflow.indexOf('script: npm run android:verify'), 'Android certification must obtain full Git history before android:verify.');
assert.ok(runner.includes('743a8bbf8273f663503dc8dd398135806dccb386'));
assert.ok(runner.includes('2fda05146dabea9bd44756f7c8071228166d40c8'));
assert.ok(runner.includes("git(['rev-parse', `${authoritativeBase}^{tree}`])"), 'Android certification must resolve the authoritative base tree.');
assert.ok(runner.includes("['merge-base', '--is-ancestor', authoritativeBase, 'HEAD']"), 'Android certification must retain the authoritative-base ancestry check.');

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
  'E ActivityManager: ANR in com.expobase.reference',
  'E ReactNativeJS: TypeError: broken',
].join('\n'));
assert.equal(runtimeFailures.length, 3);
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
