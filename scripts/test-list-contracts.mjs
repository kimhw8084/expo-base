import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process'; import { spawnSync } from 'node:child_process'; import { pathToFileURL } from 'node:url';
const root=process.cwd(); const outDir=path.join(root,'.tmp-list-contracts'); fs.rmSync(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['-p','packages/platform/tsconfig.json','--noEmit','false','--outDir',outDir],{cwd:root,encoding:'utf8'}); if(compile.status!==0){process.stderr.write(compile.stdout??'');process.stderr.write(compile.stderr??'');process.exit(compile.status??1);}
try { const lists=await import(pathToFileURL(path.join(outDir,'platform/src/lists.js')).href);
  assert.equal(lists.shouldUseVirtualizedList(40),false); assert.equal(lists.shouldUseVirtualizedList(41),true); assert.equal(lists.shouldUseVirtualizedList(-1),false);
  assert.equal(lists.normalizePageSize(1),10); assert.equal(lists.normalizePageSize(250),200); assert.equal(lists.normalizePageSize(72.9),72); assert.equal(lists.normalizePageSize(Number.NaN),50);
  assert.deepEqual(lists.validateListKeys(['a','b','c']),{valid:true,duplicates:[],emptyKeys:[]});
  assert.deepEqual(lists.validateListKeys(['a','b','a','  ','b']),{valid:false,duplicates:['a','b'],emptyKeys:[3]});
  let seed=991; const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<1000;i+=1){const count=Math.floor(random()*300);assert.equal(lists.shouldUseVirtualizedList(count),count>40);const raw=-100+random()*500;const normalized=lists.normalizePageSize(raw);assert.ok(normalized>=10&&normalized<=200&&Number.isInteger(normalized));}
  console.log('List contract tests passed (virtualization threshold, page bounds, key integrity, 1,000 generated scenarios).');
} finally {fs.rmSync(outDir,{recursive:true,force:true});}
