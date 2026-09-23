#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { validateTaskEffectBindings, validateTaskEffectDocument, summarizeTaskEffects } from '../packages/create-expo-base-app/lib/task-effects.mjs';

const args = parseArgs(process.argv.slice(2));
const target = path.resolve(args.path ?? process.cwd());
const contractPath = path.join(target, '.expo-base', 'task-effects.json');
let document;
try {
  document = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
} catch (error) {
  console.error(`Cannot read ${path.relative(target, contractPath)}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const issues = validateTaskEffectDocument(document);
const routeManifest = readJson(path.join(target, 'expo-base.routes.json'));
const routes = routeManifest?.schemaVersion === 1 && Array.isArray(routeManifest.authenticated) && Array.isArray(routeManifest.public)
  ? [...routeManifest.authenticated, ...routeManifest.public]
  : null;
const architecture = readJson(path.join(target, 'golden-architecture.config.json'));
const goldenRoot = architecture?.extends ? path.dirname(path.resolve(target, architecture.extends)) : target;
const patternRegistry = readJson(path.join(goldenRoot, 'golden.patterns.json'));
const scaffoldablePatterns = Array.isArray(patternRegistry?.patterns)
  ? patternRegistry.patterns.filter((pattern) => pattern.scaffold).map((pattern) => pattern.id)
  : null;
issues.push(...validateTaskEffectBindings(document, { routes, patterns: scaffoldablePatterns }));
if (issues.length) {
  console.error(`Generated task-effect contract is invalid:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
  process.exit(1);
}

const summary = summarizeTaskEffects(document);
console.log(`Generated task-effect contract passed: ${summary.total} actions (${summary.unresolved} unresolved, ${summary.resolved} resolved, ${summary.qualified} qualified).`);
if (summary.unresolved) console.log('Unresolved actions remain product-owned launch work; a passing foundation check is not a production-ready claim.');

function parseArgs(argv) {
  const result = { path: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--path') result.path = argv[++index];
    else if (argv[index] === '--help' || argv[index] === '-h') {
      console.log('check-task-effects [--path generated-app]');
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${argv[index]}`);
      process.exit(2);
    }
  }
  return result;
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return null; }
}
