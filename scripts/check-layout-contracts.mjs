import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const appsRoot = path.join(root, 'apps');
const problems = [];
const forbidden = [
  [/\buseWindowDimensions\b/, 'feature-level viewport measurement'],
  [/\bDimensions\.(?:get|addEventListener)\b/, 'feature-level Dimensions access'],
  [/\bPlatform\.OS\b/, 'feature-level platform branching'],
  [/<ScrollView\b/, 'raw ScrollView; use ScrollScreen or an approved internal scroller'],
  [/<FlatList\b/, 'raw FlatList; use the list infrastructure'],
  [/<SectionList\b/, 'raw SectionList; use the list infrastructure'],
  [/<VirtualizedList\b/, 'raw VirtualizedList; use the list infrastructure'],
  [/<VirtualView\b/, 'experimental VirtualView is not approved for production template use'],
  [/\bcontentContainerStyle\s*=/, 'feature-owned scroll geometry'],
];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      for (const [pattern, label] of forbidden) {
        if (pattern.test(text)) problems.push(`${path.relative(root, full)}: ${label}`);
      }
    }
  }
}

if (fs.existsSync(appsRoot)) {
  for (const app of fs.readdirSync(appsRoot, { withFileTypes: true })) {
    if (app.isDirectory()) walk(path.join(appsRoot, app.name, 'app'));
  }
}

if (problems.length) {
  console.error('Layout contract violations:\n' + problems.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log('Layout contract check passed.');
