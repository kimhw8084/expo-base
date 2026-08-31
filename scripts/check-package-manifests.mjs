import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const compatibility = JSON.parse(fs.readFileSync(path.join(root, 'precision.compatibility.json'), 'utf8'));
const versionKeys = new Set(Object.keys(compatibility).filter((key) => key !== 'schemaVersion'));
const violations = [];
const packageByName = new Map();

function json(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function sourceFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

for (const scope of ['packages', 'apps']) {
  const dir = path.join(root, scope);
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(dir, entry.name, 'package.json');
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = json(manifestPath);
    if (!manifest.name) violations.push(`${path.relative(root, manifestPath)}: missing name`);
    else if (packageByName.has(manifest.name)) violations.push(`duplicate package name ${manifest.name}`);
    else packageByName.set(manifest.name, { manifest, manifestPath, dir: path.dirname(manifestPath) });
  }
}

for (const [name, record] of packageByName) {
  const { manifest, manifestPath, dir } = record;
  const declared = { ...(manifest.dependencies ?? {}), ...(manifest.peerDependencies ?? {}), ...(manifest.devDependencies ?? {}) };
  for (const [dep, version] of Object.entries(declared)) {
    if (versionKeys.has(dep) && version !== compatibility[dep]) {
      violations.push(`${path.relative(root, manifestPath)}: ${dep}=${version} but compatibility manifest requires ${compatibility[dep]}`);
    }
    if (!dep.startsWith('@precision-calm/') && version === '*') {
      violations.push(`${path.relative(root, manifestPath)}: external dependency ${dep} must not use wildcard version`);
    }
  }
  const src = path.join(dir, 'src');
  const app = path.join(dir, 'app');
  for (const file of [...sourceFiles(src), ...sourceFiles(app)]) {
    const text = fs.readFileSync(file, 'utf8');
    const imports = [...text.matchAll(/(?:from\s+|import\s*\(?\s*)['"]([^'"]+)['"]/g)].map((match) => match[1]);
    for (const specifier of imports) {
      if (!specifier.startsWith('@precision-calm/')) continue;
      const depName = specifier.split('/').slice(0, 2).join('/');
      if (depName === name) continue;
      if (!declared[depName]) violations.push(`${path.relative(root, file)} imports undeclared workspace dependency ${depName}`);
    }
  }
}

const rootPkg = json(path.join(root, 'package.json'));
for (const [dep, version] of Object.entries(rootPkg.devDependencies ?? {})) {
  if (versionKeys.has(dep) && version !== compatibility[dep]) violations.push(`package.json: ${dep}=${version} but compatibility manifest requires ${compatibility[dep]}`);
}

if (violations.length) {
  console.error('Package manifest violations:\n' + violations.map((v) => `- ${v}`).join('\n'));
  process.exit(1);
}
console.log(`Package manifest check passed for ${packageByName.size} workspaces.`);
