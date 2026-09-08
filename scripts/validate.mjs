import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const required = [
  'package.json',
  'AGENTS.md',
  'golden.catalog.json',
  'golden.patterns.json',
  'golden.certification.json',
  'golden-architecture.config.json',
  'tsconfig.base.json',
  'apps/reference/package.json',
  'apps/reference/index.ts',
  'apps/reference/app.config.ts',
  'apps/reference/unistyles.ts',
  'packages/tokens/src/index.ts',
  'packages/platform/src/index.ts',
  'packages/primitives/src/index.ts',
  'packages/icons/src/index.ts',
  'packages/layouts/src/index.ts',
  'packages/components/src/index.ts',
  'packages/components/src/AvatarGroup.tsx',
  'packages/components/src/CodeBlock.tsx',
  'packages/components/src/StatusIndicator.tsx',
  'packages/forms/src/index.ts',
  'packages/forms/src/DateTimeFields.tsx',
  'packages/i18n/src/index.ts',
  'packages/form-rhf/src/index.tsx',
  'packages/navigation/src/index.ts',
  'packages/navigation-router/src/index.tsx',
  'packages/overlays/src/index.ts',
  'packages/lists/src/index.ts',
  'packages/data-display/src/index.ts',
  'packages/data-display/src/Timeline.tsx',
  'packages/data-display/src/DataExport.ts',
  'packages/media-presentation/src/index.ts',
  'packages/media-presentation/src/MediaFrame.tsx',
  'packages/sharing/src/index.ts',
  'packages/sharing/src/runtime.ts',
  'packages/sharing/src/ui.ts',
  'packages/sharing/src/CopyableValue.tsx',
  'packages/platform/src/data.ts',
  'packages/platform/src/visualization.ts',
  'packages/visualization/src/index.ts',
  'packages/visualization/src/AreaChart.tsx',
  'packages/visualization/src/StackedBarChart.tsx',
  'packages/platform/src/feedback.ts',
  'packages/feedback/src/index.ts',
  'packages/platform/src/accessibility.ts',
  'packages/motion/src/index.ts',
  'packages/accessibility/src/index.ts',
  'packages/accessibility/src/WebAccessibilityStyles.tsx',
  'packages/platform/src/patterns.ts',
  'packages/patterns/src/index.ts',
  'packages/patterns/src/CommandLauncher.tsx',
  'packages/patterns/src/ServerStateContent.tsx',
  'packages/patterns/src/WorkflowLayouts.tsx',
  'packages/patterns/src/FilterDrawer.tsx',
  'packages/layouts/src/PriorityActionBar.tsx',
  'packages/layouts/src/StickyActionBar.tsx',
  'packages/layouts/src/AdaptiveSplit.tsx',
  'packages/layouts/src/SidebarLayout.tsx',
  'packages/platform/src/overflow.ts',
  'scripts/check-layout-contracts.mjs',
  'scripts/test-layout-solvers.mjs',
  'scripts/check-form-contracts.mjs',
  'scripts/test-form-contracts.mjs',
  'scripts/check-navigation-contracts.mjs',
  'scripts/test-navigation-contracts.mjs',
  'scripts/check-overlay-contracts.mjs',
  'scripts/test-overlay-contracts.mjs',
  'scripts/check-list-contracts.mjs',
  'scripts/test-list-contracts.mjs',
  'scripts/check-data-contracts.mjs',
  'scripts/test-data-contracts.mjs',
  'scripts/check-visualization-contracts.mjs',
  'scripts/test-visualization-contracts.mjs',
  'scripts/check-feedback-contracts.mjs',
  'scripts/test-feedback-contracts.mjs',
  'scripts/check-accessibility-motion-contracts.mjs',
  'scripts/test-accessibility-motion-contracts.mjs',
  'scripts/check-pattern-contracts.mjs',
  'scripts/test-pattern-contracts.mjs',
  'packages/testing/src/index.ts',
  'packages/testing/src/certification.ts',
  'scripts/check-certification-contracts.mjs',
  'scripts/test-certification-matrix.mjs',
  'apps/reference/app/system.tsx',
  'apps/reference/app/golden-plus.tsx',
  'apps/reference/app/stress.tsx',
  'playwright.config.ts',
  'playwright.golden.config.ts',
  'tests/e2e/web/reference.spec.ts',
  'tests/e2e/golden/golden.visual.spec.ts',
  'tests/e2e/golden/golden.semantic.spec.ts',
  'tests/e2e/golden/golden.performance.spec.ts',
  'scripts/check-golden-certification.mjs',
  'scripts/test-golden-plus.mjs',
  'scripts/check-golden-performance.mjs',
  'scripts/run-golden-web.mjs',
  'tests/native/reference-flow.yaml',
  'packages/create-precision-app/package.json',
  'packages/create-precision-app/bin/create-precision-app.mjs',
  'packages/create-precision-app/bin/scaffold-precision-screen.mjs',
  'packages/create-precision-app/lib/screen-scaffold.mjs',
  'scripts/test-generator.mjs',
  'scripts/golden-pattern-lib.mjs',
  'scripts/generate-golden-pattern-docs.mjs',
  'scripts/check-golden-patterns.mjs',
  'scripts/test-screen-scaffolder.mjs',
  'scripts/fixtures/golden-workflows/challenges.json',
  'docs/GENERATOR.md',
  'docs/SCREEN_SCAFFOLDING.md',
  'docs/GOLDEN_WORKFLOWS.md',
  'docs/GOLDEN_CATALOG.md',
  'docs/INTERNATIONALIZATION.md',
  'docs/COMPONENTS.md',
  'docs/MEDIA_PRESENTATION.md',
  'scripts/golden-catalog-lib.mjs',
  'scripts/generate-golden-catalog-docs.mjs',
  'scripts/check-golden-catalog.mjs',
  'scripts/golden-architecture-lib.mjs',
  'scripts/check-golden-architecture.mjs',
  'scripts/test-golden-architecture.mjs',
  'scripts/test-i18n-kernel.mjs',
  'docs/RELEASE_READINESS.md',
  'docs/RELEASE_NOTES_1.0.0.md',
  'packages/tokens/src/brand.ts',
  'apps/reference/brand.ts',
  'docs/CERTIFICATION.md',
  'docs/BRANDING.md',
  'docs/PORTABILITY.md',
  'scripts/release-readiness.mjs',
  'precision.compatibility.json',
  'packages/ui/package.json',
  'packages/ui/src/index.ts',
  'packages/runtime/package.json',
  'packages/runtime/src/index.ts',
  'packages/runtime/src/services.tsx',
  'packages/server-state/package.json',
  'packages/server-state/src/index.ts',
  'packages/server-state/src/keys.ts',
  'packages/server-state/src/client.ts',
  'packages/server-state/src/usePrecisionQuery.ts',
  'packages/server-state/src/mutation.ts',
  'packages/server-state/src/presentation.ts',
  'scripts/check-server-state-contracts.mjs',
  'scripts/test-server-state.mjs',
  'docs/ADR_SERVER_STATE.md',
  'docs/SERVER_STATE.md',
  'apps/reference/app/server-state.tsx',
  'apps/reference/serverState.ts',
  'apps/reference/services.ts',
  'apps/reference/app/services.tsx',
  'scripts/test-service-runtime.mjs',
  'scripts/check-package-manifests.mjs',
  'scripts/check-public-api.mjs',
  'docs/PUBLIC_API.md',
  'packages/migrate-precision-app/package.json',
  'packages/migrate-precision-app/bin/precision-migrate-audit.mjs',
  'scripts/test-migration-audit.mjs',
  'docs/MIGRATION.md',
  'precision.api.json',
  'scripts/api-snapshot.mjs',
  'packages/precision-doctor/package.json',
  'packages/precision-doctor/bin/precision-doctor.mjs',
  'scripts/test-doctor.mjs',
  'packages/linking/src/index.ts',
  'packages/linking-expo/src/index.ts',
  'scripts/check-linking-contracts.mjs',
  'scripts/test-linking-contracts.mjs',
  'packages/session-security/src/index.ts',
  'packages/session-security/src/contracts.ts',
  'packages/session-security/src/memory.ts',
  'packages/runtime/src/sessionSecurity.tsx',
  'scripts/check-session-security-contracts.mjs',
  'scripts/test-session-security-runtime.mjs',
  'apps/reference/sessionSecurity.ts',
  'apps/reference/app/session-security.tsx',
  'apps/reference/app/unlock.tsx',
  'docs/SESSION_SECURITY.md',
  'docs/GATES_21_33_RECONCILIATION.md',
  'packages/auth/src/index.ts',
  'packages/auth/src/access.ts',
  'packages/auth/src/returnIntent.ts',
  'packages/runtime/src/auth.tsx',
  'scripts/check-auth-contracts.mjs',
  'scripts/test-auth-contracts.mjs',
  'scripts/test-auth-runtime.mjs',
  'apps/reference/auth.ts',
  'apps/reference/app/auth-session.tsx',
  'apps/reference/app/sign-in.tsx',
  'apps/reference/app/session-loading.tsx',
  'apps/reference/app/session-error.tsx',
  'docs/AUTH_PROTECTED_ROUTES.md',
  'packages/authorization/src/index.ts',
  'packages/authorization/src/contracts.ts',
  'packages/authorization/src/policy.ts',
  'packages/runtime/src/authorization.tsx',
  'scripts/check-authorization-contracts.mjs',
  'scripts/test-authorization-contracts.mjs',
  'scripts/test-authorization-runtime.mjs',
  'apps/reference/app/authorization.tsx',
  'apps/reference/app/admin-demo.tsx',
  'docs/AUTHORIZATION_CAPABILITIES.md',
  'docs/RUNTIME_RC3.md',
  'scripts/runtime-test-web.mjs',
  'scripts/serve-static-web.mjs',
  'scripts/runtime-native.mjs',
  '.github/workflows/runtime-web.yml',
  'apps/reference/ReferenceBackAction.tsx',
  'README.md',
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error('Missing required platform files:\n' + missing.map((x) => `- ${x}`).join('\n'));
  process.exit(1);
}


const referenceEntry = fs.readFileSync(path.join(root, 'apps/reference/index.ts'), 'utf8');
const unistylesImportIndex = referenceEntry.indexOf("import './unistyles'");
const routerEntryImportIndex = referenceEntry.indexOf("import 'expo-router/entry'");
if (unistylesImportIndex < 0 || routerEntryImportIndex < 0) {
  console.error('Reference entrypoint must load both expo-router/entry and ./unistyles.');
  process.exit(1);
}
if (unistylesImportIndex > routerEntryImportIndex) {
  console.error('Reference entrypoint must import ./unistyles before expo-router/entry.');
  process.exit(1);
}
const rootLayoutPath = path.join(root, 'apps/reference/app/_layout.tsx');
const rootLayoutSource = fs.readFileSync(rootLayoutPath, 'utf8').trimStart();
if (!rootLayoutSource.startsWith("import '../unistyles'")) {
  console.error('Expo Router static rendering requires app/_layout.tsx to import ../unistyles first.');
  process.exit(1);
}
const rootHtmlPath = path.join(root, 'apps/reference/app/+html.tsx');
if (!fs.existsSync(rootHtmlPath) || !fs.readFileSync(rootHtmlPath, 'utf8').includes("import '../unistyles'")) {
  console.error('Static Expo Router rendering requires app/+html.tsx to import ../unistyles.');
  process.exit(1);
}

for (const jsonFile of ['package.json', 'apps/reference/package.json']) {
  JSON.parse(fs.readFileSync(path.join(root, jsonFile), 'utf8'));
}

const packageRoots = ['packages', 'apps'];
const entrypointErrors = [];
for (const packageRoot of packageRoots) {
  const base = path.join(root, packageRoot);
  if (!fs.existsSync(base)) continue;
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const packageJsonPath = path.join(base, entry.name, 'package.json');
    if (!fs.existsSync(packageJsonPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    for (const field of ['main', 'types']) {
      const target = manifest[field];
      if (typeof target !== 'string' || target.length === 0) continue;
      const resolved = path.join(base, entry.name, target);
      if (!fs.existsSync(resolved)) {
        entrypointErrors.push(`${manifest.name ?? `${packageRoot}/${entry.name}`} ${field} -> ${target}`);
      }
    }
  }
}

if (entrypointErrors.length) {
  console.error('Workspace package entrypoints reference missing files:\n' + entrypointErrors.map((x) => `- ${x}`).join('\n'));
  process.exit(1);
}

console.log(`Expo Base validation passed (${required.length} required files present; workspace entrypoints resolved).`);
