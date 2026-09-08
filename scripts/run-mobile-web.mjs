import { spawn, spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { createInterface } from 'node:readline';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const testArgs = process.argv.slice(2);
if (testArgs.includes('--update-snapshots') && process.env.MOBILE_VISUAL_APPROVAL !== 'reviewed') {
  throw new Error('Mobile visual baseline updates require MOBILE_VISUAL_APPROVAL=reviewed after inspecting actual/diff artifacts.');
}
const run = (command, args, label, env = process.env) => {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, args, { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Object.assign(new Error(`${label} failed`), { exitCode: result.status ?? 1 });
};
const waitForServer = async (url) => {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try { if ((await fetch(url)).status < 500) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Static server did not become ready: ${url}`);
};
const startServer = () => {
  const child = spawn(process.execPath, ['scripts/serve-static-web.mjs', 'apps/reference/dist', '0'], { stdio: ['ignore', 'pipe', 'inherit'] });
  const output = createInterface({ input: child.stdout });
  const startup = new Promise((resolve, reject) => {
    output.on('line', (line) => {
      console.log(line);
      const match = line.match(/^Expo Base static web server: (http:\/\/127\.0\.0\.1:\d+)$/);
      if (match) resolve(match[1]);
    });
    child.once('error', reject);
    child.once('exit', (code) => reject(new Error(`Static server exited before readiness (${code}).`)));
  });
  return { child, output, startup };
};
const stopServer = async (server) => {
  if (!server) return;
  server.output.close();
  if (server.child.exitCode !== null) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(() => { server.child.kill('SIGKILL'); resolve(); }, 5_000);
    server.child.once('exit', () => { clearTimeout(timeout); resolve(); });
    server.child.kill('SIGTERM');
  });
};

let server;
let succeeded = false;
try {
  run(process.execPath, ['scripts/check-mobile-certification.mjs'], 'MOBILE CERTIFICATION MATRIX');
  run(npm, ['run', 'test:overlay-contracts'], 'SYNTHETIC SAFE-AREA AND OVERLAY SOLVER CONTRACTS');
  run(npm, ['run', 'check:native-shell-contracts'], 'NATIVE SOURCE CONTRACTS (NO RUNTIME CLAIM)');
  rmSync('apps/reference/dist', { recursive: true, force: true });
  run(npm, ['exec', '-w', '@precision-calm/reference', '--', 'expo', 'export', '--platform', 'web', '--output-dir', 'dist', '--source-maps'], 'DETERMINISTIC MOBILE STATIC EXPORT', { ...process.env, CI: '1', TZ: 'UTC' });
  server = startServer();
  const baseURL = await server.startup;
  await waitForServer(baseURL);
  run(npm, ['exec', '--', 'playwright', 'test', '--config', 'playwright.mobile.config.ts', ...testArgs], 'MOBILE PARITY SIMULATION', { ...process.env, PRECISION_CALM_BASE_URL: baseURL, TZ: 'UTC' });
  succeeded = true;
} finally {
  await stopServer(server);
  rmSync('apps/reference/dist', { recursive: true, force: true });
  if (succeeded) {
    rmSync('test-results/mobile', { recursive: true, force: true });
    rmSync('test-results/mobile-report', { recursive: true, force: true });
  }
}
