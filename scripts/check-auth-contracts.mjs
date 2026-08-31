import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root=process.cwd(),problems=[];
const nav=fs.readFileSync(path.join(root,'packages/navigation-router/src/index.tsx'),'utf8');
const runtime=fs.readFileSync(path.join(root,'packages/runtime/src/auth.tsx'),'utf8');
const provider=fs.readFileSync(path.join(root,'packages/runtime/src/PrecisionRuntimeProvider.tsx'),'utf8');
const linking=fs.readFileSync(path.join(root,'apps/reference/linking.ts'),'utf8');
if(!nav.includes('Stack.Protected'))problems.push('navigation-router must own Expo Router Stack.Protected');
if(!nav.includes('ProtectedRouterStack'))problems.push('navigation-router must export ProtectedRouterStack');
if(!runtime.includes("status: 'loading'"))problems.push('auth runtime must start in explicit loading state');
if(!runtime.includes('subscriptionRevision'))problems.push('auth runtime must guard stale getSession/subscription races');
if(/error\.message|String\(error\)/.test(runtime))problems.push('auth runtime must not expose raw adapter errors');
if(!provider.includes('<PrecisionAuthProvider'))problems.push('PrecisionRuntimeProvider must mount auth runtime for app services');
if(!linking.includes('onIncomingRoute')||!linking.includes('authReturnIntent.capture'))problems.push('validated native incoming routes must feed the shared auth return-intent channel');

function walk(dir){if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(/\.(?:ts|tsx|js|jsx)$/.test(entry.name)){const rel=path.relative(root,full);const text=fs.readFileSync(full,'utf8');if(/\bservices\.auth\.(?:getSession|signIn|signOut|subscribe)\s*\(/.test(text))problems.push(`${rel}: feature bypasses centralized auth runtime`);if(/<Stack\.Protected\b/.test(text)&&!rel.startsWith('packages/navigation-router/'))problems.push(`${rel}: direct Stack.Protected ownership`);}}
}
for(const entry of fs.readdirSync(path.join(root,'apps'),{withFileTypes:true}))if(entry.isDirectory())walk(path.join(root,'apps',entry.name,'app'));
const refRoot=fs.readFileSync(path.join(root,'apps/reference/app/_layout.tsx'),'utf8');
for(const marker of ['ProtectedRouterStack','usePrecisionAuthAccess','useCaptureReturnIntent'])if(!refRoot.includes(marker))problems.push(`reference root missing ${marker}`);
for(const file of ['sign-in.tsx','session-loading.tsx','session-error.tsx','auth-session.tsx'])if(!fs.existsSync(path.join(root,'apps/reference/app',file)))problems.push(`reference missing ${file}`);
if(problems.length){console.error('Auth contract violations:\n'+problems.map(x=>`- ${x}`).join('\n'));process.exit(1);}console.log('Auth contract check passed (bootstrap, protected-route ownership, safe runtime consumption).');
