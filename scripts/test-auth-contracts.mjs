import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root=process.cwd(),out=path.join(root,'.tmp-auth');fs.rmSync(out,{recursive:true,force:true});
const compile=spawnSync('tsc',['-p','packages/auth/tsconfig.json','--noEmit','false','--outDir',out],{cwd:root,encoding:'utf8'});
if(compile.status!==0){process.stderr.write(compile.stdout??'');process.stderr.write(compile.stderr??'');process.exit(compile.status??1);}
try{
  const access=await import(pathToFileURL(path.join(out,'access.js')).href);
  const intents=await import(pathToFileURL(path.join(out,'returnIntent.js')).href);
  const routes=await import(pathToFileURL(path.join(out,'routes.js')).href);
  const mod={...access,...intents,...routes};
  assert.equal(mod.deriveProtectedAccess('loading'),'booting');
  assert.equal(mod.deriveProtectedAccess('signed-out'),'signed-out');
  assert.equal(mod.deriveProtectedAccess('signed-in'),'granted');
  assert.equal(mod.deriveProtectedAccess('signed-in',{locallyLocked:true}),'locked');
  assert.equal(mod.deriveProtectedAccess('error',{locallyLocked:true}),'error');
  assert.equal(mod.canRenderProtectedContent('granted'),true);
  assert.equal(mod.isSessionFetchCurrent(4,4),true); assert.equal(mod.isSessionFetchCurrent(4,5),false); assert.equal(mod.isSessionFetchCurrent(-1,-1),false);
  for(const state of ['booting','signed-out','locked','error']) assert.equal(mod.canRenderProtectedContent(state),false);

  const policy={excludedPrefixes:['/sign-in','/session-loading','/session-error','/link-error']};
  assert.deepEqual(mod.validateReturnIntent('/cards/123?tab=rewards#secret',policy),{allowed:true,path:'/cards/123?tab=rewards'});
  for(const bad of ['https://evil.test/x','//evil.test/x','javascript:alert(1)','/sign-in','/sign-in/help','/link-error','/bad\\path','']) assert.equal(mod.validateReturnIntent(bad,policy).allowed,false,bad);
  assert.equal(mod.choosePostAuthDestination('/cards/1','/',policy),'/cards/1');
  assert.equal(mod.choosePostAuthDestination('/sign-in','/',policy),'/');
  const channel=mod.createReturnIntentChannel(policy); const observed=[]; const stop=channel.subscribe((value)=>observed.push(value));
  assert.equal(channel.capture('/cards/9?tab=bonus'),true); assert.equal(channel.peek(),'/cards/9?tab=bonus');
  assert.equal(channel.capture('/auth/callback?code=secret'),true); // /auth is not excluded in this local policy.
  channel.clear(); assert.equal(channel.peek(),null); assert.equal(channel.capture('/sign-in'),false);
  assert.equal(channel.capture('/cards/10'),true); assert.equal(channel.consume('/'),'/cards/10'); assert.equal(channel.peek(),null); stop();
  assert.ok(observed.length>=5);

  const goodSets={always:['link-error'],authenticated:['(app)'],signedOut:['sign-in'],booting:['session-loading'],error:['session-error'],locked:['unlock']};
  assert.equal(mod.validateProtectedRouteSets(goodSets).valid,true);
  const duplicate=mod.validateProtectedRouteSets({...goodSets,signedOut:['sign-in','(app)']});
  assert.equal(duplicate.valid,false);assert.deepEqual(duplicate.duplicates,['(app)']);

  for(let i=0;i<5000;i++){
    const safe=`/records/${i}?page=${i%17}`;
    const decision=mod.validateReturnIntent(safe,policy);assert.equal(decision.allowed,true);if(decision.allowed)assert.equal(decision.path,safe);
    assert.equal(mod.validateReturnIntent(`//evil-${i}.test/path`,policy).allowed,false);
    assert.equal(mod.deriveProtectedAccess('signed-in',{locallyLocked:i%2===0}),i%2===0?'locked':'granted');
    assert.equal(mod.isSessionFetchCurrent(i,i+(i%11===0?1:0)),i%11!==0);
  }
  console.log('Auth contract tests passed (access state, safe return intent, route sets, 5,000 generated authorization scenarios).');
}finally{fs.rmSync(out,{recursive:true,force:true});}
