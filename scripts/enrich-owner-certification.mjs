import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'golden.owner-certification.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const baselineFor = (owner) => owner.id.includes('advanced') ? 'golden-plus-advanced-wide' : owner.id.startsWith('visualization') ? 'visualization-wide' : owner.id.startsWith('forms') ? 'forms-wide' : owner.id.startsWith('data') ? 'data-workspace-wide' : 'actions-wide';
const cloneOwner = (owner, overrides) => ({ ...owner, ...overrides });
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
  owner.evidence = {
    fixtures: ['owner-workbench-fixtures'],
    contracts: ['owner-certification-contract'],
    browser: ['owner-workbench-browser'],
    semantic: ['golden-semantic-certification'],
    ...(owner.interactive ? { mobile: ['mobile-owner-parity'] } : {}),
    ...(owner.forcedColors ? { forcedColors: ['forced-colors-certification'] } : {}),
    ...(owner.largeText ? { largeText: ['large-text-certification'] } : {}),
    ...(owner.visualBaseline ? { visual: [baselineFor(owner)] } : {}),
  };
  owner.stateEvidence = Object.fromEntries(owner.states.map((state) => [state, ['owner-workbench-fixtures']]));
}
manifest.schemaVersion = 2;
manifest.policy.evidence = 'Every declared owner state and environment requirement resolves to checked-in evidence in golden.evidence.json; owner fixtures remain typed in apps/reference/workbenchFixtures.ts.';
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Enriched ${manifest.owners.length} owner certifications with executable evidence links.`);
