import process from 'node:process';
import { validateGoldenCatalog } from './golden-catalog-lib.mjs';

const root = process.cwd();
const { errors, catalog } = validateGoldenCatalog(root);
if (errors.length) {
  console.error('Golden Catalog validation failed:\n' + errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}
console.log(`Golden Catalog validation passed (${catalog.items.length} current owners, ${catalog.ownership.length} ownership records, ${catalog.discoveryChallenges.length} discovery challenges).`);
