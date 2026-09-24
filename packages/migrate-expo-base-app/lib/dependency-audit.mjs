import fs from 'node:fs';
import path from 'node:path';

export function auditDependencies(root, compat) {
  const file = path.join(root, 'package.json');
  if (!fs.existsSync(file)) return [];
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const out = [];
  for (const [name, expected] of Object.entries(compat)) {
    if (name === 'schemaVersion' || deps[name] === undefined) continue;
    if (deps[name] !== expected) out.push({ id: 'DEPS-001', severity: 'high', wave: 'foundation', title: 'Compatibility version drift', file: 'package.json', line: 1, sample: `${name}: ${deps[name]}`, recommendation: `Align ${name} to Expo Base compatibility version ${expected}.` });
  }
  return out;
}

export function planDependencyAlignment(root, compatibility) {
  const file = path.join(root, 'package.json');
  if (!fs.existsSync(file)) return [];
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const dependencies = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const findings = new Set(auditDependencies(root, compatibility).map((finding) => finding.sample.slice(0, finding.sample.indexOf(': '))));
  return Object.entries(compatibility)
    .filter(([name]) => name !== 'schemaVersion' && dependencies[name] !== undefined)
    .map(([name, targetCompatibilityValue]) => ({
      name,
      currentValue: dependencies[name],
      targetCompatibilityValue,
      recommendedAction: findings.has(name) ? 'align-to-target-compatibility' : 'already-aligned',
    }))
    .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
}
