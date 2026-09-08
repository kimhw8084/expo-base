import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const packageDirs = [];
for (const scope of ['packages', 'apps']) {
  for (const entry of fs.readdirSync(path.join(root, scope), { withFileTypes: true })) {
    const manifestPath = path.join(root, scope, entry.name, 'package.json');
    if (entry.isDirectory() && fs.existsSync(manifestPath)) packageDirs.push({ scope, dir: path.join(scope, entry.name), manifest: readJson(path.join(scope, entry.name, 'package.json')) });
  }
}
const catalog = readJson('golden.catalog.json');
const api = readJson('precision.api.json');
const cert = readJson('golden.certification.json');
const ownerCertPath = path.join(root, 'golden.owner-certification.json');
const ownerCert = fs.existsSync(ownerCertPath) ? readJson('golden.owner-certification.json') : { owners: [], exemptions: [] };
const routes = fs.readdirSync(path.join(root, 'apps/reference/app'), { withFileTypes: true }).flatMap((entry) => {
  if (!entry.isFile() || !/\.(tsx|ts)$/.test(entry.name) || entry.name.startsWith('_') || entry.name.startsWith('+')) return [];
  return [`/${entry.name.replace(/\.(tsx|ts)$/, '')}`];
}).concat(['/','/+not-found','/link-error','/auth/callback']).sort();
const sourceInventory = {
  layouts: fs.readdirSync(path.join(root, 'packages/layouts/src')).filter((file) => /\.(ts|tsx)$/.test(file)).sort(),
  forms: fs.readdirSync(path.join(root, 'packages/forms/src')).filter((file) => /\.(ts|tsx)$/.test(file)).sort(),
  overlays: fs.readdirSync(path.join(root, 'packages/overlays/src')).filter((file) => /\.(ts|tsx)$/.test(file)).sort(),
  dataDisplay: fs.readdirSync(path.join(root, 'packages/data-display/src')).filter((file) => /\.(ts|tsx)$/.test(file)).sort(),
  visualization: fs.readdirSync(path.join(root, 'packages/visualization/src')).filter((file) => /\.(ts|tsx)$/.test(file)).sort(),
  advancedVisualization: fs.readdirSync(path.join(root, 'packages/visualization-advanced/src')).filter((file) => /\.(ts|tsx)$/.test(file)).sort(),
  referenceRoutes: routes,
};
const graph = Object.fromEntries(packageDirs.map(({ manifest }) => [manifest.name, Object.keys({ ...(manifest.dependencies ?? {}), ...(manifest.peerDependencies ?? {}) }).filter((name) => name.startsWith('@precision-calm/')).sort()]));
const decisions = [
  { candidate: 'owner certification', disposition: 'BUILD_KERNEL', owner: 'scripts/check-owner-certification.mjs + golden.owner-certification.json', rationale: 'Stable owners need a machine-readable contract for state, responsive, semantic, theme, and touch coverage.' },
  { candidate: 'dependency graph', disposition: 'BUILD_KERNEL', owner: 'scripts/check-dependency-graph.mjs', rationale: 'Acyclic package ownership and core/advanced separation are architectural invariants.' },
  { candidate: 'advanced visualization', disposition: 'BUILD_GOLDEN_MODULE', owner: '@precision-calm/visualization-advanced', rationale: 'Scatter, histogram, and heatmap mechanics are reusable but should not enter the minimal facade.' },
  { candidate: 'tooltip', disposition: 'RECIPE_ONLY', owner: '@precision-calm/overlays Popover + explicit HelpPopover recipe', rationale: 'Critical information cannot depend on hover; a universal touch-safe tooltip needs a separate interaction contract.' },
  { candidate: 'slider/range', disposition: 'RECIPE_ONLY', owner: '@precision-calm/forms', rationale: 'No current cross-platform owner meets the complete keyboard/touch/native contract without a specialist adapter.' },
  { candidate: 'enterprise grid', disposition: 'OPTIONAL_ADAPTER', owner: '@precision-calm/data-display + future adapter boundary', rationale: 'Virtualization, pinned columns, formulas, and cell editing are specialist infrastructure.' },
  { candidate: 'maps/editor/realtime GPU', disposition: 'PRODUCT_SPECIFIC', owner: 'product-owned specialist adapter', rationale: 'Low universal leverage and high dependency/platform cost.' },
  { candidate: 'native picker/safe area/VoiceOver', disposition: 'NATIVE_VALIDATION_REQUIRED', owner: 'runtime/platform contracts', rationale: 'Web and source contracts cannot prove physical device behavior.' },
  { candidate: 'help popover', disposition: 'RECIPE_ONLY', owner: '@precision-calm/overlays Popover + disclosure', rationale: 'Explicit help is already supported by the overlay contract without introducing a second positioning system.' },
  { candidate: 'split/button group/shortcut hint', disposition: 'RECIPE_ONLY', owner: '@precision-calm/components + existing action/menu owners', rationale: 'Existing Button, ActionMenu, and shortcut composition cover the generic mechanics without a new public family.' },
  { candidate: 'tree/hierarchy view', disposition: 'OPTIONAL_ADAPTER', owner: 'data-display adapter boundary', rationale: 'Keyboard tree navigation and virtualization are valuable but materially more specialized than the core list/table contract.' },
  { candidate: 'attachment/file/media tiles', disposition: 'RECIPE_ONLY', owner: '@precision-calm/media-presentation MediaFrame + data composition', rationale: 'Presentation can be composed without owning upload transport, file permissions, or a new media hierarchy.' },
  { candidate: 'token input', disposition: 'RECIPE_ONLY', owner: '@precision-calm/forms searchable-choice', rationale: 'The existing choice and multiselect contracts own the generic selection lifecycle.' },
  { candidate: 'file-picker field', disposition: 'OPTIONAL_ADAPTER', owner: 'capability media adapter + form composition', rationale: 'The input needs platform capability selection and must not pull acquisition dependencies into the kernel.' },
  { candidate: 'analytics panels and dashboard compositions', disposition: 'RECIPE_ONLY', owner: 'Golden patterns + ChartFrame + Metric + AdaptiveDataTable', rationale: 'The current product-neutral primitives compose these narratives while product meaning remains outside the kernel.' },
  { candidate: 'chart axes/formatters/data fallback', disposition: 'BUILD_KERNEL', owner: '@precision-calm/platform + @precision-calm/visualization', rationale: 'Scales, finite data, deterministic ticks, shared state anatomy, and accessible table fallback are common mechanics.' },
  { candidate: 'specialist statistical/financial chart families', disposition: 'OPTIONAL_ADAPTER', owner: '@precision-calm/visualization-advanced boundary', rationale: 'Candlestick, box plot, funnel, cohort, and high-density composites should not inflate every app until real demand justifies them.' },
  { candidate: 'chart inspector/legend interaction', disposition: 'RECIPE_ONLY', owner: 'ChartFrame + existing overlay/pressable contracts', rationale: 'The core contract protects keyboard/touch selection and fallback; a universal inspector remains a deliberate future module boundary.' },
  { candidate: 'specialist media/editor/maps', disposition: 'PRODUCT_SPECIFIC', owner: 'product-owned specialist adapter', rationale: 'These require domain, platform, or heavy rendering infrastructure that Golden Base should not own.' },
];
const audit = {
  schemaVersion: 1,
  generatedBy: 'scripts/generate-ultimate-golden-audit.mjs',
  source: 'live checkout',
  metrics: { workspaces: packageDirs.length, catalogOwners: catalog.items.length, ownershipRecords: catalog.ownership.length, discoveryChallenges: catalog.discoveryChallenges.length, publicApiSymbols: api.symbolCount, stateOwners: cert.stateMatrix.length, visualBaselines: cert.visualBaselines.length, pseudoRoutes: cert.pseudoCoverage.routes.length, ownerCertificationRecords: ownerCert.owners.length },
  inventories: { workspaces: packageDirs.map(({ dir, manifest }) => ({ dir, name: manifest.name, dependencies: Object.keys({ ...(manifest.dependencies ?? {}), ...(manifest.peerDependencies ?? {}) }).sort() })), packageGraph: graph, catalogOwnership: catalog.ownership, publicExports: api.packages, sourceInventory },
  certificationLanes: ['structural', 'semantic/accessibility', 'visual', 'performance', 'desktop browser', 'mobile browser', 'generator/scaffolder', 'runtime/native source contracts', 'owner certification'],
  layerModel: { kernel: ['tokens', 'primitives', 'components', 'layouts', 'forms', 'navigation', 'overlays', 'feedback', 'data-display', 'core visualization', 'i18n', 'accessibility', 'motion', 'runtime boundaries'], modules: ['visualization-advanced', 'advanced analytics compositions when independently justified'], optionalAdapters: ['native pickers', 'specialist grids', 'maps/geospatial', 'rich editors', 'GPU/realtime rendering', 'specialist media engines'] },
  candidateDecisions: decisions,
  deliberateBoundaries: ['product authorization/security decisions', 'offline conflict resolution', 'business calendars/scheduling rules', 'backend integrations', 'domain-specific financial/ecommerce components', 'actual native runtime acceptance'],
};
fs.writeFileSync(path.join(root, 'docs/ultimate-golden-capabilities.json'), JSON.stringify(audit, null, 2) + '\n');
const md = [
  '# Ultimate Golden Audit',
  '',
  'This document is generated from the live checkout by `scripts/generate-ultimate-golden-audit.mjs`. The JSON artifact is authoritative for the inventory; historical phase documents retain their original measurements.',
  '',
  '## Live inventory',
  '',
  '| Measure | Current value |',
  '| --- | ---: |',
  `| Workspaces | ${packageDirs.length} |`,
  `| Golden Catalog owners | ${catalog.items.length} |`,
  `| Ownership records | ${catalog.ownership.length} |`,
  `| Discovery challenges | ${catalog.discoveryChallenges.length} |`,
  `| Public facade symbols | ${api.symbolCount} |`,
  `| Existing state owners | ${cert.stateMatrix.length} |`,
  `| Existing visual baselines | ${cert.visualBaselines.length} |`,
  `| Existing pseudo-covered routes | ${cert.pseudoCoverage.routes.length} |`,
  `| Owner-certification records | ${ownerCert.owners.length} |`,
  '',
  '## Layer decision',
  '',
  '- **Golden Kernel:** low-dependency tokens, primitives, common UI, layouts, forms, navigation, overlays, feedback, data display, core visualization, i18n, accessibility, motion, and runtime boundaries.',
  '- **Golden Modules:** advanced visualization and future analytics compositions that remain tree-shakeable and absent from minimal generated apps.',
  '- **Optional adapters:** native pickers, specialist grids, maps, editors, GPU/realtime rendering, and specialist media engines.',
  '',
  '## Candidate dispositions',
  '',
  ...decisions.map((decision) => `- **${decision.candidate} — ${decision.disposition}:** ${decision.rationale}`),
  '',
  '## Certification model',
  '',
  'The convergence gates combine the existing Golden lanes with explicit owner certification and package dependency graph validation. Stable visual owners declare states, theme/density/viewports, localization, semantics, keyboard/touch, forced colors, large text, and baseline relevance. Nonvisual catalog items remain explicit exemptions rather than denominator manipulation.',
  '',
  'Native runtime acceptance remains separate and unexecuted.',
  '',
].join('\n');
fs.writeFileSync(path.join(root, 'docs/ULTIMATE_GOLDEN_AUDIT.md'), md);
const coverage = {
  schemaVersion: 1,
  generatedBy: 'scripts/generate-ultimate-golden-audit.mjs',
  metrics: { catalogOwners: catalog.items.length, ownerCertificationRecords: ownerCert.owners.length, explicitExemptionGroups: ownerCert.exemptions?.length ?? 0, stateCertified: ownerCert.owners.length, responsiveCertified: ownerCert.owners.filter((owner) => owner.responsive).length, accessibleCertified: ownerCert.owners.filter((owner) => owner.forcedColors && owner.largeText).length, mobileCertified: ownerCert.owners.filter((owner) => owner.touch || !owner.interactive).length, visualBaselineRelevant: ownerCert.owners.filter((owner) => owner.visualBaseline).length, generatorAwareCatalogItems: catalog.items.filter((item) => item.generatorAvailability && item.generatorAvailability !== 'not-applicable').length },
  uncoveredStableOwnerPolicy: 'Every nonvisual, recipe, runtime, capability, generator, or native-only concern is documented as an explicit boundary in ultimate-golden-capabilities.json or golden.owner-certification.json.',
  nativeOnly: ['physical safe-area values', 'native keyboard/controller behavior', 'UIKit Modal behavior', 'VoiceOver rotor/announcement behavior', 'OS permissions/biometrics/camera/notifications'],
};
fs.writeFileSync(path.join(root, 'docs/ultimate-golden-coverage.json'), JSON.stringify(coverage, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'docs/ULTIMATE_GOLDEN_COVERAGE.md'), [
  '# Ultimate Golden Coverage',
  '',
  'Generated from the live owner registry.',
  '',
  '| Category | Count |',
  '| --- | ---: |',
  `| Catalog owners | ${coverage.metrics.catalogOwners} |`,
  `| Certified visual owners | ${coverage.metrics.stateCertified} |`,
  `| Responsive-certified owners | ${coverage.metrics.responsiveCertified} |`,
  `| Accessibility stress-certified owners | ${coverage.metrics.accessibleCertified} |`,
  `| Mobile/touch-certified or noninteractive owners | ${coverage.metrics.mobileCertified} |`,
  `| Owners with curated visual relevance | ${coverage.metrics.visualBaselineRelevant} |`,
  `| Generator-aware catalog items | ${coverage.metrics.generatorAwareCatalogItems} |`,
  '',
  'The remaining catalog surface is intentionally covered by explicit nonvisual/recipe/runtime/native boundaries; it is not silently treated as a visual component. Native runtime acceptance remains unexecuted.',
  '',
].join('\n'));
console.log(`Ultimate audit generated (${packageDirs.length} workspaces / ${catalog.items.length} owners / ${api.symbolCount} API symbols / ${ownerCert.owners.length} owner records).`);
