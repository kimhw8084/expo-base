#!/usr/bin/env node
import process from 'node:process';
import { scaffoldScreen } from '../lib/screen-scaffold.mjs';

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.name || !args.pattern) {
  printUsage();
  process.exit(args.help ? 0 : 2);
}
try {
  const result = scaffoldScreen({
    root: process.cwd(),
    app: args.app ?? '.',
    name: args.name,
    patternId: args.pattern,
    access: args.public ? 'public' : 'protected',
    capabilities: args.capabilities,
  });
  console.log(`Scaffolded ${result.patternId} at ${result.routes.join(', ')} (${result.access}).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function parseArgs(argv) {
  const out = { app: undefined, name: undefined, pattern: undefined, public: false, help: false, capabilities: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (key === '--help' || key === '-h') out.help = true;
    else if (key === '--app') out.app = argv[++index];
    else if (key === '--name') out.name = argv[++index];
    else if (key === '--pattern') out.pattern = argv[++index];
    else if (key === '--public') out.public = true;
    else if (key === '--protected') out.public = false;
    else if (key === '--capabilities') out.capabilities = String(argv[++index] ?? '').split(',').map((value) => value.trim()).filter(Boolean);
    else throw new Error(`Unknown argument: ${key}`);
  }
  return out;
}

function printUsage() {
  console.log('scaffold-precision-screen --app apps/your-app --name customers --pattern data-workspace [--protected|--public] [--capabilities media,preferences]');
}
