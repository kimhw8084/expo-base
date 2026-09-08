import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { scaffoldScreen } from '../packages/create-precision-app/lib/screen-scaffold.mjs';

const root = process.cwd();
const target = path.join(root, 'apps', '.tmp-screen-scaffold');
const minimal = path.join(root, 'apps', '.tmp-screen-scaffold-minimal');
const challenges = JSON.parse(fs.readFileSync(path.join(root, 'scripts/fixtures/golden-workflows/challenges.json'), 'utf8'));

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result;
}

try {
  fs.rmSync(target, { recursive: true, force: true });
  fs.rmSync(minimal, { recursive: true, force: true });
  run(process.execPath, ['packages/create-precision-app/bin/create-precision-app.mjs', '--name', 'Workflow Lab', '--slug', 'workflow-lab', '--directory', target, '--capabilities', 'media,preferences,runtime-signals']);
  run(process.execPath, ['packages/create-precision-app/bin/create-precision-app.mjs', '--name', 'Minimal Lab', '--slug', 'minimal-lab', '--directory', minimal]);

  const beforeMissingCapability = fs.readFileSync(path.join(minimal, 'precision.routes.json'), 'utf8');
  assert.throws(() => scaffoldScreen({ root, app: path.relative(root, minimal), name: 'imports', patternId: 'import-workflow' }), /requires selected capability "media"/);
  assert.equal(fs.readFileSync(path.join(minimal, 'precision.routes.json'), 'utf8'), beforeMissingCapability, 'failed capability selection must leave no partial route mutation');
  assert.throws(() => scaffoldScreen({ root, app: path.relative(root, minimal), name: 'standalone-detail', patternId: 'detail' }), /manual Golden composition only/);
  assert.equal(fs.readFileSync(path.join(minimal, 'precision.routes.json'), 'utf8'), beforeMissingCapability, 'manual-only patterns must leave no partial route mutation');

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

  const routesBeforeCollision = fs.readFileSync(path.join(target, 'precision.routes.json'), 'utf8');
  assert.throws(() => scaffoldScreen({ root, app: path.relative(root, target), name: 'customers', patternId: 'data-workspace' }), /Route collision|Refusing to overwrite/);
  assert.equal(fs.readFileSync(path.join(target, 'precision.routes.json'), 'utf8'), routesBeforeCollision, 'collision must leave route manifest untouched');

  const manifest = JSON.parse(fs.readFileSync(path.join(target, 'precision.routes.json'), 'utf8'));
  assert.deepEqual(manifest.authenticated, ['customers', 'customers/[id]', 'account-settings', 'imports', 'activity']);
  assert.deepEqual(manifest.public, []);
  const registry = fs.readFileSync(path.join(target, 'routes.ts'), 'utf8');
  assert.ok(registry.includes('customers/[id]'));

  run('tsc', ['-p', path.join(target, 'tsconfig.json'), '--noEmit']);
  run(process.execPath, ['scripts/check-golden-architecture.mjs', '--config', path.join(target, 'golden-architecture.config.json')]);
  run(process.execPath, ['packages/precision-doctor/bin/precision-doctor.mjs', '--path', target, '--fail']);
  console.log(`Screen scaffolder tests passed (${challenges.length} synthetic workflow challenges, collision rollback, capability gating, typecheck, Doctor, and Golden architecture).`);
} finally {
  fs.rmSync(target, { recursive: true, force: true });
  fs.rmSync(minimal, { recursive: true, force: true });
}
