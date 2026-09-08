import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { readGoldenPatterns, renderGoldenPatterns } from './golden-pattern-lib.mjs';

const root = process.cwd();
const registry = readGoldenPatterns(root);
const output = renderGoldenPatterns(registry);
if (process.argv.includes('--write')) {
  const target = path.join(root, registry.humanGuide);
  fs.writeFileSync(target, output);
  console.log(`Generated ${path.relative(root, target)} from golden.patterns.json.`);
} else process.stdout.write(output);
