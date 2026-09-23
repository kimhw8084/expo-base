import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'golden.owner-certification.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const evidence = JSON.parse(fs.readFileSync(path.join(root, 'golden.evidence.json'), 'utf8'));
const baselineFor = (owner) => owner.id.includes('advanced') ? 'golden-plus-advanced-wide' : owner.id.startsWith('visualization') ? 'visualization-wide' : owner.id.startsWith('forms') ? 'forms-wide' : owner.id.startsWith('data') ? 'data-workspace-wide' : 'actions-wide';
const cloneOwner = (owner, overrides) => ({ ...owner, ...overrides });
const forcedColorEvidence = new Map([
  ['components.actions', ['forced-colors-label-task', 'forced-colors-focus-state-semantics']],
  ['forms.text-entry', ['forced-colors-label-task']],
  ['forms.static-choice', ['forced-colors-label-task', 'forced-colors-focus-state-semantics']],
  ['forms.semantic-input', ['forced-colors-focus-state-semantics']],
  ['feedback.async', ['forced-colors-label-task']],
  ['visualization.advanced', ['forced-colors-advanced-chart-fallbacks']],
]);
const largeTextEvidence = new Map([
  ['components.actions', ['large-text-page-header-actions']],
  ['forms.text-entry', ['large-text-multi-section-form']],
  ['forms.static-choice', ['large-text-multi-section-form']],
  ['data.table', ['large-text-data-workspace']],
  ['overlays.sheet', ['large-text-long-sheet-final-action']],
]);
const expandedOwners = manifest.owners.flatMap((owner) => {
  if (owner.id === 'forms.fields') {
    return [
      cloneOwner(owner, { id: 'forms.text-entry', owner: 'Text entry fields', catalogItems: ['forms.text-input'], states: ['enabled', 'focus-visible', 'disabled', 'read-only', 'error', 'loading', 'long-content'] }),
      cloneOwner(owner, { id: 'forms.static-choice', owner: 'Static choice fields', catalogItems: ['forms.choice'], states: ['enabled', 'focus-visible', 'selected', 'disabled', 'error', 'long-content'] }),
      cloneOwner(owner, { id: 'forms.semantic-input', owner: 'Semantic value fields', catalogItems: ['forms.semantic-input'], states: ['enabled', 'focus-visible', 'disabled', 'read-only', 'error', 'locale-format', 'long-content'] }),
      cloneOwner(owner, { id: 'forms.searchable-choice', owner: 'Searchable choice fields', catalogItems: ['forms.searchable-choice'], states: ['closed', 'open', 'search', 'active-option', 'selected', 'loading', 'empty', 'long-content'] }),
      cloneOwner(owner, { id: 'forms.code-entry', owner: 'Verification code fields', catalogItems: ['forms.code-input'], states: ['empty', 'partial', 'complete', 'paste', 'backspace', 'error', 'disabled', 'long-content'] }),
    ];
  }
  if (owner.id === 'overlays.dialog') {
    return [
      cloneOwner(owner, { id: 'overlays.dialog-alert', owner: 'Dialog and alert dialog', catalogItems: ['overlays.confirmation'], states: ['open', 'focus-visible', 'loading', 'destructive', 'long-content', 'reduced-motion'] }),
      cloneOwner(owner, { id: 'overlays.sheet', owner: 'Bottom sheet', catalogItems: ['overlays.sheet'], states: ['open', 'focus-visible', 'long-content', 'scrolling', 'reduced-motion'] }),
    ];
  }
  if (owner.id === 'visualization.core-families') {
    return [
      cloneOwner(owner, { id: 'visualization.single-series', owner: 'Single-series charts', catalogItems: ['visualization.chart'], states: ['ready', 'loading', 'empty', 'error', 'selected', 'long-content', 'reduced-motion'] }),
      cloneOwner(owner, { id: 'visualization.composition', owner: 'Chart anatomy and fallback', catalogItems: ['visualization.anatomy'], states: ['ready', 'loading', 'empty', 'error', 'selected', 'legend', 'data-table', 'long-content'] }),
      cloneOwner(owner, { id: 'visualization.multi-series', owner: 'Multi-series compositions', catalogItems: ['visualization.plus'], states: ['ready', 'loading', 'empty', 'error', 'selected', 'legend', 'data-table', 'long-content'] }),
    ];
  }
  return [owner];
});
manifest.owners = expandedOwners;
for (const owner of manifest.owners) {
  const executedStates = new Map((evidence.browser ?? [])
    .filter((entry) => entry.caseType === 'owner-state' && entry.caseId?.startsWith(`${owner.id}/`))
    .map((entry) => [entry.caseId.slice(owner.id.length + 1), entry.id]));
  owner.stateEvidence = Object.fromEntries(owner.states.flatMap((state) => executedStates.has(state) ? [[state, [executedStates.get(state)]]] : []));
  owner.deferredStates = Object.fromEntries(owner.states.filter((state) => !owner.stateEvidence[state]).map((state) => [state, 'No distinct executable case currently establishes this declared state with a semantic or task assertion.']));
  owner.forcedColors = forcedColorEvidence.has(owner.id);
  owner.largeText = largeTextEvidence.has(owner.id);
  owner.evidence = {
    fixtures: ['owner-workbench-fixtures'],
    contracts: ['owner-certification-contract'],
    browser: ['owner-workbench-browser'],
    semantic: ['golden-semantic-certification'],
    ...(owner.interactive ? { mobile: ['mobile-owner-parity'] } : {}),
    forcedColors: forcedColorEvidence.get(owner.id) ?? [],
    largeText: largeTextEvidence.get(owner.id) ?? [],
    ...(owner.visualBaseline ? { visual: [baselineFor(owner)] } : {}),
  };
}
manifest.schemaVersion = 3;
manifest.policy.evidence = 'Owner fixtures list declared state names only. Each declared owner state is either bound to one exact executed Playwright case with a checked outcome or explicitly deferred; environment evidence resolves to exact qualification cases in golden.evidence.json.';
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Enriched ${manifest.owners.length} owner certifications with executable evidence links.`);
