import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const parse = (file) => ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

const serverManifest = json('packages/server-state/package.json');
assert.equal(serverManifest.name, '@expo-base/server-state');
assert.equal(serverManifest.dependencies['@tanstack/react-query'], json('expo-base.compatibility.json')['@tanstack/react-query']);
assert.equal(json('packages/runtime/package.json').dependencies['@expo-base/server-state'], '*');
assert.equal(json('apps/reference/package.json').dependencies['@expo-base/server-state'], '*');

const index = parse('packages/server-state/src/index.ts');
const starExports = new Set(index.statements
  .filter(ts.isExportDeclaration)
  .filter((statement) => !statement.exportClause && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier))
  .map((statement) => statement.moduleSpecifier.text));
for (const module of ['./errors', './keys', './policy', './ExpoBaseServerStateProvider', './useExpoBaseQuery', './mutation', './presentation']) {
  assert.ok(starExports.has(module), `server-state public entry must export ${module}`);
}
const clientExport = index.statements.find((statement) => ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text === './client');
assert.ok(clientExport && clientExport.exportClause && ts.isNamedExports(clientExport.exportClause));
const publicClientNames = new Set(clientExport.exportClause.elements.map((element) => element.name.text));
for (const name of ['ExpoBaseServerStateClient', 'createExpoBaseServerStateClient', 'expoBaseServerStateScopeId', 'ExpoBaseQueryFunctionContext', 'ExpoBaseServerStateScope']) assert.ok(publicClientNames.has(name), name);
assert.equal(publicClientNames.has('getExpoBaseQueryImplementation'), false, 'TanStack implementation access must remain package-internal');

const runtimeProvider = parse('packages/runtime/src/ExpoBaseRuntimeProvider.tsx');
assert.ok(imports(runtimeProvider).some((entry) => entry.module === '@expo-base/server-state' && entry.names.has('ExpoBaseServerStateProvider')));
assert.ok(jsxTags(runtimeProvider).has('ExpoBaseServerStateProvider'));
assert.ok(jsxTags(runtimeProvider).has('AuthenticatedServerState'));
const auth = parse('packages/runtime/src/auth.tsx');
assert.ok(interfaceMembers(auth, 'ExpoBaseAuthSnapshot').has('sessionRevision'), 'auth runtime must expose an authoritative session revision for cache isolation');

const route = parse('apps/reference/app/server-state.tsx');
const routeImports = imports(route);
assert.ok(routeImports.some((entry) => entry.module === '@expo-base/server-state' && entry.names.has('useExpoBaseQuery') && entry.names.has('useExpoBaseMutation')));
assert.equal(routeImports.some((entry) => entry.module.startsWith('@tanstack/')), false);

for (const file of sourceFiles(path.join(root, 'apps'))) {
  if (!file.includes(`${path.sep}app${path.sep}`)) continue;
  assert.equal(imports(parse(path.relative(root, file))).some((entry) => entry.module.startsWith('@tanstack/')), false, `${path.relative(root, file)} bypasses @expo-base/server-state`);
}
for (const file of sourceFiles(path.join(root, 'packages', 'server-state', 'src'))) {
  const modules = imports(parse(path.relative(root, file))).map((entry) => entry.module);
  assert.equal(modules.some((module) => /async-storage|secure-store|mmkv|persister|netinfo/i.test(module)), false, `${path.relative(root, file)} must not add persistence/connectivity ownership in Phase 3`);
}

const catalog = json('golden.catalog.json');
assert.ok(catalog.ownership.some((owner) => owner.id === 'server-state' && owner.package === '@expo-base/server-state'));
for (const id of ['server-state.query', 'server-state.cache', 'server-state.mutation', 'server-state.optimistic', 'server-state.feedback']) assert.ok(catalog.items.some((item) => item.id === id), id);
for (const intent of ['load server data', 'refresh server data', 'mutate server data', 'invalidate cached data', 'perform an optimistic update', 'render stale data safely']) assert.ok(catalog.discoveryChallenges.some((challenge) => challenge.intent === intent), intent);

const generatedTemplate = parse('packages/create-expo-base-app/bin/create-expo-base-app.mjs');
assert.ok(read('packages/create-expo-base-app/bin/create-expo-base-app.mjs').includes("'@expo-base/server-state': '*'"));
assert.ok(read('packages/create-expo-base-app/bin/create-expo-base-app.mjs').includes("'serverState.ts'"));
assert.ok(imports(generatedTemplate).every((entry) => !entry.module.startsWith('@tanstack/')));

console.log('Server-state structural contracts passed (facade exports, scoped runtime, session isolation, catalog, reference, generator, and no route implementation bypass).');

function imports(source) {
  const values = [];
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const names = new Set();
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) for (const element of bindings.elements) names.add(element.propertyName?.text ?? element.name.text);
    values.push({ module: statement.moduleSpecifier.text, names });
  }
  return values;
}

function jsxTags(source) {
  const tags = new Set();
  const visit = (node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName)) tags.add(node.tagName.text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return tags;
}

function interfaceMembers(source, name) {
  const declaration = source.statements.find((statement) => ts.isInterfaceDeclaration(statement) && statement.name.text === name);
  assert.ok(declaration && ts.isInterfaceDeclaration(declaration), `Missing interface ${name}`);
  return new Set(declaration.members.flatMap((member) => member.name && (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name)) ? [member.name.text] : []));
}

function sourceFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(full) : /\.(?:ts|tsx|js|mjs)$/.test(entry.name) ? [full] : [];
  });
}
