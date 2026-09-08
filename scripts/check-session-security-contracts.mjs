import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const problems = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

for (const file of [
  'packages/session-security/src/contracts.ts',
  'packages/session-security/src/memory.ts',
  'packages/runtime/src/sessionSecurity.tsx',
  'apps/reference/sessionSecurity.ts',
  'apps/reference/app/session-security.tsx',
  'apps/reference/app/unlock.tsx',
]) {
  if (!exists(file)) problems.push(`missing ${file}`);
}

if (!problems.length) {
  const contracts = read('packages/session-security/src/contracts.ts');
  const runtime = read('packages/runtime/src/sessionSecurity.tsx');
  const auth = read('packages/runtime/src/auth.tsx');
  const provider = read('packages/runtime/src/PrecisionRuntimeProvider.tsx');
  const rootLayout = read('apps/reference/app/_layout.tsx');
  const unlock = read('apps/reference/app/unlock.tsx');

  if (/react-native|expo(?:-|\/)/.test(contracts)) problems.push('session-security contracts must stay platform-neutral');
  if (!runtime.includes("status: SessionSecurityStatus")) problems.push('runtime must expose explicit session-security resolution status');
  if (!runtime.includes("{ locked: true, reason: 'security-policy' }")) problems.push('runtime must fail closed before security state resolves');
  if (/error\.message|String\(error\)/.test(runtime)) problems.push('runtime must not expose raw session-security adapter errors');
  if (!auth.includes('useOptionalPrecisionSessionSecurity')) problems.push('auth access must consume configured session-security state automatically');
  if (!auth.includes("sessionSecurity?.status === 'loading'")) problems.push('later session-security revalidation must reuse the booting access state');
  if (!auth.includes("sessionSecurity.status === 'error' || sessionSecurity.locked")) problems.push('session-security error/lock must fail closed as locked access');
  if (!provider.includes('sessionSecurity?: { adapter: SessionSecurityAdapter }')) problems.push('PrecisionRuntimeProvider must own the session-security adapter boundary');
  if (!provider.includes('<PrecisionSessionSecurityProvider adapter={sessionSecurity.adapter}>')) problems.push('PrecisionRuntimeProvider must mount session-security runtime when configured');
  if (!runtime.includes('PrecisionSessionSecurityBootstrap') || !runtime.includes("runtime.status !== 'loading'")) problems.push('runtime must expose an initial bootstrap boundary that holds navigation until session security resolves once');
  if (!rootLayout.includes("locked: ['unlock']")) problems.push('reference router must provide a dedicated locked route');
  if (!rootLayout.includes("auth.status === 'loading'")) problems.push('reference root must also hold protected navigation until initial auth resolution completes');
  if (rootLayout.includes('restrictiveRedirects')) problems.push('reference router must let Stack.Protected own locked/signed-out destinations instead of replacing browser history manually');
  if (!rootLayout.includes('sessionSecurity={{ adapter: sessionSecurity }}')) problems.push('reference root must inject session security');
  if (!rootLayout.includes('PrecisionSessionSecurityBootstrap')) problems.push('reference root must hold protected navigation behind the initial session-security bootstrap boundary');
  if (!unlock.includes('usePrecisionSessionSecurity')) problems.push('unlock route must consume the centralized session-security runtime');
  if (!unlock.includes('consumeReturnIntent') || !unlock.includes('replaceResolvedPath')) problems.push('successful unlock must restore the captured protected return intent');
}

if (problems.length) {
  console.error('Session-security contract violations:\n' + problems.map((x) => `- ${x}`).join('\n'));
  process.exit(1);
}
console.log('Session-security contract check passed (platform boundary, fail-closed auth integration, locked route ownership).');
