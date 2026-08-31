import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const visualPackages = [
  'accessibility','components','data-display','feedback','forms','icons','layouts','lists','motion','navigation','overlays','patterns','primitives','visualization'
];
const forbiddenFeatureImports = new Set(visualPackages.map((name) => `@precision-calm/${name}`));
const violations = [];

function walk(dir, visit) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, visit);
    else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) visit(full);
  }
}

const appsDir = path.join(root, 'apps');
if (fs.existsSync(appsDir)) {
  for (const app of fs.readdirSync(appsDir, { withFileTypes: true })) {
    if (!app.isDirectory()) continue;
    walk(path.join(appsDir, app.name, 'app'), (file) => {
      const text = fs.readFileSync(file, 'utf8');
      const imports = [...text.matchAll(/(?:from\s+|import\s*\(?\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
      for (const source of imports) {
        if (forbiddenFeatureImports.has(source)) violations.push(`${path.relative(root, file)} bypasses @precision-calm/ui via ${source}`);
        if (/^@precision-calm\/[^/]+\/src(?:\/|$)/.test(source)) violations.push(`${path.relative(root, file)} uses private deep import ${source}`);
      }
    });
  }
}

const uiIndex = fs.readFileSync(path.join(root, 'packages/ui/src/index.ts'), 'utf8');
for (const pkg of visualPackages) {
  if (!uiIndex.includes(`'@precision-calm/${pkg}'`)) violations.push(`@precision-calm/ui does not expose @precision-calm/${pkg}`);
}

// Detect public name collisions before export-star aggregation can become ambiguous.
const exported = new Map();
for (const pkg of visualPackages) {
  walk(path.join(root, 'packages', pkg, 'src'), (file) => {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/export\s+(?:declare\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g)) {
      const name = match[1];
      const owners = exported.get(name) ?? new Set();
      owners.add(pkg);
      exported.set(name, owners);
    }
  });
}
for (const [name, owners] of exported) {
  if (owners.size > 1) violations.push(`public export collision ${name}: ${[...owners].join(', ')}`);
}

if (violations.length) {
  console.error('Public API violations:\n' + violations.map((v) => `- ${v}`).join('\n'));
  process.exit(1);
}
console.log(`Public API check passed: ${exported.size} unique UI symbols across ${visualPackages.length} packages.`);
