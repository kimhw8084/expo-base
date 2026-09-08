import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registry = fs.readFileSync(path.join(root, 'apps/reference/workbenchFixtures.ts'), 'utf8');
const certification = JSON.parse(fs.readFileSync(path.join(root, 'golden.owner-certification.json'), 'utf8'));
assert.match(registry, /ownerFixtures/);
for (const owner of certification.owners) {
  assert.match(registry, new RegExp(owner.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Fixture registry is missing ${owner.id}.`);
  for (const state of owner.states) assert.match(registry, new RegExp(state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${owner.id} is missing state ${state}.`);
}
console.log(`owner-certification-contract: typed fixture registry resolves ${certification.owners.length} owner families and ${certification.owners.reduce((total, owner) => total + owner.states.length, 0)} declared states.`);
