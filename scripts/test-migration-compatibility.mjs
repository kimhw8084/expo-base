import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const require = createRequire(import.meta.url);
const generator = path.join(root, 'packages/create-expo-base-app/bin/create-expo-base-app.mjs');

// These are the only v1 package paths that were application-facing in the exact 1.0.0
// documentation, reference app, generator, or screen-scaffolder contract. Internal package
// topology and renamed CLI packages are deliberately not compatibility targets.
const LEGACY_PACKAGE_SHIMS = [
  { specifier: '@precision-calm/adapters', directory: 'legacy-compat-adapters', source: 'src/index.ts', canonical: '@expo-base/adapters' },
  { specifier: '@precision-calm/auth', directory: 'legacy-compat-auth', source: 'src/index.ts', canonical: '@expo-base/auth' },
  { specifier: '@precision-calm/authorization', directory: 'legacy-compat-authorization', source: 'src/index.ts', canonical: '@expo-base/authorization' },
  { specifier: '@precision-calm/capabilities', directory: 'legacy-compat-capabilities', source: 'src/index.ts', canonical: '@expo-base/capabilities' },
  { specifier: '@precision-calm/device', directory: 'legacy-compat-device', source: 'src/index.ts', canonical: '@expo-base/device' },
  { specifier: '@precision-calm/form-rhf', directory: 'legacy-compat-form-rhf', source: 'src/index.tsx', canonical: '@expo-base/form-rhf' },
  { specifier: '@precision-calm/haptics', directory: 'legacy-compat-haptics', source: 'src/index.ts', canonical: '@expo-base/haptics' },
  { specifier: '@precision-calm/linking', directory: 'legacy-compat-linking', source: 'src/index.ts', canonical: '@expo-base/linking' },
  { specifier: '@precision-calm/linking-expo', directory: 'legacy-compat-linking-expo', source: 'src/index.ts', canonical: '@expo-base/linking-expo' },
  { specifier: '@precision-calm/local-auth', directory: 'legacy-compat-local-auth', source: 'src/index.ts', canonical: '@expo-base/local-auth' },
  { specifier: '@precision-calm/media', directory: 'legacy-compat-media', source: 'src/index.ts', canonical: '@expo-base/media' },
  { specifier: '@precision-calm/navigation-router', directory: 'legacy-compat-navigation-router', source: 'src/index.tsx', canonical: '@expo-base/navigation-router' },
  { specifier: '@precision-calm/notifications', directory: 'legacy-compat-notifications', source: 'src/index.ts', canonical: '@expo-base/notifications' },
  { specifier: '@precision-calm/observability', directory: 'legacy-compat-observability', source: 'src/index.ts', canonical: '@expo-base/observability' },
  { specifier: '@precision-calm/platform', directory: 'legacy-compat-platform', source: 'src/index.ts', canonical: '@expo-base/platform' },
  { specifier: '@precision-calm/preferences', directory: 'legacy-compat-preferences', source: 'src/index.ts', canonical: '@expo-base/preferences' },
  { specifier: '@precision-calm/runtime', directory: 'legacy-compat-runtime', source: 'src/index.ts', canonical: '@expo-base/runtime' },
  { specifier: '@precision-calm/runtime-capabilities', directory: 'legacy-compat-runtime-capabilities', source: 'src/index.ts', canonical: '@expo-base/runtime-capabilities' },
  { specifier: '@precision-calm/secure-storage', directory: 'legacy-compat-secure-storage', source: 'src/index.ts', canonical: '@expo-base/secure-storage' },
  { specifier: '@precision-calm/server-state', directory: 'legacy-compat-server-state', source: 'src/index.ts', canonical: '@expo-base/server-state' },
  { specifier: '@precision-calm/session-security', directory: 'legacy-compat-session-security', source: 'src/index.ts', canonical: '@expo-base/session-security' },
  { specifier: '@precision-calm/sharing', directory: 'legacy-compat-sharing', source: 'src/index.ts', canonical: '@expo-base/sharing' },
  { specifier: '@precision-calm/sharing/runtime', directory: 'legacy-compat-sharing', source: 'src/runtime.ts', canonical: '@expo-base/sharing/runtime' },
  { specifier: '@precision-calm/sharing/ui', directory: 'legacy-compat-sharing', source: 'src/ui.ts', canonical: '@expo-base/sharing/ui' },
  { specifier: '@precision-calm/tokens', directory: 'legacy-compat-tokens', source: 'src/index.ts', canonical: '@expo-base/tokens' },
  { specifier: '@precision-calm/ui', directory: 'legacy-compat-ui', source: 'src/index.ts', canonical: '@expo-base/ui' },
  { specifier: '@precision-calm/updates', directory: 'legacy-compat-updates', source: 'src/index.ts', canonical: '@expo-base/updates' },
  { specifier: '@precision-calm/visualization-advanced', directory: 'legacy-compat-visualization-advanced', source: 'src/index.ts', canonical: '@expo-base/visualization-advanced' },
];

const LEGACY_IDENTITY_PATTERN = /@precision-calm\/|Precision Calm|precision-calm|\bPrecision[A-Z][A-Za-z0-9]*|\busePrecision[A-Z]|\bcreatePrecision[A-Z]|\bprecision[A-Z]|create-precision|migrate-precision|precision-doctor|precision\.(?:api|compatibility|capabilities|routes)/;
const GENERATED_LEGACY_COMPATIBILITY_FILES = new Set([
  'docs/GOLDEN_TEMPLATE_AUDIT.md',
  'docs/PUBLIC_API.md',
  'packages/runtime/src/legacy-compat.ts',
  'packages/ui/src/legacy-compat.ts',
]);
const LEGACY_COMPAT_PATHS = new Set(LEGACY_PACKAGE_SHIMS.flatMap(({ directory, source }) => [
  `packages/${directory}/package.json`,
  `packages/${directory}/${source}`,
]));
const ALLOWED_LEGACY_PATHS = new Set([
  'packages/ui/src/legacy-compat.ts',
  'packages/runtime/src/legacy-compat.ts',
  'docs/PUBLIC_API.md',
  'docs/MIGRATION.md',
  'docs/IDENTITY_CONVERGENCE_CHG24.md',
  'docs/GOLDEN_TEMPLATE_AUDIT.md',
  'docs/golden-template-capabilities.json',
  'docs/GOLDEN_PRODUCT_QUALITY_AUDIT.md',
  'docs/golden-product-quality-defects.json',
  'docs/final-independent-product-quality-defects.json',
  'docs/RUNTIME_RC2.md',
  'package-lock.json',
  'scripts/test-migration-compatibility.mjs',
  'scripts/fixtures/migration-compatibility-imports.ts',
]);

function isAllowedLegacyPath(relativePath) {
  return LEGACY_COMPAT_PATHS.has(relativePath) || ALLOWED_LEGACY_PATHS.has(relativePath);
}

function walkFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else files.push(full);
  }
  return files;
}

function assertLegacyIdentityAllowlist() {
  const violations = [];
  for (const full of walkFiles(root)) {
    const relativePath = path.relative(root, full).split(path.sep).join('/');
    let text;
    try {
      text = fs.readFileSync(full, 'utf8');
    } catch {
      continue;
    }
    if (LEGACY_IDENTITY_PATTERN.test(text) && !isAllowedLegacyPath(relativePath)) violations.push(relativePath);
  }
  assert.deepEqual(violations, [], `Legacy identity outside the explicit compatibility/historical allowlist:\n${violations.join('\n')}`);
}

function assertShimManifestsAndForwarders() {
  for (const shim of LEGACY_PACKAGE_SHIMS) {
    const packageDir = path.join(root, 'packages', shim.directory);
    const manifestPath = path.join(packageDir, 'package.json');
    const sourcePath = path.join(packageDir, shim.source);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const source = fs.readFileSync(sourcePath, 'utf8');
    const packageName = shim.specifier.split('/').slice(0, 2).join('/');
    const canonicalPackage = shim.canonical.split('/').slice(0, 2).join('/');
    assert.equal(manifest.name, packageName, `${shim.specifier} manifest name`);
    assert.equal(manifest.private, true, `${shim.specifier} must remain private`);
    assert.deepEqual(manifest.expoBaseCompatibility, { canonical: canonicalPackage, removeAfter: '2.0.0' }, `${shim.specifier} compatibility metadata`);
    assert.equal(manifest.dependencies?.[canonicalPackage], '*', `${shim.specifier} must depend on its canonical package`);
    assert.match(source, new RegExp(`^/\\*\\* @deprecated Migration-only v1 shim\\. Use ${escapeRegExp(shim.canonical)}\\. \\*/\\nexport \\* from '${escapeRegExp(shim.canonical)}';\\n$`));
    assert.doesNotMatch(source, /\b(?:function|class|const|let|var|interface|type|enum)\b/, `${shim.specifier} contains implementation logic`);
    const resolved = require.resolve(shim.specifier);
    assert.equal(path.resolve(resolved), path.resolve(sourcePath), `${shim.specifier} resolves through its shim source`);
  }
  assert.equal(require.resolve('@expo-base/ui'), path.join(root, 'packages/ui/src/index.ts'));
  assert.equal(require.resolve('@expo-base/runtime'), path.join(root, 'packages/runtime/src/index.ts'));
}

function assertTypecheckedImportFixture() {
  const result = spawnSync(path.join(root, 'node_modules/.bin/tsc'), [
    '-p', path.join(root, 'tsconfig.runtime-ui.json'), '--noEmit',
  ], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function assertFreshGeneratorOutput() {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-base-migration-compat-'));
  const destination = path.join(temporaryRoot, 'generated-app');
  try {
    const result = spawnSync(process.execPath, [generator, '--name', 'Compatibility Proof', '--slug', 'compatibility-proof', '--directory', destination], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const generatedFiles = walkFiles(destination);
    assert.ok(generatedFiles.length > 0, 'generator must produce files');
    const generatedCompatibilityFiles = generatedFiles.filter((file) => GENERATED_LEGACY_COMPATIBILITY_FILES.has(path.relative(destination, file).split(path.sep).join('/')));
    const generatedText = generatedFiles
      .filter((file) => !GENERATED_LEGACY_COMPATIBILITY_FILES.has(path.relative(destination, file).split(path.sep).join('/')))
      .map((file) => fs.readFileSync(file, 'utf8')).join('\n');
    assert.doesNotMatch(generatedText, LEGACY_IDENTITY_PATTERN, 'fresh product and platform output contains no legacy identity outside established compatibility shims and historical/API documentation');
    assert.deepEqual(generatedCompatibilityFiles.map((file) => path.relative(destination, file).split(path.sep).join('/')).sort(), [...GENERATED_LEGACY_COMPATIBILITY_FILES].sort(), 'only the exact 1.x compatibility shims and historical/API documents may retain legacy names in generated output');
    assert.match(generatedText, /@expo-base\/ui/);
    assert.match(generatedText, /@expo-base\/runtime/);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

assertLegacyIdentityAllowlist();
assertShimManifestsAndForwarders();
assertTypecheckedImportFixture();
assertFreshGeneratorOutput();
console.log(`Migration compatibility passed: ${LEGACY_PACKAGE_SHIMS.length} legacy package paths resolve through canonical Expo Base implementations; no legacy identity escapes the explicit generated compatibility/documentation allowlist.`);
