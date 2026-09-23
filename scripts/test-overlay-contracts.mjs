import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process'; import { spawnSync } from 'node:child_process'; import { pathToFileURL } from 'node:url';
const root=process.cwd(); const outDir=path.join(root,'.tmp-overlay-contracts'); fs.rmSync(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['-p','packages/platform/tsconfig.json','--noEmit','false','--outDir',outDir],{cwd:root,encoding:'utf8'}); if(compile.status!==0){process.stderr.write(compile.stdout??'');process.stderr.write(compile.stderr??'');process.exit(compile.status??1);}
const compileFocus=spawnSync('tsc',['--target','ES2022','--module','ES2022','--moduleResolution','bundler','--outDir',outDir,'packages/overlays/internal/web-focus-eligibility.ts'],{cwd:root,encoding:'utf8'}); if(compileFocus.status!==0){process.stderr.write(compileFocus.stdout??'');process.stderr.write(compileFocus.stderr??'');fs.rmSync(outDir,{recursive:true,force:true});process.exit(compileFocus.status??1);}
try { const overlay=await import(pathToFileURL(path.join(outDir,'platform/src/overlay.js')).href); const focusEligibility=await import(pathToFileURL(path.join(outDir,'web-focus-eligibility.js')).href);
  const base={viewport:{width:390,height:844},insets:{top:47,right:0,bottom:34,left:0},gap:8,margin:8};
  const below=overlay.solveAnchoredOverlay({...base,anchor:{x:16,y:100,width:120,height:44},overlay:{width:220,height:200},preferred:'bottom-start'}); assert.equal(below.placement,'bottom-start'); assert.ok(below.x>=8); assert.ok(below.y>=47+8);
  const flipped=overlay.solveAnchoredOverlay({...base,anchor:{x:250,y:730,width:120,height:44},overlay:{width:240,height:240},preferred:'bottom-end'}); assert.equal(flipped.placement,'top-end'); assert.ok(flipped.x+Math.min(240,flipped.maxWidth)<=390-8+0.001);
  const wide=overlay.solveAnchoredOverlay({...base,anchor:{x:20,y:200,width:60,height:44},overlay:{width:800,height:120},preferred:'bottom-start'}); assert.equal(wide.constrained,true); assert.equal(wide.maxWidth,374);
  let seed=811; const random=()=>{seed=(seed*48271)%2147483647;return seed/2147483647;};
  for(let i=0;i<2000;i+=1){const viewport={width:280+Math.floor(random()*1300),height:420+Math.floor(random()*900)};const insets={top:Math.floor(random()*60),right:Math.floor(random()*24),bottom:Math.floor(random()*50),left:Math.floor(random()*24)};const margin=8;const maxAnchorX=Math.max(0,viewport.width-insets.right-insets.left-60);const maxAnchorY=Math.max(0,viewport.height-insets.top-insets.bottom-60);const anchor={x:insets.left+Math.floor(random()*maxAnchorX),y:insets.top+Math.floor(random()*maxAnchorY),width:40+Math.floor(random()*180),height:32+Math.floor(random()*60)};anchor.width=Math.min(anchor.width,Math.max(1,viewport.width-anchor.x-insets.right));anchor.height=Math.min(anchor.height,Math.max(1,viewport.height-anchor.y-insets.bottom));const size={width:120+Math.floor(random()*700),height:60+Math.floor(random()*700)};const preferred=['bottom-start','bottom-end','top-start','top-end'][Math.floor(random()*4)];const result=overlay.solveAnchoredOverlay({anchor,overlay:size,viewport,insets,preferred,gap:8,margin});const left=insets.left+margin,right=viewport.width-insets.right-margin,top=insets.top+margin,bottom=viewport.height-insets.bottom-margin;const rw=Math.min(size.width,result.maxWidth),rh=Math.min(size.height,result.maxHeight);assert.ok(result.x>=left-0.001);assert.ok(result.y>=top-0.001);assert.ok(result.x+rw<=right+0.001);assert.ok(result.y+rh<=bottom+0.001);assert.ok(result.maxWidth>=0);assert.ok(result.maxHeight>=0);}
  const {isWebFocusEligible}=focusEligibility;
  const makeTarget=({attributes={},style={},...properties}={})=>({isConnected:true,style,getAttribute:(name)=>Object.hasOwn(attributes,name)?attributes[name]:null,hasAttribute:(name)=>Object.hasOwn(attributes,name),matches:(selector)=>selector===':disabled'&&properties.matchesDisabled===true,...properties});
  const environment={document:{defaultView:{getComputedStyle:(target)=>target.style??{}}}};
  assert.equal(isWebFocusEligible(makeTarget(),environment),true,'connected visible targets remain eligible');
  assert.equal(isWebFocusEligible(makeTarget({isConnected:false}),environment),false,'detached targets are ineligible');
  assert.equal(isWebFocusEligible(makeTarget({disabled:true}),environment),false,'disabled targets are ineligible');
  assert.equal(isWebFocusEligible(makeTarget({attributes:{disabled:''}}),environment),false,'disabled attributes are ineligible');
  assert.equal(isWebFocusEligible(makeTarget({matchesDisabled:true}),environment),false,'disabled fieldset descendants are ineligible');
  assert.equal(isWebFocusEligible(makeTarget({hidden:true}),environment),false,'hidden targets are ineligible');
  assert.equal(isWebFocusEligible(makeTarget({attributes:{hidden:''}}),environment),false,'hidden attributes are ineligible');
  assert.equal(isWebFocusEligible(makeTarget({inert:true}),environment),false,'inert targets are ineligible');
  assert.equal(isWebFocusEligible(makeTarget({attributes:{inert:''}}),environment),false,'inert attributes are ineligible');
  assert.equal(isWebFocusEligible(makeTarget({attributes:{'aria-disabled':' TrUe '}}),environment),false,'aria-disabled targets are ineligible');
  assert.equal(isWebFocusEligible(makeTarget({attributes:{'aria-hidden':'true'}}),environment),false,'aria-hidden targets are ineligible');
  assert.equal(isWebFocusEligible(makeTarget({parentElement:makeTarget({attributes:{'aria-hidden':'true'}})}),environment),false,'hidden ancestors make descendants ineligible');
  assert.equal(isWebFocusEligible(makeTarget({style:{display:'none'}}),environment),false,'display none targets are ineligible');
  assert.equal(isWebFocusEligible(makeTarget({style:{visibility:'hidden'}}),environment),false,'visibility hidden targets are ineligible');
  assert.equal(isWebFocusEligible(makeTarget({style:{visibility:'collapse'}}),environment),false,'visibility collapse targets are ineligible');
  assert.equal(isWebFocusEligible(makeTarget({style:{visibility:'visible'},parentElement:makeTarget({style:{visibility:'hidden'}})}),environment),true,'a visible child may override inherited ancestor visibility');
  assert.equal(isWebFocusEligible(makeTarget({style:{opacity:'0'}}),environment),false,'fully transparent targets are ineligible');
  assert.equal(isWebFocusEligible(makeTarget({parentElement:makeTarget({style:{opacity:'0'}})}),environment),false,'transparent ancestors make descendants ineligible');
  assert.equal(isWebFocusEligible(makeTarget({style:{opacity:'0.01'}}),environment),true,'partially transparent targets remain eligible');
  const throwingMatch=makeTarget(); throwingMatch.matches=()=>{throw new Error('unsupported selector');};
  assert.equal(isWebFocusEligible(throwingMatch,environment),true,'non-browser selector shims fall back safely');
  const throwingStyle=makeTarget({style:{display:'none'}}); environment.document.defaultView.getComputedStyle=()=>{throw new Error('computed styles unavailable');};
  assert.equal(isWebFocusEligible(throwingStyle,environment),false,'style fallback still rejects display none');
  console.log('Overlay placement and focus eligibility tests passed (2,000 placement scenarios; DOM capability and inherited eligibility checks).');
} finally {fs.rmSync(outDir,{recursive:true,force:true});}
