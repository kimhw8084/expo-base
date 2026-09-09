import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifestPath = join(root, 'ios.certification.json');
const sourcePath = join(root, 'tests', 'native', 'ios', 'ExpoBaseNativeUITests.swift');
const generatorPath = join(root, 'scripts', 'generate-ios-ui-test-project.mjs');
const allowed = new Set(['AUTOMATED_XCUITEST', 'AUTOMATED_CONTRACT', 'SIMULATOR_LIMITED', 'PHYSICAL_DEVICE_REQUIRED', 'SUBJECTIVE_HUMAN_REVIEW']);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const source = readFileSync(sourcePath, 'utf8');
const generator = readFileSync(generatorPath, 'utf8');
const failures = [];
const ids = new Set();

if (manifest.schemaVersion !== 2) failures.push(`Unsupported schemaVersion: ${manifest.schemaVersion}`);
if (!manifest.app?.bundleIdentifier || !manifest.app?.nativeTestTarget) failures.push('app.bundleIdentifier and app.nativeTestTarget are required.');
if (!Array.isArray(manifest.profiles) || manifest.profiles.length === 0) failures.push('At least one simulator profile is required.');
const profileIds = new Set();
for (const profile of manifest.profiles ?? []) {
  if (!profile.id || profileIds.has(profile.id)) failures.push(`Simulator profile IDs must be unique: ${profile.id ?? '<missing>'}`);
  profileIds.add(profile.id);
  if (profile.platform !== 'iOS Simulator' || !profile.device || !profile.runtime) failures.push(`${profile.id ?? '<missing>'}: platform, device, and runtime are required.`);
  if (Object.hasOwn(profile, 'udid')) failures.push(`${profile.id}: machine-specific udid ownership is forbidden; use IOS_SIMULATOR_UDID only as an override.`);
  const baselineDir = join(root, 'tests', 'native', 'ios', 'baselines', profile.id ?? '');
  if (!existsSync(baselineDir)) failures.push(`${profile.id}: release baseline directory is missing.`);
  else if (!readdirSync(baselineDir).some((file) => file.endsWith('.png'))) failures.push(`${profile.id}: release baseline directory has no PNG baseline.`);
}
if (!manifest.app?.nativeTestTarget || !generator.includes(manifest.app.nativeTestTarget)) failures.push('Native test target is not owned by the first-party generator.');
if (!manifest.evidenceRegistry || typeof manifest.evidenceRegistry !== 'object') failures.push('evidenceRegistry is required.');
const evidenceRegistry = manifest.evidenceRegistry ?? {};
for (const [evidenceId, evidence] of Object.entries(evidenceRegistry)) {
  if (!evidence?.kind) failures.push(`Evidence ${evidenceId} must declare kind.`);
  if (evidence?.test && !source.includes(`func ${evidence.test}(`)) failures.push(`Evidence ${evidenceId}: test function ${evidence.test} is not present in the Swift suite.`);
}
for (const scenario of manifest.scenarios ?? []) {
  if (!scenario.id || ids.has(scenario.id)) failures.push(`Scenario IDs must be unique: ${scenario.id ?? '<missing>'}`);
  ids.add(scenario.id);
  if (!allowed.has(scenario.automation)) failures.push(`${scenario.id}: unsupported automation disposition ${scenario.automation}`);
  if (!scenario.category || !scenario.route) failures.push(`${scenario.id}: category and route are required.`);
  if (scenario.automation === 'AUTOMATED_XCUITEST') {
    if (!scenario.test) failures.push(`${scenario.id}: AUTOMATED_XCUITEST requires test.`);
    else if (!source.includes(`func ${scenario.test}(`)) failures.push(`${scenario.id}: test function ${scenario.test} is not present in the Swift suite.`);
    if (!Array.isArray(scenario.evidence) || scenario.evidence.length === 0) failures.push(`${scenario.id}: AUTOMATED_XCUITEST requires evidence references.`);
  }
  if (scenario.automation === 'AUTOMATED_CONTRACT') {
    if (!scenario.command) failures.push(`${scenario.id}: AUTOMATED_CONTRACT requires command.`);
    if (!Array.isArray(scenario.evidence) || scenario.evidence.length === 0) failures.push(`${scenario.id}: AUTOMATED_CONTRACT requires evidence references.`);
  }
  for (const evidenceId of scenario.evidence ?? []) {
    if (!evidenceRegistry[evidenceId]) failures.push(`${scenario.id}: evidence reference ${evidenceId} is not registered.`);
  }
  if (scenario.automation === 'SIMULATOR_LIMITED' && !scenario.reason) failures.push(`${scenario.id}: SIMULATOR_LIMITED requires reason.`);
  if ((scenario.automation === 'PHYSICAL_DEVICE_REQUIRED' || scenario.automation === 'SUBJECTIVE_HUMAN_REVIEW') && !scenario.reason) failures.push(`${scenario.id}: boundary dispositions require reason.`);
}
for (const boundary of manifest.boundaries ?? []) {
  if (!boundary.id || !allowed.has(boundary.automation) || !boundary.reason) failures.push(`Invalid boundary: ${boundary.id ?? '<missing>'}`);
}
if ((manifest.scenarios ?? []).some((scenario) => scenario.automation === 'UNCLASSIFIED')) failures.push('UNCLASSIFIED scenarios are forbidden.');

if (failures.length) {
  console.error(`iOS certification manifest failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`iOS certification manifest passed: ${manifest.scenarios.length} scenarios, ${manifest.boundaries.length} explicit boundaries.`);
