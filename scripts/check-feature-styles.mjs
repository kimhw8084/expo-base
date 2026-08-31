import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const appsRoot = path.join(root, 'apps');
const forbidden = [
  [/style\s*=\s*\{\s*\{/, 'inline style objects'],
  [/\bzIndex\s*:/, 'manual z-index'],
  [/\bposition\s*:\s*['"]absolute['"]/, 'absolute page positioning'],
  [/\bborderRadius\s*:\s*\d+/, 'literal radius'],
  [/\b(?:margin|padding)(?:Top|Right|Bottom|Left|Horizontal|Vertical)?\s*:\s*\d+/, 'literal spacing'],
  [/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/, 'literal hex colors'],
  [/from\s+['"]lucide-react-native['"]/, 'direct Lucide import; use @precision-calm/icons'],
  [/from\s+['"]react-native-svg['"]/, 'direct SVG import; use the icon/visualization system'],
];
const problems = [];

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
  console.error('Feature styling contract violations:\n' + problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
console.log('Feature styling contract check passed.');
