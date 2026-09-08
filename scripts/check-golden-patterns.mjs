import process from 'node:process';
import { validateGoldenPatterns } from './golden-pattern-lib.mjs';

const { errors, registry } = validateGoldenPatterns(process.cwd());
if (errors.length) {
  console.error('Golden pattern registry validation failed:\n' + errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log(`Golden pattern registry validation passed (${registry.patterns.length} patterns).`);
