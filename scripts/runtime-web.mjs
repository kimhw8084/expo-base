import { rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args, label) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(npm, args, { stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(['run', 'preflight'], 'NODE PREFLIGHT');
run(['run', 'check:runtime-stabilization'], 'RUNTIME STABILIZATION');
run(['run', 'test:contrast'], 'COLOR CONTRAST');
run(['run', 'typecheck:runtime-ui'], 'RUNTIME UI TYPECHECK');
run(['run', 'doctor', '--', '--path', 'apps/reference', '--fail'], 'EXPO BASE DOCTOR');

console.log('\n=== CLEAR EXPO CACHE ===');
rmSync('.expo', { recursive: true, force: true });
rmSync('apps/reference/.expo', { recursive: true, force: true });

console.log('\n=== START EXPO BASE WEB ===');
const result = spawnSync(
  npm,
  ['exec', '-w', '@precision-calm/reference', '--', 'expo', 'start', '--web', '--clear'],
  { stdio: 'inherit', env: process.env },
);
process.exit(result.status ?? 0);
