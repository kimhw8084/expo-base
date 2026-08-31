import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root=process.cwd(); const problems=[];
const forbidden=[
  [/from\s+['"]expo-linking['"]/, 'direct expo-linking import'],
  [/import\s*\{[^}]*\bLinking\b[^}]*\}\s*from\s*['"]react-native['"]/, 'direct React Native Linking import'],
  [/from\s+['"]expo-web-browser['"]/, 'direct expo-web-browser import for external navigation'],
  [/\bLinking\.(?:openURL|canOpenURL)\s*\(/, 'direct Linking.openURL/canOpenURL call'],
  [/\bwindow\.open\s*\(/, 'direct window.open call'],
  [/\b(?:window\.)?location\.href\s*=/, 'direct location.href assignment'],
  [/<a\b[^>]*\bhref\s*=/, 'raw web anchor external-navigation ownership'],
  [/\bhref\s*=\s*['"]https?:\/\//, 'direct external href'],
];
function walk(dir){ if(!fs.existsSync(dir))return; for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name); if(entry.isDirectory())walk(full); else if(/\.(?:ts|tsx|js|jsx)$/.test(entry.name)){ const rel=path.relative(root,full); if(rel.endsWith('app/+native-intent.tsx')) continue; const text=fs.readFileSync(full,'utf8'); for(const [pattern,label] of forbidden) if(pattern.test(text)) problems.push(`${rel}: ${label}`); }}}
for(const app of fs.readdirSync(path.join(root,'apps'),{withFileTypes:true})) if(app.isDirectory()) walk(path.join(root,'apps',app.name,'app'));
if(problems.length){console.error('Linking contract violations:\n'+problems.map(x=>`- ${x}`).join('\n'));process.exit(1);}console.log('Linking contract check passed (external navigation is centralized).');
