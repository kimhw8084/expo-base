import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const rules = {
  'session-security': [/@expo-base\/(?:tokens|platform|icons|primitives|layouts|components|forms|navigation|overlays|patterns|runtime|ui)/, /react-native/, /(?:^|[^@A-Za-z0-9_-])expo(?:\/|$)/i, /supabase/i, /firebase/i],
  auth: [/@expo-base\/(?:tokens|platform|icons|primitives|layouts|components|forms|navigation|overlays|patterns|runtime|ui)/, /react-native/, /(?:^|[^@A-Za-z0-9_-])expo(?:\/|$)/i, /supabase/i, /firebase/i],
  authorization: [/@expo-base\/(?:tokens|platform|icons|primitives|layouts|components|forms|navigation|overlays|patterns|runtime|ui)/, /react-native/, /(?:^|[^@A-Za-z0-9_-])expo(?:\/|$)/i, /supabase/i, /firebase/i],
  tokens: [/@expo-base\/(platform|icons|primitives|layouts|components)/, /react-native/, /(?:^|[^@A-Za-z0-9_-])expo(?:\/|$)/i, /supabase/i, /firebase/i],
  platform: [/@expo-base\/(icons|primitives|layouts|components)/, /react-native/, /(?:^|[^@A-Za-z0-9_-])expo(?:\/|$)/i, /supabase/i, /firebase/i],
  icons: [/@expo-base\/(platform|primitives|layouts|components)/, /supabase/i, /firebase/i],
  primitives: [/@expo-base\/(layouts|components)/, /supabase/i, /firebase/i],
  layouts: [/@expo-base\/components/, /supabase/i, /firebase/i],
  components: [/supabase/i, /firebase/i],
  forms: [/@expo-base\/(layouts|form-rhf)/, /supabase/i, /firebase/i],
  'form-rhf': [/@expo-base\/(tokens|platform|icons|primitives|layouts|components|navigation|navigation-router)/, /supabase/i, /firebase/i],
  navigation: [/@expo-base\/(forms|form-rhf|navigation-router)/, /supabase/i, /firebase/i],
  'navigation-router': [/@expo-base\/(tokens|icons|primitives|layouts|components|forms|form-rhf|overlays)/, /supabase/i, /firebase/i],
  overlays: [/@expo-base\/(layouts|forms|form-rhf|navigation|navigation-router|lists)/, /supabase/i, /firebase/i],
  lists: [/@expo-base\/(icons|primitives|layouts|components|forms|form-rhf|navigation|navigation-router|overlays|data-display)/, /supabase/i, /firebase/i],
  'data-display': [/@expo-base\/(layouts|forms|form-rhf|navigation|navigation-router|overlays|lists|visualization)/, /supabase/i, /firebase/i],
  visualization: [/@expo-base\/(icons|layouts|components|forms|form-rhf|navigation|navigation-router|overlays|lists|data-display|feedback)/, /supabase/i, /firebase/i],
  feedback: [/@expo-base\/(layouts|forms|form-rhf|navigation|navigation-router|overlays|lists|data-display|visualization|motion|accessibility)/, /supabase/i, /firebase/i],
  motion: [/@expo-base\/(platform|icons|primitives|layouts|components|forms|form-rhf|navigation|navigation-router|overlays|lists|data-display|visualization|feedback|accessibility)/, /supabase/i, /firebase/i],
  accessibility: [/@expo-base\/(icons|layouts|components|forms|form-rhf|navigation|navigation-router|overlays|lists|data-display|visualization|feedback|motion|patterns)/, /supabase/i, /firebase/i],
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
      if (source === '@expo-base/ui' && pkg !== 'ui') violations.push(`${path.relative(root, file)} -> ${source} (facade inversion)`);
      if (source === '@expo-base/runtime' && pkg !== 'runtime') violations.push(`${path.relative(root, file)} -> ${source} (runtime inversion)`);
    }
  });
}

if (violations.length) {
  console.error('Architecture boundary violations:\n' + violations.map((v) => `- ${v}`).join('\n'));
  process.exit(1);
}
console.log('Architecture boundary check passed.');
