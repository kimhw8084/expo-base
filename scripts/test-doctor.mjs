import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const target = path.join(root, '.tmp-doctor-app');
const capabilityTarget = path.join(root, '.tmp-doctor-capability-app');
const MAX_CHILD_OUTPUT = 8 * 1024 * 1024;

fs.rmSync(target, { recursive: true, force: true });
fs.rmSync(capabilityTarget, { recursive: true, force: true });

function runNode(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: MAX_CHILD_OUTPUT,
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function parseDoctorJson(stdout, stderr) {
  try {
    return JSON.parse(stdout);
  } catch (error) {
    const bytes = Buffer.byteLength(stdout ?? '', 'utf8');
    throw new Error(
      `Precision Doctor returned invalid/truncated JSON (${bytes} bytes captured).\n` +
      `stderr:\n${stderr || '(empty)'}\n` +
      `Original parse error: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

try {
  let run = runNode([
    'packages/create-precision-app/bin/create-precision-app.mjs',
    '--name', 'Doctor Test',
    '--slug', 'doctor-test',
    '--directory', target,
  ]);
  assert.equal(run.status, 0, run.stderr || run.stdout);

  run = runNode([
    'packages/precision-doctor/bin/precision-doctor.mjs',
    '--path', target,
    '--json',
    '--fail',
  ]);
  assert.equal(run.status, 0, run.stderr || run.stdout);

  let report = parseDoctorJson(run.stdout, run.stderr);
  assert.equal(report.status, 'PASS');
  assert.ok(report.checks.some((check) => check.id === 'CONFIG-000' && check.pass));
  assert.ok(report.checks.some((check) => check.id === 'CONFIG-006' && check.pass));
  assert.ok(report.checks.some((check) => check.id === 'THEME-003' && check.pass));
  assert.ok(report.checks.some((check) => check.id === 'GOLDEN-001' && check.pass));
  assert.ok(report.checks.some((check) => check.id === 'GOLDEN-002' && check.pass));
  assert.ok(report.checks.some((check) => check.id === 'GOLDEN-003' && check.pass));
  assert.ok(report.checks.some((check) => check.id === 'I18N-001' && check.pass));
  assert.ok(report.checks.some((check) => check.id === 'SERVER-STATE-001' && check.pass));
  assert.ok(report.checks.some((check) => check.id === 'CAPABILITY-001' && check.pass));
  for (const id of ['ROUTES-001', 'ROUTES-002', 'ROUTES-003']) assert.ok(report.checks.some((check) => check.id === id && check.pass), id);

  const routeManifestPath = path.join(target, 'precision.routes.json');
  const routeManifestText = fs.readFileSync(routeManifestPath, 'utf8');
  const routeManifest = JSON.parse(routeManifestText);
  routeManifest.authenticated.push('missing-scaffolded-route');
  fs.writeFileSync(routeManifestPath, JSON.stringify(routeManifest));
  run = runNode([
    'packages/precision-doctor/bin/precision-doctor.mjs',
    '--path', target,
    '--json',
    '--fail',
  ]);
  assert.equal(run.status, 3);
  report = parseDoctorJson(run.stdout, run.stderr);
  assert.ok(report.checks.some((check) => check.id === 'ROUTES-missing-scaffolded-route' && !check.pass));
  fs.writeFileSync(routeManifestPath, routeManifestText);

  const generatedUnistyles = path.join(target, 'unistyles.ts');
  const safeInitialTheme = "Platform.OS === 'web' ? 'light' : Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'";
  const unsafeWebInitialTheme = "Platform.OS === 'web' ? Appearance.getColorScheme() === 'dark' ? 'dark' : 'light' : Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'";
  const safeUnistylesText = fs.readFileSync(generatedUnistyles, 'utf8');
  assert.ok(safeUnistylesText.includes(safeInitialTheme));
  fs.writeFileSync(generatedUnistyles, safeUnistylesText.replace(safeInitialTheme, unsafeWebInitialTheme));

  run = runNode([
    'packages/precision-doctor/bin/precision-doctor.mjs',
    '--path', target,
    '--json',
    '--fail',
  ]);
  assert.equal(run.status, 3);
  report = parseDoctorJson(run.stdout, run.stderr);
  assert.ok(report.checks.some((check) => check.id === 'THEME-003' && !check.pass));
  fs.writeFileSync(generatedUnistyles, safeUnistylesText);

  fs.writeFileSync(path.join(target, 'app.config.js'), "module.exports = {};\n");
  run = runNode([
    'packages/precision-doctor/bin/precision-doctor.mjs',
    '--path', target,
    '--json',
    '--fail',
  ]);
  assert.equal(run.status, 3);
  report = parseDoctorJson(run.stdout, run.stderr);
  assert.ok(report.checks.some((check) => check.id === 'CONFIG-006' && !check.pass));
  fs.rmSync(path.join(target, 'app.config.js'));

  run = runNode([
    'packages/precision-doctor/bin/precision-doctor.mjs',
    '--path', target,
    '--json',
    '--fail',
  ]);
  assert.equal(run.status, 0, run.stderr || run.stdout);

  const babel = path.join(target, 'babel.config.js');
  fs.writeFileSync(
    babel,
    fs.readFileSync(babel, 'utf8').replace('@precision-calm/ui', '@precision-calm/components'),
  );

  run = runNode([
    'packages/precision-doctor/bin/precision-doctor.mjs',
    '--path', target,
    '--json',
    '--fail',
  ]);
  assert.equal(run.status, 3);

  report = parseDoctorJson(run.stdout, run.stderr);
  assert.ok(report.checks.some((check) => check.id === 'BABEL-002' && !check.pass));

  run = runNode([
    'packages/create-precision-app/bin/create-precision-app.mjs',
    '--name', 'Doctor Capability Test',
    '--slug', 'doctor-capability-test',
    '--directory', capabilityTarget,
    '--capabilities', 'secure-storage,media,notifications',
  ]);
  assert.equal(run.status, 0, run.stderr || run.stdout);
  run = runNode([
    'packages/precision-doctor/bin/precision-doctor.mjs',
    '--path', capabilityTarget,
    '--json',
    '--fail',
  ]);
  assert.equal(run.status, 0, run.stderr || run.stdout);
  report = parseDoctorJson(run.stdout, run.stderr);
  for (const id of ['CAPABILITY-secure-storage-PACKAGE', 'CAPABILITY-media-PACKAGE', 'CAPABILITY-notifications-PACKAGE', 'CAPABILITY-media-expo-camera-PLUGIN', 'CAPABILITY-notifications-expo-notifications-PLUGIN']) assert.ok(report.checks.some((check) => check.id === id && check.pass), id);
  const selected = JSON.parse(fs.readFileSync(path.join(capabilityTarget, 'precision.capabilities.json'), 'utf8'));
  selected.capabilities.push('unknown-capability');
  fs.writeFileSync(path.join(capabilityTarget, 'precision.capabilities.json'), JSON.stringify(selected));
  run = runNode([
    'packages/precision-doctor/bin/precision-doctor.mjs',
    '--path', capabilityTarget,
    '--json',
    '--fail',
  ]);
  assert.equal(run.status, 3);
  report = parseDoctorJson(run.stdout, run.stderr);
  assert.ok(report.checks.some((check) => check.id === 'CAPABILITY-unknown-capability-PROFILE' && !check.pass));

  console.log(`Expo Base doctor tests passed (${report.checks.length} structural/runtime checks).`);
} finally {
  fs.rmSync(target, { recursive: true, force: true });
  fs.rmSync(capabilityTarget, { recursive: true, force: true });
}
