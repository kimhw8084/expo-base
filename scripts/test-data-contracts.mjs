import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const outDir = path.join(root, '.tmp-data-contracts');
fs.rmSync(outDir, { recursive: true, force: true });
const compile = spawnSync('tsc', ['-p', 'packages/platform/tsconfig.json', '--noEmit', 'false', '--outDir', outDir], { cwd: root, encoding: 'utf8' });
if (compile.status !== 0) {
  process.stderr.write(compile.stdout ?? '');
  process.stderr.write(compile.stderr ?? '');
  process.exit(compile.status ?? 1);
}
try {
  const data = await import(pathToFileURL(path.join(outDir, 'platform/src/data.js')).href);

  assert.deepEqual(data.validateDataColumns([{ key: 'name', label: 'Name', primary: true }, { key: 'value', label: 'Value' }]), { valid: true, violations: [] });
  const bad = data.validateDataColumns([{ key: 'x', label: '', primary: true }, { key: 'x', label: 'Duplicate', primary: true }]);
  assert.equal(bad.valid, false);
  assert.ok(bad.violations.some((x) => x.includes('visible label')));
  assert.ok(bad.violations.some((x) => x.includes('Duplicate column key')));
  assert.ok(bad.violations.some((x) => x.includes('Only one column')));

  assert.deepEqual(data.paginationWindow(1, 10, 5), [1, 2, 3, 4, 5]);
  assert.deepEqual(data.paginationWindow(5, 10, 5), [3, 4, 5, 6, 7]);
  assert.deepEqual(data.paginationWindow(10, 10, 5), [6, 7, 8, 9, 10]);
  assert.deepEqual(data.paginationWindow(-3, 0, 0), [1]);

  assert.equal(data.formatCurrency(1234.5, 'USD', 'en-US'), '$1,234.50');
  assert.equal(data.formatCurrency(Number.NaN), '—');
  assert.equal(data.formatPercent(0.142, 'en-US', 1), '14.2%');
  assert.equal(data.formatPercent(Infinity), '—');
  assert.equal(data.formatCompactNumber(1250000, 'en-US'), '1.3M');
  assert.equal(data.formatCompactNumber(Number.NEGATIVE_INFINITY), '—');

  let seed = 411;
  const random = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 1000; i += 1) {
    const total = 1 + Math.floor(random() * 500);
    const page = -50 + Math.floor(random() * 700);
    const visible = -5 + Math.floor(random() * 20);
    const pages = data.paginationWindow(page, total, visible);
    assert.ok(pages.length >= 1 && pages.length <= total);
    assert.ok(pages.every((value, index) => value >= 1 && value <= total && (index === 0 || value === pages[index - 1] + 1)));
  }
  console.log('Data contract tests passed (schema validation, pagination, numeric formatting, 1,000 generated scenarios).');
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
}
