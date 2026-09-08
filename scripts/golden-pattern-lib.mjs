import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_FIELDS = ['id', 'intent', 'owners', 'referenceRoute', 'serverState', 'forms', 'capabilities', 'scaffold'];

export function readGoldenPatterns(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'golden.patterns.json'), 'utf8'));
}

export function validateGoldenPatterns(root, registry = readGoldenPatterns(root)) {
  const errors = [];
  if (registry.schemaVersion !== 1) errors.push('golden.patterns.json must declare schemaVersion 1.');
  if (!Array.isArray(registry.patterns) || registry.patterns.length === 0) errors.push('golden.patterns.json must declare patterns.');
  const ids = new Set();
  for (const pattern of registry.patterns ?? []) {
    for (const field of REQUIRED_FIELDS) if (!(field in pattern)) errors.push(`${pattern.id ?? '<unknown>'}: missing ${field}.`);
    if (typeof pattern.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(pattern.id)) errors.push(`Invalid pattern id: ${String(pattern.id)}.`);
    if (ids.has(pattern.id)) errors.push(`Duplicate pattern id: ${pattern.id}.`);
    ids.add(pattern.id);
    if (!Array.isArray(pattern.owners) || pattern.owners.length === 0) errors.push(`${pattern.id}: owners must be a non-empty array.`);
    if (!['none', 'optional', 'recommended', 'required'].includes(pattern.serverState)) errors.push(`${pattern.id}: invalid serverState value.`);
    if (!['none', 'optional', 'required'].includes(pattern.forms)) errors.push(`${pattern.id}: invalid forms value.`);
    if (!Array.isArray(pattern.capabilities)) errors.push(`${pattern.id}: capabilities must be an array.`);
    if (typeof pattern.referenceRoute !== 'string' || !pattern.referenceRoute.startsWith('/')) errors.push(`${pattern.id}: referenceRoute must be an application path.`);
  }
  const rendered = renderGoldenPatterns(registry);
  const guide = path.join(root, registry.humanGuide ?? 'docs/GOLDEN_WORKFLOWS.md');
  if (!fs.existsSync(guide)) errors.push(`Golden workflow guide is missing: ${path.relative(root, guide)}.`);
  else if (fs.readFileSync(guide, 'utf8') !== rendered) errors.push('Golden workflow guide is stale. Run npm run golden:patterns:write.');
  return { errors, registry, rendered };
}

export function renderGoldenPatterns(registry) {
  const lines = [
    '<!-- Generated from golden.patterns.json. Do not edit by hand; run npm run golden:patterns:write. -->',
    '',
    '# Golden workflows',
    '',
    'Start a product screen by choosing one of these composable workflow archetypes. The registry is',
    'the source for the screen scaffolder; detailed page-layout behavior remains in [Golden page patterns](./GOLDEN_PATTERNS.md).',
    '',
    '## New screen flow',
    '',
    '1. Match the request to a pattern below.',
    '2. Run `npm run scaffold:screen -- --app apps/your-app --name route-name --pattern pattern-id` when it is scaffoldable.',
    '3. Replace only the explicit domain TODOs: models, service loader/mutation, copy, and unique visualization.',
    '4. Run `npm run check:golden-architecture` and focused feature tests.',
    '',
    'Scaffolded screens are one sanctioned route implementation; expert manual composition remains valid for unusual product workflows.',
    '',
    '## Taxonomy',
    '',
    '| Pattern | Use when | Shared owners | Server state | Form | Optional capabilities | Scaffold | Reference |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const pattern of registry.patterns) {
    lines.push(`| \`${pattern.id}\` | ${pattern.intent} | ${pattern.owners.map((owner) => `\`${owner}\``).join(', ')} | ${pattern.serverState} | ${pattern.forms} | ${pattern.capabilities.length ? pattern.capabilities.map((capability) => `\`${capability}\``).join(', ') : '—'} | ${pattern.scaffold ? 'yes' : 'manual composition'} | [${pattern.referenceRoute}](${pattern.referenceRoute}) |`);
  }
  lines.push('', '## Boundaries', '', '- Patterns own page hierarchy, responsive composition, shared state anatomy, action placement, and accessibility structure.', '- Product code owns domain types, query keys/loaders, mutations, copy, authorization choices, and unique visualizations.', '- A pattern never installs an optional capability; select it in the app capability profile before scaffolding a capability-aware workflow.', '- Do not create a new page architecture when a listed Golden pattern already matches the request.', '');
  return lines.join('\n');
}
