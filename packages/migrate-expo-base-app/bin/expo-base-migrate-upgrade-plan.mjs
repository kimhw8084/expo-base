#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createUpgradePlan, renderUpgradePlanHuman } from '../lib/upgrade-plan.mjs';

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
  } else {
    const consumerRoot = path.resolve(args.path ?? process.cwd());
    const targetSourceRoot = path.resolve(args.sourceRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'));
    const plan = createUpgradePlan({ consumerRoot, targetSourceRoot });
    const report = args.json ? `${JSON.stringify(plan, null, 2)}\n` : renderUpgradePlanHuman(plan);
    if (args.output) {
      const outputPath = path.resolve(args.output);
      if (fs.existsSync(outputPath)) throw new Error(`Report output already exists; refusing to overwrite: ${args.output}`);
      fs.writeFileSync(outputPath, report, { flag: 'wx' });
    } else {
      process.stdout.write(report);
    }
  }
} catch (error) {
  process.stderr.write(`Upgrade plan unavailable: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
}

function parseArgs(argv) {
  const args = { json: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--help' || value === '-h') args.help = true;
    else if (value === '--json') args.json = true;
    else if (value === '--path') args.path = requiredValue(argv, ++index, value);
    else if (value === '--source-root') args.sourceRoot = requiredValue(argv, ++index, value);
    else if (value === '--output') args.output = requiredValue(argv, ++index, value);
    else throw new Error(`Unknown argument: ${value}`);
  }
  return args;
}

function requiredValue(argv, index, option) {
  const value = argv[index];
  if (!value || value.startsWith('--')) throw new Error(`${option} requires a value.`);
  return value;
}

function usage() {
  process.stdout.write('expo-base-migrate-upgrade-plan [--path consumer-repository] [--source-root expo-base-checkout] [--json] [--output report-path]\n');
  process.stdout.write('Advisory only. Reads exact source provenance and never applies or regenerates consumer files.\n');
}
