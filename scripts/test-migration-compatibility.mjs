import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const uiCompat = fs.readFileSync(path.join(root, 'packages/ui/src/legacy-compat.ts'), 'utf8');
const runtimeCompat = fs.readFileSync(path.join(root, 'packages/runtime/src/legacy-compat.ts'), 'utf8');
const generator = fs.readFileSync(path.join(root, 'packages/create-expo-base-app/bin/create-expo-base-app.mjs'), 'utf8');

for (const name of [
  'PrecisionWebAccessibilityStyles',
  'PrecisionCommand',
  'PrecisionDensity',
  'PrecisionI18nProvider',
  'comparePrecisionLocale',
  'detectPrecisionLocale',
  'detectPrecisionTimeZone',
  'formatPrecisionCurrency',
  'formatPrecisionDate',
  'formatPrecisionEditableNumber',
  'formatPrecisionMessage',
  'formatPrecisionNumber',
  'formatPrecisionPercent',
  'isPrecisionPseudoLocale',
  'normalizePrecisionLocale',
  'parsePrecisionDecimalInput',
  'precisionLocaleDirection',
  'precisionNumberSymbols',
  'resolvePrecisionMessage',
  'usePrecisionDirection',
  'usePrecisionI18n',
  'PrecisionDirection',
  'PrecisionDirectionPreference',
  'PrecisionI18nOptions',
  'PrecisionI18nValue',
  'PrecisionMessage',
  'PrecisionMessageCatalog',
  'PrecisionMessageValues',
  'PrecisionPluralMessage',
  'usePrecisionMotion',
  'PrecisionMotionValue',
  'usePrecisionReducedMotion',
  'PrecisionSection',
]) {
  assert.match(uiCompat, new RegExp(`\\b${name}\\b`), name);
}
assert.match(runtimeCompat, /PrecisionRuntimeProvider/);
assert.match(runtimeCompat, /PrecisionRuntimeProviderProps/);
assert.match(runtimeCompat, /@deprecated/);
assert.doesNotMatch(generator, /Precision|precision-calm|@precision-calm/);
console.log('Migration compatibility aliases are isolated and generator-free.');
