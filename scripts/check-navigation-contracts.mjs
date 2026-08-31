import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const appsRoot = path.join(root, 'apps');
const problems = [];
const forbidden = [
  [/from\s+['"]@react-navigation\//, 'direct React Navigation import; Expo SDK 56+ app code should route through Expo Router/Precision Calm adapters'],
  [/from\s+['"]expo-router['"]/, 'feature-level Expo Router import; use @precision-calm/navigation-router'],
];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && entry.name !== '_layout.tsx') {
      const text = fs.readFileSync(full, 'utf8');
      for (const [pattern, label] of forbidden) if (pattern.test(text)) problems.push(`${path.relative(root, full)}: ${label}`);
    }
  }
}

if (fs.existsSync(appsRoot)) for (const app of fs.readdirSync(appsRoot, { withFileTypes: true })) if (app.isDirectory()) walk(path.join(appsRoot, app.name, 'app'));
if (problems.length) {
  console.error('Navigation contract violations:\n' + problems.map((x) => `- ${x}`).join('\n'));
  process.exit(1);
}
console.log('Navigation contract check passed.');
