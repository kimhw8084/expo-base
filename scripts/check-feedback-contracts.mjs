import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process';
const root=process.cwd();const appsRoot=path.join(root,'apps');const problems=[];
const forbidden=[
  [/\bActivityIndicator\b/, 'raw ActivityIndicator; use @precision-calm/feedback LoadingState'],
  [/from\s+['"]react-native-loading-spinner-overlay['"]/, 'direct loading overlay; use system feedback/overlay components'],
  [/from\s+['"]react-native-toast-message['"]/, 'direct toast library; use the shared OverlayRootProvider toast path'],
];
function walk(dir){if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(/\.(ts|tsx)$/.test(entry.name)){const text=fs.readFileSync(full,'utf8');for(const [pattern,label] of forbidden)if(pattern.test(text))problems.push(`${path.relative(root,full)}: ${label}`);}}}
if(fs.existsSync(appsRoot))for(const app of fs.readdirSync(appsRoot,{withFileTypes:true}))if(app.isDirectory())walk(path.join(appsRoot,app.name,'app'));
if(problems.length){console.error('Feedback contract violations:\n'+problems.map((x)=>`- ${x}`).join('\n'));process.exit(1);}console.log('Feedback contract check passed.');
