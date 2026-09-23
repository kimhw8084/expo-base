import assert from 'node:assert/strict';
import { validateOwnerStateEvidence } from './owner-state-evidence.mjs';

const certification = {
  owners: [{
    id: 'components.actions',
    states: ['enabled', 'disabled'],
    stateEvidence: { enabled: ['case-actions-enabled'] },
    deferredStates: { disabled: 'No distinct executable disabled-state case is registered.' },
  }],
};
const testSource = `import { expect, test } from '@playwright/test';
test('@owner-state components.actions/enabled enabled action activates', async ({ page }) => {
  await page.getByRole('button', { name: 'Enabled action' }).click();
  await expect(page.getByRole('heading', { name: 'Fixture error' })).toBeVisible();
});`;
const caseEvidence = {
  browser: [{
    id: 'case-actions-enabled',
    file: 'tests/e2e/web/ultimate-workbench.spec.ts',
    marker: '@owner-state components.actions/enabled',
    caseId: 'components.actions/enabled',
    caseType: 'owner-state',
    outcome: 'Enabled action activates and renders the shared error state.',
    assertions: ["getByRole('heading'", 'toBeVisible()'],
  }],
};
const readFile = (file) => {
  assert.equal(file, 'tests/e2e/web/ultimate-workbench.spec.ts');
  return testSource;
};

const accepted = validateOwnerStateEvidence(certification, caseEvidence, readFile);
assert.deepEqual(accepted, { executedStates: 1, deferredStates: 1 });

assert.throws(
  () => validateOwnerStateEvidence({ owners: [{ ...certification.owners[0], stateEvidence: { enabled: ['fixture-only'] } }] }, { fixtures: [{ id: 'fixture-only', file: 'apps/reference/workbenchFixtures.ts', marker: 'components.actions' }], browser: [] }, () => 'export const ownerFixtures = [{ ownerId: "components.actions", states: ["enabled"] }];'),
  /requires a browser execution case; fixture\/list evidence is not execution proof/,
  'A state-name fixture alone must be rejected as non-executed evidence.',
);

assert.throws(
  () => validateOwnerStateEvidence(certification, { browser: [{ ...caseEvidence.browser[0], marker: '@owner-state missing/case' }] }, readFile),
  /must identify exactly one Playwright test/,
  'A nonexistent Playwright marker must fail closed.',
);

assert.throws(
  () => validateOwnerStateEvidence(certification, { browser: [caseEvidence.browser[0], { ...caseEvidence.browser[0], id: 'duplicate-case' }] }, readFile),
  /Duplicate executed case ID/,
  'Duplicate executed case identities must fail closed.',
);

assert.throws(
  () => validateOwnerStateEvidence(certification, { browser: [{ ...caseEvidence.browser[0], caseId: 'components.actions/disabled' }] }, readFile),
  /stale or mismatched executed case binding/,
  'A real test marker bound to the wrong owner state must fail closed.',
);

assert.throws(
  () => validateOwnerStateEvidence({ owners: [{ ...certification.owners[0], stateEvidence: { enabled: ['case-actions-enabled'] }, deferredStates: { disabled: 'deferred', enabled: 'also deferred' } }] }, caseEvidence, readFile),
  /must have exactly one executed case binding or an explicit deferral/,
  'A state cannot be both executed and deferred.',
);

assert.throws(
  () => validateOwnerStateEvidence({ owners: [{ ...certification.owners[0], stateEvidence: { enabled: ['case-actions-enabled'] }, deferredStates: {} }] }, caseEvidence, readFile),
  /must have exactly one executed case binding or an explicit deferral/,
  'A declared state without executed or deferred evidence must fail closed.',
);

console.log('owner-certification-contract: exact Playwright case identities and outcomes validate; fixture-only, duplicate, missing, and stale state claims are rejected.');
