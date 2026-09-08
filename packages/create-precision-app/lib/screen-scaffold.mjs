import fs from 'node:fs';
import path from 'node:path';

export function scaffoldScreen({ root, app, name, patternId, access = 'protected', capabilities = [] }) {
  const target = path.resolve(root, app);
  const registry = readJson(path.join(root, 'golden.patterns.json'));
  const pattern = registry?.patterns?.find((candidate) => candidate.id === patternId);
  if (!pattern) throw new Error(`Unknown Golden pattern "${patternId}". Run npm run check:golden-patterns for the current registry.`);
  if (!pattern.scaffold) throw new Error(`Pattern "${patternId}" supports manual Golden composition only. See docs/GOLDEN_WORKFLOWS.md.`);
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error('Screen name must be lowercase kebab-case.');
  if (!['protected', 'public'].includes(access)) throw new Error('Access must be protected or public.');
  const manifestPath = path.join(target, 'precision.routes.json');
  const routeManifest = readJson(manifestPath);
  if (!routeManifest || routeManifest.schemaVersion !== 1 || !Array.isArray(routeManifest.authenticated) || !Array.isArray(routeManifest.public)) {
    throw new Error('This app has no valid precision.routes.json. Regenerate the app or add the canonical route manifest before scaffolding.');
  }
  const capabilityManifest = readJson(path.join(target, 'precision.capabilities.json'));
  const selectedCapabilities = new Set(capabilityManifest?.capabilities ?? []);
  const requestedCapabilities = [...new Set(capabilities)];
  const requiredCapabilities = requiredForPattern(patternId);
  for (const capability of [...requestedCapabilities, ...requiredCapabilities]) {
    if (!selectedCapabilities.has(capability)) throw new Error(`Pattern "${patternId}" requires selected capability "${capability}". Create the app with --capabilities ${capability} or register that profile first.`);
  }
  const routes = screenRoutes(name, patternId);
  const existingRoutes = new Set([...routeManifest.authenticated, ...routeManifest.public]);
  for (const route of routes) if (existingRoutes.has(route)) throw new Error(`Route collision: "${route}" is already registered in precision.routes.json.`);
  const files = screenFiles({ name, patternId, requestedCapabilities });
  for (const relative of Object.keys(files)) {
    const destination = path.join(target, relative);
    if (fs.existsSync(destination)) throw new Error(`Refusing to overwrite existing file: ${relative}.`);
  }

  const nextManifest = {
    schemaVersion: 1,
    authenticated: [...routeManifest.authenticated],
    public: [...routeManifest.public],
  };
  nextManifest[access === 'protected' ? 'authenticated' : 'public'].push(...routes);
  const staged = new Map(files);
  staged.set('precision.routes.json', JSON.stringify(nextManifest, null, 2) + '\n');
  staged.set('routes.ts', renderRouteModule(nextManifest));
  transactionalWrite(target, staged);
  return { target, patternId, access, routes, files: [...files.keys()] };
}

function screenRoutes(name, patternId) {
  return patternId === 'data-workspace' ? [name, `${name}/[id]`] : [name];
}

function requiredForPattern(patternId) {
  if (patternId === 'import-workflow') return ['media'];
  if (patternId === 'offline-workspace') return ['runtime-signals'];
  return [];
}

function screenFiles({ name, patternId, requestedCapabilities }) {
  const title = titleCase(name);
  const singular = pascalCase(singularize(name));
  const stem = camelCase(name);
  const feature = `features/${name}`;
  const files = new Map([
    [`${feature}/${name}.model.ts`, modelTemplate(singular)],
    [`${feature}/${name}.service.ts`, serviceTemplate({ name, singular, stem, patternId })],
  ]);
  if (patternId === 'data-workspace') {
    files.set(`app/${name}.tsx`, dataWorkspaceTemplate({ name, title, singular, stem }));
    files.set(`app/${name}/[id].tsx`, detailTemplate({ name, title, singular, stem }));
  } else if (patternId === 'settings-form' || patternId === 'form-workspace') {
    files.set(`app/${name}.tsx`, formTemplate({ name, title, singular, stem, preferences: requestedCapabilities.includes('preferences') }));
  } else if (patternId === 'import-workflow') {
    files.set(`app/${name}.tsx`, importTemplate({ name, title, singular, stem }));
  } else if (patternId === 'offline-workspace') {
    files.set(`app/${name}.tsx`, offlineTemplate({ name, title, singular, stem }));
  } else if (patternId === 'review-approval') {
    files.set(`app/${name}.tsx`, reviewTemplate({ title, singular }));
  } else if (patternId === 'completion') {
    files.set(`app/${name}.tsx`, completionTemplate({ title }));
  } else if (patternId === 'permission-rationale') {
    files.set(`app/${name}.tsx`, permissionTemplate({ title }));
  } else throw new Error(`No scaffold template is registered for ${patternId}.`);
  return files;
}

function modelTemplate(singular) {
  return `// TODO(product): replace this neutral record with the domain model.\nexport interface ${singular}Record {\n  id: string;\n  label: string;\n  description: string;\n}\n`;
}

function serviceTemplate({ name, singular, stem, patternId }) {
  const isMutation = ['settings-form', 'form-workspace', 'import-workflow', 'review-approval'].includes(patternId);
  return `import type { ${singular}Record } from './${name}.model';\n\n// TODO(product): implement this service through the application's adapter composition.\n// Do not add fetch, a vendor client, or a local cache in a route.\nexport const ${stem}Service = {\n  list: async (_signal: AbortSignal): Promise<readonly ${singular}Record[]> => {\n    throw new Error('TODO: provide a ${stem} list loader through a service adapter.');\n  },\n  get: async (_id: string, _signal: AbortSignal): Promise<${singular}Record> => {\n    throw new Error('TODO: provide a ${stem} detail loader through a service adapter.');\n  },\n${isMutation ? `  save: async (value: ${singular}Record, _signal: AbortSignal): Promise<${singular}Record> => {\n    void value;\n    throw new Error('TODO: provide a ${stem} mutation through a service adapter.');\n  },\n` : ''}};\n`;
}

function dataWorkspaceTemplate({ name, title, singular, stem }) {
  return `import { useState } from 'react';\nimport { usePrecisionRouter } from '@precision-calm/navigation-router';\nimport { precisionQueryKey, usePrecisionQuery } from '@precision-calm/server-state';\nimport { AdaptiveDataTable, DataToolbar, DataWorkspaceLayout, ScrollScreen, ServerStateContent, StateView } from '@precision-calm/ui';\nimport { ${stem}Service } from '../features/${name}/${name}.service';\nimport type { ${singular}Record } from '../features/${name}/${name}.model';\n\nconst columns = [\n  { key: 'label', label: '${singular}', primary: true, render: (record: ${singular}Record) => record.label },\n  { key: 'description', label: 'Description', render: (record: ${singular}Record) => record.description },\n] as const;\n\nexport default function ${singular}WorkspaceScreen() {\n  const router = usePrecisionRouter();\n  const [search, setSearch] = useState('');\n  const query = usePrecisionQuery({\n    key: precisionQueryKey.list('${name}', { search }),\n    // TODO(product): enable after replacing the scaffold service loader.\n    enabled: false,\n    query: ({ signal }) => ${stem}Service.list(signal),\n  });\n  const records = query.state.kind === 'content' ? query.state.data : [];\n  return <ScrollScreen><DataWorkspaceLayout\n    title="${title}"\n    description="TODO(product): describe the ${name} workspace."\n    controls={<DataToolbar searchLabel="Search ${name}" query={search} onQueryChange={setSearch} summary={records.length + ' ${name}'} />}\n    data={\n      <ServerStateContent\n        query={query}\n        itemCount={records.length}\n        empty={<StateView kind="empty" title="Connect ${title}" message="TODO(product): implement the service loader to show ${name}." />}\n      >\n        <AdaptiveDataTable\n          rows={records}\n          columns={columns}\n          keyExtractor={(record) => record.id}\n          onRowPress={(record) => router.push({ pathname: '/${name}/[id]', params: { id: record.id } } as never)}\n        />\n      </ServerStateContent>\n    }\n  /></ScrollScreen>;\n}\n`;
}

function detailTemplate({ name, title, singular, stem }) {
  return `import { usePrecisionLocalSearchParams, usePrecisionRouter } from '@precision-calm/navigation-router';\nimport { precisionQueryKey, usePrecisionQuery } from '@precision-calm/server-state';\nimport { Button, DetailLayout, KeyValueList, ScrollScreen, ServerStateContent, StateView } from '@precision-calm/ui';\nimport { ${stem}Service } from '../../features/${name}/${name}.service';\n\nexport default function ${singular}DetailScreen() {\n  const router = usePrecisionRouter();\n  const params = usePrecisionLocalSearchParams<{ id: string }>();\n  const id = typeof params.id === 'string' ? params.id : 'missing';\n  const query = usePrecisionQuery({\n    key: precisionQueryKey.entity('${name}', id),\n    enabled: false,\n    query: ({ signal }) => ${stem}Service.get(id, signal),\n  });\n  const record = query.state.kind === 'content' ? query.state.data : undefined;\n  return <ScrollScreen><DetailLayout title="${title}" description="TODO(product): show domain detail." details={<ServerStateContent query={query} itemCount={record ? 1 : 0} empty={<StateView kind="empty" title="Connect ${title}" message="TODO(product): implement the detail loader." />}>{record ? <KeyValueList items={[{ key: 'label', label: 'Label', value: record.label }, { key: 'description', label: 'Description', value: record.description }]} /> : null}</ServerStateContent>} aside={<Button label="Back" variant="secondary" responsiveWidth="compact-full" onPress={() => router.backOr('/${name}')} />} /></ScrollScreen>;\n}\n`;
}

function formTemplate({ name, title, singular, stem, preferences }) {
  const preferenceImport = preferences ? "import { usePrecisionPreferences } from '@precision-calm/preferences';\n" : '';
  const preferenceHook = preferences ? '  const preferences = usePrecisionPreferences();\n' : '';
  const preferenceSave = preferences ? "      void preferences.set('display-label', values.label);\n" : '';
  return `import { usePrecisionRouter } from '@precision-calm/navigation-router';\nimport { usePrecisionForm, usePrecisionFormLifecycle, ControlledTextField } from '@precision-calm/form-rhf';\nimport { usePrecisionMutation } from '@precision-calm/server-state';\nimport { Button, FormDiscardDialog, FormErrorSummary, FormSection, FormSectionGroup, FormWorkspaceLayout } from '@precision-calm/ui';\n${preferenceImport}import { ${stem}Service } from '../features/${name}/${name}.service';\nimport type { ${singular}Record } from '../features/${name}/${name}.model';\n\nexport default function ${singular}FormScreen() {\n  const router = usePrecisionRouter();\n${preferenceHook}  const form = usePrecisionForm<${singular}Record>({ defaultValues: { id: '${name}', label: '', description: '' } });\n  const lifecycle = usePrecisionFormLifecycle(form, [{ name: 'label', label: 'Label' }, { name: 'description', label: 'Description' }]);\n  const save = usePrecisionMutation<${singular}Record, ${singular}Record>({ mutation: ({ variables, signal }) => ${stem}Service.save(variables, signal) });\n  const submit = form.handleSubmit(async (values) => {\n    const result = await save.execute(values);\n    if (!result.ok) lifecycle.applyServerErrors({ form: result.error.message });\n    else {\n${preferenceSave}      lifecycle.reset();\n    }\n  });\n  return <>\n    <FormWorkspaceLayout\n      title="${title}"\n      description="TODO(product): describe this form."\n      summary={<FormErrorSummary errors={lifecycle.errors} />}\n      primaryAction={<Button label="Save" loading={save.state.status === 'pending'} responsiveWidth="compact-full" onPress={() => { void submit(); }} />}\n      secondaryAction={<Button label="Discard" variant="ghost" responsiveWidth="compact-full" onPress={() => lifecycle.leaveGuard.requestLeave(() => router.backOr('/'))} />}\n    >\n      <FormSectionGroup>\n        <FormSection title="Basics" description="TODO(product): add domain fields and validation.">\n          <ControlledTextField control={form.control} name="label" id="${name}-label" label="Label" rules={{ required: 'Enter a label.' }} />\n          <ControlledTextField control={form.control} name="description" id="${name}-description" label="Description" />\n        </FormSection>\n      </FormSectionGroup>\n    </FormWorkspaceLayout>\n    <FormDiscardDialog guard={lifecycle.leaveGuard} />\n  </>;\n}\n`;
}

function importTemplate({ name, title, singular, stem }) {
  return `import { useState } from 'react';\nimport { usePrecisionDocumentPicker, type PrecisionAcquiredResource } from '@precision-calm/media';\nimport { usePrecisionMutation } from '@precision-calm/server-state';\nimport { Button, ImportWorkflowLayout, KeyValueList, StateView, Text, VStack } from '@precision-calm/ui';\nimport { ${stem}Service } from '../features/${name}/${name}.service';\nimport type { ${singular}Record } from '../features/${name}/${name}.model';\n\nexport default function ${singular}ImportScreen() {\n  const documents = usePrecisionDocumentPicker();\n  const [resource, setResource] = useState<PrecisionAcquiredResource | null>(null);\n  const upload = usePrecisionMutation<PrecisionAcquiredResource, ${singular}Record>({ mutation: ({ variables, signal }) => ${stem}Service.save({ id: variables.uri, label: variables.name ?? 'Selected item', description: variables.mimeType ?? 'Unknown type' }, signal) });\n  const choose = async () => { const result = await documents.pick(); if (result.status === 'success') setResource(result.value[0] ?? null); };\n  return <ImportWorkflowLayout title="${title}" description="Choose a file, validate it in product logic, then send it through a service mutation." acquisition={<VStack gap="lg">{resource ? <KeyValueList items={[{ key: 'name', label: 'File', value: resource.name ?? 'Unnamed file' }, { key: 'type', label: 'Type', value: resource.mimeType ?? 'Unknown' }]} /> : <StateView kind="empty" title="No file selected" message="Choose a document to begin." />}<Button label="Choose document" variant="secondary" responsiveWidth="compact-full" onPress={() => { void choose(); }} /></VStack>} status={upload.state.status === 'error' ? <Text tone="negative">{upload.state.error.message}</Text> : undefined} primaryAction={<Button label="Upload" disabled={!resource} loading={upload.state.status === 'pending'} responsiveWidth="compact-full" onPress={() => { if (resource) void upload.execute(resource); }} />} secondaryAction={<Button label="Cancel" variant="ghost" responsiveWidth="compact-full" onPress={() => {}} />} />;\n}\n`;
}

function offlineTemplate({ name, title, singular, stem }) {
  return `import { precisionQueryKey, usePrecisionQuery } from '@precision-calm/server-state';\nimport { ListRow, OfflineWorkspaceLayout, ScrollScreen, ServerStateContent, StateView, VStack } from '@precision-calm/ui';\nimport { ${stem}Service } from '../features/${name}/${name}.service';\n\nexport default function ${singular}OfflineWorkspaceScreen() {\n  const query = usePrecisionQuery({ key: precisionQueryKey.list('${name}'), enabled: false, query: ({ signal }) => ${stem}Service.list(signal) });\n  const records = query.state.kind === 'content' ? query.state.data : [];\n  return <ScrollScreen><OfflineWorkspaceLayout title="${title}" description="Retain available data and refresh explicitly after a real reconnect."><ServerStateContent query={query} itemCount={records.length} empty={<StateView kind="empty" title="Connect ${title}" message="TODO(product): provide the activity loader." />}>{<VStack gap="xs">{records.map((record) => <ListRow key={record.id} title={record.label} subtitle={record.description} />)}</VStack>}</ServerStateContent></OfflineWorkspaceLayout></ScrollScreen>;\n}\n`;
}

function reviewTemplate({ title, singular }) {
  return `import { useState } from 'react';\nimport { Button, Dialog, KeyValueList, ReviewWorkflowLayout } from '@precision-calm/ui';\n\nexport default function ${singular}ReviewScreen() {\n  const [confirming, setConfirming] = useState(false);\n  return <>\n    <ReviewWorkflowLayout title="${title}" description="TODO(product): present the domain change set." review={<KeyValueList items={[{ key: 'review', label: 'Review', value: 'TODO(product): domain summary' }]} />} primaryAction={<Button label="Continue" responsiveWidth="compact-full" onPress={() => setConfirming(true)} />} secondaryAction={<Button label="Back" variant="secondary" responsiveWidth="compact-full" onPress={() => {}} />} />\n    <Dialog open={confirming} onOpenChange={setConfirming} title="Confirm action" description="TODO(product): explain the consequence." kind="alert" actions={<Button label="Confirm" variant="danger" onPress={() => setConfirming(false)} />} />\n  </>;\n}\n`;
}

function completionTemplate({ title }) {
  return `import { Button, CompletionLayout, ScrollScreen } from '@precision-calm/ui';\n\nexport default function ${camelCase(title)}CompletionScreen() {\n  return <ScrollScreen><CompletionLayout title="${title}" message="TODO(product): describe the completed workflow." primaryAction={<Button label="Continue" responsiveWidth="compact-full" onPress={() => {}} />} /></ScrollScreen>;\n}\n`;
}

function permissionTemplate({ title }) {
  return `import { Button, PermissionRationaleLayout, ScrollScreen } from '@precision-calm/ui';\n\nexport default function ${camelCase(title)}PermissionScreen() {\n  return <ScrollScreen><PermissionRationaleLayout title="${title}" message="TODO(product): explain why this optional capability is useful." primaryAction={<Button label="Continue" responsiveWidth="compact-full" onPress={() => {}} />} /></ScrollScreen>;\n}\n`;
}

function renderRouteModule(manifest) {
  return `// Generated by scaffold:screen. Edit routes through the scaffolder so protected-route ownership remains explicit.\nexport const precisionRoutes = {\n  authenticated: ${JSON.stringify(manifest.authenticated)},\n  public: ${JSON.stringify(manifest.public)},\n} as const;\n`;
}

function transactionalWrite(target, files) {
  const staged = [];
  const created = [];
  const overwritten = new Map();
  try {
    for (const [relative, content] of files) {
      const destination = path.join(target, relative);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      const temporary = `${destination}.precision-scaffold-${process.pid}`;
      fs.writeFileSync(temporary, content);
      staged.push([temporary, destination]);
    }
    for (const [temporary, destination] of staged) {
      if (fs.existsSync(destination)) overwritten.set(destination, fs.readFileSync(destination));
      else created.push(destination);
      fs.renameSync(temporary, destination);
    }
  } catch (error) {
    for (const [temporary] of staged) fs.rmSync(temporary, { force: true });
    for (const destination of created) fs.rmSync(destination, { force: true });
    for (const [destination, content] of overwritten) fs.writeFileSync(destination, content);
    throw error;
  }
}

function readJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }
function titleCase(value) { return value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '); }
function camelCase(value) { const [first, ...rest] = value.split(/[-\s]+/); return first + rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(''); }
function pascalCase(value) { const camel = camelCase(value); return camel.charAt(0).toUpperCase() + camel.slice(1); }
function singularize(value) { return value.endsWith('s') && value.length > 1 ? value.slice(0, -1) : value; }
function kebabCase(value) { return value.replace(/([a-z])([A-Z])/g, '$1-$2').replaceAll(' ', '-').toLowerCase(); }
