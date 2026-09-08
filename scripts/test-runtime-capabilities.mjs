import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const out = path.join(root, '.tmp-runtime-capabilities');
fs.rmSync(out, { recursive: true, force: true });

const packages = ['capabilities', 'secure-storage', 'preferences', 'runtime-capabilities', 'sharing', 'media', 'local-auth', 'notifications', 'updates', 'device', 'haptics', 'observability', 'server-state'];
for (const name of packages) compile(name);
fs.writeFileSync(path.join(out, 'package.json'), '{"type":"commonjs"}\n');
link('@precision-calm/capabilities', 'capabilities');
link('@precision-calm/server-state', 'server-state');

try {
  const require = createRequire(import.meta.url);
  const core = require(path.join(out, 'capabilities', 'memory.js'));
  const secure = require(path.join(out, 'secure-storage', 'memory.js'));
  const preferences = require(path.join(out, 'preferences', 'memory.js'));
  const signals = require(path.join(out, 'runtime-capabilities', 'memory.js'));
  const bridge = require(path.join(out, 'runtime-capabilities', 'ServerStateRuntimeBridge.js'));
  const sharing = require(path.join(out, 'sharing', 'memory.js'));
  const media = require(path.join(out, 'media', 'memory.js'));
  const localAuth = require(path.join(out, 'local-auth', 'memory.js'));
  const notifications = require(path.join(out, 'notifications', 'memory.js'));
  const updates = require(path.join(out, 'updates', 'memory.js'));
  const device = require(path.join(out, 'device', 'memory.js'));
  const haptics = require(path.join(out, 'haptics', 'memory.js'));
  const observability = require(path.join(out, 'observability', 'index.js'));

  const permission = new core.MemoryPermissionAdapter({ status: 'denied', canAskAgain: false, canOpenSettings: true });
  assert.equal((await permission.get()).status, 'denied');
  assert.deepEqual(await permission.openSettings(), { status: 'success', value: undefined });
  const secrets = new secure.MemorySecureStorage();
  assert.equal((await secrets.set('token', 'secret')).status, 'success');
  assert.deepEqual(await secrets.get('token'), { status: 'success', value: 'secret' });
  secrets.setAvailability({ status: 'unavailable', reason: 'unsupported' });
  assert.deepEqual(await secrets.get('token'), { status: 'unavailable', reason: 'unsupported' });
  const prefs = new preferences.MemoryPreferences();
  await prefs.set('density', 'compact');
  assert.deepEqual(await prefs.get('density'), { status: 'success', value: 'compact' });
  prefs.setAvailability({ status: 'unavailable', reason: 'temporarily-unavailable' });
  assert.equal((await prefs.remove('density')).status, 'unavailable');
  const connectivity = new signals.MemoryConnectivity({ status: 'offline' });
  const lifecycle = new signals.MemoryAppLifecycle('background');
  let invalidations = 0;
  const cleanup = bridge.connectPrecisionServerStateRuntime({ async invalidate() { invalidations += 1; } }, { connectivity, lifecycle, policy: { refetchOnReconnect: true, refetchOnForeground: true } });
  connectivity.setState({ status: 'online' }); lifecycle.setState('active');
  await Promise.resolve(); assert.equal(invalidations, 2);
  cleanup(); connectivity.setState({ status: 'offline' }); connectivity.setState({ status: 'online' });
  await Promise.resolve(); assert.equal(invalidations, 2, 'subscription cleanup must prevent later invalidations');
  const clipboard = new sharing.MemoryClipboard(); await clipboard.copyText('value'); assert.deepEqual(await clipboard.readText(), { status: 'success', value: 'value' });
  const share = new sharing.MemorySharing(); assert.equal((await share.share({ url: 'https://example.com' })).status, 'success'); share.available = false; assert.equal((await share.share({ url: 'https://example.com' })).status, 'unavailable');
  const documents = new media.MemoryDocumentPicker(); documents.resources = [{ uri: 'file://one', name: 'one.txt', mimeType: 'text/plain', size: 1, kind: 'document' }]; assert.equal((await documents.pick()).status, 'success');
  const acquisition = new media.MemoryMediaAcquisition(); acquisition.cameraPermission.setRequestResult({ status: 'denied', canAskAgain: false, canOpenSettings: true }); assert.equal((await acquisition.cameraPermission.request()).status, 'denied');
  const biometric = new localAuth.MemoryLocalAuthentication(); biometric.setResult({ status: 'cancelled' }); assert.equal((await biometric.authenticate({ prompt: 'Unlock' })).status, 'cancelled');
  const push = new notifications.MemoryNotifications(); push.token = 'ExponentPushToken[test]'; assert.equal((await push.getToken()).status, 'success'); let opened = 0; const unlisten = push.subscribeOpen(() => { opened += 1; }); push.emitOpen({ identifier: 'n1', data: {} }); unlisten(); push.emitOpen({ identifier: 'n2', data: {} }); assert.equal(opened, 1);
  const updater = new updates.MemoryUpdates(); updater.checkResult = { status: 'available' }; assert.deepEqual(await updater.download(), { status: 'success', value: { downloaded: true } });
  const info = new device.MemoryDevice(); assert.equal((await info.getInfo()).status, 'success');
  const tactile = new haptics.MemoryHaptics(); await tactile.perform('confirm'); assert.deepEqual(tactile.intents, ['confirm']); tactile.available = false; assert.equal((await tactile.perform('warning')).status, 'unavailable');
  const recorder = new observability.RecordingObservability(); await recorder.measure({ name: 'load' }, async () => 1); recorder.report(new Error('safe'), { name: 'reported' }); assert.equal(recorder.events.length, 1); assert.equal(recorder.reports.length, 1);
  console.log('Runtime capability tests passed (memory success/unavailable/denied/cancelled, cleanup, normalized outcomes, and signal-to-query policy).');
} finally { fs.rmSync(out, { recursive: true, force: true }); }

function compile(name) {
  const result = spawnSync(path.join(root, 'node_modules', '.bin', 'tsc'), ['-p', `packages/${name}/tsconfig.json`, '--noEmit', 'false', '--outDir', path.join(out, name), '--module', 'commonjs', '--moduleResolution', 'node'], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
}
function link(name, output) {
  const target = path.join(out, 'node_modules', ...name.split('/'));
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({ type: 'commonjs', main: '../../../' + output + '/index.js' }));
}
