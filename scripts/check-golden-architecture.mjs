import path from 'node:path';
import process from 'node:process';
import { loadGoldenArchitectureConfig, inspectGoldenArchitecture, formatGoldenArchitectureViolations } from './golden-architecture-lib.mjs';
import { validateGoldenCatalog } from './golden-catalog-lib.mjs';

const args = parseArgs(process.argv.slice(2));
const root = process.cwd();
const configPath = path.resolve(root, args.config ?? 'golden-architecture.config.json');
let config;
try {
  config = loadGoldenArchitectureConfig(configPath);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const catalogRoot = config.catalogPath ? path.dirname(config.catalogPath) : root;
const catalog = validateGoldenCatalog(catalogRoot);
const violations = inspectGoldenArchitecture({ projectRoot: config.configDir, config });
const failures = [
  ...catalog.errors.map((message) => `- Golden Catalog: ${message}`),
  ...violations.map((violation) => `- ${violation.message}`),
];
if (failures.length) {
  console.error('Golden architecture check failed:\n' + failures.join('\n'));
  process.exit(1);
}
console.log(`Golden architecture check passed (${catalog.catalog.items.length} catalog owners; ${violations.length} feature-route violations).`);

function parseArgs(argv) {
  const parsed = { config: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--config') parsed.config = argv[++index];
    else { console.error(`Unknown argument: ${argv[index]}`); process.exit(2); }
  }
  return parsed;
}
