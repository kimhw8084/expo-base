import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root=process.cwd();
const snapshotFile=path.join(root,'precision.api.json');
const packages=['accessibility','components','data-display','feedback','forms','icons','layouts','lists','motion','navigation','overlays','patterns','primitives','visualization'];
const snapshot={schemaVersion:1,facade:'@precision-calm/ui',packages:{}};
function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(f));else if(/\.(?:ts|tsx)$/.test(e.name))out.push(f);}return out;}
for(const pkg of packages){const names=new Set();for(const file of walk(path.join(root,'packages',pkg,'src'))){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(/export\s+(?:declare\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g))names.add(m[1]);}snapshot.packages[pkg]=[...names].sort();}
const all=[...new Set(Object.values(snapshot.packages).flat())].sort();snapshot.symbols=all;snapshot.symbolCount=all.length;
if(process.argv.includes('--write')){fs.writeFileSync(snapshotFile,JSON.stringify(snapshot,null,2)+'\n');console.log(`Wrote API snapshot (${all.length} symbols).`);process.exit(0);}
if(!fs.existsSync(snapshotFile)){console.error('precision.api.json missing; run npm run api:snapshot:write for an explicitly approved baseline.');process.exit(2);}
const expected=JSON.parse(fs.readFileSync(snapshotFile,'utf8'));
const current=JSON.stringify(snapshot);const baseline=JSON.stringify(expected);
if(current!==baseline){
  const oldSet=new Set(expected.symbols??[]),newSet=new Set(all);const removed=[...oldSet].filter((x)=>!newSet.has(x));const added=[...newSet].filter((x)=>!oldSet.has(x));
  console.error('Public API snapshot changed.\n'+(removed.length?`Removed: ${removed.join(', ')}\n`:'')+(added.length?`Added: ${added.join(', ')}\n`:'')+'Approve intentional changes with npm run api:snapshot:write.');process.exit(1);
}
console.log(`Public API snapshot check passed (${all.length} symbols).`);
