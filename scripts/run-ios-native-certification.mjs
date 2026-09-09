import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const project = join(root, 'apps', 'reference');
const workspace = join(project, 'ios', 'ExpoBaseReference.xcworkspace');
const resultsRoot = join(root, 'test-results', 'ios-native-certification');
const deviceId = process.env.IOS_SIMULATOR_UDID ?? 'E97BB776-234F-41F5-8544-5E3924121C1F';
const mode = process.argv.includes('--mode=debug') ? 'debug' : 'release';
const resultBundle = join(resultsRoot, `ExpoBaseNativeCertification-${mode}.xcresult`);
const summaryFile = join(resultsRoot, `summary-${mode}.json`);
const derivedData = join(resultsRoot, `derived-data-${mode}`);
const visualOutput = join(resultsRoot, `visual-${mode}`);
const visualBaselines = join(root, 'tests', 'native', 'ios', 'baselines', 'iphone-17-pro-ios-26.5');
const onlyTesting = process.env.IOS_ONLY_TESTING;

function run(command, args, label, options = {}) {
  console.log(`\n=== ${label} ===`);
  const { logFile, ...spawnOptions } = options;
  let logDescriptor;
  if (logFile) {
    mkdirSync(resolve(logFile, '..'), { recursive: true });
    logDescriptor = openSync(logFile, 'w');
    spawnOptions.stdio = ['ignore', logDescriptor, logDescriptor];
  }
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, CI: process.env.CI ?? '1' },
    stdio: 'inherit',
    ...spawnOptions,
  });
  if (logDescriptor !== undefined) closeSync(logDescriptor);
  if (result.error) throw result.error;
  if (logFile && result.status !== 0 && existsSync(logFile)) {
    const tail = readFileSync(logFile, 'utf8').split('\n').slice(-80).join('\n');
    console.error(`\n${label} failed. Tail of ${logFile}:\n${tail}`);
  }
  return result.status ?? 1;
}

if (Number(process.versions.node.split('.')[0]) < 22) {
  console.error(`iOS certification requires Node 22; found ${process.version}.`);
  process.exit(1);
}

mkdirSync(resultsRoot, { recursive: true });
if (existsSync(resultBundle)) rmSync(resultBundle, { recursive: true, force: true });
if (existsSync(visualOutput)) rmSync(visualOutput, { recursive: true, force: true });
mkdirSync(visualOutput, { recursive: true });

const simctl = run('/usr/bin/xcrun', ['simctl', 'list', 'devices', 'available'], 'VALIDATE SIMULATOR', { stdio: 'pipe' });
if (simctl !== 0) process.exit(simctl);

if (!existsSync(workspace)) {
  const npmCommand = process.env.npm_execpath ? process.execPath : 'npm';
  const npmArgs = process.env.npm_execpath
    ? [process.env.npm_execpath, 'exec', '-w', '@precision-calm/reference', '--', 'expo', 'prebuild']
    : ['exec', '-w', '@precision-calm/reference', '--', 'expo', 'prebuild'];
  const prebuild = run(npmCommand, npmArgs, 'GENERATE IOS PROJECT');
  if (prebuild !== 0) process.exit(prebuild);
}

const generated = run(process.execPath, ['scripts/generate-ios-ui-test-project.mjs'], 'GENERATE XCUITEST TARGET');
if (generated !== 0) process.exit(generated);

const configuration = mode === 'debug' ? 'Debug' : 'Release';
const args = [
  'test',
  '-workspace', workspace,
  '-scheme', 'ExpoBaseReferenceUITests',
  '-configuration', configuration,
  '-destination', `platform=iOS Simulator,id=${deviceId}`,
  '-derivedDataPath', derivedData,
  '-resultBundlePath', resultBundle,
  '-parallel-testing-enabled', 'NO',
  'CODE_SIGNING_ALLOWED=NO',
  'CODE_SIGNING_REQUIRED=NO',
];
if (onlyTesting) {
  for (const testTarget of onlyTesting.split(',').map((value) => value.trim()).filter(Boolean)) {
    args.push(`-only-testing:ExpoBaseReferenceUITests/ExpoBaseNativeUITests/${testTarget}`);
  }
}

const xcodeLog = join(resultsRoot, `xcodebuild-${mode}.log`);
const status = run('/usr/bin/xcodebuild', args, `RUN IOS ${mode.toUpperCase()} XCUITEST CERTIFICATION`, { logFile: xcodeLog });
if (status === 0 && mode === 'release' && !onlyTesting) {
  const exportedVisuals = join(resultsRoot, `visual-export-${mode}`);
  if (existsSync(exportedVisuals)) rmSync(exportedVisuals, { recursive: true, force: true });
  const exportStatus = run('/usr/bin/xcrun', ['xcresulttool', 'export', 'attachments', '--path', resultBundle, '--output-path', exportedVisuals], 'EXPORT IOS RELEASE VISUAL EVIDENCE', { stdio: 'pipe' });
  if (exportStatus !== 0) process.exit(exportStatus);

  const manifest = JSON.parse(readFileSync(join(exportedVisuals, 'manifest.json'), 'utf8'));
  const attachments = manifest.flatMap((test) => test.attachments ?? []);
  for (const baselineFile of readdirSync(visualBaselines).filter((file) => file.endsWith('.png'))) {
    const prefix = `${basename(baselineFile, '.png')}_0_`;
    const attachment = attachments.find((candidate) => candidate.suggestedHumanReadableName?.startsWith(prefix));
    if (!attachment) {
      console.error(`Missing native screenshot attachment for baseline ${baselineFile}.`);
      process.exit(1);
    }
    copyFileSync(join(exportedVisuals, attachment.exportedFileName), join(visualOutput, baselineFile));
  }
  rmSync(exportedVisuals, { recursive: true, force: true });

  const visualStatus = run('/usr/bin/swift', [join(root, 'scripts', 'compare-ios-native-visuals.swift'), visualBaselines, visualOutput], 'COMPARE IOS RELEASE VISUAL BASELINES');
  if (visualStatus !== 0) process.exit(visualStatus);
}
if (existsSync(resultBundle)) {
  const summaryResult = spawnSync('/usr/bin/xcrun', ['xcresulttool', 'get', 'test-results', 'summary', '--path', resultBundle, '--format', 'json'], { cwd: root, encoding: 'utf8' });
  if (summaryResult.status === 0) {
    writeFileSync(summaryFile, `${summaryResult.stdout.trim()}\n`);
    console.log(`\nSaved native certification summary to ${summaryFile}`);
  } else {
    console.warn('The XCUITest result bundle was created, but xcresulttool summary extraction failed. The bundle remains available for inspection.');
  }
}
process.exit(status);
