import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const rules = {
  'session-security': [/@precision-calm\/(?:tokens|platform|icons|primitives|layouts|components|forms|navigation|overlays|patterns|runtime|ui)/, /react-native/, /expo/, /supabase/i, /firebase/i],
  auth: [/@precision-calm\/(?:tokens|platform|icons|primitives|layouts|components|forms|navigation|overlays|patterns|runtime|ui)/, /react-native/, /expo/, /supabase/i, /firebase/i],
  authorization: [/@precision-calm\/(?:tokens|platform|icons|primitives|layouts|components|forms|navigation|overlays|patterns|runtime|ui)/, /react-native/, /expo/, /supabase/i, /firebase/i],
  tokens: [/@precision-calm\/(platform|icons|primitives|layouts|components)/, /react-native/, /expo/, /supabase/i, /firebase/i],
  platform: [/@precision-calm\/(icons|primitives|layouts|components)/, /react-native/, /expo/, /supabase/i, /firebase/i],
  icons: [/@precision-calm\/(platform|primitives|layouts|components)/, /supabase/i, /firebase/i],
  primitives: [/@precision-calm\/(layouts|components)/, /supabase/i, /firebase/i],
  layouts: [/@precision-calm\/components/, /supabase/i, /firebase/i],
  components: [/supabase/i, /firebase/i],
  forms: [/@precision-calm\/(layouts|form-rhf)/, /supabase/i, /firebase/i],
  'form-rhf': [/@precision-calm\/(tokens|platform|icons|primitives|layouts|components|navigation|navigation-router)/, /supabase/i, /firebase/i],
  navigation: [/@precision-calm\/(forms|form-rhf|navigation-router)/, /supabase/i, /firebase/i],
  'navigation-router': [/@precision-calm\/(tokens|icons|primitives|layouts|components|forms|form-rhf|overlays)/, /supabase/i, /firebase/i],
  overlays: [/@precision-calm\/(layouts|forms|form-rhf|navigation|navigation-router|lists)/, /supabase/i, /firebase/i],
  lists: [/@precision-calm\/(icons|primitives|layouts|components|forms|form-rhf|navigation|navigation-router|overlays|data-display)/, /supabase/i, /firebase/i],
  'data-display': [/@precision-calm\/(layouts|forms|form-rhf|navigation|navigation-router|overlays|lists|visualization)/, /supabase/i, /firebase/i],
  visualization: [/@precision-calm\/(icons|layouts|components|forms|form-rhf|navigation|navigation-router|overlays|lists|data-display|feedback)/, /supabase/i, /firebase/i],
  feedback: [/@precision-calm\/(layouts|forms|form-rhf|navigation|navigation-router|overlays|lists|data-display|visualization|motion|accessibility)/, /supabase/i, /firebase/i],
  motion: [/@precision-calm\/(platform|icons|primitives|layouts|components|forms|form-rhf|navigation|navigation-router|overlays|lists|data-display|visualization|feedback|accessibility)/, /supabase/i, /firebase/i],
  accessibility: [/@precision-calm\/(icons|layouts|components|forms|form-rhf|navigation|navigation-router|overlays|lists|data-display|visualization|feedback|motion|patterns)/, /supabase/i, /firebase/i],
  patterns: [/supabase/i, /firebase/i]
};

const extensions = new Set(['.ts', '.tsx', '.js', '.mjs']);
const violations = [];

function walk(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, visit);
    else if (extensions.has(path.extname(entry.name))) visit(full);
  }
}

for (const [pkg, denied] of Object.entries(rules)) {
  const src = path.join(root, 'packages', pkg, 'src');
  if (!fs.existsSync(src)) continue;
  walk(src, (file) => {
    const text = fs.readFileSync(file, 'utf8');
    const imports = [...text.matchAll(/(?:from\s+|import\s*\(?\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
    for (const source of imports) {
      for (const pattern of denied) {
        if (pattern.test(source)) violations.push(`${path.relative(root, file)} -> ${source}`);
      }
    }
  });
}


// The public facade/runtime sit above implementation packages. Internal packages
// must never import them or the dependency graph would invert/cycle.
for (const pkg of fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)) {
  const src = path.join(root, 'packages', pkg, 'src');
  if (!fs.existsSync(src)) continue;
  walk(src, (file) => {
    const text = fs.readFileSync(file, 'utf8');
    const imports = [...text.matchAll(/(?:from\s+|import\s*\(?\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
    for (const source of imports) {
      if (source === '@precision-calm/ui' && pkg !== 'ui') violations.push(`${path.relative(root, file)} -> ${source} (facade inversion)`);
      if (source === '@precision-calm/runtime' && pkg !== 'runtime') violations.push(`${path.relative(root, file)} -> ${source} (runtime inversion)`);
    }
  });
}

if (violations.length) {
  console.error('Architecture boundary violations:\n' + violations.map((v) => `- ${v}`).join('\n'));
  process.exit(1);
}
console.log('Architecture boundary check passed.');
