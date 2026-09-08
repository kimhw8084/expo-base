import { spawnSync } from 'node:child_process';
import process from 'node:process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const [platform, ...forwarded] = process.argv.slice(2);
if (platform !== 'ios' && platform !== 'android') {
  console.error('Usage: node scripts/runtime-native.mjs <ios|android> [expo run options]');
  process.exit(1);
}

function run(args, label) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(npm, args, { stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(['run', 'runtime:verify'], 'RUNTIME VERIFY');
run(['exec', '-w', '@precision-calm/reference', '--', 'expo', `run:${platform}`, ...forwarded], `EXPO BASE ${platform.toUpperCase()} DEVELOPMENT BUILD`);
