import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root=process.cwd(), out=path.join(root,'.tmp-linking'); fs.rmSync(out,{recursive:true,force:true});
const compile=spawnSync('tsc',['-p','packages/linking/tsconfig.json','--noEmit','false','--outDir',out],{cwd:root,encoding:'utf8'});
if(compile.status!==0){process.stderr.write(compile.stdout??'');process.stderr.write(compile.stderr??'');process.exit(compile.status??1);}
try {
  const mod=await import(pathToFileURL(path.join(out,'policy.js')).href);
  const external={allowHttps:true,allowedHosts:[{host:'example.com',allowSubdomains:true},{host:'trusted.test'}],allowMailto:false,allowTel:true};
  assert.equal(mod.validateExternalUrl('https://example.com/a',external).allowed,true);
  assert.equal(mod.validateExternalUrl('https://sub.example.com/a',external).allowed,true);
  assert.equal(mod.validateExternalUrl('https://lookalikeexample.com',external).reason,'blocked_host');
  assert.equal(mod.validateExternalUrl('http://example.com',external).reason,'insecure_http');
  for(const bad of ['javascript:alert(1)','data:text/html,x','file:///etc/passwd','vbscript:msgbox(1)','blob:https://example.com/id','intent://scan']) assert.equal(mod.validateExternalUrl(bad,external).allowed,false,bad);
  assert.equal(mod.validateExternalUrl('tel:+15551212',external).allowed,true);
  assert.equal(mod.validateExternalUrl('mailto:a@example.com',external).allowed,false);
  assert.equal(mod.validateExternalUrl('https://example.com:8443/a',external).reason,'blocked_port');
  assert.equal(mod.validateExternalUrl('https://user:secret@example.com/a',external).reason,'embedded_credentials');
  assert.equal(mod.redactUrlForDiagnostics('https://example.com/auth?code=SECRET#token'),'https://example.com/auth');

  const incoming={appSchemes:['demo'],universalLinkHosts:[{host:'app.example.com'}],callbackRules:[{path:'/auth/callback',allowedQueryKeys:['code','state','error'],requiredQueryKeys:['state']}],rejectedRoute:'/link-error'};
  assert.deepEqual(mod.resolveIncomingLink('/cards/123?tab=reward',incoming),{action:'route',route:'/cards/123?tab=reward',source:'internal-path'});
  assert.deepEqual(mod.resolveIncomingLink('demo://auth/callback?code=abc&state=s1',incoming),{action:'route',route:'/auth/callback?code=abc&state=s1',source:'custom-scheme'});
  assert.equal(mod.resolveIncomingLink('demo://auth/callback?code=abc',incoming).reason,'invalid_callback');
  assert.equal(mod.resolveIncomingLink('demo://auth/callback?code=abc&state=s1&redirect=https://evil.test',incoming).reason,'invalid_callback');
  assert.deepEqual(mod.resolveIncomingLink('https://app.example.com/cards/1',incoming),{action:'route',route:'/cards/1',source:'universal-link'});
  assert.equal(mod.resolveIncomingLink('https://evil.example/cards/1',incoming).action,'reject');
  assert.equal(mod.resolveIncomingLink('javascript:alert(1)',incoming).route,'/link-error');

  class MemoryAdapter { constructor(){this.opened=[];this.available=true;} async canOpen(){return this.available;} async open(url){this.opened.push(url);} }
  const adapter=new MemoryAdapter(); const observed=[]; const runtime=mod.createPrecisionLinkingRuntime({adapter,externalPolicy:external,incomingPolicy:incoming,onIncomingRoute:(route)=>observed.push(route)});
  assert.equal(runtime.redirectIncoming('demo://cards/42'),'/cards/42'); assert.deepEqual(observed,['/cards/42']);
  assert.equal(runtime.redirectIncoming('javascript:alert(1)'),'/link-error'); assert.deepEqual(observed,['/cards/42']);
  assert.equal((await runtime.openExternal('https://example.com/safe')).status,'opened'); assert.equal(adapter.opened.length,1);
  assert.equal((await runtime.openExternal('javascript:alert(1)')).status,'blocked'); assert.equal(adapter.opened.length,1);
  adapter.available=false; assert.equal((await runtime.openExternal('https://example.com/safe')).status,'unavailable');

  // Generated stress: allowlisted subdomains pass, lookalikes/blocked schemes never do.
  for(let i=0;i<5000;i++){
    const good=`https://${i%2?'sub.':''}example.com/path/${i}?q=${i}`; assert.equal(mod.validateExternalUrl(good,external).allowed,true);
    const evil=`https://example.com.evil-${i}.test/path`; assert.equal(mod.validateExternalUrl(evil,external).allowed,false);
    const script=`javascript:alert(${i})`; assert.equal(mod.validateExternalUrl(script,external).allowed,false);
  }
  console.log('Linking contract tests passed (policy, incoming rewrite, safe open, redaction, 5,000 generated URL scenarios).');
} finally { fs.rmSync(out,{recursive:true,force:true}); }
