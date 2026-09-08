import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const records = new Map();
for (const scope of ['packages', 'apps']) {
  const dir = path.join(root, scope);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(dir, entry.name, 'package.json');
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    records.set(manifest.name, { dir: path.dirname(manifestPath), manifest });
  }
}
const workspaceNames = new Set(records.keys());
const graph = Object.fromEntries([...records].sort(([a], [b]) => a.localeCompare(b)).map(([name, record]) => {
  const declared = { ...(record.manifest.dependencies ?? {}), ...(record.manifest.peerDependencies ?? {}) };
  return [name, Object.keys(declared).filter((dep) => workspaceNames.has(dep)).sort()];
}));
const visiting = new Set();
const visited = new Set();
const cycles = [];
function visit(name, trail = []) {
  if (visiting.has(name)) { cycles.push([...trail, name].join(' -> ')); return; }
  if (visited.has(name)) return;
  visiting.add(name);
  for (const dep of graph[name] ?? []) visit(dep, [...trail, name]);
  visiting.delete(name); visited.add(name);
}
for (const name of Object.keys(graph)) visit(name);
assert.equal(cycles.length, 0, `Workspace dependency cycles:\n${cycles.join('\n')}`);
const violations = [];
const edges = (from, forbidden, message) => { for (const target of graph[from] ?? []) if (forbidden.has(target)) violations.push(`${from} -> ${target}: ${message}`); };
const visual = new Set(['@precision-calm/accessibility', '@precision-calm/components', '@precision-calm/data-display', '@precision-calm/feedback', '@precision-calm/forms', '@precision-calm/i18n', '@precision-calm/icons', '@precision-calm/layouts', '@precision-calm/lists', '@precision-calm/media-presentation', '@precision-calm/motion', '@precision-calm/navigation', '@precision-calm/overlays', '@precision-calm/patterns', '@precision-calm/primitives', '@precision-calm/visualization', '@precision-calm/visualization-advanced']);
edges('@precision-calm/tokens', new Set([...workspaceNames].filter((name) => name !== '@precision-calm/tokens')), 'tokens are the dependency root');
edges('@precision-calm/platform', new Set([...visual, '@precision-calm/ui']), 'platform math/contracts must not depend on presentation');
edges('@precision-calm/visualization', new Set(['@precision-calm/visualization-advanced', '@precision-calm/ui']), 'core visualization must not depend on advanced/facade layers');
edges('@precision-calm/capabilities', new Set(['@precision-calm/notifications', '@precision-calm/media', '@precision-calm/device', '@precision-calm/local-auth', '@precision-calm/updates']), 'capability facade must not eagerly depend on optional implementations');
edges('@precision-calm/ui', new Set(['@precision-calm/ui']), 'facade self-cycle');
edges('@precision-calm/testing', new Set(['@precision-calm/reference']), 'testing utilities must not depend on the reference app');
if (violations.length) throw new Error(`Dependency graph violations:\n${violations.map((entry) => `- ${entry}`).join('\n')}`);
fs.writeFileSync(path.join(root, 'docs/ultimate-dependency-graph.json'), JSON.stringify({ schemaVersion: 1, policy: 'Production workspace dependencies are acyclic; kernel math remains below presentation; advanced visualization is opt-in.', graph }, null, 2) + '\n');
console.log(`Dependency graph passed (${Object.keys(graph).length} workspaces / ${Object.values(graph).reduce((sum, deps) => sum + deps.length, 0)} internal edges / 0 cycles / 0 violations).`);
