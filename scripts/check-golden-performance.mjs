import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const root = path.resolve('apps/reference/dist');
const certification = JSON.parse(fs.readFileSync('golden.certification.json', 'utf8'));
const budgets = certification.performanceBudgets;
assert.ok(fs.existsSync(root), 'Export apps/reference/dist before checking performance.');

function walk(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target, output); else output.push(target);
  }
  return output;
}

const files = walk(root);
const chunks = files.filter((file) => file.endsWith('.js')).map((file) => ({
  file: path.relative(root, file), bytes: fs.statSync(file).size,
})).sort((left, right) => right.bytes - left.bytes);
const totalJavaScriptBytes = chunks.reduce((total, chunk) => total + chunk.bytes, 0);
const routeChunks = chunks.filter(({ file }) => !/(?:__common|__expo-metro-runtime|\/_layout-|\/index-)/.test(file));
const routePayloads = files.filter((file) => file.endsWith('.html')).map((file) => {
  const html = fs.readFileSync(file, 'utf8');
  const references = [...new Set(html.split('src="').slice(1).map((part) => part.split('"')[0]).filter((reference) => reference.endsWith('.js')))];
  const bytes = references.reduce((sum, reference) => {
    const target = path.join(root, reference.replace(/^\//, ''));
    return sum + (fs.existsSync(target) ? fs.statSync(target).size : 0);
  }, 0);
  return { route: path.relative(root, file), bytes };
}).sort((left, right) => right.bytes - left.bytes);

const sourceBytes = new Map();
for (const mapFile of files.filter((file) => file.endsWith('.js.map'))) {
  const sourceMap = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
  for (let index = 0; index < sourceMap.sources.length; index += 1) {
    const source = String(sourceMap.sources[index]);
    const bytes = Buffer.byteLength(sourceMap.sourcesContent?.[index] ?? '');
    sourceBytes.set(source, Math.max(sourceBytes.get(source) ?? 0, bytes));
  }
}
const contributorBytes = new Map();
for (const [source, bytes] of sourceBytes) {
  const nodeModule = source.match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/)?.[1];
  const workspace = source.match(/(?:^|\/)packages\/([^/]+)/)?.[1];
  const owner = nodeModule ?? (workspace ? `@precision-calm/${workspace}` : source.includes('/apps/reference/') ? '@precision-calm/reference' : 'other');
  contributorBytes.set(owner, (contributorBytes.get(owner) ?? 0) + bytes);
}
const majorSourceContributors = [...contributorBytes].map(([owner, bytes]) => ({ owner, bytes })).sort((left, right) => right.bytes - left.bytes).slice(0, 15);

const sample = Array.from({ length: 10_000 }, (_, index) => ({ id: index, label: `Record ${index % 317}`, value: (index * 7919) % 100_003 }));
const started = performance.now();
sample.filter((item) => item.label.includes('17')).sort((left, right) => left.value - right.value);
const largeDataDerivationMilliseconds = performance.now() - started;

const report = {
  totalJavaScriptBytes,
  largestChunk: chunks[0],
  heaviestInitialRoute: routePayloads[0],
  largestLazyRouteChunk: routeChunks[0],
  splitRouteChunkCount: routeChunks.length,
  largeDataDerivationMilliseconds: Number(largeDataDerivationMilliseconds.toFixed(2)),
  largestChunks: chunks.slice(0, 10),
  majorSourceContributors,
};

assert.ok(totalJavaScriptBytes <= budgets.totalJavaScriptBytes, `Total JavaScript ${totalJavaScriptBytes} exceeds ${budgets.totalJavaScriptBytes}.`);
assert.ok((chunks[0]?.bytes ?? 0) <= budgets.largestChunkBytes, `Largest chunk exceeds ${budgets.largestChunkBytes}.`);
assert.ok((routePayloads[0]?.bytes ?? 0) <= budgets.heaviestInitialRouteBytes, `Initial route payload exceeds ${budgets.heaviestInitialRouteBytes}.`);
assert.ok((routeChunks[0]?.bytes ?? 0) <= budgets.largestLazyRouteChunkBytes, `Lazy route chunk exceeds ${budgets.largestLazyRouteChunkBytes}.`);
assert.ok(routeChunks.length >= budgets.minimumSplitRouteChunks, `Expected at least ${budgets.minimumSplitRouteChunks} split route chunks.`);
assert.ok(largeDataDerivationMilliseconds <= budgets.largeDataDerivationMilliseconds, `Large-data derivation exceeds ${budgets.largeDataDerivationMilliseconds}ms.`);
console.log(JSON.stringify(report, null, 2));
console.log('Golden performance budgets passed.');
