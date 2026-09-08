import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path'; import process from 'node:process'; import { spawnSync } from 'node:child_process'; import { pathToFileURL } from 'node:url';
const root=process.cwd(); const outDir=path.join(root,'.tmp-visualization-contracts'); fs.rmSync(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['-p','packages/platform/tsconfig.json','--noEmit','false','--outDir',outDir],{cwd:root,encoding:'utf8'}); if(compile.status!==0){process.stderr.write(compile.stdout??'');process.stderr.write(compile.stderr??'');process.exit(compile.status??1);}
try { const viz=await import(pathToFileURL(path.join(outDir,'platform/src/visualization.js')).href);
  const data=[{label:'Jan',value:10},{label:'Feb',value:20},{label:'Mar',value:15}];
  assert.deepEqual(viz.chartBounds(data),{min:10,max:20,span:10});
  assert.deepEqual(viz.chartBounds([{label:'A',value:5}],true),{min:0,max:5,span:5});
  const points=viz.chartPoints(data,300,100,10); assert.equal(points.length,3); assert.equal(points[0].x,10); assert.equal(points[2].x,290); assert.ok(points.every((p)=>p.x>=0&&p.x<=300&&p.y>=0&&p.y<=100));
  assert.match(viz.linePath(points),/^M/); assert.match(viz.areaPath(points,90),/Z$/);
  const bars=viz.barRects([{label:'A',value:-5},{label:'B',value:10}],200,100,8); assert.equal(bars.length,2); assert.ok(bars.every((bar)=>bar.x>=0&&bar.width>0&&bar.height>0));
  assert.equal(viz.clampProgress(-1),0); assert.equal(viz.clampProgress(.4),.4); assert.equal(viz.clampProgress(9),1); assert.equal(viz.clampProgress(Number.NaN),0);
  assert.match(viz.chartSummary(data,'Value'),/3 points/); assert.equal(viz.chartSummary([], 'Value'),'Value. No data.');
  const donut=viz.donutSegments([{label:'A',value:1},{label:'B',value:3},{label:'Ignored',value:-4}]); assert.equal(donut.length,2); assert.equal(donut[0].startAngle,0); assert.ok(Math.abs(donut[1].endAngle-Math.PI*2)<0.000001);
  let seed=787; const random=()=>{seed=(seed*48271)%2147483647;return seed/2147483647;};
  for(let scenario=0;scenario<2000;scenario+=1){const count=Math.floor(random()*40);const generated=Array.from({length:count},(_,i)=>({label:`P${i}`,value:(random()-.35)*10000}));const width=1+Math.floor(random()*1600);const height=1+Math.floor(random()*500);const pts=viz.chartPoints(generated,width,height,Math.floor(random()*20));assert.ok(pts.every((p)=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=width&&p.y>=0&&p.y<=height));assert.ok(!/NaN|Infinity/.test(viz.linePath(pts)));const rects=viz.barRects(generated,width,height,random()*20);assert.ok(rects.every((r)=>[r.x,r.y,r.width,r.height].every(Number.isFinite)&&r.width>0&&r.height>0));}
  console.log('Visualization contract tests passed (scales, paths, bars, donut segments, progress, summaries, 2,000 generated scenarios).');
} finally {fs.rmSync(outDir,{recursive:true,force:true});}
