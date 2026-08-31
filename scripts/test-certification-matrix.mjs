import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const outDir = path.join(root, '.tmp-certification');
fs.rmSync(outDir, { recursive: true, force: true });
const compile = spawnSync('tsc', ['-p', 'packages/testing/tsconfig.json', '--noEmit', 'false', '--outDir', outDir], { cwd: root, encoding: 'utf8' });
if (compile.status !== 0) {
  process.stderr.write(compile.stdout ?? '');
  process.stderr.write(compile.stderr ?? '');
  process.exit(compile.status ?? 1);
}

try {
  const certification = await import(pathToFileURL(path.join(outDir, 'testing/src/certification.js')).href);
  const scenarios = certification.createCertificationScenarios();
  assert.equal(scenarios.length, 9 * 2 * 2 * 7);
  assert.equal(new Set(scenarios.map((scenario) => scenario.id)).size, scenarios.length);
  assert.equal(certification.capabilityForWidth(320), 'compact');
  assert.equal(certification.capabilityForWidth(600), 'medium');
  assert.equal(certification.capabilityForWidth(900), 'expanded');
  assert.equal(certification.capabilityForWidth(1200), 'wide');

  const valid = certification.validateGeometrySnapshot({
    viewportWidth: 390,
    viewportHeight: 844,
    documentWidth: 390,
    elements: [
      { id: 'save', x: 16, y: 120, width: 96, height: 44, actionable: true, overlapGroup: 'toolbar' },
      { id: 'more', x: 280, y: 120, width: 94, height: 44, actionable: true, overlapGroup: 'toolbar' },
      { id: 'card', x: 16, y: 188, width: 358, height: 220 },
    ],
  });
  assert.deepEqual(valid, []);

  const invalid = certification.validateGeometrySnapshot({
    viewportWidth: 320,
    viewportHeight: 568,
    documentWidth: 356,
    elements: [
      { id: 'tiny', x: 8, y: 20, width: 28, height: 28, actionable: true, overlapGroup: 'actions' },
      { id: 'overlap', x: 20, y: 20, width: 80, height: 44, actionable: true, overlapGroup: 'actions' },
      { id: 'offscreen', x: 292, y: 80, width: 60, height: 44, actionable: true },
    ],
  });
  const codes = new Set(invalid.map((violation) => violation.code));
  assert.ok(codes.has('page-overflow-x'));
  assert.ok(codes.has('target-too-small'));
  assert.ok(codes.has('offscreen-action'));
  assert.ok(codes.has('exclusive-overlap'));

  console.log(`Certification matrix tests passed (${scenarios.length} theme/density/content/viewport scenarios plus geometry invariants).`);
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
}
