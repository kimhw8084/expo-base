import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const outDir = path.join(root, '.tmp-navigation-contracts');
fs.rmSync(outDir, { recursive: true, force: true });
const compile = spawnSync('tsc', ['-p', 'packages/platform/tsconfig.json', '--noEmit', 'false', '--outDir', outDir], { cwd: root, encoding: 'utf8' });
if (compile.status !== 0) { process.stderr.write(compile.stdout ?? ''); process.stderr.write(compile.stderr ?? ''); process.exit(compile.status ?? 1); }
try {
  const nav = await import(pathToFileURL(path.join(outDir, 'platform/src/navigation.js')).href);
  assert.equal(nav.validatePrimaryNavigation([{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }, { key: 'c', label: 'C' }]).valid, true);
  assert.equal(nav.validatePrimaryNavigation([{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]).valid, false);
  assert.equal(nav.validatePrimaryNavigation(Array.from({ length: 6 }, (_, i) => ({ key: String(i), label: String(i) }))).valid, false);
  assert.equal(nav.validatePrimaryNavigation([{ key: 'a', label: 'A' }, { key: 'a', label: 'B' }, { key: 'c', label: 'C' }]).valid, false);
  const items = [{ key: 'home', label: 'Home', href: '/' }, { key: 'cards', label: 'Cards', href: '/cards' }, { key: 'cardDetail', label: 'Card', href: '/cards/detail' }];
  assert.equal(nav.bestNavigationMatch('/', items), 'home');
  assert.equal(nav.bestNavigationMatch('/cards', items), 'cards');
  assert.equal(nav.bestNavigationMatch('/cards/detail/123', items), 'cardDetail');
  assert.equal(nav.bestNavigationMatch('/unknown', items), null);
  const enabled = [true, false, true, true];
  assert.equal(nav.resolveRovingFocusIndex('ArrowRight', 0, enabled), 2);
  assert.equal(nav.resolveRovingFocusIndex('ArrowRight', 3, enabled), 0);
  assert.equal(nav.resolveRovingFocusIndex('ArrowLeft', 0, enabled, { direction: 'rtl' }), 2);
  assert.equal(nav.resolveRovingFocusIndex('ArrowDown', 2, enabled, { orientation: 'both' }), 3);
  assert.equal(nav.resolveRovingFocusIndex('Home', 3, enabled), 0);
  assert.equal(nav.resolveRovingFocusIndex('End', 0, enabled), 3);
  assert.equal(nav.resolveRovingFocusIndex('Enter', 0, enabled), null);
  console.log('Navigation contract tests passed (destination count, route match, disabled-aware RTL roving focus).');
} finally { fs.rmSync(outDir, { recursive: true, force: true }); }
