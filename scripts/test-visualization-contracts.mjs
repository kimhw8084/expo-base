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
  const domain=viz.numericDomain([-10,0,25,Number.NaN],true); assert.deepEqual(domain,{min:-10,max:25,span:35});
  const nice=viz.niceDomain({min:1.2,max:9.1,span:7.9},5); assert.ok(nice.min<=1.2&&nice.max>=9.1&&nice.span>0);
  const ticks=viz.chartTicks(domain,5); assert.equal(ticks.length,5); assert.ok(ticks.every((tick)=>Number.isFinite(tick.position)&&tick.position>=0&&tick.position<=1));
  const reduced=viz.downsampleMinMax(Array.from({length:1000},(_,i)=>({label:`P${i}`,value:Math.sin(i/10)*i})),40); assert.ok(reduced.length<=40); assert.equal(reduced[0]?.label,'P0'); assert.equal(reduced.at(-1)?.label,'P999');
  const histogram=viz.histogramBins([-2,-1,0,1,2,3],3); assert.equal(histogram.reduce((sum,bin)=>sum+bin.count,0),6);
  const heatmap=viz.heatmapCells([{row:'A',column:'One',value:1},{row:'B',column:'Two',value:2}],200,100); assert.equal(heatmap.length,2); assert.ok(heatmap.every((cell)=>cell.width>0&&cell.height>0&&cell.x>=0&&cell.y>=0));
  const waterfall=viz.waterfallRects([{label:'Start',value:100,kind:'total'},{label:'Gain',value:20,kind:'increase'},{label:'Cost',value:-10,kind:'decrease'},{label:'End',value:110,kind:'total'}],240,120); assert.equal(waterfall.length,4); assert.ok(waterfall.every((rect)=>[rect.x,rect.y,rect.width,rect.height,rect.start,rect.end].every(Number.isFinite)));
  let seed=787; const random=()=>{seed=(seed*48271)%2147483647;return seed/2147483647;};
  for(let scenario=0;scenario<2000;scenario+=1){const count=Math.floor(random()*40);const generated=Array.from({length:count},(_,i)=>({label:`P${i}`,value:(random()-.35)*10000}));const width=1+Math.floor(random()*1600);const height=1+Math.floor(random()*500);const pts=viz.chartPoints(generated,width,height,Math.floor(random()*20));assert.ok(pts.every((p)=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=width&&p.y>=0&&p.y<=height));assert.ok(!/NaN|Infinity/.test(viz.linePath(pts)));const rects=viz.barRects(generated,width,height,random()*20);assert.ok(rects.every((r)=>[r.x,r.y,r.width,r.height].every(Number.isFinite)&&r.width>0&&r.height>0));}
  console.log('Visualization contract tests passed (scales, ticks, paths, bars, donut segments, histogram, heatmap, waterfall, downsampling, progress, summaries, 2,000 generated scenarios).');
} finally {fs.rmSync(outDir,{recursive:true,force:true});}
