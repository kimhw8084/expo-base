import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { classifyAndroidRun, ensureGradleMetaspace, parseAvdConfigIdentity, resolveAndroidLocale, resolveAndroidProfile, validateAndroidDevice } from './android-certification-lib.mjs';
import { prepareAndroidNativeTests } from './generate-android-native-tests.mjs';

const root = resolve(import.meta.dirname, '..');
const manifestPath = join(root, 'android.certification.json');
const outputDir = join(root, 'test-results', 'android-native-certification');
const androidDir = join(root, 'apps', 'reference', 'android');
const appPackage = 'com.expobase.reference';
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const args = process.argv.slice(2);
const profileArgument = valueAfter(args, '--profile') ?? process.env.EXPO_BASE_ANDROID_PROFILE;
const profile = resolveAndroidProfile(manifest, profileArgument);
const state = {
  status: 'FAIL',
  candidate: {},
  profile: { ...profile },
  build: { variant: 'release', javascript: 'bundled-in-release-apk', maxGradleWorkers: manifest.buildExecution.maxGradleWorkers, minimumMetaspaceMb: manifest.buildExecution.minimumMetaspaceMb },
  instrumentation: { runner: manifest.instrumentation.runner, expectedTests: manifest.instrumentation.expectedTests },
  evidence: {},
  workflow: {},
  failures: [],
};
let buildExitCode = null;
let junitReports = [];
let logcat = '';
let identityErrors = [];
let missingEvidence = [];
let stage = 'preflight';

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(join(outputDir, 'junit'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });

try {
  const nodeParts = process.versions.node.split('.').map(Number);
  if (nodeParts[0] < 22 || (nodeParts[0] === 22 && nodeParts[1] < 13)) throw new Error(`Node.js >=22.13.0 is required, current version is ${process.versions.node}.`);
  stage = 'candidate-identity';
  state.candidate = candidateIdentity();
  state.workflow = workflowIdentity();
  if (process.env.GITHUB_SHA && process.env.GITHUB_SHA !== state.candidate.sha) throw new Error(`GitHub checked out ${process.env.GITHUB_SHA}, but the source candidate is ${state.candidate.sha}.`);
  if (state.candidate.sha === manifest.claim.baseCommit) throw new Error('The base release commit is not a new Android candidate.');
  if (state.candidate.dirtyFiles.length) throw new Error(`Certification requires committed candidate source; worktree changes remain: ${state.candidate.dirtyFiles.join(', ')}.`);

  stage = 'emulator-profile';
  state.device = inspectEmulator(profile);
  state.evidence.avdProfileConfig = {
    path: relative(root, join(outputDir, 'avd-config.ini')),
    sha256: state.device.avdConfigSha256,
  };
  const profileErrors = validateAndroidDevice(profile, state.device);
  if (profileErrors.length) throw new Error(profileErrors.join(' '));

  stage = 'fresh-cng';
  const cng = run('npm', ['exec', '-w', '@expo-base/reference', '--', 'expo', 'prebuild', '--clean', '--platform', 'android', '--no-install'], {
    cwd: root,
    log: join(outputDir, 'cng.log'),
    env: process.env,
  });
  if (cng.status !== 0) throw new Error(`Fresh Expo CNG generation failed with status ${cng.status}.`);
  const gradlePropertiesPath = join(androidDir, 'gradle.properties');
  const configuredGradleProperties = ensureGradleMetaspace(readFileSync(gradlePropertiesPath, 'utf8'), manifest.buildExecution.minimumMetaspaceMb);
  writeFileSync(gradlePropertiesPath, configuredGradleProperties.properties);
  state.build.configuredMetaspaceMb = configuredGradleProperties.metaspaceMb;
  const gradleEvidencePath = join(outputDir, 'generated-gradle.properties');
  copyFileSync(gradlePropertiesPath, gradleEvidencePath);
  state.evidence.gradleConfiguration = {
    path: relative(root, gradleEvidencePath),
    sha256: createHash('sha256').update(readFileSync(gradlePropertiesPath)).digest('hex'),
    maxWorkers: manifest.buildExecution.maxGradleWorkers,
    metaspaceMb: configuredGradleProperties.metaspaceMb,
  };
  const generatedTests = prepareAndroidNativeTests(androidDir);
  const generatedIdentity = generatedAndroidIdentity();
  state.evidence.generatedNative = generatedIdentity;
  state.app = inspectAppIdentity();
  writeFileSync(join(outputDir, 'generated-native-identity.json'), `${JSON.stringify({
    candidate: state.candidate,
    profileId: profile.id,
    app: state.app,
    generatedAndroid: generatedIdentity,
    instrumentationSource: relative(root, generatedTests.testDestination),
  }, null, 2)}\n`);

  stage = 'release-build-and-instrumentation';
  runAdb(['logcat', '-c'], 'logcat-clear.log');
  const gradle = run('./gradlew', [
    '--no-daemon', '--stacktrace', '--console=plain', `--max-workers=${manifest.buildExecution.maxGradleWorkers}`,
    `-PreactNativeArchitectures=${profile.architecture}`,
    ':app:connectedReleaseAndroidTest',
  ], {
    cwd: androidDir,
    log: join(outputDir, 'gradle-instrumentation.log'),
    env: { ...process.env, EXPO_USE_PRECOMPILED_MODULES: '0', RCT_USE_PREBUILT_RNCORE: '0' },
  });
  buildExitCode = gradle.status ?? 1;

  stage = 'evidence-extraction';
  junitReports = collectJunitReports();
  for (const [index, report] of junitReports.entries()) {
    const destination = join(outputDir, 'junit', `report-${String(index + 1).padStart(2, '0')}.xml`);
    writeFileSync(destination, report.contents);
  }
  const logcatCapture = run('adb', ['-e', 'logcat', '-d', '-v', 'threadtime'], { cwd: root, log: join(outputDir, 'logcat.txt'), env: process.env, echo: false });
  logcat = logcatCapture.stdout;
  if (logcatCapture.status !== 0) state.failures.push({ layer: 'evidence-extraction', reason: `Could not collect device logcat (adb status ${logcatCapture.status}).` });

  const screenshots = [
    ['/sdcard/Download/expo-base-android-home.png', join(outputDir, 'screenshots', 'home.png')],
    ['/sdcard/Download/expo-base-android-dialog-open.png', join(outputDir, 'screenshots', 'dialog-open.png')],
    ['/sdcard/Download/expo-base-android-form-invalid.png', join(outputDir, 'screenshots', 'form-invalid.png')],
    ['/sdcard/Download/expo-base-android-server-state-refresh-error.png', join(outputDir, 'screenshots', 'server-state-refresh-error.png')],
  ];
  for (const [devicePath, localPath] of screenshots) {
    const pull = run('adb', ['-e', 'pull', devicePath, localPath], { cwd: root, log: `${localPath}.pull.log`, env: process.env });
    if (pull.status !== 0 || !existsSync(localPath) || statSync(localPath).size === 0) missingEvidence.push(relative(root, localPath));
  }

  const releaseApk = join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  if (existsSync(releaseApk)) {
    const evidenceApk = join(outputDir, 'app-release.apk');
    copyFileSync(releaseApk, evidenceApk);
    state.build.apk = inspectApk(evidenceApk);
  } else {
    missingEvidence.push('apps/reference/android/app/build/outputs/apk/release/app-release.apk');
  }
  if (!state.evidence.generatedNative || !existsSync(join(outputDir, 'generated-native-identity.json'))) missingEvidence.push('generated-native-identity.json');
  if (!state.evidence.gradleConfiguration || !existsSync(join(outputDir, 'generated-gradle.properties'))) missingEvidence.push('generated-gradle.properties');
  if (junitReports.length === 0) missingEvidence.push('junit/TEST-*.xml');

  const analysis = classifyAndroidRun({
    buildExitCode,
    junitReports: junitReports.map((report) => report.contents),
    expectedTests: manifest.instrumentation.expectedTests,
    logcat,
    identityErrors,
    missingEvidence,
  });
  state.instrumentation = { ...state.instrumentation, ...analysis.junit, crashDisposition: analysis.crashDisposition };
  state.failures.push(...analysis.failures);
  if (state.build.apk?.applicationId !== appPackage) {
    state.failures.push({ layer: 'evidence-identity', reason: `Built APK application ID was ${state.build.apk?.applicationId ?? '<missing>'}, expected ${appPackage}.` });
  }
  if (state.build.apk && !state.build.apk.containsBundledJavaScript) {
    state.failures.push({ layer: 'evidence-identity', reason: 'Release APK does not contain assets/index.android.bundle.' });
  }
  if (state.candidate.sha !== state.workflow.sha && state.workflow.sha) {
    state.failures.push({ layer: 'evidence-identity', reason: `Workflow SHA ${state.workflow.sha} does not match checked-out candidate ${state.candidate.sha}.` });
  }
  if (state.evidence.generatedNative?.sha256 && !state.evidence.generatedNative.fileCount) {
    state.failures.push({ layer: 'evidence-identity', reason: 'Fresh generated Android source identity has no files.' });
  }
  state.status = state.failures.length === 0 ? 'PASS' : 'FAIL';
} catch (error) {
  state.failures.push({ layer: stage, reason: error instanceof Error ? error.message : String(error) });
  if (stage === 'release-build-and-instrumentation') buildExitCode = 1;
} finally {
  if (state.candidate.sha && buildExitCode !== null) {
    try {
      const reportFiles = collectJunitReports();
      if (!junitReports.length) junitReports = reportFiles;
    } catch (error) {
      state.failures.push({ layer: 'evidence-extraction', reason: error instanceof Error ? error.message : String(error) });
    }
  }
  state.status = state.failures.length === 0 ? 'PASS' : 'FAIL';
  state.evidence.files = listEvidenceFiles(outputDir).map((path) => relative(root, path));
  state.evidence.logcatDisposition = state.instrumentation.crashDisposition ?? 'not-collected';
  writeFileSync(join(outputDir, 'summary.json'), `${JSON.stringify(state, null, 2)}\n`);
  console.log(`Android native certification ${state.status}; result: ${relative(root, join(outputDir, 'summary.json'))}`);
  for (const failure of state.failures) console.error(`- [${failure.layer}] ${failure.reason}`);
}

if (state.status !== 'PASS') process.exit(1);

function candidateIdentity() {
  const sha = git(['rev-parse', 'HEAD']).trim();
  const tree = git(['rev-parse', 'HEAD^{tree}']).trim();
  const baseTree = git(['rev-parse', `${manifest.claim.baseCommit}^{tree}`]).trim();
  if (baseTree !== manifest.claim.baseTree) throw new Error(`Protected base tree changed: ${baseTree}.`);
  const ancestor = spawnSync('git', ['merge-base', '--is-ancestor', manifest.claim.baseCommit, 'HEAD'], { cwd: root, encoding: 'utf8' });
  if (ancestor.status !== 0) throw new Error('Candidate is not descended from the exact protected v1.1.0 base.');
  const releaseTag = git(['rev-parse', 'v1.1.0^{commit}']).trim();
  if (releaseTag !== manifest.claim.baseCommit) throw new Error(`The v1.1.0 tag no longer identifies the required base (${releaseTag}).`);
  const dirtyFiles = git(['status', '--porcelain', '--untracked-files=all']).split('\n').filter(Boolean);
  return { sha, tree, baseCommit: manifest.claim.baseCommit, baseTree, releaseTagCommit: releaseTag, dirtyFiles };
}

function workflowIdentity() {
  return {
    event: process.env.GITHUB_EVENT_NAME ?? null,
    sha: process.env.GITHUB_SHA ?? null,
    ref: process.env.GITHUB_REF ?? null,
    branch: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || null,
    runId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    job: process.env.GITHUB_JOB ?? null,
  };
}

function inspectEmulator(selectedProfile) {
  const values = Object.fromEntries([
    ['apiLevel', 'ro.build.version.sdk'],
    ['model', 'ro.product.model'],
    ['manufacturer', 'ro.product.manufacturer'],
    ['cpuAbi', 'ro.product.cpu.abi'],
    ['isEmulator', 'ro.kernel.qemu'],
  ].map(([key, property]) => [key, runAdb(['shell', 'getprop', property], `device-${key}.log`).stdout.trim()]));
  const avdResult = runAdb(['emu', 'avd', 'name'], 'device-avd-name.log');
  values.avdName = avdResult.stdout.split(/\r?\n/)[0].trim();
  const avdHome = process.env.ANDROID_AVD_HOME || join(process.env.HOME || '', '.android', 'avd');
  const avdConfigPath = join(avdHome, `${values.avdName}.avd`, 'config.ini');
  if (!existsSync(avdConfigPath)) throw new Error(`Emulator AVD configuration was not found at ${avdConfigPath}.`);
  const avdConfig = readFileSync(avdConfigPath, 'utf8');
  copyFileSync(avdConfigPath, join(outputDir, 'avd-config.ini'));
  Object.assign(values, parseAvdConfigIdentity(avdConfig));
  values.avdConfigSha256 = createHash('sha256').update(avdConfig).digest('hex');
  values.profileId = selectedProfile.id;
  const persistedLocale = runAdb(['shell', 'getprop', 'persist.sys.locale'], 'device-locale-persisted.log').stdout.trim();
  const systemLocales = runAdb(['shell', 'settings', 'get', 'system', 'system_locales'], 'device-locale-system-settings.log').stdout.trim();
  const productLocale = runAdb(['shell', 'getprop', 'ro.product.locale'], 'device-locale-product-default.log').stdout.trim();
  values.localeProbe = { persistedLocale, systemLocales, productLocale };
  values.locale = resolveAndroidLocale(values.localeProbe);
  return values;
}

function inspectAppIdentity() {
  const gradle = readFileSync(join(androidDir, 'app', 'build.gradle'), 'utf8');
  const manifestText = readFileSync(join(androidDir, 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
  const packageJson = JSON.parse(readFileSync(join(root, 'apps', 'reference', 'package.json'), 'utf8'));
  const errors = [];
  if (!gradle.includes(`applicationId '${appPackage}'`) || !gradle.includes(`namespace '${appPackage}'`)) errors.push('Fresh CNG Gradle identity does not match the reference application ID.');
  if (!manifestText.includes('android:name=".MainActivity"')) errors.push('Fresh CNG Android manifest has no reference MainActivity.');
  if (packageJson.dependencies['react-native'] !== manifest.app.reactNativeVersion || packageJson.dependencies.expo !== manifest.app.expoVersion) errors.push('Reference app Expo or React Native dependency baseline is stale against the Android manifest.');
  if (errors.length) identityErrors.push(...errors);
  return { applicationId: appPackage, expoVersion: packageJson.dependencies.expo, reactNativeVersion: packageJson.dependencies['react-native'], appVersion: packageJson.version };
}

function generatedAndroidIdentity() {
  const files = walkFiles(androidDir).filter((path) => !isGeneratedOutput(relative(androidDir, path)));
  const hash = createHash('sha256');
  for (const path of files) {
    hash.update(relative(androidDir, path).replaceAll('\\', '/'));
    hash.update('\0');
    hash.update(readFileSync(path));
    hash.update('\0');
  }
  return { sha256: hash.digest('hex'), fileCount: files.length, algorithm: 'sha256(sorted-relative-path-and-file-bytes)' };
}

function collectJunitReports() {
  const resultRoot = join(androidDir, 'app', 'build', 'outputs', 'androidTest-results', 'connected', 'release');
  if (!existsSync(resultRoot)) return [];
  return walkFiles(resultRoot)
    .filter((path) => path.endsWith('.xml') && readFileSync(path, 'utf8').includes('<testsuite'))
    .map((path) => ({ path, contents: readFileSync(path, 'utf8') }));
}

function inspectApk(apkPath) {
  const bytes = readFileSync(apkPath);
  const aapt = findAndroidTool('aapt');
  const badging = run(aapt, ['dump', 'badging', apkPath], { cwd: root, log: join(outputDir, 'apk-badging.log'), env: process.env }).stdout;
  const applicationId = badging.match(/^package: name='([^']+)'/m)?.[1] ?? null;
  const versionCode = badging.match(/^package:.*versionCode='([^']+)'/m)?.[1] ?? null;
  const versionName = badging.match(/^package:.*versionName='([^']+)'/m)?.[1] ?? null;
  return {
    path: relative(root, apkPath),
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes: bytes.length,
    applicationId,
    versionCode,
    versionName,
    containsBundledJavaScript: bytes.includes(Buffer.from('assets/index.android.bundle')),
  };
}

function findAndroidTool(toolName) {
  const sdk = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
  if (!sdk) throw new Error('ANDROID_SDK_ROOT or ANDROID_HOME is required for artifact identity checks.');
  const buildTools = join(sdk, 'build-tools');
  const versions = existsSync(buildTools) ? readdirSync(buildTools).sort((a, b) => b.localeCompare(a, undefined, { numeric: true })) : [];
  const path = versions.map((version) => join(buildTools, version, toolName)).find(existsSync);
  if (!path) throw new Error(`Android SDK ${toolName} executable was not found.`);
  return path;
}

function runAdb(adbArgs, logName) {
  const result = run('adb', ['-e', ...adbArgs], { cwd: root, log: join(outputDir, logName), env: process.env, echo: !adbArgs.includes('logcat') });
  if (result.status !== 0) throw new Error(`adb ${adbArgs.join(' ')} failed with status ${result.status ?? '<no status>'}.`);
  return result;
}

function run(command, commandArgs, { cwd, log, env, echo = true }) {
  const result = spawnSync(command, commandArgs, { cwd, env, encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (log) writeFileSync(log, output);
  if (echo && output) process.stdout.write(output);
  if (result.error) process.stderr.write(`${command}: ${result.error.message}\n`);
  return { ...result, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function git(gitArgs) {
  const result = spawnSync('git', gitArgs, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git ${gitArgs.join(' ')} failed: ${(result.stderr ?? '').trim()}`);
  return result.stdout ?? '';
}

function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(path) : entry.isFile() ? [path] : [];
  }).sort((a, b) => a.localeCompare(b));
}

function isGeneratedOutput(path) {
  const normalized = path.replaceAll('\\', '/');
  return normalized.split('/').some((part) => ['.gradle', 'build', 'captures'].includes(part)) || normalized === 'local.properties';
}

function listEvidenceFiles(directory) {
  return walkFiles(directory).filter((path) => !path.endsWith('summary.json'));
}

function valueAfter(values, name) {
  const index = values.indexOf(name);
  return index >= 0 ? values[index + 1] : undefined;
}
