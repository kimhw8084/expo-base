import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const outDir = path.join(root, '.tmp-i18n-kernel');
fs.rmSync(outDir, { recursive: true, force: true });

const compile = spawnSync('tsc', ['-p', 'packages/i18n/tsconfig.json', '--noEmit', 'false', '--outDir', outDir], { cwd: root, encoding: 'utf8' });
if (compile.status !== 0) {
  process.stderr.write(compile.stdout ?? '');
  process.stderr.write(compile.stderr ?? '');
  process.exit(compile.status ?? 1);
}

try {
  const i18n = await import(pathToFileURL(path.join(outDir, 'locale.js')).href);
  assert.equal(i18n.normalizeExpoBaseLocale('pt_BR'), 'pt-BR');
  assert.equal(i18n.normalizeExpoBaseLocale('not a locale', 'fr-FR'), 'fr-FR');
  assert.equal(i18n.expoBaseLocaleDirection('ar-EG'), 'rtl');
  assert.equal(i18n.expoBaseLocaleDirection('en-XB'), 'rtl');
  assert.equal(i18n.expoBaseLocaleDirection('en-US'), 'ltr');

  const messages = {
    'en-US': {
      greeting: 'Hello, {name}',
      results: { one: '{count} result', other: '{count} results' },
    },
  };
  assert.equal(i18n.formatExpoBaseMessage(i18n.resolveExpoBaseMessage(messages, 'greeting', 'fr-CA', 'en-US'), 'en-US', { name: 'Ada' }), 'Hello, Ada');
  assert.equal(i18n.formatExpoBaseMessage(messages['en-US'].results, 'en-US', { count: 1 }), '1 result');
  assert.equal(i18n.formatExpoBaseMessage(messages['en-US'].results, 'en-US', { count: 2 }), '2 results');
  assert.match(i18n.pseudoLocalize('Save changes'), /^［/);
  assert.match(i18n.pseudoLocalize('Save changes'), /Saavee/);
  assert.match(i18n.pseudoLocalize('Save changes', 'rtl'), /^\u202e/);
  assert.equal(i18n.formatExpoBaseNumber(Number.NaN, 'en-US'), '—');
  assert.ok(i18n.formatExpoBaseCurrency(1234.5, 'USD', 'en-US').includes('$'));
  assert.equal(i18n.formatExpoBaseDate('2024-01-01T00:00:00.000Z', 'en-US', { timeZone: 'UTC' }), '1/1/2024');
  assert.ok(i18n.compareExpoBaseLocale('item 2', 'item 10', 'en-US') < 0);
  assert.equal(i18n.parseExpoBaseDecimalInput('1.234,50', 'de-DE'), 1234.5);
  assert.equal(i18n.parseExpoBaseDecimalInput('١٬٢٣٤٫٥', 'ar-EG'), 1234.5);
  assert.equal(i18n.parseExpoBaseDecimalInput('12,', 'de-DE'), null);
  assert.equal(i18n.parseExpoBaseDecimalInput('-', 'en-US'), null);
  assert.match(i18n.formatExpoBaseEditableNumber(1234.5, 'de-DE', { minimumFractionDigits: 2 }), /1\.234,50/);
  assert.deepEqual(i18n.expoBaseNumberSymbols('en-US'), { decimal: '.', group: ',', minus: '-' });
  console.log('I18n kernel tests passed (normalization, fallback, pluralization, pseudo locale, locale entry, direction, formatting, and collation).');
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
}
