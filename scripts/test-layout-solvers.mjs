import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const outDir = path.join(root, '.tmp-layout-contracts');
fs.rmSync(outDir, { recursive: true, force: true });

const compile = spawnSync('tsc', ['-p', 'packages/platform/tsconfig.json', '--noEmit', 'false', '--outDir', outDir], {
  cwd: root,
  encoding: 'utf8',
});
if (compile.status !== 0) {
  process.stderr.write(compile.stdout ?? '');
  process.stderr.write(compile.stderr ?? '');
  process.exit(compile.status ?? 1);
}

try {
  const overflow = await import(pathToFileURL(path.join(outDir, 'platform/src/overflow.js')).href);
  const responsive = await import(pathToFileURL(path.join(outDir, 'platform/src/responsive.js')).href);
  const scroll = await import(pathToFileURL(path.join(outDir, 'platform/src/scroll.js')).href);

  const actions = [
    { key: 'save', priority: 'required', width: 90, order: 0 },
    { key: 'compare', priority: 'preferred', width: 100, order: 1 },
    { key: 'export', priority: 'preferred', width: 90, order: 2 },
    { key: 'share', priority: 'overflow', width: 80, order: 3 },
    { key: 'archive', priority: 'overflow', width: 90, order: 4 },
  ];

  assert.deepEqual(
    overflow.solveActionOverflow({ availableWidth: 520, actions, gap: 8, overflowTriggerWidth: 72 }),
    { visibleKeys: ['save', 'compare', 'export', 'share', 'archive'], overflowKeys: [], capacityExceeded: false, usedWidth: 482 },
  );

  const constrained = overflow.solveActionOverflow({ availableWidth: 360, actions, gap: 8, overflowTriggerWidth: 72 });
  assert.deepEqual(constrained.visibleKeys, ['save', 'compare']);
  assert.deepEqual(constrained.overflowKeys, ['export', 'share', 'archive']);
  assert.equal(constrained.capacityExceeded, false);
  assert.ok(constrained.usedWidth <= 360);

  const triggerPressure = overflow.solveActionOverflow({
    availableWidth: 100,
    gap: 8,
    overflowTriggerWidth: 44,
    actions: [
      { key: 'save', priority: 'required', width: 80, order: 0 },
      { key: 'share', priority: 'overflow', width: 80, order: 1 },
    ],
  });
  assert.equal(triggerPressure.capacityExceeded, true);
  assert.deepEqual(triggerPressure.visibleKeys, ['save']);
  assert.deepEqual(triggerPressure.overflowKeys, ['share']);

  const impossible = overflow.solveActionOverflow({
    availableWidth: 120,
    gap: 8,
    overflowTriggerWidth: 44,
    actions: [
      { key: 'a', priority: 'required', width: 80, order: 0 },
      { key: 'b', priority: 'required', width: 80, order: 1 },
    ],
  });
  assert.equal(impossible.capacityExceeded, true);
  assert.deepEqual(impossible.visibleKeys, ['a', 'b']);


  const strictPriority = overflow.solveActionOverflow({
    availableWidth: 290,
    gap: 8,
    overflowTriggerWidth: 44,
    actions: [
      { key: 'save', priority: 'required', width: 70, order: 0 },
      { key: 'largePreferred', priority: 'preferred', width: 180, order: 1 },
      { key: 'smallOverflow', priority: 'overflow', width: 40, order: 2 },
    ],
  });
  assert.deepEqual(strictPriority.visibleKeys, ['save']);
  assert.deepEqual(strictPriority.overflowKeys, ['largePreferred', 'smallOverflow']);

  let seed = 173;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let scenario = 0; scenario < 1000; scenario += 1) {
    const count = 1 + Math.floor(random() * 8);
    const generated = Array.from({ length: count }, (_, index) => ({
      key: `a${index}`,
      priority: index === 0 ? 'required' : random() < 0.55 ? 'preferred' : 'overflow',
      width: 40 + Math.floor(random() * 130),
      order: index,
    }));
    const availableWidth = 40 + Math.floor(random() * 760);
    const solved = overflow.solveActionOverflow({ availableWidth, actions: generated, gap: 8, overflowTriggerWidth: 44 });
    for (const required of generated.filter((action) => action.priority === 'required')) {
      assert.ok(solved.visibleKeys.includes(required.key));
    }
    if (!solved.capacityExceeded) assert.ok(solved.usedWidth <= availableWidth);
    const hiddenPreferred = generated.some((action) => action.priority === 'preferred' && solved.overflowKeys.includes(action.key));
    if (hiddenPreferred) {
      assert.equal(generated.some((action) => action.priority === 'overflow' && solved.visibleKeys.includes(action.key)), false);
    }
  }

  const thresholds = { compact: 0, medium: 600, expanded: 900, wide: 1200 };
  assert.equal(responsive.capabilityForWidth(320, thresholds), 'compact');
  assert.equal(responsive.capabilityForWidth(600, thresholds), 'medium');
  assert.equal(responsive.capabilityForWidth(1199, thresholds), 'expanded');
  assert.equal(responsive.capabilityForWidth(1200, thresholds), 'wide');
  assert.equal(responsive.isCapabilityVisible('medium', { from: 'medium', until: 'wide' }), true);
  assert.equal(responsive.isCapabilityVisible('wide', { from: 'medium', until: 'wide' }), false);

  const validScroll = scroll.validateScrollContract([
    { key: 'screen', axis: 'vertical', owner: 'screen' },
    { key: 'chart', axis: 'horizontal', owner: 'internal' },
  ]);
  assert.equal(validScroll.valid, true);

  const invalidScroll = scroll.validateScrollContract([
    { key: 'screen', axis: 'vertical', owner: 'screen' },
    { key: 'list', axis: 'vertical', owner: 'list' },
  ]);
  assert.equal(invalidScroll.valid, false);
  assert.equal(invalidScroll.violations.length, 1);

  console.log('Layout solver tests passed (overflow, capability, scroll ownership).');
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
}
