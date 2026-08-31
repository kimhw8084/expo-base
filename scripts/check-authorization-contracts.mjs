import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root=process.cwd(),problems=[];
const runtime=fs.readFileSync(path.join(root,'packages/runtime/src/authorization.tsx'),'utf8');
const provider=fs.readFileSync(path.join(root,'packages/runtime/src/PrecisionRuntimeProvider.tsx'),'utf8');
if(!runtime.includes("status: AuthorizationStatus"))problems.push('authorization runtime status contract missing');
if(!runtime.includes('isCapabilityFetchCurrent'))problems.push('authorization runtime must reject stale capability fetches');
if(/error\.message|String\(error\)/.test(runtime))problems.push('authorization runtime must not surface raw adapter errors');
if(!provider.includes('<PrecisionAuthorizationProvider adapter={services.authorization}'))problems.push('runtime provider must mount authorization under authenticated services');
function walk(dir){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else if(/\.(?:ts|tsx|js|jsx)$/.test(e.name)){const rel=path.relative(root,full),text=fs.readFileSync(full,'utf8');if(/\bservices\.authorization\.(?:getCapabilities|subscribe)\s*\(/.test(text))problems.push(`${rel}: feature bypasses authorization runtime`);if(/\b(?:user|session\.user)\.role\s*===|\broles?\.includes\s*\(/.test(text))problems.push(`${rel}: feature hardcodes role checks instead of capabilities`);}}}
for(const app of fs.readdirSync(path.join(root,'apps'),{withFileTypes:true}))if(app.isDirectory())walk(path.join(root,'apps',app.name,'app'));
if(problems.length){console.error('Authorization contract violations:\n'+problems.map(x=>`- ${x}`).join('\n'));process.exit(1);}console.log('Authorization contract check passed (fail-closed runtime, capability ownership, no feature role checks).');
