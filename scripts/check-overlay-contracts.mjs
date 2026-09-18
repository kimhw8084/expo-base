import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root=process.cwd(); const appsRoot=path.join(root,'apps'); const packagesRoot=path.join(root,'packages'); const problems=[];
const overlayRootSource = fs.readFileSync(path.join(root, 'packages/overlays/src/OverlayRootProvider.tsx'), 'utf8');
const forbidden=[
  [/<Modal\b/,'raw Modal; use @expo-base/overlays'],
  [/\.measureInWindow\s*\(/,'feature-owned overlay measurement'],
  [/\.measureLayout\s*\(/,'feature-owned overlay measurement'],
  [/from\s+['"](?:@floating-ui|react-native-portal|@gorhom\/portal)/,'direct overlay positioning/portal dependency; use @expo-base/overlays'],
];
if (!/toastLayer:\s*\{[\s\S]*?pointerEvents:\s*['"]box-none['"]/.test(overlayRootSource)) problems.push('packages/overlays/src/OverlayRootProvider.tsx: toast layer must retain style.pointerEvents box-none.');
if (!/toastLifetimeTrack:\s*\{[\s\S]*?pointerEvents:\s*['"]none['"]/.test(overlayRootSource)) problems.push('packages/overlays/src/OverlayRootProvider.tsx: toast lifetime track must retain style.pointerEvents none.');
function walkAppCode(dir){if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walkAppCode(full);else if(/\.(ts|tsx)$/.test(entry.name)){const text=fs.readFileSync(full,'utf8');for(const [pattern,label] of forbidden)if(pattern.test(text))problems.push(`${path.relative(root,full)}: ${label}`);}}}
function walkOwnedSource(dir){if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walkOwnedSource(full);else if(/\.(ts|tsx)$/.test(entry.name)){const text=fs.readFileSync(full,'utf8');if (/<(?:View|Animated\.View)\b[^>]*\bpointerEvents\s*=/.test(text)) problems.push(`${path.relative(root,full)}: maintained View pointerEvents must be owned by style.pointerEvents, not the deprecated JSX prop.`);}}}
walkOwnedSource(packagesRoot);
walkOwnedSource(appsRoot);
if(fs.existsSync(appsRoot))for(const app of fs.readdirSync(appsRoot,{withFileTypes:true}))if(app.isDirectory())walkAppCode(path.join(appsRoot,app.name,'app'));
if(problems.length){console.error('Overlay contract violations:\n'+problems.map((x)=>`- ${x}`).join('\n'));process.exit(1);}console.log('Overlay contract check passed.');
