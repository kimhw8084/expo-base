import assert from 'node:assert/strict';
import path from 'node:path';
import process from 'node:process';
import { inspectGoldenArchitecture } from './golden-architecture-lib.mjs';
import { readGoldenCatalog, validateGoldenCatalog } from './golden-catalog-lib.mjs';

const root = process.cwd();
const fixturesRoot = path.join(root, 'scripts', 'fixtures', 'golden-architecture');
const catalogPath = path.join(root, 'golden.catalog.json');

function inspectFixture(name, allowlists = []) {
  return inspectGoldenArchitecture({
    projectRoot: path.join(fixturesRoot, name),
    config: {
      schemaVersion: 1,
      catalogPath,
      featureRoots: ['app'],
      excludePaths: [],
      allowlists,
    },
  });
}

function expectRule(name, ruleId, expectedFragment) {
  const violations = inspectFixture(name);
  const expected = new RegExp(expectedFragment);
  const violation = violations.find((candidate) => candidate.ruleId === ruleId && expected.test(candidate.message));
  assert.ok(violation, `${name} must fail ${ruleId}: ${JSON.stringify(violations, null, 2)}`);
  assert.match(violation.message, expected);
  assert.match(violation.message, /See docs\/(?:GOLDEN_CATALOG|GOLDEN_WORKFLOWS)\.md#/);
}

expectRule('design', 'design-ownership', 'literal padding');
assert.ok(inspectFixture('design').some((violation) => violation.message.includes('literal marginTop')), 'top-level style aliases must be resolved structurally');
expectRule('sticky-actions', 'workflow-ownership', 'fixed action positioning');
expectRule('interaction', 'interaction-ownership', 'raw Pressable');
expectRule('forms', 'form-ownership', 'raw TextInput');
assert.ok(inspectFixture('forms').some((violation) => violation.message.includes('direct date/time implementation import')), 'feature date/time implementation imports must be detected structurally');
expectRule('overlay', 'overlay-ownership', 'raw Modal');
expectRule('platform', 'platform-ownership', 'Platform\.OS branch');
expectRule('runtime', 'runtime-ownership', 'direct fetch call');
expectRule('navigation', 'navigation-ownership', 'navigation import from expo-router');
expectRule('feedback', 'feedback-ownership', 'raw ActivityIndicator');
expectRule('media', 'media-ownership', 'raw Image');
expectRule('i18n', 'i18n-ownership', 'feature-local locale formatting');
expectRule('server-state', 'server-state-ownership', 'query implementation import from @tanstack/react-query');
expectRule('capabilities', 'capability-ownership', 'direct expo-secure-store import');
assert.ok(inspectFixture('capabilities').some((violation) => violation.message.includes('direct AppState import')), 'feature AppState imports must be detected structurally');
assert.ok(inspectFixture('i18n').some((violation) => violation.message.includes('I18nManager direction branch')), 'feature I18nManager direction branches must be detected structurally');

assert.deepEqual(inspectFixture('approved'), [], 'shared owners must pass the feature-route check');
expectRule('allowlisted', 'platform-ownership', 'Platform\.OS branch');
assert.deepEqual(inspectFixture('allowlisted', [{
  id: 'fixture-native-bridge',
  paths: ['app/platform-bridge.tsx'],
  rules: ['platform-ownership'],
  rationale: 'Fixture proves a narrow reviewed native bridge exception.',
}]), [], 'a narrow rationale-bearing allowlist must suppress only its declared rule');

const validation = validateGoldenCatalog(root);
assert.deepEqual(validation.errors, [], validation.errors.join('\n'));
const catalog = readGoldenCatalog(root);
for (const challenge of catalog.discoveryChallenges) {
  assert.ok(challenge.requiredItems.length > 0, `${challenge.intent} must map to at least one sanctioned owner`);
  for (const itemId of challenge.requiredItems) assert.ok(catalog.items.some((item) => item.id === itemId), `${challenge.intent} references ${itemId}`);
}

console.log(`Golden architecture tests passed (13 structural rule fixtures, approved-owner fixture, allowlist fixture, ${catalog.discoveryChallenges.length} discovery challenges).`);
