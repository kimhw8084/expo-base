import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { readGoldenCatalog, renderGoldenCatalog } from './golden-catalog-lib.mjs';

const write = process.argv.includes('--write');
const root = process.cwd();
const catalog = readGoldenCatalog(root);
const output = renderGoldenCatalog(catalog);
const target = path.join(root, catalog.humanGuide);
if (write) {
  fs.writeFileSync(target, output);
  console.log(`Generated ${path.relative(root, target)} from golden.catalog.json.`);
} else {
  process.stdout.write(output);
}
