import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root=process.cwd(); const outDir=path.join(root,'.tmp-adapters'); fs.rmSync(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['-p','packages/adapters/tsconfig.json','--noEmit','false','--outDir',outDir],{cwd:root,encoding:'utf8'});
if(compile.status!==0){process.stderr.write(compile.stdout??'');process.stderr.write(compile.stderr??'');process.exit(compile.status??1);}
try{
  const mod=await import(pathToFileURL(path.join(outDir,'memory.js')).href);
  const auth=new mod.MemoryAuthAdapter(); const seen=[]; const unsubscribe=auth.subscribe((session)=>seen.push(session?.user.email??null));
  const session=await auth.signIn({email:'Alex@Example.com',password:'demo'}); assert.equal(session.user.email,'alex@example.com');
  assert.equal((await auth.getSession())?.user.id,'demo:alex@example.com'); await auth.signOut(); unsubscribe(); assert.deepEqual(seen,[null,'alex@example.com',null]);
  const authorization=new mod.MemoryAuthorizationAdapter({'demo:alex@example.com':['reports.view']}); const capabilityEvents=[]; const stopAuthz=authorization.subscribe('demo:alex@example.com',(values)=>capabilityEvents.push([...values])); assert.deepEqual(await authorization.getCapabilities('demo:alex@example.com'),['reports.view']); authorization.setCapabilities('demo:alex@example.com',['reports.view','settings.manage']); assert.deepEqual(await authorization.getCapabilities('demo:alex@example.com'),['reports.view','settings.manage']); stopAuthz(); assert.equal(capabilityEvents.length,2);
  const store=new mod.MemoryEntityStore([{id:'a',value:1}]); assert.equal((await store.list()).length,1); await store.upsert({id:'b',value:2}); assert.equal((await store.get('b')).value,2); await store.remove('a'); assert.equal(await store.get('a'),null);
  const storage=new mod.MemoryKeyValueStorage(); await storage.set('theme','dark'); assert.equal(await storage.get('theme'),'dark'); await storage.remove('theme'); assert.equal(await storage.get('theme'),null);
  const analytics=new mod.RecordingAnalyticsAdapter(); analytics.identify('u1'); analytics.track({name:'opened',properties:{screen:'home'}}); assert.equal(analytics.identifiedUser,'u1'); assert.equal(analytics.events.length,1);
  const services=mod.createDemoServices(); assert.ok(services.auth&&services.authorization&&services.storage&&services.analytics&&services.images);
  console.log('Adapter contract tests passed (auth, authorization, entity store, storage, analytics, image provider).');
} finally { fs.rmSync(outDir,{recursive:true,force:true}); }
