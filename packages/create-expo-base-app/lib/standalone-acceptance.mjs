import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const root = process.cwd();
const stateDirectory = path.join(root, '.expo-base');
const resultPath = path.join(stateDirectory, 'acceptance-result.json');
const summaryPath = path.join(stateDirectory, 'acceptance-summary.md');
const logPath = path.join(stateDirectory, 'acceptance.log');
const exportDirectory = path.join(stateDirectory, 'acceptance-dist');
const claim = parseArgs(process.argv.slice(2));
const startedAt = new Date().toISOString();
const checks = [];
let runningServer;

fs.mkdirSync(stateDirectory, { recursive: true });
fs.rmSync(logPath, { force: true });

const packageJson = readJson('package.json');
const provenance = readJson('.expo-base/source.json');
const obligationDocument = readJson('.expo-base/acceptance-obligations.json');
const obligations = obligationDocument.obligations ?? [];
const result = {
  schemaVersion: 1,
  acceptance: 'standalone-generated-app-foundation',
  startedAt,
  finishedAt: null,
  status: 'running',
  claimRequested: claim,
  productionReadiness: claim === 'production-ready' ? 'pending-claim' : 'not-claimed',
  provenance: {
    source: provenance,
    generatedRepository: {
      packageName: packageJson.name,
      slug: packageJson.expo?.slug ?? packageJson.name?.replace('@apps/', ''),
      capabilities: readJson('expo-base.capabilities.json').capabilities,
    },
  },
  checks,
  obligations,
  claimBoundary: {
    automated: [
      'standalone package and vendored @expo-base locality',
      'TypeScript and local Golden pattern/architecture checks',
      'Expo public configuration',
      'static web export and local runtime startup',
      'bounded Chromium auth/session/link/error/not-found shell smoke',
    ],
    notProven: [
      'backend authorization or data-security enforcement',
      'iOS/Android native runtime and physical-device behavior',
      'human VoiceOver usability and exact Dynamic Type user-settings behavior',
      'provider/backend integration, deployment, and release certification',
    ],
    productionReadiness: 'A green foundation acceptance does not make the consuming product production-ready.',
  },
  artifacts: {
    result: '.expo-base/acceptance-result.json',
    summary: '.expo-base/acceptance-summary.md',
    log: '.expo-base/acceptance.log',
  },
};

try {
  await check('package-locality', 'pass/fail', checkPackageLocality);
  await checkCommand('typecheck', ['run', 'typecheck']);
  await checkCommand('golden-patterns', ['run', 'check:golden-patterns']);
  await checkCommand('golden-architecture', ['run', 'check:golden-architecture']);
  await checkExpoConfig();
  const exportPassed = await check('static-web-export-and-runtime', 'pass/fail', exportAndStartServer);
  if (exportPassed) await check('browser-shell-smoke', 'pass/fail', browserShellSmoke);
  else checks.push({ id: 'browser-shell-smoke', outcome: 'skipped', blockedBy: 'static-web-export-and-runtime' });

  if (claim === 'production-ready') {
    await check('production-readiness-claim', 'pass/fail', () => {
      const unresolved = mandatoryUnresolvedObligations();
      assert.equal(unresolved.length, 0, `Mandatory product obligations remain unresolved: ${unresolved.map((item) => item.id).join(', ')}`);
      result.productionReadiness = 'claimed';
    });
  }
} finally {
  await stopServer();
  const failures = checks.filter((check) => check.outcome === 'fail');
  const unresolved = mandatoryUnresolvedObligations();
  result.finishedAt = new Date().toISOString();
  result.status = failures.length ? 'failed' : unresolved.length ? 'accepted-with-unresolved-obligations' : 'accepted';
  if (claim !== 'production-ready') result.productionReadiness = 'not-claimed';
  else if (failures.length || unresolved.length) result.productionReadiness = 'blocked';
  writeResult();
  emit(`\nAcceptance result: ${result.status}`);
  emit(`Production readiness: ${result.productionReadiness}`);
  emit(`Unresolved mandatory product obligations: ${unresolved.length}`);
  emit(`Machine result: ${result.artifacts.result}`);
  emit(`Guidance: ${result.artifacts.summary}`);
  process.exitCode = failures.length ? 1 : 0;
}

async function check(id, kind, operation) {
  emit(`\n=== ${id} (${kind}) ===`);
  const started = Date.now();
  try {
    await operation();
    checks.push({ id, outcome: 'pass', durationMs: Date.now() - started });
    emit(`${id}: PASS`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.push({ id, outcome: 'fail', durationMs: Date.now() - started, error: message });
    emit(`${id}: FAIL: ${message}`, 'stderr');
    return false;
  }
}

async function checkCommand(id, args) {
  return check(id, 'pass/fail', async () => {
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawnSync(command, args, { cwd: root, encoding: 'utf8', env: process.env });
    writeProcessOutput(child);
    if (child.error) throw child.error;
    assert.equal(child.status, 0, `${command} ${args.join(' ')} exited with ${child.status ?? 'unknown status'}`);
  });
}

function checkPackageLocality() {
  assert.deepEqual(packageJson.workspaces, ['packages/*'], 'standalone workspace boundary must be packages/*');
  assert.equal(typeof packageJson.scripts?.['verify:acceptance'], 'string', 'verify:acceptance must be repository-local');
  assert.equal(provenance.schemaVersion, 1, 'source provenance schema is missing');
  assert.ok(provenance.sourceCommit, 'source commit provenance is missing');
  assert.ok(provenance.sourceTree, 'source tree provenance is missing');
  assert.equal(obligationDocument.schemaVersion, 1, 'acceptance obligation schema is missing');
  assert.ok(Array.isArray(obligations) && obligations.length > 0, 'acceptance obligations must be explicit');
  for (const obligation of obligations) {
    assert.match(obligation.id, /^[a-z0-9-]+$/, `invalid obligation id: ${obligation.id}`);
    assert.equal(obligation.owner, 'product', `${obligation.id} must remain product-owned`);
    assert.ok(['unresolved', 'replaced', 'qualified'].includes(obligation.status), `${obligation.id} has an invalid status`);
    assert.equal(typeof obligation.requiredForProduction, 'boolean', `${obligation.id} must declare production-readiness impact`);
    assert.ok(Array.isArray(obligation.paths) && obligation.paths.length > 0, `${obligation.id} must name its product-owned paths`);
    if (obligation.status !== 'unresolved') assert.ok(typeof obligation.evidence === 'string' && obligation.evidence.trim(), `${obligation.id} needs evidence when resolved or qualified`);
  }
  const requireFromRoot = createRequire(path.join(root, 'package.json'));
  const manifests = [packageJson, ...fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readJson(path.join('packages', entry.name, 'package.json')))
    .filter(Boolean)];
  const internalNames = new Set(fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(root, 'packages', entry.name, 'package.json')))
    .map((entry) => readJson(path.join('packages', entry.name, 'package.json'))?.name)
    .filter((name) => typeof name === 'string' && name.startsWith('@expo-base/')));
  for (const manifest of manifests) {
    for (const dependency of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies, ...manifest.peerDependencies, ...manifest.optionalDependencies })) {
      if (!dependency.startsWith('@expo-base/')) continue;
      assert.ok(internalNames.has(dependency), `${manifest.name} requires missing local package ${dependency}`);
      const resolved = requireFromRoot.resolve(`${dependency}/package.json`);
      assert.ok(resolved.startsWith(`${root}${path.sep}`), `${dependency} resolved outside generated repository: ${resolved}`);
    }
  }
  for (const file of ['README.md', 'AGENTS.md', 'package.json', 'tsconfig.json', 'golden-architecture.config.json']) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(content, /(?:^|["' ])\.\.\/(?:AGENTS|docs|scripts|packages|tsconfig\.base)/, `${file} escapes the standalone repository`);
  }
}

async function checkExpoConfig() {
  return check('expo-public-config', 'pass/fail', async () => {
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const child = spawnSync(command, ['--no-install', 'expo', 'config', '--type', 'public', '--json'], { cwd: root, encoding: 'utf8', env: process.env });
    writeProcessOutput(child);
    if (child.error) throw child.error;
    assert.equal(child.status, 0, 'Expo public config command failed');
    const config = parseLastJson(child.stdout);
    assert.equal(config.slug, result.provenance.generatedRepository.slug, 'Expo public config slug mismatch');
    assert.equal(config.web?.output, 'static', 'Expo public config must use static web output');
    assert.equal(config.scheme, result.provenance.generatedRepository.slug, 'Expo public config scheme mismatch');
    assert.equal(typeof config.name, 'string', 'Expo public config name is missing');
  });
}

async function exportAndStartServer() {
  fs.rmSync(exportDirectory, { recursive: true, force: true });
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const child = spawnSync(command, ['--no-install', 'expo', 'export', '--platform', 'web', '--output-dir', exportDirectory], { cwd: root, encoding: 'utf8', env: { ...process.env, CI: '1' } });
  writeProcessOutput(child);
  if (child.error) throw child.error;
  assert.equal(child.status, 0, 'static Expo web export failed');
  assert.ok(fs.existsSync(path.join(exportDirectory, 'index.html')), 'static Expo web export did not produce index.html');
  runningServer = await startStaticServer();
  const response = await fetch(`${runningServer.url}/`);
  assert.ok(response.status >= 200 && response.status < 300, `static web server returned ${response.status}`);
}

async function browserShellSmoke() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const browserFailures = [];
  let expectingNotFoundDocument = false;
  page.on('console', (message) => {
    const line = `console.${message.type()}: ${message.text()}`;
    emit(line, message.type() === 'warning' || message.type() === 'error' ? 'stderr' : 'stdout');
    const expectedNotFoundConsoleError = expectingNotFoundDocument && message.type() === 'error' && message.text() === 'Failed to load resource: the server responded with a status of 404 (Not Found)';
    if ((message.type() === 'warning' || message.type() === 'error') && !expectedNotFoundConsoleError) browserFailures.push(line);
  });
  page.on('pageerror', (error) => {
    const line = `pageerror: ${error.message}`;
    emit(line, 'stderr');
    browserFailures.push(line);
  });
  page.on('response', (response) => {
    if (response.status() < 400) return;
    const expectedNotFound = response.url() === `${runningServer.url}/a-route-that-does-not-exist` && response.status() === 404;
    const line = `http-${response.status()}: ${response.url()}`;
    emit(line, expectedNotFound ? 'stdout' : 'stderr');
    if (!expectedNotFound) browserFailures.push(line);
  });
  try {
    await goto(page, '/', 200);
    await page.getByRole('heading', { name: 'Sign in' }).waitFor();
    await page.getByLabel('Email').fill('acceptance@example.com');
    await page.getByLabel('Password').fill('demo');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByText('Production foundation').waitFor();

    await goto(page, '/link-error', 200);
    await page.getByRole('heading', { name: 'This link cannot be opened safely' }).waitFor();
    await goto(page, '/session-loading', 200);
    await page.locator('body').waitFor();
    await goto(page, '/session-error', 200);
    await page.locator('body').waitFor();
    expectingNotFoundDocument = true;
    await goto(page, '/a-route-that-does-not-exist', 404);
    await page.getByText('We could not find that page').waitFor();
    expectingNotFoundDocument = false;
    assert.deepEqual(browserFailures, [], 'browser console/page errors and warnings are material acceptance failures');
  } finally {
    await browser.close();
  }
}

async function goto(page, pathname, expectedStatus) {
  const response = await page.goto(`${runningServer.url}${pathname}`, { waitUntil: 'networkidle' });
  assert.ok(response, `no response for ${pathname}`);
  assert.equal(response.status(), expectedStatus, `${pathname} returned an unexpected status`);
}

async function startStaticServer() {
  const child = spawn(process.execPath, ['scripts/serve-static-web.mjs', exportDirectory, '0'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  let output = '';
  const startup = new Promise((resolve, reject) => {
    const onLine = (line) => {
      output += `${line}\n`;
      emit(line);
      const match = line.match(/^Expo Base static web server: (http:\/\/127\.0\.0\.1:\d+)$/);
      if (match) resolve(match[1]);
    };
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => chunk.split('\n').filter(Boolean).forEach(onLine));
    child.stderr.on('data', (chunk) => { output += chunk; emit(chunk.trimEnd(), 'stderr'); });
    child.once('error', reject);
    child.once('exit', (code, signal) => reject(new Error(`static server exited before startup (${signal ?? code ?? 'unknown'})\n${output}`)));
  });
  const url = await startup;
  return { child, url };
}

async function stopServer() {
  if (!runningServer || runningServer.child.exitCode !== null) return;
  const child = runningServer.child;
  await new Promise((resolve) => {
    const timeout = setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 2_000);
    child.once('exit', () => { clearTimeout(timeout); resolve(); });
    child.kill('SIGTERM');
  });
  runningServer = undefined;
}

function mandatoryUnresolvedObligations() {
  return obligations.filter((obligation) => obligation.requiredForProduction === true && obligation.status === 'unresolved');
}

function writeResult() {
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`);
  const unresolved = mandatoryUnresolvedObligations();
  const lines = [
    '# Generated-app acceptance guidance',
    '',
    `- Result: **${result.status}**`,
    `- Production readiness: **${result.productionReadiness}**`,
    `- Source: ${provenance.sourceRepository}@${provenance.sourceCommit} (tree ${provenance.sourceTree})`,
    `- Automated checks: ${checks.filter((check) => check.outcome === 'pass').length} passed, ${checks.filter((check) => check.outcome === 'fail').length} failed.`,
    `- Mandatory product obligations unresolved: ${unresolved.length}.`,
    '',
    'This is generated Expo Base foundation evidence only. It does not prove backend authorization/data security, native or physical-device behavior, human VoiceOver/Dynamic Type certification, provider/backend integration, deployment, or release certification.',
    '',
    'Resolve or explicitly qualify the product-owned obligations in `.expo-base/acceptance-obligations.json` before making a production-readiness claim. `npm run verify:acceptance -- --claim production-ready` fails closed while mandatory obligations remain unresolved.',
    '',
  ];
  fs.writeFileSync(summaryPath, `${lines.join('\n')}\n`);
}

function writeProcessOutput(child) {
  if (child.stdout) { process.stdout.write(child.stdout); appendLog(child.stdout); }
  if (child.stderr) { process.stderr.write(child.stderr); appendLog(child.stderr); }
}

function emit(message, stream = 'stdout') {
  const line = String(message);
  appendLog(`${line}\n`);
  (stream === 'stderr' ? process.stderr : process.stdout).write(`${line}\n`);
}

function appendLog(value) {
  const text = String(value);
  fs.appendFileSync(logPath, text);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function parseLastJson(value) {
  const text = value.trim();
  const start = text.indexOf('{');
  assert.notEqual(start, -1, 'Expo public config output did not contain JSON');
  return JSON.parse(text.slice(start));
}

function parseArgs(argv) {
  const claimIndex = argv.indexOf('--claim');
  const value = claimIndex === -1 ? 'foundation' : argv[claimIndex + 1];
  if (!['foundation', 'production-ready'].includes(value)) throw new Error('--claim must be foundation or production-ready');
  return value;
}
