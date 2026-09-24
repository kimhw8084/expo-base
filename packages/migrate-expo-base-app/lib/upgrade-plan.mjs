import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { planDependencyAlignment } from './dependency-audit.mjs';

const HASH_RE = /^[a-f0-9]{40}$/;
const CONTENT_HASH_RE = /^[a-f0-9]{64}$/;
const MANIFEST_OWNERSHIP = new Set(['platform-owned', 'platform-generated', 'product-seed']);
const LEGACY_TOOL_PATHS = [
  'scripts/check-golden-architecture.mjs',
  'scripts/golden-architecture-lib.mjs',
  'scripts/golden-catalog-lib.mjs',
  'scripts/golden-pattern-lib.mjs',
  'scripts/check-golden-patterns.mjs',
  'scripts/generate-golden-catalog-docs.mjs',
  'scripts/generate-golden-pattern-docs.mjs',
  'scripts/check-task-effects.mjs',
  'scripts/serve-static-web.mjs',
  'scripts/verify-acceptance.mjs',
];
const LEGACY_PRODUCT_PATHS = [
  'services.ts', 'serverState.ts', 'brand.ts', 'auth.ts', 'sessionSecurity.ts',
  'linking.ts', 'routes.ts', '.env.example', 'public/favicon.svg',
];
const IGNORED_SOURCE_SEGMENTS = new Set(['node_modules', '.git', '.expo', 'dist']);
const SOURCE_TREE_CACHE = new Map();

export function createUpgradePlan({ consumerRoot, targetSourceRoot }) {
  const consumer = path.resolve(consumerRoot);
  const targetRoot = path.resolve(targetSourceRoot);
  const provenance = readRequiredJson(path.join(consumer, '.expo-base/source.json'), 'consumer .expo-base/source.json');
  validateProvenance(provenance);

  const target = resolveTargetIdentity(targetRoot);
  if (normalizeRepositoryIdentity(provenance.sourceRepository) !== target.repositoryIdentity) {
    throw new Error(`Consumer source repository ${provenance.sourceRepository} is incompatible with target ${target.sourceRepository}.`);
  }
  const historicalCommit = resolveCommit(targetRoot, provenance.sourceCommit, 'historical source commit');
  const historicalTree = gitText(targetRoot, ['rev-parse', `${historicalCommit}^{tree}`], 'historical source tree');
  if (provenance.sourceTree && historicalTree !== provenance.sourceTree) {
    throw new Error(`Historical source tree mismatch: source.json records ${provenance.sourceTree}, Git resolves ${historicalTree}.`);
  }
  if (!provenance.sourceTree) {
    const historicalGenerator = gitFile(targetRoot, historicalCommit, 'packages/create-expo-base-app/bin/create-expo-base-app.mjs');
    if (!historicalGenerator || /sourceTree\s*:/.test(historicalGenerator.bytes.toString('utf8'))) {
      throw new Error('Consumer sourceTree is missing, and the exact historical generator does not prove a pre-sourceTree provenance format.');
    }
  }
  const historicalTreeEvidence = provenance.sourceTree
    ? 'recorded-and-verified'
    : 'derived-from-exact-recorded-commit; historical generator has no sourceTree field';

  const compatibility = readGitJson(targetRoot, target.commit, 'expo-base.compatibility.json', 'target dependency compatibility authority');
  const dependencies = planDependencyAlignment(consumer, compatibility);
  const manifestPath = path.join(consumer, '.expo-base/generated-files.json');
  const hasManifest = fs.existsSync(manifestPath);
  const manifest = hasManifest ? readRequiredJson(manifestPath, 'consumer .expo-base/generated-files.json') : null;
  if (manifest) validateManifest(manifest);
  const sourceMatchesTarget = historicalCommit === target.commit && historicalTree === target.tree;
  const filePlan = manifest
    ? planManifestFiles({ consumer, targetRoot, historicalCommit, target, manifest, sourceMatchesTarget })
    : planLegacyFiles({ consumer, targetRoot, historicalCommit, target });

  const productOwnedPreserved = filePlan.filter((file) => file.ownershipEvidence.ownership === 'product-seed');
  const safePlatformCarryForward = filePlan.filter((file) => file.classification === 'unchanged-platform-update');
  const alreadyCurrent = filePlan.filter((file) => file.classification === 'already-current');
  const manualAndConcurrentReview = filePlan.filter((file) => ![
    'unchanged-platform-update', 'already-current',
  ].includes(file.classification) && file.ownershipEvidence.ownership !== 'product-seed');

  return {
    schemaVersion: 1,
    mode: 'advisory-read-only',
    consumerMutations: 'none',
    provenance: {
      historicalSource: {
        repository: target.sourceRepository,
        commit: provenance.sourceCommit,
        tree: historicalTree,
        treeEvidence: historicalTreeEvidence,
        sourceVersion: provenance.sourceVersion,
        generatorVersion: provenance.generatorVersion,
        verified: true,
      },
      targetSource: {
        repository: target.sourceRepository,
        commit: target.commit,
        tree: target.tree,
        sourceVersion: target.sourceVersion,
        generatorVersion: target.generatorVersion,
        verified: true,
      },
      relation: sourceMatchesTarget ? 'same-source' : 'source-upgrade',
      ownershipEvidence: manifest ? 'generated-files-manifest' : 'legacy-pre-manifest-source-path-fallback',
    },
    sections: {
      safePlatformCarryForward,
      dependencyAlignment: dependencies,
      manualAndConcurrentReview,
      productOwnedPreserved,
      alreadyCurrent,
      requiredPostMigrationVerification: [
        'Run npm run verify in the consumer repository.',
        'Run npm run verify:acceptance and resolve its product obligations.',
        'Run the consumer product test, build, and release checks required by its own contract.',
        'Preserve the selected capability profile and existing public API or legacy-shim compatibility unless the product explicitly approves a separate change.',
      ],
    },
    counts: summarizeFiles(filePlan),
  };
}

export function renderUpgradePlanHuman(plan) {
  const lines = [
    'Expo Base upgrade plan — advisory and read-only',
    'Consumer source changes: none. This plan does not apply or regenerate files.',
    '',
    '1. Exact source and provenance identity',
    `Historical: ${plan.provenance.historicalSource.repository} @ ${plan.provenance.historicalSource.commit}`,
    `Historical tree: ${plan.provenance.historicalSource.tree} (${plan.provenance.historicalSource.treeEvidence})`,
    `Target: ${plan.provenance.targetSource.repository} @ ${plan.provenance.targetSource.commit}`,
    `Target tree: ${plan.provenance.targetSource.tree} (verified)`,
    `Relationship: ${plan.provenance.relation}; ownership evidence: ${plan.provenance.ownershipEvidence}`,
    '',
    `2. Safe platform carry-forward candidates (${plan.sections.safePlatformCarryForward.length})`,
  ];
  appendFiles(lines, plan.sections.safePlatformCarryForward);
  lines.push('', `3. Dependency alignment (${plan.sections.dependencyAlignment.length})`);
  if (!plan.sections.dependencyAlignment.length) lines.push('- No compatibility-managed dependencies are installed in the consumer root package.');
  for (const item of plan.sections.dependencyAlignment) {
    lines.push(`- ${item.name}: ${item.currentValue} → ${item.targetCompatibilityValue} (${item.recommendedAction})`);
  }
  lines.push('', `4. Manual or concurrent review (${plan.sections.manualAndConcurrentReview.length})`);
  appendFiles(lines, plan.sections.manualAndConcurrentReview);
  lines.push('', `5. Product-owned files explicitly preserved (${plan.sections.productOwnedPreserved.length})`);
  appendFiles(lines, plan.sections.productOwnedPreserved);
  lines.push('', `6. Already current (${plan.sections.alreadyCurrent.length})`);
  appendFiles(lines, plan.sections.alreadyCurrent);
  lines.push('', '7. Required post-migration verification');
  for (const item of plan.sections.requiredPostMigrationVerification) lines.push(`- ${item}`);
  lines.push('', `File classification totals: ${formatCounts(plan.counts)}`);
  return `${lines.join('\n')}\n`;
}

function planManifestFiles({ consumer, targetRoot, historicalCommit, target, manifest, sourceMatchesTarget }) {
  const files = [];
  const seen = new Set();
  for (const entry of manifest.files) {
    seen.add(entry.path);
    const consumerHash = hashConsumerPath(consumer, entry.path);
    if (entry.ownership === 'product-seed') {
      files.push(makeRecord({
        file: entry.path,
        ownership: entry.ownership,
        sourceOrigin: entry.sourceOrigin,
        evidence: 'The generator labels this as editable product seed; later product work owns it.',
        historicalHash: entry.contentHash,
        consumerHash,
        targetHash: null,
        forcedClassification: 'consumer-only/manual',
        rationale: 'Preserve product-owned routes, domain behavior, copy, branding, or integrations for product-led review.',
      }));
      continue;
    }

    const sourceOrigin = entry.sourceOrigin;
    const historicalBytes = sourceOrigin ? gitFile(targetRoot, historicalCommit, sourceOrigin) : null;
    const targetBytes = sourceOrigin ? gitFile(targetRoot, target.commit, sourceOrigin) : null;
    const historicalSourceHash = historicalBytes ? sha256(historicalBytes.bytes) : null;
    const directSourceProof = entry.ownership === 'platform-owned'
      && historicalSourceHash !== null
      && historicalSourceHash === entry.contentHash;

    if (directSourceProof) {
      files.push(classifyThreeWay({
        file: entry.path,
        ownership: entry.ownership,
        sourceOrigin,
        evidence: `Manifest generation hash matches exact historical Git bytes at ${sourceOrigin}.`,
        historicalHash: historicalSourceHash,
        consumerHash,
        targetHash: targetBytes?.mode.startsWith('100') ? sha256(targetBytes.bytes) : null,
      }));
    } else if (sourceMatchesTarget && entry.ownership === 'platform-generated') {
      files.push(classifyThreeWay({
        file: entry.path,
        ownership: entry.ownership,
        sourceOrigin,
        evidence: 'The exact source identity is unchanged; the manifest generation hash is the historical and target generated baseline.',
        historicalHash: entry.contentHash,
        consumerHash,
        targetHash: entry.contentHash,
      }));
    } else {
      files.push(makeRecord({
        file: entry.path,
        ownership: entry.ownership,
        sourceOrigin,
        evidence: sourceOrigin
          ? `Manifest hash is available, but ${sourceOrigin} does not prove the emitted bytes as a direct copy for this source delta.`
          : 'The manifest has no source-origin path for this emitted file.',
        historicalHash: entry.contentHash,
        consumerHash,
        targetHash: null,
        forcedClassification: 'consumer-only/manual',
        rationale: 'Generated output bytes cannot be established from the exact source origin; preserve for manual review.',
      }));
    }
  }

  addManifestTargetPackageFiles(files, seen, consumer, targetRoot, historicalCommit, target);
  return sortRecords(dedupeRecords(files));
}

function addManifestTargetPackageFiles(files, seen, consumer, targetRoot, historicalCommit, target) {
  for (const packageDirectory of consumerExpoBasePackageDirectories(consumer)) {
    const sourceDirectory = `packages/${packageDirectory}`;
    const targetTree = gitTree(targetRoot, target.commit, sourceDirectory);
    const historicalTree = gitTree(targetRoot, historicalCommit, sourceDirectory);
    for (const [sourcePath, targetObject] of targetTree) {
      if (!targetObject.mode.startsWith('100') || sourcePath.endsWith('/package.json') || sourcePath === `${sourceDirectory}/package.json` || isIgnoredSourcePath(sourcePath)) continue;
      const outputPath = sourcePath;
      if (seen.has(outputPath)) continue;
      seen.add(outputPath);
      const historicalObject = historicalTree.get(sourcePath);
      if (!historicalObject) {
        files.push(makeRecord({
          file: outputPath,
          ownership: 'platform-owned',
          sourceOrigin: sourcePath,
          evidence: 'Target source adds a regular file under an already selected vendored Expo Base package.',
          historicalHash: null,
          consumerHash: hashConsumerPath(consumer, outputPath),
          targetHash: sha256(targetObject.bytes),
          forcedClassification: 'target-added',
          rationale: 'This selected platform package contains a target-added source file; review the new contract before adding it.',
        }));
      } else {
        files.push(makeRecord({
          file: outputPath,
          ownership: 'platform-owned',
          sourceOrigin: sourcePath,
          evidence: 'Target source contains this path, but the historical manifest did not govern it.',
          historicalHash: sha256(historicalObject.bytes),
          consumerHash: hashConsumerPath(consumer, outputPath),
          targetHash: sha256(targetObject.bytes),
          forcedClassification: 'consumer-only/manual',
          rationale: 'The historical ownership manifest does not establish this path as a generated platform file.',
        }));
      }
    }
  }
}

function planLegacyFiles({ consumer, targetRoot, historicalCommit, target }) {
  const files = [];
  const seen = new Set();
  const packageDirectories = consumerExpoBasePackageDirectories(consumer);
  for (const packageDirectory of packageDirectories) {
    const sourceDirectory = `packages/${packageDirectory}`;
    const historicalTree = gitTree(targetRoot, historicalCommit, sourceDirectory);
    const targetTree = gitTree(targetRoot, target.commit, sourceDirectory);
    const paths = new Set([...historicalTree.keys(), ...targetTree.keys()]);
    for (const sourcePath of [...paths].sort()) {
      if (isIgnoredSourcePath(sourcePath)) continue;
      if (sourcePath === `${sourceDirectory}/package.json`) {
        if (consumerFileExists(consumer, sourcePath)) {
          files.push(makeRecord({
            file: sourcePath,
            ownership: 'platform-generated',
            sourceOrigin: sourcePath,
            evidence: 'The generator rewrites vendored package manifests; raw source bytes do not establish the emitted manifest bytes.',
            historicalHash: null,
            consumerHash: hashConsumerPath(consumer, sourcePath),
            targetHash: null,
            forcedClassification: 'consumer-only/manual',
            rationale: 'Legacy generated package manifest has no byte-exact ownership evidence.',
          }));
        }
        seen.add(sourcePath);
        continue;
      }
      const oldObject = historicalTree.get(sourcePath);
      const newObject = targetTree.get(sourcePath);
      if ((oldObject && !oldObject.mode.startsWith('100')) || (newObject && !newObject.mode.startsWith('100'))) continue;
      const consumerHash = hashConsumerPath(consumer, sourcePath);
      if (!oldObject && !newObject) continue;
      if (oldObject && !newObject) {
        files.push(makeRecord({
          file: sourcePath,
          ownership: 'platform-owned',
          sourceOrigin: sourcePath,
          evidence: 'Legacy vendored package path maps directly to an exact historical source file.',
          historicalHash: sha256(oldObject.bytes), consumerHash, targetHash: null,
          forcedClassification: 'target-removed',
          rationale: 'The target source removed a previously vendored platform file.',
        }));
      } else if (!oldObject && newObject) {
        files.push(makeRecord({
          file: sourcePath,
          ownership: 'platform-owned',
          sourceOrigin: sourcePath,
          evidence: 'The target adds this path under a package already selected in the legacy consumer.',
          historicalHash: null, consumerHash, targetHash: sha256(newObject.bytes),
          forcedClassification: 'target-added',
          rationale: 'The selected vendored package has a target-added platform file for manual review.',
        }));
      } else {
        files.push(classifyThreeWay({
          file: sourcePath,
          ownership: 'platform-owned',
          sourceOrigin: sourcePath,
          evidence: 'Legacy fallback proves this vendored path maps directly to the exact historical source bytes.',
          historicalHash: sha256(oldObject.bytes),
          consumerHash,
          targetHash: sha256(newObject.bytes),
        }));
      }
      seen.add(sourcePath);
    }
  }

  for (const outputPath of LEGACY_TOOL_PATHS) {
    const sourceOrigin = outputPath === 'scripts/verify-acceptance.mjs'
      ? 'packages/create-expo-base-app/lib/standalone-acceptance.mjs'
      : outputPath;
    if (seen.has(outputPath)) continue;
    const oldObject = gitFile(targetRoot, historicalCommit, sourceOrigin);
    const newObject = gitFile(targetRoot, target.commit, sourceOrigin);
    if (!oldObject && !newObject) continue;
    files.push(classifyThreeWay({
      file: outputPath,
      ownership: 'platform-owned',
      sourceOrigin,
      evidence: oldObject
        ? `The historical standalone generator copies this platform tool from ${sourceOrigin}.`
        : `The exact historical source has no bytes at ${sourceOrigin}; the target source provides this mapped platform tool.`,
      historicalHash: oldObject?.mode.startsWith('100') ? sha256(oldObject.bytes) : null,
      consumerHash: hashConsumerPath(consumer, outputPath),
      targetHash: newObject?.mode.startsWith('100') ? sha256(newObject.bytes) : null,
    }));
    seen.add(outputPath);
  }

  for (const productPath of LEGACY_PRODUCT_PATHS) {
    if (!consumerFileExists(consumer, productPath) || seen.has(productPath)) continue;
    files.push(makeRecord({
      file: productPath,
      ownership: 'product-seed',
      sourceOrigin: null,
      evidence: 'Legacy standalone root ownership cannot be proven from a pre-manifest consumer; this path is conservatively product-owned.',
      historicalHash: null,
      consumerHash: hashConsumerPath(consumer, productPath),
      targetHash: null,
      forcedClassification: 'consumer-only/manual',
      rationale: 'Preserve the legacy consumer file; its replacement ownership was not recorded at generation time.',
    }));
    seen.add(productPath);
  }

  for (const productPath of walkConsumerFiles(path.join(consumer, 'app'), consumer)) {
    if (seen.has(productPath)) continue;
    files.push(makeRecord({
      file: productPath,
      ownership: 'product-seed',
      sourceOrigin: null,
      evidence: 'Legacy app routes and domain surfaces have no recorded replacement ownership and are product-owned.',
      historicalHash: null,
      consumerHash: hashConsumerPath(consumer, productPath),
      targetHash: null,
      forcedClassification: 'consumer-only/manual',
      rationale: 'Preserve product route, domain, and copy edits.',
    }));
    seen.add(productPath);
  }

  for (const item of walkConsumerFiles(consumer, consumer)) {
    if (seen.has(item) || item === '.expo-base/generated-files.json') continue;
    if (item.startsWith('packages/') || item.startsWith('node_modules/') || item.startsWith('.git/')) continue;
    if (item.startsWith('app/')) continue;
    files.push(makeRecord({
      file: item,
      ownership: 'unknown',
      sourceOrigin: null,
      evidence: 'Pre-manifest generation did not record this root file as platform-owned or product-seed.',
      historicalHash: null,
      consumerHash: hashConsumerPath(consumer, item),
      targetHash: null,
      forcedClassification: 'consumer-only/manual',
      rationale: 'Ownership is unproven; preserve the consumer file for manual review.',
    }));
    seen.add(item);
  }
  return sortRecords(dedupeRecords(files));
}

function classifyThreeWay({ file, ownership, sourceOrigin, evidence, historicalHash, consumerHash, targetHash }) {
  let classification;
  let rationale;
  if (historicalHash === null && targetHash !== null) {
    classification = 'target-added';
    rationale = 'The target source contains a governed platform file absent from the historical source.';
  } else if (historicalHash !== null && targetHash === null) {
    classification = 'target-removed';
    rationale = 'The target source removed a governed platform file present in the historical source.';
  } else if (historicalHash === null || targetHash === null) {
    classification = 'consumer-only/manual';
    rationale = 'One or more source-side bytes are unavailable, so this file cannot be classified safely.';
  } else if (consumerHash === null) {
    classification = 'consumer-modified';
    rationale = 'The consumer removed a file that exists in the historical or target platform source; review the deletion manually.';
  } else if (consumerHash === targetHash) {
    classification = 'already-current';
    rationale = 'Consumer bytes already equal the exact target source bytes.';
  } else if (consumerHash === historicalHash && targetHash !== historicalHash) {
    classification = 'unchanged-platform-update';
    rationale = 'Consumer bytes still equal the historical platform bytes while the target source changed.';
  } else if (consumerHash !== historicalHash && targetHash === historicalHash) {
    classification = 'consumer-modified';
    rationale = 'Consumer bytes changed while the target retained the historical platform bytes; preserve the consumer edit.';
  } else {
    classification = 'concurrent-change';
    rationale = 'Consumer and target bytes both diverged from history and differ from each other; manual merge is required.';
  }
  return makeRecord({ file, ownership, sourceOrigin, evidence, historicalHash, consumerHash, targetHash, forcedClassification: classification, rationale });
}

function makeRecord({ file, ownership, sourceOrigin = null, evidence, historicalHash = null, consumerHash = null, targetHash = null, forcedClassification, rationale }) {
  return {
    path: file.split(path.sep).join('/'),
    classification: forcedClassification,
    hashes: { historical: historicalHash, consumer: consumerHash, target: targetHash },
    rationale,
    ownershipEvidence: { ownership, sourceOrigin, evidence },
  };
}

function summarizeFiles(files) {
  const totals = {};
  for (const file of files) totals[file.classification] = (totals[file.classification] ?? 0) + 1;
  return Object.fromEntries(Object.entries(totals).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0));
}

function appendFiles(lines, files) {
  if (!files.length) {
    lines.push('- None.');
    return;
  }
  for (const file of files) {
    const { historical, consumer, target } = file.hashes;
    lines.push(`- ${file.path} — ${file.classification}`);
    lines.push(`  hashes: historical=${historical ?? 'unavailable'}, consumer=${consumer ?? 'missing'}, target=${target ?? 'unavailable'}`);
    lines.push(`  ownership: ${file.ownershipEvidence.ownership}; source origin: ${file.ownershipEvidence.sourceOrigin ?? 'unproven'}`);
    lines.push(`  reason: ${file.rationale}`);
  }
}

function formatCounts(counts) {
  const entries = Object.entries(counts);
  return entries.length ? entries.map(([name, count]) => `${name}=${count}`).join(', ') : 'none';
}

function validateProvenance(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schemaVersion !== 1) throw new Error('Consumer .expo-base/source.json is malformed or uses an unsupported schema.');
  if (typeof value.sourceRepository !== 'string' || !normalizeRepositoryIdentity(value.sourceRepository)) throw new Error('Consumer provenance has no valid sourceRepository identity.');
  if (typeof value.sourceCommit !== 'string' || !HASH_RE.test(value.sourceCommit)) throw new Error('Consumer provenance sourceCommit must be a full 40-character Git commit.');
  if (value.sourceTree !== undefined && (typeof value.sourceTree !== 'string' || !HASH_RE.test(value.sourceTree))) throw new Error('Consumer provenance sourceTree must be a full 40-character Git tree when present.');
  if (typeof value.sourceVersion !== 'string' || !value.sourceVersion || typeof value.generatorVersion !== 'string' || !value.generatorVersion) throw new Error('Consumer provenance sourceVersion and generatorVersion are required.');
}

function validateManifest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schemaVersion !== 1 || !Array.isArray(value.files)) throw new Error('Consumer generated-files manifest is malformed or uses an unsupported schema.');
  const seen = new Set();
  for (const entry of value.files) {
    if (!entry || typeof entry !== 'object' || !isSafeRelativePath(entry.path)) throw new Error('Generated-files manifest contains an invalid path.');
    if (seen.has(entry.path)) throw new Error(`Generated-files manifest repeats path ${entry.path}.`);
    seen.add(entry.path);
    if (!MANIFEST_OWNERSHIP.has(entry.ownership)) throw new Error(`Generated-files manifest has an invalid ownership class at ${entry.path}.`);
    if (typeof entry.contentHash !== 'string' || !CONTENT_HASH_RE.test(entry.contentHash)) throw new Error(`Generated-files manifest has an invalid content hash at ${entry.path}.`);
    if (entry.sourceOrigin !== null && !isSafeRelativePath(entry.sourceOrigin)) throw new Error(`Generated-files manifest has an invalid source origin at ${entry.path}.`);
  }
}

function isSafeRelativePath(value) {
  return typeof value === 'string' && value.length > 0 && !path.posix.isAbsolute(value) && !value.includes('\\') && !value.split('/').includes('..') && !value.split('/').includes('.');
}

function resolveTargetIdentity(root) {
  if (!fs.existsSync(path.join(root, 'expo-base.compatibility.json'))) throw new Error('Target source root does not contain expo-base.compatibility.json.');
  const commit = resolveCommit(root, 'HEAD', 'target source commit');
  const tree = gitText(root, ['rev-parse', `${commit}^{tree}`], 'target source tree');
  const remote = gitText(root, ['config', '--get', 'remote.origin.url'], 'target source repository identity');
  const repositoryIdentity = normalizeRepositoryIdentity(remote);
  if (!repositoryIdentity) throw new Error('Target source repository identity cannot be resolved from Git origin.');
  const rootPackage = readGitJson(root, commit, 'package.json', 'target Expo Base package manifest');
  const generatorPackage = readGitJson(root, commit, 'packages/create-expo-base-app/package.json', 'target generator package manifest');
  if (typeof rootPackage.version !== 'string' || typeof generatorPackage.version !== 'string') throw new Error('Target source version identity cannot be resolved reliably.');
  return {
    commit,
    tree,
    repositoryIdentity,
    sourceRepository: `https://${repositoryIdentity}`,
    sourceVersion: rootPackage.version,
    generatorVersion: generatorPackage.version,
  };
}

function resolveCommit(root, expression, description) {
  const commit = gitText(root, ['rev-parse', '--verify', `${expression}^{commit}`], description);
  if (!HASH_RE.test(commit)) throw new Error(`${description} did not resolve to a full Git commit.`);
  return commit;
}

function readGitJson(root, commit, sourcePath, description) {
  const bytes = gitFile(root, commit, sourcePath);
  if (!bytes) throw new Error(`Unable to read ${description} at ${commit}:${sourcePath}.`);
  try { return JSON.parse(bytes.bytes.toString('utf8')); }
  catch { throw new Error(`${description} at ${commit}:${sourcePath} is malformed JSON.`); }
}

function gitFile(root, commit, sourcePath) {
  if (!isSafeRelativePath(sourcePath)) return null;
  const segments = sourcePath.split('/');
  const directory = segments[0] === 'packages' && segments.length > 1
    ? `${segments[0]}/${segments[1]}`
    : ['scripts', 'docs'].includes(segments[0])
      ? segments[0]
      : sourcePath;
  const tree = gitTree(root, commit, directory);
  return tree.get(sourcePath) ?? null;
}

function gitTree(root, commit, directory) {
  if (!isSafeRelativePath(directory)) return new Map();
  const cacheKey = `${root}\0${commit}\0${directory}`;
  if (SOURCE_TREE_CACHE.has(cacheKey)) return SOURCE_TREE_CACHE.get(cacheKey);
  const result = spawnSync('git', ['-C', root, 'ls-tree', '-r', '-z', '--full-tree', commit, '--', directory], { encoding: 'buffer', maxBuffer: 128 * 1024 * 1024 });
  if (result.error) throw new Error(`Git could not inspect ${commit}:${directory}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`Git could not inspect ${commit}:${directory}: ${(result.stderr ?? Buffer.alloc(0)).toString('utf8').trim()}`);
  const entries = new Map();
  const objects = [];
  for (const record of result.stdout.toString('utf8').split('\0')) {
    if (!record) continue;
    const tab = record.indexOf('\t');
    const [mode, type, object] = record.slice(0, tab).split(' ');
    const sourcePath = record.slice(tab + 1);
    if (type !== 'blob' || isIgnoredSourcePath(sourcePath)) continue;
    objects.push({ mode, object, sourcePath });
  }
  if (!objects.length) {
    SOURCE_TREE_CACHE.set(cacheKey, entries);
    return entries;
  }
  const blobs = spawnSync('git', ['-C', root, 'cat-file', '--batch'], {
    input: Buffer.from(`${objects.map(({ object }) => object).join('\n')}\n`),
    encoding: 'buffer',
    maxBuffer: 512 * 1024 * 1024,
  });
  if (blobs.error || blobs.status !== 0) throw new Error('Git could not read exact source blobs.');
  let cursor = 0;
  for (const item of objects) {
    const newline = blobs.stdout.indexOf(0x0a, cursor);
    if (newline < 0) throw new Error(`Git returned a malformed blob header for ${item.object}.`);
    const header = blobs.stdout.toString('utf8', cursor, newline).split(' ');
    const size = Number(header[2]);
    if (header[1] !== 'blob' || !Number.isSafeInteger(size) || size < 0) throw new Error(`Git returned a malformed blob for ${item.object}.`);
    const start = newline + 1;
    const end = start + size;
    if (end >= blobs.stdout.length || blobs.stdout[end] !== 0x0a) throw new Error(`Git returned truncated source blob ${item.object}.`);
    entries.set(item.sourcePath, { mode: item.mode, bytes: blobs.stdout.subarray(start, end) });
    cursor = end + 1;
  }
  SOURCE_TREE_CACHE.set(cacheKey, entries);
  return entries;
}

function gitText(root, args, description) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw new Error(`Unable to resolve ${description}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`Unable to resolve ${description}: ${(result.stderr ?? '').trim()}`);
  return result.stdout.trim();
}

function normalizeRepositoryIdentity(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  let host;
  let repositoryPath;
  const scp = trimmed.match(/^git@([^:]+):(.+)$/i);
  if (scp) {
    host = scp[1];
    repositoryPath = scp[2];
  } else {
    let parsed;
    try { parsed = new URL(trimmed); } catch { return null; }
    if (!['https:', 'ssh:', 'git:'].includes(parsed.protocol)) return null;
    host = parsed.hostname;
    repositoryPath = parsed.pathname;
  }
  repositoryPath = repositoryPath.replace(/^\/+|\/+$/g, '').replace(/\.git$/i, '').toLowerCase();
  if (!host || !repositoryPath || repositoryPath.split('/').some((part) => !part || part === '.' || part === '..')) return null;
  return `${host.toLowerCase()}/${repositoryPath}`;
}

function consumerExpoBasePackageDirectories(consumer) {
  const packagesRoot = path.join(consumer, 'packages');
  if (!fs.existsSync(packagesRoot)) return [];
  return fs.readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(packagesRoot, entry.name, 'package.json')))
    .filter((entry) => {
      try { return JSON.parse(fs.readFileSync(path.join(packagesRoot, entry.name, 'package.json'), 'utf8')).name?.startsWith('@expo-base/'); }
      catch { return false; }
    })
    .map((entry) => entry.name)
    .sort();
}

function walkConsumerFiles(directory, root, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walkConsumerFiles(full, root, output);
    else if (entry.isFile()) output.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return output;
}

function hashConsumerPath(root, relativePath) {
  if (!isSafeRelativePath(relativePath)) return null;
  const fullPath = path.join(root, ...relativePath.split('/'));
  try {
    const stat = fs.lstatSync(fullPath);
    if (!stat.isFile()) return null;
    return sha256(fs.readFileSync(fullPath));
  } catch { return null; }
}

function consumerFileExists(root, relativePath) {
  if (!isSafeRelativePath(relativePath)) return false;
  try { return fs.lstatSync(path.join(root, ...relativePath.split('/'))).isFile(); }
  catch { return false; }
}

function isIgnoredSourcePath(sourcePath) {
  return sourcePath.split('/').some((segment) => IGNORED_SOURCE_SEGMENTS.has(segment));
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function readRequiredJson(file, description) {
  if (!fs.existsSync(file)) throw new Error(`${description} is missing.`);
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { throw new Error(`${description} is malformed JSON.`); }
}

function sortRecords(records) {
  return [...records].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
}

function dedupeRecords(records) {
  const byPath = new Map();
  for (const record of records) byPath.set(record.path, record);
  return [...byPath.values()];
}
