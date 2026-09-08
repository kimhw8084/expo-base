import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const output = path.join(root, '.tmp-golden-plus');
fs.rmSync(output, { recursive: true, force: true });

function compile(project, destination) {
  const result = spawnSync('tsc', ['-p', project, '--noEmit', 'false', '--outDir', destination], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    process.exit(result.status ?? 1);
  }
}

try {
  compile('packages/platform/tsconfig.json', path.join(output, 'platform'));
  const forms = await import(pathToFileURL(path.join(output, 'platform/platform/src/forms.js')).href);
  const visualization = await import(pathToFileURL(path.join(output, 'platform/platform/src/visualization.js')).href);
  const data = await import(pathToFileURL(path.join(output, 'platform/platform/src/data.js')).href);

  assert.equal(forms.parsePrecisionTimeValue('14:30'), '14:30');
  assert.equal(forms.parsePrecisionTimeValue('24:00'), null);
  assert.equal(forms.parsePrecisionTimeValue('9:30'), null);
  assert.deepEqual(forms.parsePrecisionDateRange('2026-09-07', '2026-09-14'), { start: '2026-09-07', end: '2026-09-14' });
  assert.equal(forms.parsePrecisionDateRange('2026-09-14', '2026-09-07'), null);
  assert.match(forms.formatPrecisionCalendarDate('2026-09-07', 'en-US'), /Sep.*7.*2026/);
  assert.match(forms.formatPrecisionTimeValue('14:30', 'en-US'), /2:30.*PM/i);
  assert.deepEqual(forms.validatePrecisionDateValue('2025-12-31', { min: '2026-01-01' }), { code: 'min', message: 'Choose 2026-01-01 or later.' });

  const stacked = visualization.stackedBarRects([
    { label: 'Q1', values: [38, 12, 4] },
    { label: 'Q2', values: [45, 9, 3] },
  ], 200, 100, 8);
  assert.equal(stacked.length, 6);
  assert.ok(stacked.every((rect) => [rect.x, rect.y, rect.width, rect.height, rect.value].every(Number.isFinite)));
  assert.ok(stacked.every((rect) => rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= 200 && rect.y + rect.height <= 101));
  assert.equal(visualization.stackedBarRects([{ label: 'Invalid', values: [-1, Number.NaN] }], 100, 100).length, 0);

  const csv = data.serializePrecisionDelimitedData([
    { name: 'Alpha, Inc.', note: 'Ready' },
    { name: 'Beta', note: 'Line one\nLine two' },
  ], [
    { key: 'name', label: 'Name', value: (row) => row.name },
    { key: 'note', label: 'Note', value: (row) => row.note },
  ]);
  assert.equal(csv, 'Name,Note\n"Alpha, Inc.",Ready\nBeta,"Line one\nLine two"');

  console.log('Golden Plus contracts passed (portable date/time, range ordering, stacked geometry, and deterministic delimited export).');
} finally {
  fs.rmSync(output, { recursive: true, force: true });
}
