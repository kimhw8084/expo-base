import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_ITEM_FIELDS = [
  'id', 'category', 'canonicalName', 'package', 'apiPackage', 'apiSymbols', 'purpose', 'useWhen',
  'doNotUseWhen', 'supportedStates', 'responsiveBehavior', 'accessibility', 'platformNotes',
  'recipeReference', 'maturity', 'generatorAvailability',
];
const REQUIRED_DISCOVERY_INTENTS = new Set([
  'build a settings form',
  'build a searchable data screen',
  'show a loading/error/retry state',
  'open a destructive confirmation',
  'perform an async action',
  'add a responsive page header',
  'load server data',
  'refresh server data',
  'mutate server data',
  'invalidate cached data',
  'perform an optimistic update',
  'render stale data safely',
  'scaffold a Golden screen',
  'build a protected searchable customer workspace',
  'build an account settings workflow',
  'build an import workflow',
  'build an offline-aware workspace',
  'open a command launcher',
  'enter currency',
  'choose from a searchable list',
  'collect a verification code',
  'add repeatable form items',
  'paginate or scale a dataset',
  'build a filter-heavy browse screen',
  'show media with loading or error',
  'show a trend chart',
  'show explanatory hover or focus help',
  'show a copyable identifier',
  'show code or configuration text',
  'show a semantic status',
  'show user avatars',
  'show event history',
  'collect a date or time',
  'show a compact trend',
  'show stacked series',
]);

export function readGoldenCatalog(root) {
  const file = path.join(root, 'golden.catalog.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function validateGoldenCatalog(root, catalog = readGoldenCatalog(root)) {
  const errors = [];
  if (catalog.schemaVersion !== 1) errors.push('golden.catalog.json must declare schemaVersion 1.');
  if (!Array.isArray(catalog.ownership) || catalog.ownership.length === 0) errors.push('golden.catalog.json must declare ownership metadata.');
  if (!Array.isArray(catalog.items) || catalog.items.length === 0) errors.push('golden.catalog.json must declare catalog items.');
  if (!Array.isArray(catalog.discoveryChallenges)) errors.push('golden.catalog.json must declare discoveryChallenges.');

  const snapshotPath = path.join(root, catalog.apiSnapshot ?? 'precision.api.json');
  let api = null;
  try { api = JSON.parse(fs.readFileSync(snapshotPath, 'utf8')); } catch { errors.push(`Public API snapshot not readable: ${path.relative(root, snapshotPath)}.`); }
  const packageNames = workspacePackageNames(root);
  const ids = new Set();
  for (const item of catalog.items ?? []) {
    for (const field of REQUIRED_ITEM_FIELDS) if (!(field in item)) errors.push(`${item.id ?? '<unknown>'}: missing ${field}.`);
    if (!item.id || typeof item.id !== 'string') continue;
    if (ids.has(item.id)) errors.push(`Duplicate catalog item id: ${item.id}.`);
    ids.add(item.id);
    if (!Array.isArray(item.apiSymbols) || !Array.isArray(item.supportedStates)) errors.push(`${item.id}: apiSymbols and supportedStates must be arrays.`);
    if (typeof item.recipeReference === 'string' && !fs.existsSync(path.join(root, item.recipeReference))) errors.push(`${item.id}: recipeReference does not exist: ${item.recipeReference}.`);
    if (item.apiPackage) {
      const symbols = api?.packages?.[item.apiPackage];
      if (!Array.isArray(symbols)) errors.push(`${item.id}: apiPackage ${item.apiPackage} is absent from precision.api.json.`);
      else for (const symbol of item.apiSymbols ?? []) if (!symbols.includes(symbol)) errors.push(`${item.id}: ${symbol} is absent from public API package ${item.apiPackage}.`);
      if (item.package !== '@precision-calm/ui') errors.push(`${item.id}: items with apiPackage must import from @precision-calm/ui.`);
    } else if (typeof item.package === 'string' && item.package.startsWith('@precision-calm/') && !packageNames.has(item.package)) {
      errors.push(`${item.id}: package ${item.package} does not exist in workspace manifests.`);
    }
  }

  const ownershipIds = new Set();
  for (const owner of catalog.ownership ?? []) {
    if (!owner?.id || !owner.concern || !owner.package || !owner.classification || !owner.featureRouteAccess || !owner.docs) errors.push(`Ownership metadata is incomplete for ${owner?.id ?? '<unknown>'}.`);
    if (ownershipIds.has(owner?.id)) errors.push(`Duplicate ownership id: ${owner.id}.`);
    ownershipIds.add(owner?.id);
    if (typeof owner?.docs === 'string' && !fs.existsSync(path.join(root, owner.docs))) errors.push(`${owner.id}: ownership docs do not exist: ${owner.docs}.`);
  }

  const challenges = new Set();
  for (const challenge of catalog.discoveryChallenges ?? []) {
    if (!challenge?.intent || !Array.isArray(challenge.requiredItems) || challenge.requiredItems.length === 0) {
      errors.push(`Discovery challenge is incomplete: ${challenge?.intent ?? '<unknown>'}.`);
      continue;
    }
    challenges.add(challenge.intent);
    for (const itemId of challenge.requiredItems) if (!ids.has(itemId)) errors.push(`Discovery challenge "${challenge.intent}" references missing item ${itemId}.`);
  }
  for (const intent of REQUIRED_DISCOVERY_INTENTS) if (!challenges.has(intent)) errors.push(`Missing required Codex discovery challenge: "${intent}".`);

  const rendered = renderGoldenCatalog(catalog);
  const guidePath = path.join(root, catalog.humanGuide ?? 'docs/GOLDEN_CATALOG.md');
  if (!fs.existsSync(guidePath)) errors.push(`Human Golden Catalog is missing: ${path.relative(root, guidePath)}.`);
  else if (fs.readFileSync(guidePath, 'utf8') !== rendered) errors.push(`Human Golden Catalog is stale. Run npm run golden:catalog:write.`);
  return { errors, catalog, rendered };
}

export function renderGoldenCatalog(catalog) {
  const items = new Map(catalog.items.map((item) => [item.id, item]));
  const lines = [
    '<!-- Generated from golden.catalog.json. Do not edit by hand; run npm run golden:catalog:write. -->',
    '',
    '# Golden Catalog',
    '',
    'Use this as the intent-first index for current Expo Base owners. It documents only usable',
    'capabilities. The authoritative machine-readable source is [`golden.catalog.json`](../golden.catalog.json);',
    'detailed API behavior remains in the linked package documents.',
    '',
    '## Start by intent',
    '',
    '| I need to… | Start with | Supporting owners |',
    '| --- | --- | --- |',
  ];
  for (const challenge of catalog.discoveryChallenges) {
    const challengeItems = challenge.requiredItems.map((id) => items.get(id)).filter(Boolean);
    const first = challengeItems[0];
    lines.push(`| ${challenge.intent} | ${formatItem(first)} | ${challengeItems.slice(1).map(formatItem).join('; ') || '—'} |`);
  }
  lines.push('', '## Available current owners', '');
  const categories = [...new Set(catalog.items.map((item) => item.category))];
  for (const category of categories) {
    lines.push(`### ${titleCase(category)}`, '', '| Owner | Use when | Do not use when | Package |', '| --- | --- | --- | --- |');
    for (const item of catalog.items.filter((candidate) => candidate.category === category)) {
      lines.push(`| ${item.canonicalName} | ${item.useWhen} | ${item.doNotUseWhen} | \`${item.package}\` |`);
    }
    lines.push('');
  }
  lines.push('## Current limits', '');
  for (const item of catalog.items.filter((item) => item.maturity !== 'stable')) {
    lines.push(`- **${item.canonicalName}** — ${item.accessibility} ${item.platformNotes} (${item.maturity}).`);
  }
  lines.push('', 'For planned capabilities, consult the [Golden Template audit](./GOLDEN_TEMPLATE_AUDIT.md);', 'planned items are not sanctioned APIs.', '');
  return lines.join('\n');
}

function workspacePackageNames(root) {
  const names = new Set();
  for (const directory of ['packages', 'apps']) {
    const base = path.join(root, directory);
    if (!fs.existsSync(base)) continue;
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      try {
        const manifest = JSON.parse(fs.readFileSync(path.join(base, entry.name, 'package.json'), 'utf8'));
        if (typeof manifest.name === 'string') names.add(manifest.name);
      } catch { /* A non-package directory is irrelevant to catalog package validation. */ }
    }
  }
  return names;
}

function formatItem(item) {
  return item ? `\`${item.canonicalName}\`` : '—';
}

function titleCase(value) {
  const lowerCaseWords = new Set(['a', 'an', 'and', 'or', 'the', 'to']);
  return value.split('-').map((part, index) => index > 0 && lowerCaseWords.has(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
