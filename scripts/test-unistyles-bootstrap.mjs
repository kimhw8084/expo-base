import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function assertBootstrapOrder(entrySource, rootLayoutSource, htmlSource, label) {
  const themeIndex = entrySource.indexOf("import './unistyles'");
  const routerIndex = entrySource.indexOf("import 'expo-router/entry'");
  assert.ok(themeIndex >= 0, `${label}: missing ./unistyles entry import`);
  assert.ok(routerIndex >= 0, `${label}: missing expo-router/entry import`);
  assert.ok(themeIndex < routerIndex, `${label}: ./unistyles must execute before expo-router/entry`);
  assert.ok(rootLayoutSource.trimStart().startsWith("import '../unistyles'"), `${label}: app/_layout.tsx must import ../unistyles first`);
  assert.ok(htmlSource.trimStart().startsWith("import '../unistyles'"), `${label}: app/+html.tsx must import ../unistyles before shared styled owners`);
}

const referenceEntry = fs.readFileSync(path.join(root, 'apps/reference/index.ts'), 'utf8');
const referenceLayout = fs.readFileSync(path.join(root, 'apps/reference/app/_layout.tsx'), 'utf8');
const referenceHtml = fs.readFileSync(path.join(root, 'apps/reference/app/+html.tsx'), 'utf8');
assertBootstrapOrder(referenceEntry, referenceLayout, referenceHtml, 'reference app');

const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-base-bootstrap-'));
try {
  const run = spawnSync(process.execPath, [
    'packages/create-precision-app/bin/create-precision-app.mjs',
    '--name', 'Bootstrap Probe',
    '--slug', 'bootstrap-probe',
    '--accent', 'violet',
    '--directory', destination,
  ], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);

  const generatedEntry = fs.readFileSync(path.join(destination, 'index.ts'), 'utf8');
  const generatedLayout = fs.readFileSync(path.join(destination, 'app/_layout.tsx'), 'utf8');
  const generatedHtml = fs.readFileSync(path.join(destination, 'app/+html.tsx'), 'utf8');
  assertBootstrapOrder(generatedEntry, generatedLayout, generatedHtml, 'generated app');

  console.log('Unistyles bootstrap regression passed (reference + generated app).');
} finally {
  fs.rmSync(destination, { recursive: true, force: true });
}
