import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const failures = [];

function fail(message) { failures.push(message); }
function readJson(file) { return JSON.parse(readFileSync(join(root, file), 'utf8')); }
function git(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(' ')} failed`);
  return result.stdout.trim();
}
function sourceTreeHash() {
  const files = git(['ls-files', '-z']).split('\0').filter(Boolean).filter((file) => file !== 'release-candidate.certification.json');
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update('\0');
    hash.update(createHash('sha256').update(readFileSync(join(root, file))).digest('hex'));
    hash.update('\n');
  }
  return hash.digest('hex');
}
function checkScript(file, args = []) {
  const result = spawnSync(process.execPath, [file, ...args], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) fail(`${file} failed: ${(result.stderr || result.stdout || '').trim()}`);
}

if (!process.argv.includes('--check')) {
  console.error('Use npm run release:verify for the deterministic release-readiness check.');
  process.exit(2);
}

const packageJson = readJson('package.json');
const compatibility = readJson('precision.compatibility.json');
const manifest = readJson('ios.certification.json');
const recordPath = 'release-candidate.certification.json';
if (packageJson.version !== '1.0.0') fail('Root package version must be 1.0.0.');
if (compatibility.expo !== packageJson.dependencies.expo || compatibility.react !== packageJson.dependencies.react || compatibility['react-native'] !== packageJson.dependencies['react-native']) fail('Compatibility manifest does not match root runtime versions.');
if (packageJson.devDependencies?.xcode !== '3.0.1') fail('The first-party xcode tooling dependency must be a direct exact devDependency at 3.0.1.');
for (const file of [
  'docs/RELEASE_CANDIDATE_1_0.md', 'docs/IOS_NATIVE_ACCEPTANCE.md', 'docs/RELEASE_READINESS.md',
  'ios.certification.json', 'golden.certification.json', 'mobile.certification.json',
]) if (!existsSync(join(root, file))) fail(`Required release governance artifact is missing: ${file}`);
if (git(['ls-files', 'apps/reference/ios', 'apps/reference/android'])) fail('Generated apps/reference native directories must remain untracked under CNG.');

checkScript('scripts/check-ios-certification-manifest.mjs');
checkScript('scripts/check-native-ui-selector-contracts.mjs');
checkScript('scripts/check-cng-freshness.mjs');
checkScript('scripts/test-ios-simulator-resolution.mjs');
checkScript('scripts/check-package-manifests.mjs');
checkScript('scripts/check-public-api.mjs');
checkScript('scripts/check-dependency-graph.mjs');

if (!existsSync(join(root, recordPath))) {
  fail(`${recordPath} is missing; run the deliberate writer after npm run ios:verify and review the result.`);
} else {
  const record = readJson(recordPath);
  if (record.schemaVersion !== 1 || record.project !== 'expo-base' || record.version !== packageJson.version) fail('Certification record schema/project/version is invalid.');
  if (!/^[0-9a-f]{40}$/.test(record.certifiedCommit ?? '')) fail('Certification record must contain a full certified commit SHA.');
  else if (spawnSync('git', ['cat-file', '-e', `${record.certifiedCommit}^{commit}`], { cwd: root }).status !== 0) fail('Certification record certifiedCommit is not a repository commit.');
  if (record.sourceTreeHash !== sourceTreeHash()) fail('Certification record sourceTreeHash does not match the current executable source tree.');
  if (record.native?.profileId !== manifest.profiles?.[0]?.id || record.native?.device !== manifest.profiles?.[0]?.device || record.native?.runtime !== manifest.profiles?.[0]?.runtime) fail('Certification record native profile does not match ios.certification.json.');
  const baselineDir = join(root, 'tests', 'native', 'ios', 'baselines', manifest.profiles?.[0]?.id ?? '');
  const baselineCount = existsSync(baselineDir) ? readdirSync(baselineDir).filter((file) => file.endsWith('.png')).length : 0;
  if (record.native?.releaseTestsPassed !== 17 || record.native?.visualBaselinesPassed !== baselineCount || baselineCount !== 9) fail('Certification record native test or baseline counts are invalid.');
  if (!record.native?.resultBundle || record.native.resultBundle.includes('/Users/')) fail('Certification record must use repository-relative evidence paths.');
  const hostedNames = new Set((record.hostedChecks ?? []).filter((check) => check.required).map((check) => check.name));
  for (const required of ['runtime-web', 'structural', 'mobile', 'golden']) if (!hostedNames.has(required)) fail(`Certification record is missing required hosted check ${required}.`);
  for (const severity of ['P0', 'P1', 'P2']) if (record.openSeverityCounts?.[severity] !== 0) fail(`Open ${severity} count must be zero.`);
  if (record.android?.policy !== 'B' || record.android.status !== 'deferred/waived') fail('Android Policy B waiver must be explicit.');
  if (!/VoiceOver/i.test(record.boundaries?.voiceOver ?? '') || !/Dynamic Type/i.test(record.boundaries?.dynamicType ?? '') || !/physical/i.test(record.boundaries?.physicalDevice ?? '')) fail('VoiceOver, Dynamic Type, and physical-device boundaries must be explicit.');
}

const status = git(['status', '--short']);
if (status) fail('Worktree must be clean for release readiness.');
if (failures.length) {
  console.error(`Release readiness blocked with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Expo Base release readiness passed: version, source identity, native governance, manifests, API/dependency boundaries, and certification record are consistent.');
