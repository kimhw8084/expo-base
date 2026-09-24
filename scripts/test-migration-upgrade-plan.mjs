import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const historicalGeneratorCommit = '43ae1b27257697093d893d504b7e22b6f25cfad7';
const targetBaselineCommit = 'd8ca9e65a0dea3a0a8a381d22428524787de0aa9';
const targetBaselineTree = 'fdedb4330662eca5936324b19e3271e7e45ca056';
const executingCommit = gitText(root, ['rev-parse', 'HEAD']);
const executingTree = gitText(root, ['rev-parse', `${executingCommit}^{tree}`]);
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-base-chg201-'));
const historicalRoot = path.join(temporaryRoot, 'historical-source');
const targetRoot = path.join(temporaryRoot, 'target-baseline');
const generatedSourceRoot = path.join(temporaryRoot, 'generated-source');
const siteLedger = path.join(temporaryRoot, 'site-ledger');
const freshOne = path.join(temporaryRoot, 'fresh-one');
const freshTwo = path.join(temporaryRoot, 'fresh-two');
const planner = path.join(root, 'packages/migrate-expo-base-app/bin/expo-base-migrate-upgrade-plan.mjs');
let historicalWorktreeAdded = false;
let targetWorktreeAdded = false;
let generatedSourceWorktreeAdded = false;

try {
  const targetWorktree = git(root, ['worktree', 'add', '--detach', targetRoot, targetBaselineCommit]);
  assert.equal(targetWorktree.status, 0, targetWorktree.stderr || targetWorktree.stdout);
  targetWorktreeAdded = true;
  assert.equal(gitText(targetRoot, ['rev-parse', 'HEAD']), targetBaselineCommit);
  assert.equal(gitText(targetRoot, ['rev-parse', 'HEAD^{tree}']), targetBaselineTree, 'historical-to-current target baseline tree must remain exact');

  const generatedSourceWorktree = git(root, ['worktree', 'add', '--detach', generatedSourceRoot, executingCommit]);
  assert.equal(generatedSourceWorktree.status, 0, generatedSourceWorktree.stderr || generatedSourceWorktree.stdout);
  generatedSourceWorktreeAdded = true;
  assert.equal(gitText(generatedSourceRoot, ['rev-parse', 'HEAD']), executingCommit);
  assert.equal(gitText(generatedSourceRoot, ['rev-parse', 'HEAD^{tree}']), executingTree);
  assert.equal(gitText(generatedSourceRoot, ['status', '--porcelain']), '', 'generated fixtures must use a clean committed source worktree');

  const worktree = git(root, ['worktree', 'add', '--detach', historicalRoot, historicalGeneratorCommit]);
  assert.equal(worktree.status, 0, worktree.stderr || worktree.stdout);
  historicalWorktreeAdded = true;
  const historicalGeneration = run(process.execPath, [
    path.join(historicalRoot, 'packages/create-expo-base-app/bin/create-expo-base-app.mjs'),
    '--name', 'Site Ledger', '--slug', 'site-ledger', '--accent', 'green',
    '--capabilities', 'runtime-signals', '--mode', 'standalone', '--directory', siteLedger,
  ], historicalRoot);
  assert.equal(historicalGeneration.status, 0, historicalGeneration.stderr || historicalGeneration.stdout);
  const historicalProvenancePath = path.join(siteLedger, '.expo-base/source.json');
  const historicalProvenance = readJson(historicalProvenancePath);
  assert.equal(historicalProvenance.sourceCommit, historicalGeneratorCommit);
  const historicalTree = gitText(root, ['rev-parse', `${historicalGeneratorCommit}^{tree}`]);
  assert.equal(historicalProvenance.sourceTree, undefined, 'the exact historical generator predates the sourceTree field');
  assert.equal(fs.existsSync(path.join(siteLedger, '.expo-base/generated-files.json')), false, 'the historical Site Ledger baseline must remain pre-manifest');

  const productRoute = path.join(siteLedger, 'app/index.tsx');
  fs.appendFileSync(productRoute, '\n// Product route and copy fixture: Site Ledger ledger content remains product-owned.\n');
  fs.appendFileSync(path.join(siteLedger, 'services.ts'), '\n// Product domain fixture: Site Ledger entry API remains product-owned.\n');
  const siteLedgerPackage = readJson(path.join(siteLedger, 'package.json'));
  siteLedgerPackage.dependencies.expo = '0.0.0-chg201-fixture';
  fs.writeFileSync(path.join(siteLedger, 'package.json'), `${JSON.stringify(siteLedgerPackage, null, 2)}\n`);

  const historicalChangedPaths = gitText(targetRoot, ['diff', '--name-only', `${historicalGeneratorCommit}..${targetBaselineCommit}`, '--', 'packages'])
    .split('\n').filter(Boolean).sort();
  const vendoredPackageDirectories = new Set(fs.readdirSync(path.join(siteLedger, 'packages')));
  const platformEditSourcePath = historicalChangedPaths.find((sourcePath) => {
    if (!/\.(?:ts|tsx|js|jsx)$/.test(sourcePath) || sourcePath.endsWith('/package.json')) return false;
    const [packagesDir, packageName, ...relative] = sourcePath.split('/');
    const outputPath = path.join(siteLedger, packagesDir, packageName, ...relative);
    return packagesDir === 'packages' && vendoredPackageDirectories.has(packageName) && fs.existsSync(outputPath);
  });
  assert.ok(platformEditSourcePath, 'historical Site Ledger must vendor a platform source file changed by the target');
  const platformEditPath = path.join(siteLedger, platformEditSourcePath);
  fs.appendFileSync(platformEditPath, '\n// Deterministic Site Ledger platform customization fixture.\n');

  const beforeFirstPlan = fingerprint(siteLedger);
  const first = runPlan(siteLedger, targetRoot);
  assert.equal(first.status, 0, first.stderr || first.stdout);
  const afterFirstPlan = fingerprint(siteLedger);
  assert.deepEqual(afterFirstPlan, beforeFirstPlan, 'planner must leave the historical consumer tree and all file bytes unchanged');
  const second = runPlan(siteLedger, targetRoot);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  assert.equal(second.stdout, first.stdout, 'same source/consumer/target tuple must produce byte-identical semantic JSON');
  assert.deepEqual(fingerprint(siteLedger), beforeFirstPlan, 'second planner execution must also be read-only');
  const historicalPlan = JSON.parse(first.stdout);
  assert.equal(historicalPlan.mode, 'advisory-read-only');
  assert.equal(historicalPlan.consumerMutations, 'none');
  assert.equal(historicalPlan.provenance.historicalSource.commit, historicalGeneratorCommit);
  assert.equal(historicalPlan.provenance.historicalSource.tree, historicalTree);
  assert.equal(historicalPlan.provenance.historicalSource.treeEvidence, 'derived-from-exact-recorded-commit; historical generator has no sourceTree field');
  assert.equal(historicalPlan.provenance.targetSource.commit, targetBaselineCommit);
  assert.ok(historicalPlan.sections.safePlatformCarryForward.length > 0, 'untouched vendored platform files must be safe carry-forward candidates');
  assert.ok(historicalPlan.sections.manualAndConcurrentReview.some((file) => file.path === platformEditSourcePath && file.classification === 'concurrent-change'));
  assert.ok(historicalPlan.sections.productOwnedPreserved.some((file) => file.path === 'app/index.tsx'));
  assert.ok(historicalPlan.sections.productOwnedPreserved.some((file) => file.path === 'services.ts'));
  assert.ok(historicalPlan.sections.dependencyAlignment.some((item) => item.name === 'expo' && item.currentValue === '0.0.0-chg201-fixture' && item.targetCompatibilityValue && item.recommendedAction === 'align-to-target-compatibility'));
  assert.equal(historicalPlan.sections.dependencyAlignment.some((item) => item.name === 'expo-haptics'), false, 'planner must not suggest adding an unselected optional capability');

  const reportPath = path.join(temporaryRoot, 'site-ledger-upgrade-plan.json');
  const reportBefore = fingerprint(siteLedger);
  const reportWrite = run(process.execPath, [planner, '--path', siteLedger, '--source-root', targetRoot, '--json', '--output', reportPath], root);
  assert.equal(reportWrite.status, 0, reportWrite.stderr || reportWrite.stdout);
  assert.equal(reportWrite.stdout, '');
  assert.deepEqual(JSON.parse(fs.readFileSync(reportPath, 'utf8')), historicalPlan);
  assert.deepEqual(fingerprint(siteLedger), reportBefore, 'explicit report output must not write into the consumer');
  const reportBytes = fs.readFileSync(reportPath);
  const overwrite = run(process.execPath, [planner, '--path', siteLedger, '--source-root', targetRoot, '--json', '--output', reportPath], root);
  assert.notEqual(overwrite.status, 0, 'report output must refuse to overwrite an existing file');
  assert.deepEqual(fs.readFileSync(reportPath), reportBytes);

  const freshArgs = [
    '--name', 'CHG201 Manifest Ledger', '--slug', 'chg201-manifest-ledger', '--accent', 'green',
    '--capabilities', 'runtime-signals', '--mode', 'standalone',
  ];
  for (const destination of [freshOne, freshTwo]) {
    const generated = run(process.execPath, [
      path.join(generatedSourceRoot, 'packages/create-expo-base-app/bin/create-expo-base-app.mjs'),
      ...freshArgs, '--directory', destination,
    ], generatedSourceRoot);
    assert.equal(generated.status, 0, generated.stderr || generated.stdout);
  }

  const freshProvenance = readJson(path.join(freshOne, '.expo-base/source.json'));
  assert.equal(freshProvenance.sourceCommit, executingCommit, 'fresh manifest provenance must name the committed generator source');
  assert.equal(freshProvenance.sourceTree, executingTree, 'fresh manifest provenance must name the committed generator source tree');
  const freshTwoProvenance = readJson(path.join(freshTwo, '.expo-base/source.json'));
  assert.equal(freshTwoProvenance.sourceCommit, executingCommit);
  assert.equal(freshTwoProvenance.sourceTree, executingTree);

  const manifestOneBytes = fs.readFileSync(path.join(freshOne, '.expo-base/generated-files.json'));
  const manifestTwoBytes = fs.readFileSync(path.join(freshTwo, '.expo-base/generated-files.json'));
  assert.deepEqual(manifestOneBytes, manifestTwoBytes, 'repeated generation must emit byte-identical ownership manifests');
  const manifest = JSON.parse(manifestOneBytes.toString('utf8'));
  assert.equal(manifest.schemaVersion, 1);
  assert.deepEqual(manifest.generationProfile.capabilities, ['runtime-signals']);
  assert.equal(manifest.files.some((entry) => entry.path === '.expo-base/generated-files.json'), false, 'manifest does not recursively hash itself');
  for (const entry of manifest.files) {
    const actual = fs.readFileSync(path.join(freshOne, ...entry.path.split('/')));
    assert.equal(entry.contentHash, sha256(actual), `generation-time hash for ${entry.path}`);
    assert.ok(['platform-owned', 'platform-generated', 'product-seed'].includes(entry.ownership), entry.path);
    if (entry.sourceOrigin !== null) assert.ok(entry.sourceOrigin && !entry.sourceOrigin.startsWith('/'), entry.path);
  }
  const routeEntry = manifest.files.find((entry) => entry.path === 'app/index.tsx');
  assert.equal(routeEntry.ownership, 'product-seed');
  const serviceEntry = manifest.files.find((entry) => entry.path === 'services.ts');
  assert.equal(serviceEntry.ownership, 'product-seed');
  const platformEntry = manifest.files.find((entry) => entry.ownership === 'platform-owned' && entry.path.startsWith('packages/') && /\.(?:ts|tsx|js|jsx)$/.test(entry.path));
  assert.ok(platformEntry, 'manifest includes platform-owned vendored source');
  const generatedConfig = manifest.files.find((entry) => entry.path === 'app.config.ts');
  assert.equal(generatedConfig.ownership, 'platform-generated');
  const generatedBaseTsconfig = manifest.files.find((entry) => entry.path === 'tsconfig.base.json');
  assert.equal(generatedBaseTsconfig.ownership, 'platform-generated');
  assert.equal(generatedBaseTsconfig.sourceOrigin, 'tsconfig.base.json');

  const freshBefore = fingerprint(freshOne);
  const freshPlanRun = runPlan(freshOne);
  assert.equal(freshPlanRun.status, 0, freshPlanRun.stderr || freshPlanRun.stdout);
  const freshPlan = JSON.parse(freshPlanRun.stdout);
  assert.ok(freshPlan.sections.alreadyCurrent.length > 0, 'same-source current app must report already-current platform output');
  assert.ok(freshPlan.sections.productOwnedPreserved.some((file) => file.path === 'app/index.tsx'));
  assert.deepEqual(fingerprint(freshOne), freshBefore, 'same-source planner must not write consumer files');
  const humanPlan = run(process.execPath, [planner, '--path', freshOne, '--source-root', generatedSourceRoot], root);
  assert.equal(humanPlan.status, 0, humanPlan.stderr || humanPlan.stdout);
  for (const heading of ['1. Exact source and provenance identity', '2. Safe platform carry-forward candidates', '3. Dependency alignment', '4. Manual or concurrent review', '5. Product-owned files explicitly preserved', '7. Required post-migration verification']) assert.ok(humanPlan.stdout.includes(heading), heading);
  assert.equal(humanPlan.stdout.includes(freshOne), false, 'human report should not embed unstable absolute consumer paths');
  assert.deepEqual(fingerprint(freshOne), freshBefore, 'human output must also be read-only');

  fs.appendFileSync(path.join(freshOne, 'app/index.tsx'), '\n// Product-owned route edit.\n');
  fs.appendFileSync(path.join(freshOne, ...platformEntry.path.split('/')), '\n// Intentional platform-owned file edit.\n');
  const changedFresh = JSON.parse(runPlan(freshOne, generatedSourceRoot).stdout);
  assert.ok(changedFresh.sections.productOwnedPreserved.some((file) => file.path === 'app/index.tsx'));
  assert.ok(changedFresh.sections.manualAndConcurrentReview.some((file) => file.path === platformEntry.path && file.classification === 'consumer-modified'));

  const invalidConsumer = path.join(temporaryRoot, 'invalid-consumer');
  fs.mkdirSync(path.join(invalidConsumer, '.expo-base'), { recursive: true });
  const missingProvenance = runPlan(invalidConsumer);
  assert.notEqual(missingProvenance.status, 0, 'missing provenance must fail closed');
  assert.match(missingProvenance.stderr, /source\.json is missing/);
  fs.writeFileSync(path.join(invalidConsumer, '.expo-base/source.json'), '{broken');
  const invalidProvenance = runPlan(invalidConsumer);
  assert.notEqual(invalidProvenance.status, 0, 'malformed provenance must fail closed');
  assert.match(invalidProvenance.stderr, /malformed JSON/);
  fs.writeFileSync(path.join(invalidConsumer, '.expo-base/source.json'), `${JSON.stringify({ ...historicalProvenance, sourceTree: '0'.repeat(40) }, null, 2)}\n`);
  const mismatchedTree = runPlan(invalidConsumer);
  assert.notEqual(mismatchedTree.status, 0, 'a recorded historical source tree mismatch must fail closed');
  assert.match(mismatchedTree.stderr, /Historical source tree mismatch/);
  fs.writeFileSync(path.join(invalidConsumer, '.expo-base/source.json'), `${JSON.stringify({ ...historicalProvenance, sourceRepository: 'https://example.invalid/other-product' }, null, 2)}\n`);
  const incompatibleRepository = runPlan(invalidConsumer);
  assert.notEqual(incompatibleRepository.status, 0, 'incompatible source repository identities must fail closed');
  assert.match(incompatibleRepository.stderr, /incompatible/);
  fs.writeFileSync(path.join(invalidConsumer, '.expo-base/source.json'), `${JSON.stringify({ ...historicalProvenance, sourceCommit: '0'.repeat(40) }, null, 2)}\n`);
  const unresolvedCommit = runPlan(invalidConsumer);
  assert.notEqual(unresolvedCommit.status, 0, 'unresolvable historical source commits must fail closed');
  assert.match(unresolvedCommit.stderr, /historical source commit/);
  const currentProvenanceWithoutTree = readJson(path.join(freshOne, '.expo-base/source.json'));
  delete currentProvenanceWithoutTree.sourceTree;
  fs.writeFileSync(path.join(invalidConsumer, '.expo-base/source.json'), `${JSON.stringify(currentProvenanceWithoutTree, null, 2)}\n`);
  const unexpectedMissingTree = runPlan(invalidConsumer);
  assert.notEqual(unexpectedMissingTree.status, 0, 'missing sourceTree must fail when the exact historical generator records it');
  assert.match(unexpectedMissingTree.stderr, /sourceTree is missing/);
  const unresolvedTarget = runPlan(freshOne, path.join(temporaryRoot, 'not-a-source-checkout'));
  assert.notEqual(unresolvedTarget.status, 0, 'unresolvable target source roots must fail closed');
  assert.match(unresolvedTarget.stderr, /target source root/i);

  const safeExample = historicalPlan.sections.safePlatformCarryForward[0];
  const conflictExample = historicalPlan.sections.manualAndConcurrentReview.find((file) => file.classification === 'concurrent-change');
  console.log(`Historical Site Ledger lineage passed: safe=${historicalPlan.sections.safePlatformCarryForward.length}, concurrent=${historicalPlan.sections.manualAndConcurrentReview.filter((file) => file.classification === 'concurrent-change').length}, product=${historicalPlan.sections.productOwnedPreserved.length}, dependencyRows=${historicalPlan.sections.dependencyAlignment.length}, dependencyAlignments=${historicalPlan.sections.dependencyAlignment.filter((item) => item.recommendedAction === 'align-to-target-compatibility').length}`);
  console.log(`Classification counts: ${JSON.stringify(historicalPlan.counts)}`);
  console.log(`Examples: safe=${safeExample.path}; conflict=${conflictExample.path}; product=app/index.tsx`);
  console.log(`Manifest checks passed: ${manifest.files.length} governed paths; platform edit detected at ${platformEntry.path}.`);
  console.log(`Deterministic Fabric evidence SHA-256: plan=${sha256(Buffer.from(first.stdout))}; manifest=${sha256(manifestOneBytes)}.`);
} finally {
  if (historicalWorktreeAdded) {
    const remove = git(root, ['worktree', 'remove', '--force', historicalRoot]);
    if (remove.status !== 0) process.stderr.write(`Unable to remove temporary historical worktree: ${remove.stderr || remove.stdout}`);
  }
  if (targetWorktreeAdded) {
    const remove = git(root, ['worktree', 'remove', '--force', targetRoot]);
    if (remove.status !== 0) process.stderr.write(`Unable to remove temporary target worktree: ${remove.stderr || remove.stdout}`);
  }
  if (generatedSourceWorktreeAdded) {
    const remove = git(root, ['worktree', 'remove', '--force', generatedSourceRoot]);
    if (remove.status !== 0) process.stderr.write(`Unable to remove temporary generated-source worktree: ${remove.stderr || remove.stdout}`);
  }
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}

function runPlan(consumer, sourceRoot = generatedSourceRoot) {
  return run(process.execPath, [planner, '--path', consumer, '--source-root', sourceRoot, '--json'], root);
}

function run(command, args, cwd) {
  return spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

function git(cwd, args) {
  return spawnSync('git', ['-C', cwd, ...args], { cwd: root, encoding: 'utf8' });
}

function gitText(cwd, args) {
  const result = git(cwd, args);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function fingerprint(directory) {
  const records = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const full = path.join(current, entry.name);
      const relative = path.relative(directory, full).split(path.sep).join('/');
      if (entry.isDirectory()) {
        records.push({ path: relative, type: 'directory' });
        visit(full);
      } else if (entry.isSymbolicLink()) {
        records.push({ path: relative, type: 'symlink', target: fs.readlinkSync(full) });
      } else if (entry.isFile()) {
        records.push({ path: relative, type: 'file', sha256: sha256(fs.readFileSync(full)) });
      }
    }
  };
  visit(directory);
  return records;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
