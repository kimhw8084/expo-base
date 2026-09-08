import assert from 'node:assert/strict';
import fs from 'node:fs';

const certification = JSON.parse(fs.readFileSync('golden.certification.json', 'utf8'));
assert.equal(certification.schemaVersion, 1);
assert.equal(certification.environment.browser, 'chromium');
assert.ok(certification.stateMatrix.length >= 20, 'Certification requires a representative public interactive-state matrix.');
assert.ok(certification.visualBaselines.length >= 8 && certification.visualBaselines.length <= 16, 'Visual coverage must stay high-information rather than combinatorial.');
assert.ok(Array.isArray(certification.pseudoCoverage?.routes) && certification.pseudoCoverage.routes.length >= 12, 'Certification requires route-level pseudo-localization coverage for every canonical surface.');

const owners = new Set();
for (const entry of certification.stateMatrix) {
  assert.ok(entry.owner && entry.package && entry.states.length > 1, `Invalid state owner ${entry.owner ?? '<missing>'}.`);
  assert.ok(!owners.has(entry.owner), `Duplicate state owner: ${entry.owner}`);
  owners.add(entry.owner);
}
const ids = new Set();
for (const baseline of certification.visualBaselines) {
  assert.ok(!ids.has(baseline.id), `Duplicate visual baseline: ${baseline.id}`);
  assert.ok(baseline.route.startsWith('/'));
  assert.ok(['compact', 'wide'].includes(baseline.viewport));
  ids.add(baseline.id);
}
for (const [name, value] of Object.entries(certification.performanceBudgets)) {
  assert.ok(Number.isFinite(value) && value >= 0, `Invalid performance budget ${name}.`);
}
for (const route of certification.pseudoCoverage.routes) {
  assert.ok(typeof route.path === 'string' && route.path.startsWith('/'), 'Pseudo coverage routes must use absolute paths.');
  assert.ok(Array.isArray(route.classes) && route.classes.length >= 4, `Pseudo coverage requires four representative copy classes for ${route.path}.`);
  assert.ok(route.copyClassification && typeof route.copyClassification === 'object', `Pseudo coverage requires an explicit copy classification for ${route.path}.`);
  const classNames = new Set();
  for (const entry of route.classes) {
    assert.ok(typeof entry.name === 'string' && entry.name.length > 0 && typeof entry.source === 'string' && entry.source.length > 0, `Invalid pseudo coverage entry for ${route.path}.`);
    assert.ok(!classNames.has(entry.name), `Duplicate pseudo copy class ${entry.name} for ${route.path}.`);
    classNames.add(entry.name);
  }
  const classification = route.copyClassification;
  assert.ok(Array.isArray(classification.pseudoOwned) && Array.isArray(classification.intentionallyLiteral) && Array.isArray(classification.developerOnly), `Invalid pseudo copy classification for ${route.path}.`);
  assert.deepEqual([...classification.pseudoOwned].sort(), [...classNames].sort(), `Pseudo-owned classes must match coverage probes for ${route.path}.`);
  assert.deepEqual(classification.intentionallyLiteral, route.intentionalLiterals, `Intentional literals must remain explicit for ${route.path}.`);
}
console.log(`Golden certification registry passed (${owners.size} state owners / ${ids.size} visual baselines / ${certification.pseudoCoverage.routes.length} pseudo-covered routes).`);
