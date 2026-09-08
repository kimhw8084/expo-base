import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const outDir = path.join(root, '.tmp-visualization-benchmark');
fs.rmSync(outDir, { recursive: true, force: true });
const compile = spawnSync('tsc', ['-p', 'packages/platform/tsconfig.json', '--noEmit', 'false', '--outDir', outDir], { cwd: root, encoding: 'utf8' });
if (compile.status !== 0) {
  process.stderr.write(compile.stdout ?? '');
  process.stderr.write(compile.stderr ?? '');
  process.exit(compile.status ?? 1);
}
try {
  const viz = await import(pathToFileURL(path.join(outDir, 'platform/src/visualization.js')).href);
  const data = Array.from({ length: 50_000 }, (_, index) => ({ label: `P${index}`, value: Math.sin(index / 37) * (index % 997) }));
  const values = data.map((item) => item.value);
  const measure = (work) => {
    const samples = [];
    for (let iteration = 0; iteration < 9; iteration += 1) {
      const start = performance.now();
      work();
      samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    return Math.round((samples[2] ?? 0) * 100) / 100;
  };
  const result = {
    benchmarkIterations: 9,
      dataPoints: data.length,
    downsample10kMedianMs: measure(() => viz.downsampleMinMax(data, 10_000)),
    downsample1kMedianMs: measure(() => viz.downsampleMinMax(data, 1_000)),
      histogram50kMedianMs: measure(() => viz.histogramBins(values, 64)),
      heatmap1kMedianMs: measure(() => viz.heatmapCells(Array.from({ length: 1_000 }, (_, index) => ({ row: `R${index % 20}`, column: `C${index % 50}`, value: index })), 800, 320)),
      waterfall10kMedianMs: measure(() => viz.waterfallRects(Array.from({ length: 10_000 }, (_, index) => ({ label: `P${index}`, value: index % 2 ? -index : index, kind: index % 5 === 0 ? 'total' : index % 2 ? 'decrease' : 'increase' })), 1200, 320)),
    thresholdsMs: { downsample10k: 100, downsample1k: 100, histogram50k: 100, heatmap1k: 100, waterfall10k: 100 },
  };
  fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
  fs.writeFileSync(path.join(root, 'test-results/visualization-benchmark.json'), `${JSON.stringify(result, null, 2)}\n`);
  for (const [name, value] of Object.entries(result)) {
    if (name.endsWith('MedianMs')) {
      const threshold = result.thresholdsMs[name.replace('MedianMs', '')];
      if (threshold !== undefined && value > threshold) throw new Error(`${name} exceeded ${threshold}ms (${value}ms).`);
    }
  }
  console.log(`Visualization benchmark passed (${JSON.stringify(result)}).`);
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
}
