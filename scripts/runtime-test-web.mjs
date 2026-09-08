import { spawn, spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { createInterface } from 'node:readline';
import process from 'node:process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const node = process.execPath;

function run(command, args, label, env = process.env) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, args, { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const error = new Error(`${label} failed`);
    error.exitCode = result.status ?? 1;
    throw error;
  }
}

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status >= 200 && response.status < 500) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Static server did not become ready at ${url}. ${lastError instanceof Error ? lastError.message : ''}`);
}

function isExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

function waitForExit(child, timeoutMs) {
  if (isExited(child)) return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timeout);
      child.removeListener('error', finish);
      child.removeListener('exit', finish);
      resolve();
    };
    const timeout = setTimeout(finish, timeoutMs);
    child.once('error', finish);
    child.once('exit', finish);
  });
}

async function stopServer(runningServer) {
  if (!runningServer) return;
  runningServer.output.close();
  if (isExited(runningServer.child)) return;

  const gracefulExit = waitForExit(runningServer.child, 5_000);
  runningServer.child.kill('SIGTERM');
  await gracefulExit;
  if (isExited(runningServer.child)) return;

  const forcedExit = waitForExit(runningServer.child, 1_000);
  runningServer.child.kill('SIGKILL');
  await forcedExit;
}

function startStaticServer() {
  const child = spawn(node, ['scripts/serve-static-web.mjs', 'apps/reference/dist', '0'], {
    stdio: ['ignore', 'pipe', 'inherit'],
    env: process.env,
  });
  const output = createInterface({ input: child.stdout });
  let started = false;
  const startup = new Promise((resolve, reject) => {
    output.on('line', (line) => {
      console.log(line);
      const match = line.match(/^Expo Base static web server: (http:\/\/127\.0\.0\.1:\d+)$/);
      if (!started && match) {
        started = true;
        resolve(match[1]);
      }
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (!started) reject(new Error(`Static server exited before startup (${signal ?? code ?? 'unknown'})`));
    });
  });
  return { child, output, startup };
}

let server;
let signalExitStarted = false;
const handleSignal = (signal) => {
  if (signalExitStarted) return;
  signalExitStarted = true;
  void stopServer(server).finally(() => {
    process.exitCode = signal === 'SIGINT' ? 130 : 143;
    process.exit();
  });
};
process.once('SIGINT', handleSignal);
process.once('SIGTERM', handleSignal);

let exitCode = 1;
try {
  run(npm, ['run', 'runtime:verify'], 'RUNTIME VERIFY');
  rmSync('apps/reference/dist', { recursive: true, force: true });
  run(
    npm,
    ['exec', '-w', '@precision-calm/reference', '--', 'expo', 'export', '--platform', 'web', '--output-dir', 'dist'],
    'STATIC EXPO WEB EXPORT',
    { ...process.env, CI: '1' },
  );

  console.log('\n=== STATIC WEB SERVER ===');
  server = startStaticServer();
  const baseURL = await server.startup;
  await waitForServer(baseURL);
  run(npm, ['run', 'test:web'], 'PLAYWRIGHT WEB CERTIFICATION', { ...process.env, PRECISION_CALM_BASE_URL: baseURL });
  exitCode = 0;
} catch (error) {
  console.error(error instanceof Error ? error.stack : error);
  exitCode = error && typeof error === 'object' && Number.isInteger(error.exitCode) ? error.exitCode : 1;
} finally {
  await stopServer(server);
  process.removeListener('SIGINT', handleSignal);
  process.removeListener('SIGTERM', handleSignal);
}

process.exitCode = exitCode;
