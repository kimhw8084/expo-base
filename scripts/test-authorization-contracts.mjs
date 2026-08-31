import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root=process.cwd(),out=path.join(root,'.tmp-authorization');fs.rmSync(out,{recursive:true,force:true});
const compile=spawnSync('tsc',['-p','packages/authorization/tsconfig.json','--noEmit','false','--outDir',out],{cwd:root,encoding:'utf8'});
if(compile.status!==0){process.stderr.write(compile.stdout??'');process.stderr.write(compile.stderr??'');process.exit(compile.status??1);}
try{
  const mod=await import(pathToFileURL(path.join(out,'policy.js')).href);
  assert.equal(mod.isValidCapabilityKey('reports.view'),true);
  for(const bad of ['Admin',' reports.view','reports view','*','', 'a'.repeat(129)]) assert.equal(mod.isValidCapabilityKey(bad),false,bad);
  assert.deepEqual(mod.normalizeCapabilities(['reports.view','reports.view',' settings.manage ','INVALID CAP']),['reports.view','settings.manage']);
  const ready={status:'ready',capabilities:['reports.view','settings.manage']};
  assert.deepEqual(mod.evaluateCapabilityRequirement(ready,{all:['reports.view']}),{allowed:true,reason:'granted'});
  assert.equal(mod.evaluateCapabilityRequirement(ready,{all:['reports.view','billing.manage']}).reason,'missing_all');
  assert.equal(mod.evaluateCapabilityRequirement(ready,{any:['billing.manage','settings.manage']}).allowed,true);
  assert.equal(mod.evaluateCapabilityRequirement(ready,{any:['billing.manage']}).reason,'missing_any');
  assert.equal(mod.evaluateCapabilityRequirement(ready,{none:['settings.manage']}).reason,'denied_capability');
  for(const status of ['inactive','loading','error']) assert.equal(mod.evaluateCapabilityRequirement({status,capabilities:['settings.manage']},{all:['settings.manage']}).allowed,false,status);
  assert.equal(mod.evaluateCapabilityRequirement(ready,{all:['INVALID CAP']}).reason,'invalid_requirement');
  assert.equal(mod.isCapabilityFetchCurrent(3,3),true); assert.equal(mod.isCapabilityFetchCurrent(3,4),false);
  for(let i=0;i<5000;i++){
    const caps=[`record.${i%7}`, ...(i%3===0?['settings.manage']:[])];
    const snapshot={status:'ready',capabilities:caps};
    assert.equal(mod.evaluateCapabilityRequirement(snapshot,{all:[`record.${i%7}`]}).allowed,true);
    assert.equal(mod.evaluateCapabilityRequirement(snapshot,{all:['settings.manage']}).allowed,i%3===0);
    assert.equal(mod.evaluateCapabilityRequirement({status:i%2?'loading':'error',capabilities:caps},{all:[`record.${i%7}`]}).allowed,false);
  }
  console.log('Authorization contract tests passed (requirements, fail-closed state, normalization, 5,000 generated capability scenarios).');
}finally{fs.rmSync(out,{recursive:true,force:true});}
