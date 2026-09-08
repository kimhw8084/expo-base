import { spawn, spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { createInterface } from 'node:readline';
import process from 'node:process';

const [mode = 'all', updateFlag] = process.argv.slice(2);
if (!['visual', 'semantic', 'performance', 'all'].includes(mode)) throw new Error(`Unknown Golden web mode: ${mode}`);
if (updateFlag === '--update-snapshots' && process.env.GOLDEN_VISUAL_APPROVAL !== 'reviewed') {
  throw new Error('Visual baseline updates require GOLDEN_VISUAL_APPROVAL=reviewed after inspecting actual/diff artifacts.');
}
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
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
try {
  rmSync('apps/reference/dist', { recursive: true, force: true });
  run(npm, ['exec', '-w', '@precision-calm/reference', '--', 'expo', 'export', '--platform', 'web', '--output-dir', 'dist', '--source-maps'], 'DETERMINISTIC STATIC EXPORT', { ...process.env, CI: '1', TZ: 'UTC' });
  if (mode === 'performance' || mode === 'all') run(process.execPath, ['scripts/check-golden-performance.mjs'], 'PERFORMANCE AND BUNDLE BUDGETS');
  server = startServer();
  const baseURL = await server.startup;
  await waitForServer(baseURL);
  const grep = mode === 'all' ? '@(?:visual|semantic|performance)' : `@${mode}`;
  const args = ['exec', '--', 'playwright', 'test', '--config', 'playwright.golden.config.ts', '--grep', grep];
  if (updateFlag === '--update-snapshots') args.push('--update-snapshots');
  run(npm, args, `GOLDEN ${mode.toUpperCase()} CERTIFICATION`, { ...process.env, PRECISION_CALM_BASE_URL: baseURL, TZ: 'UTC' });
} finally {
  await stopServer(server);
}
