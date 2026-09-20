import { createHash } from 'node:crypto';
import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { basename, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { artifactRelativePath, detectAndroidRuntimeFailures, isCertificationReleaseMode } from './android-certification-lib.mjs';
import { androidTool, loadCertificationProfile, parseAdbDevices, parseGetprop, resolveAndroidProfile } from './resolve-android-emulator.mjs';

const root = resolve(import.meta.dirname, '..');
const project = join(root, 'apps', 'reference');
const androidRoot = join(project, 'android');
const resultsRoot = join(root, 'test-results', 'android-native-certification');
const mode = process.argv.includes('--mode=debug') ? 'debug' : 'release';
const summaryPath = join(resultsRoot, `summary-${mode}.json`);
const { manifest, profile } = loadCertificationProfile(root);
const adb = androidTool(root, 'adb');
const authoritativeBase = '743a8bbf8273f663503dc8dd398135806dccb386';
const authoritativeBaseTree = '2fda05146dabea9bd44756f7c8071228166d40c8';
const startedEmulatorProcesses = [];

function git(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(' ')} failed.`);
  return result.stdout.trim();
}

function writeSummary(summary) {
  mkdirSync(resultsRoot, { recursive: true });
  writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
}

function blocked(reason, details = {}) {
  const summary = {
    schemaVersion: 1,
    status: 'BLOCKED',
    decisiveNativeRun: 'NOT_RUN',
    reason,
    mode,
    candidate: safeCandidateIdentity(),
    authoritativeBase: { commit: authoritativeBase, tree: authoritativeBaseTree },
    changedFiles: safeChangedFiles(),
    evidenceRegistry: manifest.evidenceRegistry,
    renderedPixelImpact: 'NONE — certification infrastructure and source contracts only; no Product/reference pixels or visual baselines changed.',
    ...details,
    boundaries: manifest.boundaries.map(({ id, automation, reason: boundaryReason }) => ({ id, automation, reason: boundaryReason })),
  };
  writeSummary(summary);
  console.error(`ANDROID NATIVE CERTIFICATION BLOCKED: ${reason}`);
  console.error(`Wrote ${summaryPath}`);
  process.exitCode = 2;
}

function safeCandidateIdentity() {
  try {
    return { commit: git(['rev-parse', 'HEAD']), tree: git(['write-tree']), changedFiles: sourceScope() };
  } catch {
    return { commit: 'unavailable', tree: 'unavailable', changedFiles: [] };
  }
}

function safeChangedFiles() {
  try { return sourceScope(); } catch { return []; }
}

function sourceScope() {
  return git(['diff', '--name-only', `${authoritativeBase}..HEAD`]).split('\n').filter(Boolean);
}

function run(command, args, label, options = {}) {
  console.log(`\n=== ${label} ===`);
  const { logFile, env: extraEnvironment, ...spawnOptions } = options;
  let logDescriptor;
  if (logFile) {
    mkdirSync(resolve(logFile, '..'), { recursive: true });
    logDescriptor = openSync(logFile, 'w');
    spawnOptions.stdio = ['ignore', logDescriptor, logDescriptor];
  }
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, CI: process.env.CI ?? '1', ...extraEnvironment },
    stdio: 'inherit',
    ...spawnOptions,
  });
  if (logDescriptor !== undefined) closeSync(logDescriptor);
  if (result.error) throw result.error;
  return result.status ?? 1;
}

export function resolveAndroidGradleInvocation(platform = process.platform) {
  return {
    command: platform === 'win32' ? 'gradlew.bat' : './gradlew',
    cwd: androidRoot,
  };
}

function commandOutput(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error(result.stderr || `${command} ${args.join(' ')} failed.`);
  return result.stdout;
}

function unavailableHostTools() {
  const missing = [];
  const java = spawnSync('java', ['-version'], { cwd: root, encoding: 'utf8' });
  if (java.error || java.status !== 0) missing.push('JDK/java');
  const adbCheck = spawnSync(adb, ['version'], { cwd: root, encoding: 'utf8' });
  if (adbCheck.error || adbCheck.status !== 0) missing.push('Android SDK platform-tools/adb');
  return missing;
}

function assertCleanCandidate() {
  const status = git(['status', '--porcelain', '--untracked-files=all']);
  if (status) throw new Error(`Android certification requires a clean candidate source tree; found:\n${status}`);
  const baseTree = git(['rev-parse', `${authoritativeBase}^{tree}`]);
  if (baseTree !== authoritativeBaseTree) throw new Error(`Authoritative base ${authoritativeBase} resolved to unexpected tree ${baseTree}.`);
  const ancestry = spawnSync('git', ['merge-base', '--is-ancestor', authoritativeBase, 'HEAD'], { cwd: root });
  if (ancestry.status !== 0) throw new Error(`Candidate HEAD is not descended from authoritative base ${authoritativeBase}.`);
  return { commit: git(['rev-parse', 'HEAD']), tree: git(['write-tree']), authoritativeBase: { commit: authoritativeBase, tree: authoritativeBaseTree }, changedFiles: sourceScope() };
}

function parseJsonOutput(output) {
  const start = output.indexOf('{');
  const end = output.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Expo config did not return JSON.');
  return JSON.parse(output.slice(start, end + 1));
}

function appConfig() {
  const npmCommand = process.env.npm_execpath ? process.execPath : 'npm';
  const npmArgs = process.env.npm_execpath
    ? [process.env.npm_execpath, 'exec', '-w', '@expo-base/reference', '--', 'expo', 'config', '--json']
    : ['exec', '-w', '@expo-base/reference', '--', 'expo', 'config', '--json'];
  return parseJsonOutput(commandOutput(npmCommand, npmArgs));
}

function waitForAdb(serial, timeoutMs = 180000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const boot = spawnSync(adb, ['-s', serial, 'shell', 'getprop', 'sys.boot_completed'], { cwd: root, encoding: 'utf8' });
    if (boot.status === 0 && boot.stdout.trim() === '1') return;
    spawnSync(process.platform === 'win32' ? 'ping' : 'sleep', process.platform === 'win32' ? ['-n', '2', '127.0.0.1'] : ['1']);
  }
  throw new Error(`Android emulator ${serial} did not finish booting within ${timeoutMs}ms.`);
}

function connectedDevices() {
  const output = commandOutput(adb, ['devices', '-l']);
  return parseAdbDevices(output).map((device) => {
    if (device.state !== 'device') return device;
    const props = spawnSync(adb, ['-s', device.serial, 'shell', 'getprop'], { cwd: root, encoding: 'utf8' });
    const parsed = parseGetprop(props.stdout);
    return {
      ...device,
      apiLevel: parsed['ro.build.version.sdk'],
      model: parsed['ro.product.model'],
      avdName: parsed['ro.boot.qemu.avd_name'],
      abi: parsed['ro.product.cpu.abi'],
    };
  });
}

function startHeadlessEmulatorIfRequested() {
  if (connectedDevices().some((device) => device.isEmulator && device.state === 'device')) return;
  const avdName = process.env.ANDROID_AVD_NAME;
  if (!avdName) throw new Error('No booted Android emulator matched and ANDROID_AVD_NAME was not provided for a headless emulator start.');
  const emulator = process.env.ANDROID_HOME ? join(process.env.ANDROID_HOME, 'emulator', 'emulator') : 'emulator';
  const child = spawn(emulator, ['-avd', avdName, '-no-window', '-no-audio', '-no-boot-anim', '-gpu', 'swiftshader_indirect'], { cwd: root, detached: true, stdio: 'ignore' });
  startedEmulatorProcesses.push(child);
  child.unref();
}

function resolveEmulator() {
  startHeadlessEmulatorIfRequested();
  const started = Date.now();
  let resolved;
  let lastError;
  while (Date.now() - started < 180000) {
    try {
      resolved = resolveAndroidProfile(profile, connectedDevices(), process.env.ANDROID_SERIAL);
      break;
    } catch (error) {
      lastError = error;
      spawnSync(process.platform === 'win32' ? 'ping' : 'sleep', process.platform === 'win32' ? ['-n', '2', '127.0.0.1'] : ['1']);
    }
  }
  if (!resolved) throw lastError ?? new Error(`No Android emulator matched ${profile.id}.`);
  const details = { ...resolved, resolvedAt: new Date().toISOString(), sourceProfile: profile };
  writeFileSync(join(resultsRoot, 'resolved-profile.json'), `${JSON.stringify(details, null, 2)}\n`);
  return resolved;
}

function artifactFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...artifactFiles(path));
    else files.push(path);
  }
  return files;
}

function copyBuildArtifacts() {
  const outputRoot = join(resultsRoot, 'artifacts');
  mkdirSync(outputRoot, { recursive: true });
  const candidates = artifactFiles(join(androidRoot, 'app', 'build', 'outputs')).filter((file) => /(?:release|androidTest).*\.apk$/.test(basename(file)));
  const copied = [];
  for (const file of candidates) {
    const destination = join(outputRoot, basename(file));
    copyFileSync(file, destination);
    const bytes = readFileSync(destination);
    copied.push({ path: artifactRelativePath(root, destination), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  return copied;
}

function collectJunitResults() {
  const destination = join(resultsRoot, 'junit');
  mkdirSync(destination, { recursive: true });
  const roots = [join(androidRoot, 'app', 'build', 'outputs', 'androidTest-results'), join(androidRoot, 'app', 'build', 'reports', 'androidTests')];
  const copied = [];
  for (const sourceRoot of roots) {
    for (const file of artifactFiles(sourceRoot)) {
      const name = `${copied.length}-${basename(file)}`;
      copyFileSync(file, join(destination, name));
      copied.push(relative(root, join(destination, name)));
    }
  }
  return copied;
}

function pullScreenshots(serial) {
  const destination = join(resultsRoot, 'screenshots');
  mkdirSync(destination, { recursive: true });
  const remote = `/sdcard/Android/data/${manifest.app.bundleIdentifier}/files/Pictures/expo-base-android-certification`;
  const result = spawnSync(adb, ['-s', serial, 'pull', remote, destination], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) return [];
  return artifactFiles(destination).map((file) => relative(root, file));
}

function stopStartedEmulators() {
  for (const child of startedEmulatorProcesses) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch { /* The emulator may have exited with the test. */ }
  }
}

function main() {
  mkdirSync(resultsRoot, { recursive: true });
  if (!isCertificationReleaseMode(mode)) {
    blocked('Debug/development-client smoke is not the decisive Android certification lane.', { decisiveNativeRun: 'NOT_RUN', productLane: manifest.app.productLane });
    return;
  }
  if (Number(process.versions.node.split('.')[0]) < 22) {
    blocked(`Android certification requires Node 22; found ${process.version}.`);
    return;
  }
  const missingHostTools = unavailableHostTools();
  if (missingHostTools.length) {
    blocked(`Android certification prerequisites are unavailable: ${missingHostTools.join(', ')}.`);
    return;
  }
  let candidate;
  try {
    candidate = assertCleanCandidate();
  } catch (error) {
    blocked(error.message);
    return;
  }
  const provenance = { schemaVersion: 1, candidate, project: manifest.app.project, productLane: manifest.app.productLane, generatedNative: 'pending', profile: profile.id, recordedAt: new Date().toISOString() };
  writeFileSync(join(resultsRoot, 'provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
  let resolved;
  try {
    const npmCommand = process.env.npm_execpath ? process.execPath : 'npm';
    const npmArgs = process.env.npm_execpath
      ? [process.env.npm_execpath, 'exec', '-w', '@expo-base/reference', '--', 'expo', 'prebuild', '--platform', 'android', '--clean']
      : ['exec', '-w', '@expo-base/reference', '--', 'expo', 'prebuild', '--platform', 'android', '--clean'];
    const prebuildStatus = run(npmCommand, npmArgs, 'GENERATE ANDROID PROJECT FROM FRESH CNG', { env: { EXPO_USE_PRECOMPILED_MODULES: '0', RCT_USE_PREBUILT_RNCORE: '0' }, logFile: join(resultsRoot, 'prebuild.log') });
    if (prebuildStatus !== 0) throw new Error(`Fresh Android CNG generation failed with exit ${prebuildStatus}.`);
    const generated = run(process.execPath, ['scripts/generate-android-ui-test-project.mjs'], 'GENERATE ANDROID INSTRUMENTATION TARGET');
    if (generated !== 0) throw new Error(`Android instrumentation target generation failed with exit ${generated}.`);
    if (!existsSync(join(androidRoot, 'app', 'build.gradle'))) throw new Error('Fresh CNG did not produce apps/reference/android/app/build.gradle.');
    const config = appConfig();
    resolved = resolveEmulator();
    provenance.generatedNative = { applicationId: config.android?.package ?? manifest.app.bundleIdentifier, config, buildGradle: artifactRelativePath(root, join(androidRoot, 'app', 'build.gradle')), generatedAt: new Date().toISOString() };
    provenance.resolvedEmulator = resolved;
    writeFileSync(join(resultsRoot, 'provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
    waitForAdb(resolved.serial);
    run(adb, ['-s', resolved.serial, 'logcat', '-c'], 'CLEAR ANDROID LOGCAT');
    const { command: gradle, cwd: gradleCwd } = resolveAndroidGradleInvocation();
    const gradleLog = join(resultsRoot, 'gradle-release.log');
    const gradleStatus = run(gradle, [':app:connectedReleaseAndroidTest', '--no-daemon', '--stacktrace'], 'RUN ANDROID RELEASE INSTRUMENTATION', { cwd: gradleCwd, logFile: gradleLog, env: { ANDROID_SERIAL: resolved.serial } });
    const logcat = commandOutput(adb, ['-s', resolved.serial, 'logcat', '-d', '-v', 'threadtime']);
    writeFileSync(join(resultsRoot, 'logcat-release.txt'), logcat);
    const failures = detectAndroidRuntimeFailures(logcat);
    const junit = collectJunitResults();
    const artifacts = copyBuildArtifacts();
    const screenshots = pullScreenshots(resolved.serial);
    if (gradleStatus !== 0) throw new Error(`Android instrumentation failed with exit ${gradleStatus}.`);
    if (failures.length) throw new Error(`Android runtime diagnostics contain ${failures.length} crash/ANR/uncaught-error marker(s).`);
    if (!junit.length) throw new Error('Android instrumentation produced no JUnit/report artifacts.');
    if (!artifacts.some((file) => /app-release\.apk$/.test(file.path))) throw new Error('Android release APK artifact was not produced.');
    const summary = { schemaVersion: 1, status: 'PASS', decisiveNativeRun: 'PASS', mode, candidate, changedFiles: candidate.changedFiles, productLane: manifest.app.productLane, renderedPixelImpact: 'NONE — certification infrastructure and source contracts only; no Product/reference pixels or visual baselines changed.', resolvedEmulator: resolved, artifacts: { junit, nativeBuild: artifacts, screenshots, logcat: 'test-results/android-native-certification/logcat-release.txt', gradleLog: 'test-results/android-native-certification/gradle-release.log', provenance: 'test-results/android-native-certification/provenance.json' }, boundaries: manifest.boundaries.map(({ id, automation, reason }) => ({ id, automation, reason })) };
    writeSummary(summary);
    console.log(`ANDROID NATIVE CERTIFICATION PASSED: ${summary.artifacts.junit.length} test/report artifacts, ${summary.artifacts.screenshots.length} screenshots.`);
  } catch (error) {
    if (!resolved && /No booted Android emulator|No Android emulator matches|ANDROID_AVD_NAME|did not finish booting/.test(error.message)) {
      blocked(error.message, { generatedCngAttempted: true });
      return;
    }
    const logcat = resolved ? spawnSync(adb, ['-s', resolved.serial, 'logcat', '-d', '-v', 'threadtime'], { cwd: root, encoding: 'utf8' }).stdout : '';
    if (resolved) writeFileSync(join(resultsRoot, 'logcat-release.txt'), logcat);
    const failureMarkers = detectAndroidRuntimeFailures(logcat);
    writeSummary({ schemaVersion: 1, status: 'FAIL', decisiveNativeRun: 'FAIL', mode, candidate, changedFiles: candidate.changedFiles, productLane: manifest.app.productLane, renderedPixelImpact: 'NONE — certification infrastructure and source contracts only; no Product/reference pixels or visual baselines changed.', evidenceRegistry: manifest.evidenceRegistry, resolvedEmulator: resolved ?? null, failure: error.message, failureMarkers, boundaries: manifest.boundaries.map(({ id, automation, reason }) => ({ id, automation, reason })) });
    console.error(`ANDROID NATIVE CERTIFICATION FAILED: ${error.message}`);
    process.exitCode = 1;
  } finally {
    stopStartedEmulators();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
