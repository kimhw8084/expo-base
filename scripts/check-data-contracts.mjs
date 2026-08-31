import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const appsRoot = path.join(root, 'apps');
const problems = [];
const forbidden = [
  [/from\s+['"](?:@tanstack\/react-table|ag-grid-react|react-data-grid|@mui\/x-data-grid)['"]/, 'direct table/grid library; use @precision-calm/data-display or add a reviewed adapter'],
  [/\bnew\s+Intl\.NumberFormat\s*\(/, 'direct numeric formatter; use @precision-calm/platform formatting utilities'],
  [/\bIntl\.NumberFormat\s*\(/, 'direct numeric formatter; use @precision-calm/platform formatting utilities'],
];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      for (const [pattern, label] of forbidden) if (pattern.test(text)) problems.push(`${path.relative(root, full)}: ${label}`);
    }
  }
}

if (fs.existsSync(appsRoot)) {
  for (const app of fs.readdirSync(appsRoot, { withFileTypes: true })) {
    if (app.isDirectory()) walk(path.join(appsRoot, app.name, 'app'));
  }
}
if (problems.length) {
  console.error('Data contract violations:\n' + problems.map((x) => `- ${x}`).join('\n'));
  process.exit(1);
}
console.log('Data contract check passed.');
