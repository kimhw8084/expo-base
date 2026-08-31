import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root = process.cwd(); const appsRoot = path.join(root, 'apps'); const problems = [];
const forbidden = [
  [/<TextInput\b/, 'raw TextInput; use @precision-calm/forms'],
  [/<Switch\b/, 'raw Switch; use SwitchField'],
  [/<KeyboardAvoidingView\b/, 'raw KeyboardAvoidingView; use FormScreen'],
  [/from\s+['"]react-native-keyboard-controller['"]/, 'direct keyboard-controller import; use FormScreen'],
  [/from\s+['"]react-hook-form['"]/, 'direct React Hook Form import; use @precision-calm/form-rhf'],
];
function walk(dir){ if(!fs.existsSync(dir))return; for(const entry of fs.readdirSync(dir,{withFileTypes:true})){ const full=path.join(dir,entry.name); if(entry.isDirectory())walk(full); else if(/\.(ts|tsx)$/.test(entry.name)){ const text=fs.readFileSync(full,'utf8'); for(const [pattern,label] of forbidden) if(pattern.test(text)) problems.push(`${path.relative(root,full)}: ${label}`); } } }
if(fs.existsSync(appsRoot)) for(const app of fs.readdirSync(appsRoot,{withFileTypes:true})) if(app.isDirectory()) walk(path.join(appsRoot,app.name,'app'));
if(problems.length){ console.error('Form contract violations:\n'+problems.map((x)=>`- ${x}`).join('\n')); process.exit(1); }
console.log('Form contract check passed.');
