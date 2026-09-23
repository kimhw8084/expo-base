import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { scaffoldScreen } from '../packages/create-expo-base-app/lib/screen-scaffold.mjs';
import { validateTaskEffectBindings, validateTaskEffectDocument } from '../packages/create-expo-base-app/lib/task-effects.mjs';

const root = process.cwd();
const target = path.join(root, 'apps', '.tmp-screen-scaffold');
const minimal = path.join(root, 'apps', '.tmp-screen-scaffold-minimal');
const reordered = path.join(root, 'apps', '.tmp-screen-scaffold-reordered');
const challenges = JSON.parse(fs.readFileSync(path.join(root, 'scripts/fixtures/golden-workflows/challenges.json'), 'utf8'));
const extraTasks = [
  { name: 'review', patternId: 'review-approval' },
  { name: 'completion', patternId: 'completion' },
  { name: 'permissions', patternId: 'permission-rationale' },
];

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

try {
  fs.rmSync(target, { recursive: true, force: true });
  fs.rmSync(minimal, { recursive: true, force: true });
  fs.rmSync(reordered, { recursive: true, force: true });
  run(process.execPath, ['packages/create-expo-base-app/bin/create-expo-base-app.mjs', '--name', 'Workflow Lab', '--slug', 'workflow-lab', '--directory', target, '--capabilities', 'media,preferences,runtime-signals']);
  run(process.execPath, ['packages/create-expo-base-app/bin/create-expo-base-app.mjs', '--name', 'Minimal Lab', '--slug', 'minimal-lab', '--directory', minimal]);
  run(process.execPath, ['packages/create-expo-base-app/bin/create-expo-base-app.mjs', '--name', 'Reordered Lab', '--slug', 'reordered-lab', '--directory', reordered, '--capabilities', 'media,preferences,runtime-signals']);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(minimal, '.expo-base/task-effects.json'), 'utf8')), { schemaVersion: 1, actions: [] });

  const beforeMissingCapability = fs.readFileSync(path.join(minimal, 'expo-base.routes.json'), 'utf8');
  const beforeMissingCapabilityEffects = fs.readFileSync(path.join(minimal, '.expo-base/task-effects.json'), 'utf8');
  assert.throws(() => scaffoldScreen({ root, app: path.relative(root, minimal), name: 'imports', patternId: 'import-workflow' }), /requires selected capability "media"/);
  assert.equal(fs.readFileSync(path.join(minimal, 'expo-base.routes.json'), 'utf8'), beforeMissingCapability, 'failed capability selection must leave no partial route mutation');
  assert.equal(fs.readFileSync(path.join(minimal, '.expo-base/task-effects.json'), 'utf8'), beforeMissingCapabilityEffects, 'failed capability selection must leave task effects untouched');
  assert.throws(() => scaffoldScreen({ root, app: path.relative(root, minimal), name: 'standalone-detail', patternId: 'detail' }), /manual Golden composition only/);
  assert.equal(fs.readFileSync(path.join(minimal, 'expo-base.routes.json'), 'utf8'), beforeMissingCapability, 'manual-only patterns must leave no partial route mutation');

  for (const challenge of challenges) {
    const result = scaffoldScreen({
      root,
      app: path.relative(root, target),
      name: challenge.name,
      patternId: challenge.pattern,
      capabilities: challenge.capabilities ?? [],
    });
    assert.ok(result.routes.length > 0, `${challenge.id} creates routes`);
    const primarySource = fs.readFileSync(path.join(target, challenge.requiredFiles[0]), 'utf8');
    for (const owner of challenge.requiredOwners) assert.ok(primarySource.includes(owner), `${challenge.id} uses ${owner}`);
    for (const file of challenge.requiredFiles) {
      const source = fs.readFileSync(path.join(target, file), 'utf8');
      assert.doesNotMatch(source, /\bfetch\s*\(|style\s*=\s*\{\s*\{|Platform\.OS|useWindowDimensions|<Modal\b/, `${challenge.id} stays inside Golden ownership`);
    }
  }
  for (const task of extraTasks) scaffoldScreen({ root, app: path.relative(root, target), name: task.name, patternId: task.patternId });

  const taskEffectPath = path.join(target, '.expo-base/task-effects.json');
  const taskEffectText = fs.readFileSync(taskEffectPath, 'utf8');
  const taskEffects = JSON.parse(taskEffectText);
  assert.deepEqual(validateTaskEffectDocument(taskEffects), []);
  const expectedActions = new Map([
    ['import-workflow', ['Cancel']],
    ['review-approval', ['Back', 'Confirm']],
    ['completion', ['Continue']],
    ['permission-rationale', ['Continue']],
  ]);
  const allTaskPatterns = [...challenges.map((challenge) => ({ name: challenge.name, patternId: challenge.pattern })), ...extraTasks];
  for (const [pattern, labels] of expectedActions) {
    const challenge = allTaskPatterns.find((candidate) => candidate.patternId === pattern);
    assert.ok(challenge, `${pattern} workflow fixture exists`);
    const actions = taskEffects.actions.filter((action) => action.pattern === pattern);
    assert.deepEqual(actions.map((action) => action.label).sort(), labels.sort(), `${pattern} records every unresolved consequential action`);
    for (const action of actions) {
      assert.equal(action.route, challenge.name, `${action.label} is bound to its route`);
      assert.equal(action.status, 'unresolved');
      assert.ok(action.intendedEffect && action.prohibitedEffects.length && action.recoveryExpectation && action.nextAction);
    }
  }
  assert.equal(taskEffects.actions.length, 5);

  const importSource = fs.readFileSync(path.join(target, 'app/imports.tsx'), 'utf8');
  const reviewSource = fs.readFileSync(path.join(target, 'app/review.tsx'), 'utf8');
  const completionSource = fs.readFileSync(path.join(target, 'app/completion.tsx'), 'utf8');
  const permissionSource = fs.readFileSync(path.join(target, 'app/permissions.tsx'), 'utf8');
  const customerSource = fs.readFileSync(path.join(target, 'app/customers.tsx'), 'utf8');
  const customerDetailSource = fs.readFileSync(path.join(target, 'app/customers/[id].tsx'), 'utf8');
  const settingsSource = fs.readFileSync(path.join(target, 'app/account-settings.tsx'), 'utf8');
  for (const source of [importSource, reviewSource, completionSource, permissionSource]) {
    assert.match(source, /TODO\(product\): Bind /, 'unresolved actions carry a source TODO describing the Product binding');
    const noOpHandlers = [...source.matchAll(/onPress=\{\(\) => \{\}\}/g)];
    assert.ok(noOpHandlers.length > 0, 'each no-op placeholder has a direct non-operational control');
    assert.ok(noOpHandlers.every((handler) => {
      const buttonStart = source.lastIndexOf('<Button', handler.index);
      const buttonEnd = source.indexOf('/>', handler.index);
      return /\bdisabled\b/.test(source.slice(buttonStart, buttonEnd));
    }), 'no no-op consequential control remains active-looking');
  }
  assert.ok(importSource.includes('label="Choose document"') && importSource.includes('void choose();'), 'document acquisition remains operational');
  assert.ok(importSource.includes('label="Upload" disabled={!resource}') && importSource.includes('void upload.execute(resource)'), 'shared upload mutation remains wired');
  assert.ok(reviewSource.includes('label="Continue"') && reviewSource.includes('setConfirming(true)'), 'review continues to its confirmation step');
  assert.match(reviewSource, /label="Confirm"[^>]*disabled/, 'the placeholder destructive confirmation cannot imply success');
  assert.ok(customerSource.includes('router.push('), 'workspace rows keep real route navigation');
  assert.ok(customerDetailSource.includes("router.backOr('/customers')"), 'detail Back keeps its real router behavior');
  assert.ok(settingsSource.includes('label="Save"') && settingsSource.includes('void submit()'), 'form Save keeps its validation and mutation path');
  assert.ok(settingsSource.includes('lifecycle.leaveGuard.requestLeave'), 'form Discard keeps its guarded local navigation');

  for (const challenge of [...challenges, ...extraTasks].reverse()) {
    scaffoldScreen({ root, app: path.relative(root, reordered), name: challenge.name, patternId: challenge.pattern ?? challenge.patternId, capabilities: challenge.capabilities ?? [] });
  }
  assert.equal(fs.readFileSync(path.join(reordered, '.expo-base/task-effects.json'), 'utf8'), taskEffectText, 'task-effect output is deterministic independent of scaffold order');

  const validAction = {
    actionKey: 'sample:confirm', route: 'sample', pattern: 'review-approval', label: 'Confirm', status: 'unresolved',
    intendedEffect: 'TODO(product): bind the domain effect.', prohibitedEffects: ['Do not report false success.'],
    recoveryExpectation: 'Keep the review available.', nextAction: 'Bind and evidence the effect.',
  };
  assert.ok(validateTaskEffectDocument({ schemaVersion: 1, actions: [{ ...validAction, actionKey: 'duplicate' }, { ...validAction, actionKey: 'duplicate' }] }).some((issue) => issue.includes('duplicates')));
  assert.ok(validateTaskEffectDocument({ schemaVersion: 1, actions: [{ ...validAction, status: 'pending' }] }).some((issue) => issue.includes('status')));
  assert.ok(validateTaskEffectDocument({ schemaVersion: 1, actions: [{ ...validAction, status: 'resolved' }] }).some((issue) => issue.includes('evidence')));
  assert.ok(validateTaskEffectDocument({ schemaVersion: 1, actions: [{ ...validAction, status: 'qualified' }] }).some((issue) => issue.includes('evidence')));
  assert.ok(validateTaskEffectDocument({ schemaVersion: 1, actions: 'not-an-array' }).some((issue) => issue.includes('actions')));
  assert.ok(validateTaskEffectBindings({ schemaVersion: 1, actions: [validAction] }, { routes: [], patterns: ['review-approval'] }).some((issue) => issue.includes('route')));

  const routesBeforeCollision = fs.readFileSync(path.join(target, 'expo-base.routes.json'), 'utf8');
  const taskEffectsBeforeCollision = fs.readFileSync(taskEffectPath, 'utf8');
  assert.throws(() => scaffoldScreen({ root, app: path.relative(root, target), name: 'customers', patternId: 'data-workspace' }), /Route collision|Refusing to overwrite/);
  assert.equal(fs.readFileSync(path.join(target, 'expo-base.routes.json'), 'utf8'), routesBeforeCollision, 'collision must leave route manifest untouched');
  assert.equal(fs.readFileSync(taskEffectPath, 'utf8'), taskEffectsBeforeCollision, 'collision must leave task effects untouched');

  const manifest = JSON.parse(fs.readFileSync(path.join(target, 'expo-base.routes.json'), 'utf8'));
  assert.deepEqual(manifest.authenticated, ['customers', 'customers/[id]', 'account-settings', 'imports', 'activity', 'review', 'completion', 'permissions']);
  assert.deepEqual(manifest.public, []);
  const registry = fs.readFileSync(path.join(target, 'routes.ts'), 'utf8');
  assert.ok(registry.includes('customers/[id]'));

  run('tsc', ['-p', path.join(target, 'tsconfig.json'), '--noEmit']);
  run(process.execPath, ['scripts/check-golden-architecture.mjs', '--config', path.join(target, 'golden-architecture.config.json')]);
  const doctor = run(process.execPath, ['packages/expo-base-doctor/bin/expo-base-doctor.mjs', '--path', target, '--fail']);
  assert.match(doctor.stdout, /TASK-EFFECT-002.*5 unresolved action/);
  fs.writeFileSync(taskEffectPath, JSON.stringify({ schemaVersion: 1, actions: [{ ...taskEffects.actions[0], status: 'completed' }] }));
  const malformedDoctor = spawnSync(process.execPath, ['packages/expo-base-doctor/bin/expo-base-doctor.mjs', '--path', target, '--fail'], { cwd: root, encoding: 'utf8' });
  assert.equal(malformedDoctor.status, 3, 'Doctor fails closed for malformed task-effect records');
  fs.writeFileSync(taskEffectPath, taskEffectText);
  console.log(`Screen scaffolder tests passed (${challenges.length + extraTasks.length} scaffold templates, deterministic task effects, collision rollback, capability gating, typecheck, Doctor, and Golden architecture).`);
} finally {
  fs.rmSync(target, { recursive: true, force: true });
  fs.rmSync(minimal, { recursive: true, force: true });
  fs.rmSync(reordered, { recursive: true, force: true });
}
