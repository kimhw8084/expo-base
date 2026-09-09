import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const runner = readFileSync(join(root, 'scripts', 'run-ios-native-certification.mjs'), 'utf8');
const generator = readFileSync(join(root, 'scripts', 'generate-ios-ui-test-project.mjs'), 'utf8');
const failures = [];
if (!runner.includes("const requiresFreshCng = mode === 'release' && !onlyTesting;")) failures.push('Release freshness must be distinct from focused testing.');
if (!runner.includes("'expo', 'prebuild', ...(requiresFreshCng ? ['--clean'] : [])")) failures.push('Full Release must regenerate CNG output with expo prebuild --clean.');
if (!runner.includes('if (requiresFreshCng || !existsSync(workspace))')) failures.push('CNG generation must run for every full Release lane.');
if (!runner.includes('if (!existsSync(workspace)) throw new Error')) failures.push('Release must fail when CNG does not produce the workspace.');
if (!runner.includes("EXPO_USE_PRECOMPILED_MODULES: '0'") || !runner.includes("RCT_USE_PREBUILT_RNCORE: '0'")) failures.push('Full Release must use source-backed native module builds when prebuilt artifacts are unavailable.');
if (runner.includes('golden:visual:update') || runner.includes('update-snapshots')) failures.push('Native certification must not contain an automatic baseline update path.');
if (generator.indexOf('mkdirSync(generatedTestDir') > generator.indexOf('copyFileSync(join(sourceDir')) failures.push('Generated UI-test target directory must exist before source copying on a fresh CNG project.');
if (failures.length) {
  console.error('CNG freshness contract failed:\n' + failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}
console.log('CNG freshness contract passed: full Release regenerates ignored native output before target injection.');
