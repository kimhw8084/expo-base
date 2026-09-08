import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const packagesRoot = path.join(root, 'packages');

const nonZeroNumber = String.raw`-?(?:[1-9]\d*(?:\.\d+)?|0?\.\d*[1-9]\d*)`;
const sharedForbidden = [
  [/style\s*=\s*\{\s*\{/, 'inline style objects'],
  [new RegExp(String.raw`\b(?:margin|padding)(?:Top|Right|Bottom|Left|Horizontal|Vertical)?\s*:\s*${nonZeroNumber}\b`), 'literal spacing'],
  [new RegExp(String.raw`\b(?:gap|rowGap|columnGap|borderRadius)\s*:\s*${nonZeroNumber}\b`), 'literal gap/radius'],
  [new RegExp(String.raw`\b(?:width|height|minWidth|minHeight|maxWidth|maxHeight|top|right|bottom|left)\s*:\s*${nonZeroNumber}\b`), 'literal geometry'],
  [new RegExp(String.raw`\bborder(?:Top|Right|Bottom|Left)?Width\s*:\s*${nonZeroNumber}\b`), 'literal stroke width'],
  [new RegExp(String.raw`\b(?:fontSize|lineHeight|letterSpacing)\s*:\s*${nonZeroNumber}\b`), 'literal typography geometry'],
  [/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/, 'literal hex colors'],
  [/from\s+['"]lucide-react-native['"]/, 'direct Lucide import; use @precision-calm/icons'],
  [/from\s+['"]react-native-svg['"]/, 'direct SVG import; use the icon/visualization system'],
];

const sharedStylePackages = [
  'components',
  'data-display',
  'feedback',
  'forms',
  'layouts',
  'lists',
  'navigation',
  'overlays',
  'patterns',
  'primitives',
  'ui',
];

const problems = [];

function walk(dir, rules) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, rules);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      for (const [pattern, label] of rules) {
        if (pattern.test(text)) problems.push(`${path.relative(root, full)}: ${label}`);
      }
    }
  }
}

for (const packageName of sharedStylePackages) {
  walk(path.join(packagesRoot, packageName, 'src'), sharedForbidden);
}

if (problems.length) {
  console.error('Style ownership contract violations:\n' + problems.map((p) => `- ${p}`).join('\n'));
  process.exit(1);
}
console.log(`Style ownership contract check passed (${sharedStylePackages.length} shared UI packages; feature routes use check:golden-architecture).`);
