import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const certification = JSON.parse(fs.readFileSync(path.join(root, 'golden.owner-certification.json'), 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'golden.catalog.json'), 'utf8'));
const evidence = JSON.parse(fs.readFileSync(path.join(root, 'golden.evidence.json'), 'utf8'));
assert.ok(certification.schemaVersion >= 2);
assert.ok(Array.isArray(certification.owners) && certification.owners.length >= 12);
const catalogIds = new Set(catalog.items.map((item) => item.id));
const evidenceKinds = ['fixtures', 'contracts', 'browser', 'mobile', 'semantic', 'visual', 'forcedColors', 'largeText'];
const evidenceByKind = new Map(evidenceKinds.map((kind) => [kind, new Set((evidence[kind] ?? []).map((entry) => entry.id))]));
const evidenceEntries = new Map(evidenceKinds.flatMap((kind) => (evidence[kind] ?? []).map((entry) => [entry.id, entry])));
const baselineIds = new Set(JSON.parse(fs.readFileSync(path.join(root, 'golden.certification.json'), 'utf8')).visualBaselines.map((baseline) => baseline.id));
const fixtureSource = fs.readFileSync(path.join(root, 'apps/reference/workbenchFixtures.ts'), 'utf8');
for (const kind of evidenceKinds) {
  for (const entry of evidence[kind] ?? []) {
    if (!entry.file) continue;
    const file = path.join(root, entry.file);
    assert.ok(fs.existsSync(file), `Evidence ${entry.id} points to missing file ${entry.file}.`);
    const source = fs.readFileSync(file, 'utf8');
    assert.ok(!entry.marker || source.includes(entry.marker), `Evidence ${entry.id} marker is not present in ${entry.file}.`);
  }
}
const covered = new Set();
const ownerIds = new Set();
for (const owner of certification.owners) {
  assert.ok(!ownerIds.has(owner.id), `Duplicate owner certification: ${owner.id}`);
  ownerIds.add(owner.id);
  assert.ok(owner.owner && owner.package && owner.semanticRole, `Incomplete owner certification: ${owner.id}`);
  assert.ok(Array.isArray(owner.catalogItems) && owner.catalogItems.length > 0, `Owner ${owner.id} needs catalog links.`);
  for (const itemId of owner.catalogItems) {
    assert.ok(catalogIds.has(itemId), `${owner.id} references missing catalog item ${itemId}.`);
    assert.ok(!covered.has(itemId), `Catalog item ${itemId} has competing owner certifications.`);
    covered.add(itemId);
  }
  for (const key of ['states', 'themes', 'densities', 'viewports']) assert.ok(Array.isArray(owner[key]) && owner[key].length > 0, `${owner.id} needs ${key}.`);
  assert.ok(owner.evidence && owner.stateEvidence, `${owner.id} needs executable evidence links.`);
  assert.ok(fixtureSource.includes(owner.id), `${owner.id} has no typed workbench fixture.`);
  for (const state of owner.states) {
    const stateEvidence = owner.stateEvidence[state];
    assert.ok(Array.isArray(stateEvidence) && stateEvidence.length > 0, `${owner.id} state ${state} has no evidence.`);
    for (const evidenceId of stateEvidence) assert.ok(evidenceByKind.get('fixtures')?.has(evidenceId), `${owner.id} state ${state} references missing fixture evidence ${evidenceId}.`);
  }
  for (const kind of evidenceKinds) {
    if (kind === 'mobile' && !owner.interactive) continue;
    if (kind === 'visual' && !owner.visualBaseline) continue;
    if (kind === 'forcedColors' && !owner.forcedColors) continue;
    if (kind === 'largeText' && !owner.largeText) continue;
    const ids = owner.evidence[kind];
    assert.ok(Array.isArray(ids) && ids.length > 0, `${owner.id} needs ${kind} evidence.`);
    for (const evidenceId of ids) {
      assert.ok(evidenceByKind.get(kind)?.has(evidenceId), `${owner.id} references missing ${kind} evidence ${evidenceId}.`);
      if (kind === 'visual') assert.ok(baselineIds.has(evidenceEntries.get(evidenceId)?.baselineId), `${owner.id} visual evidence ${evidenceId} has no approved baseline.`);
    }
  }
  if (owner.interactive) {
    for (const key of ['keyboard', 'touch', 'forcedColors', 'largeText']) assert.equal(typeof owner[key], 'boolean', `${owner.id} needs ${key} coverage.`);
  }
}
const exemptions = certification.exemptions ?? [];
assert.ok(exemptions.length > 0, 'Non-visual catalog boundary must be explicit.');
const exempted = new Set();
for (const exemption of exemptions) {
  assert.ok(exemption.id && exemption.classification && Array.isArray(exemption.catalogItems), `Incomplete exemption ${exemption.id ?? '<missing>'}.`);
  for (const itemId of exemption.catalogItems) {
    assert.ok(catalogIds.has(itemId), `${exemption.id} references missing catalog item ${itemId}.`);
    assert.ok(!covered.has(itemId), `${itemId} is both visual-certified and exempted.`);
    assert.ok(!exempted.has(itemId), `${itemId} has competing exemptions.`);
    exempted.add(itemId);
  }
}
const uncovered = [...catalogIds].filter((id) => !covered.has(id) && !exempted.has(id));
assert.deepEqual(uncovered, [], `Catalog items need an owner certification or explicit exemption: ${uncovered.join(', ')}`);
assert.equal(covered.size + exempted.size, catalogIds.size, 'Owner certification coverage must account for every catalog item exactly once.');
console.log(`Owner certification passed (${certification.owners.length} stable visual owners, ${covered.size} linked catalog items, ${exempted.size} explicit nonvisual/recipe items).`);
