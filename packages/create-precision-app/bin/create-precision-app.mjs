#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  printUsage();
  process.exit(0);
}
if (!args.name || !args.slug) {
  printUsage();
  process.exit(2);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.slug)) fail('Slug must be lowercase kebab-case.');
const accents = new Set(['blue', 'violet', 'green', 'orange']);
if (!accents.has(args.accent)) fail(`Unknown accent "${args.accent}". Choose blue, violet, green, or orange.`);
if (args.linkHost && !isValidHost(args.linkHost)) fail('--link-host must be a bare HTTPS hostname such as app.example.com (no scheme, port, path, query, or fragment).');

const CAPABILITY_PROFILES = Object.freeze({
  'secure-storage': {
    workspace: '@precision-calm/secure-storage', external: ['expo-secure-store'], plugins: ['expo-secure-store'],
    imports: ["import { ExpoSecureStorage } from '@precision-calm/secure-storage';"],
    entries: (config) => [`secureStorage: new ExpoSecureStorage({ namespace: ${JSON.stringify(config.identifier)} })`],
  },
  preferences: {
    workspace: '@precision-calm/preferences', external: ['@react-native-async-storage/async-storage'], plugins: [],
    imports: ["import { DevicePreferences } from '@precision-calm/preferences';"],
    entries: (config) => [`preferences: new DevicePreferences({ namespace: ${JSON.stringify(config.slug)} })`],
  },
  'runtime-signals': {
    workspace: '@precision-calm/runtime-capabilities', external: ['expo-network'], plugins: [],
    imports: ["import { ExpoConnectivity, ReactNativeAppLifecycle } from '@precision-calm/runtime-capabilities';"],
    entries: () => ['connectivity: new ExpoConnectivity()', 'appLifecycle: new ReactNativeAppLifecycle()'],
  },
  sharing: {
    workspace: '@precision-calm/sharing', external: ['expo-clipboard', 'expo-sharing'], plugins: [],
    imports: ["import { ExpoClipboard, ExpoSharing } from '@precision-calm/sharing/runtime';"],
    entries: () => ['clipboard: new ExpoClipboard()', 'sharing: new ExpoSharing()'],
  },
  media: {
    workspace: '@precision-calm/media', external: ['expo-camera', 'expo-document-picker', 'expo-image-picker'], plugins: ['expo-camera', 'expo-document-picker', 'expo-image-picker'],
    imports: ["import { ExpoDocumentPicker, ExpoMediaAcquisition } from '@precision-calm/media';"],
    entries: () => ['documents: new ExpoDocumentPicker()', 'media: new ExpoMediaAcquisition()'],
  },
  'local-auth': {
    workspace: '@precision-calm/local-auth', external: ['expo-local-authentication'], plugins: ['expo-local-authentication'],
    imports: ["import { ExpoLocalAuthentication } from '@precision-calm/local-auth';"],
    entries: () => ['localAuthentication: new ExpoLocalAuthentication()'],
  },
  notifications: {
    workspace: '@precision-calm/notifications', external: ['expo-notifications'], plugins: ['expo-notifications'],
    imports: ["import { ExpoNotifications } from '@precision-calm/notifications';"],
    entries: () => ['notifications: new ExpoNotifications()'],
  },
  updates: {
    workspace: '@precision-calm/updates', external: ['expo-updates'], plugins: ['expo-updates'],
    imports: ["import { ExpoUpdates } from '@precision-calm/updates';"],
    entries: () => ['updates: new ExpoUpdates()'],
  },
  device: {
    workspace: '@precision-calm/device', external: ['expo-application', 'expo-device'], plugins: [],
    imports: ["import { ExpoDevice } from '@precision-calm/device';"],
    entries: () => ['device: new ExpoDevice()'],
  },
  haptics: {
    workspace: '@precision-calm/haptics', external: ['expo-haptics'], plugins: [],
    imports: ["import { ExpoHaptics } from '@precision-calm/haptics';"],
    entries: () => ['haptics: new ExpoHaptics()'],
  },
  observability: {
    workspace: '@precision-calm/observability', external: [], plugins: [],
    imports: ["import { NoopObservability } from '@precision-calm/observability';"],
    entries: () => ['observability: new NoopObservability()'],
  },
});

const selectedCapabilities = resolveCapabilityProfiles(args.capabilities);
const root = process.cwd();
const compatibilityPath = path.join(root, 'precision.compatibility.json');
if (!fs.existsSync(compatibilityPath)) fail('precision.compatibility.json is required at the workspace root.');
const compatibility = JSON.parse(fs.readFileSync(compatibilityPath, 'utf8'));
const destination = path.resolve(root, args.directory ?? path.join('apps', args.slug));
if (fs.existsSync(destination) && fs.readdirSync(destination).length > 0 && !args.force) fail(`Destination is not empty: ${destination}. Use --force to replace it.`);
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(path.join(destination, 'app'), { recursive: true });
const identifier = `com.precision.${args.slug.replaceAll('-', '')}`;
const shortName = firstGlyph(args.name);
const workspaceRelative = path.relative(destination, root).split(path.sep).join('/') || '.';
const files = buildFiles({ ...args, identifier, shortName, workspaceRelative, capabilities: selectedCapabilities }, compatibility);
for (const [relative, content] of Object.entries(files)) {
  const target = path.join(destination, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
console.log(`Created Precision Calm app at ${path.relative(root, destination) || destination}`);
console.log(`Brand: ${args.name} · Accent: ${args.accent}`);
if (selectedCapabilities.length) console.log(`Capabilities: ${selectedCapabilities.join(', ')}`);
console.log('Next: npm install, then npm run start -w ' + JSON.stringify(`@apps/${args.slug}`));

function buildFiles(config, versions) {
  const capabilityProfiles = config.capabilities.map((name) => CAPABILITY_PROFILES[name]);
  const capabilityDependencies = Object.fromEntries(capabilityProfiles.flatMap((profile) => [[profile.workspace, '*'], ...profile.external.map((dependency) => [dependency, versions[dependency]])]));
  const capabilityPlugins = [...new Set(capabilityProfiles.flatMap((profile) => profile.plugins))];
  const appPlugins = [['expo-router', { asyncRoutes: { web: 'production' } }], ...capabilityPlugins];
  const capabilityImports = capabilityProfiles.flatMap((profile) => profile.imports);
  const capabilityEntries = capabilityProfiles.flatMap((profile) => profile.entries(config));
  const pkg = {
    name: `@apps/${config.slug}`,
    version: '1.0.0', private: true, main: 'index.ts',
    scripts: { start: 'expo start --dev-client', web: 'expo start --web', prebuild: 'expo prebuild --clean', 'check:golden-architecture': `node ${config.workspaceRelative}/scripts/check-golden-architecture.mjs --config golden-architecture.config.json`, 'scaffold:screen': `node ${config.workspaceRelative}/packages/create-precision-app/bin/scaffold-precision-screen.mjs --app .` },
    dependencies: {
      '@precision-calm/adapters': '*', '@precision-calm/auth': '*', '@precision-calm/authorization': '*', '@precision-calm/capabilities': '*', '@precision-calm/form-rhf': '*', '@precision-calm/linking': '*', '@precision-calm/linking-expo': '*', '@precision-calm/navigation-router': '*', '@precision-calm/platform': '*', '@precision-calm/runtime': '*', '@precision-calm/server-state': '*', '@precision-calm/session-security': '*', '@precision-calm/tokens': '*', '@precision-calm/ui': '*',
      expo: versions.expo, 'expo-linking': versions['expo-linking'], 'expo-router': versions['expo-router'], react: versions.react, 'react-dom': versions['react-dom'], 'react-hook-form': versions['react-hook-form'], 'react-native': versions['react-native'], 'react-native-keyboard-controller': versions['react-native-keyboard-controller'], 'react-native-nitro-modules': versions['react-native-nitro-modules'], 'react-native-reanimated': versions['react-native-reanimated'], 'react-native-svg': versions['react-native-svg'], 'react-native-unistyles': versions['react-native-unistyles'], 'react-native-web': versions['react-native-web'], 'react-native-worklets': versions['react-native-worklets'], 'lucide-react-native': versions['lucide-react-native'], ...capabilityDependencies
    },
    devDependencies: { 'babel-preset-expo': versions['babel-preset-expo'], typescript: versions.typescript }
  };
  return {
    'package.json': JSON.stringify(pkg, null, 2) + '\n',
    'README.md': `# ${config.name}\n\nGenerated from Precision Calm Universal.\n\n## Start\n\n- \`npm install\` from the workspace root\n- \`npm run start -w @apps/${config.slug}\`\n- \`npm run web -w @apps/${config.slug}\`\n\n## Golden development contract\n\nRead \`AGENTS.md\`, which forwards to the canonical workspace contract. Start feature work from \`${config.workspaceRelative}/docs/GOLDEN_CATALOG.md\`, \`${config.workspaceRelative}/docs/GOLDEN_WORKFLOWS.md\`, and their machine-readable catalogs. Use \`npm run scaffold:screen -- --name customers --pattern data-workspace\` for a standard route, then replace only explicit domain TODOs. Run \`npm run check:golden-architecture\` before broader certification. Product screens should compose Precision Calm components and patterns rather than introduce raw geometry, raw platform APIs, direct networking, persistence, or local overlay/feedback mechanics. Remote data uses a service adapter plus \`@precision-calm/server-state\`; \`serverState.ts\` demonstrates deterministic key ownership.\n\n## Optional capabilities\n\nThis app selected: \`${config.capabilities.join(', ') || 'none (minimal kernel profile)'}\`. Root registrations are in \`capabilities.ts\`. Add or change a capability only through the root composition and follow \`${config.workspaceRelative}/docs/RUNTIME_CAPABILITIES.md\`; do not import Expo capability modules in a route.\n\nBrand configuration lives in \`brand.ts\`.${config.linkHost ? `\n\nVerified web-link host requested: \`${config.linkHost}\`. You must still publish the Android Digital Asset Links file and iOS AASA file on that domain before App/Universal Links can verify.` : ''}\n`,
    'AGENTS.md': `# Generated Expo Base app contract\n\nThis app inherits the canonical workspace contract at \`${config.workspaceRelative}/AGENTS.md\`. Read that file before changing a route or shared integration.\n\nUse \`${config.workspaceRelative}/docs/GOLDEN_CATALOG.md\`, \`${config.workspaceRelative}/docs/GOLDEN_WORKFLOWS.md\`, \`${config.workspaceRelative}/golden.catalog.json\`, and \`${config.workspaceRelative}/golden.patterns.json\` to choose owners. For a standard feature, use \`npm run scaffold:screen -- --name route-name --pattern pattern-id\`; do not create a new page architecture when a Golden pattern matches. Product routes in \`app/\` own domain logic, models, copy, and unique visualizations; they do not own raw geometry, React Native controls, platform branches, direct networking/persistence, overlays, feedback anatomy, query caches, retry loops, or optimistic rollback bookkeeping. Remote data uses a service adapter plus \`@precision-calm/server-state\`.\n\nOptional capability profile: \`${config.capabilities.join(', ') || 'minimal'}\`. Root registrations live in \`capabilities.ts\`; add a selected Precision capability there, never a direct Expo capability import in a feature route. Read \`${config.workspaceRelative}/docs/RUNTIME_CAPABILITIES.md\` before changing capability selection.\n\nRun \`npm run check:golden-architecture\` after feature work. Add a narrow, rationale-bearing entry to \`golden-architecture.config.json\` only for a reviewed exception.\n`,
    'golden-architecture.config.json': JSON.stringify({ schemaVersion: 1, extends: `${config.workspaceRelative}/golden-architecture.config.json`, featureRoots: ['app'], excludePaths: ['app/_layout.tsx', 'app/+html.tsx', 'app/+native-intent.tsx'], allowlists: [] }, null, 2) + '\n',
    'precision.capabilities.json': JSON.stringify({ schemaVersion: 1, capabilities: config.capabilities }, null, 2) + '\n',
    'precision.routes.json': JSON.stringify({ schemaVersion: 1, authenticated: [], public: [] }, null, 2) + '\n',
    'routes.ts': `// Generated route registry. Add product routes with npm run scaffold:screen.\nexport const precisionRoutes = { authenticated: [] as readonly string[], public: [] as readonly string[] } as const;\n`,
    'index.ts': `import './unistyles';\nimport 'expo-router/entry';\n`,
    'brand.ts': `import { brandPresets, type PrecisionBrand } from '@precision-calm/tokens';\n\nexport const appBrand: PrecisionBrand = {\n  ...brandPresets.${config.accent},\n  name: ${JSON.stringify(config.name)},\n  shortName: ${JSON.stringify(config.shortName)},\n};\n`,
    'unistyles.ts': `import { Appearance, Platform } from 'react-native';\nimport { StyleSheet } from 'react-native-unistyles';\nimport { breakpoints, createPrecisionThemes } from '@precision-calm/tokens';\nimport { appBrand } from './brand';\n\nconst themes = createPrecisionThemes(appBrand);\ntype AppThemes = typeof themes;\ntype AppBreakpoints = typeof breakpoints;\ndeclare module 'react-native-unistyles' { export interface UnistylesThemes extends AppThemes {} export interface UnistylesBreakpoints extends AppBreakpoints {} }\nStyleSheet.configure({ themes, breakpoints, settings: { initialTheme: Platform.OS === 'web' ? 'light' : Appearance.getColorScheme() === 'dark' ? 'dark' : 'light', nativeBreakpointsMode: 'points' } });\n`,
    'ThemeRuntimeSync.tsx': `import { useEffect } from 'react';
import { Platform, StatusBar, useColorScheme } from 'react-native';
import { UnistylesRuntime } from 'react-native-unistyles';

export function ThemeRuntimeSync() {
  const colorScheme = useColorScheme();
  const effectiveTheme = colorScheme === 'dark' ? 'dark' : 'light';
  useEffect(() => {
    if (UnistylesRuntime.themeName !== effectiveTheme) UnistylesRuntime.setTheme(effectiveTheme);
  }, [effectiveTheme]);
  if (Platform.OS === 'web') return null;
  return <StatusBar animated barStyle={effectiveTheme === 'dark' ? 'light-content' : 'dark-content'} />;
}
`,
    'app/+html.tsx': `import '../unistyles';
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
import { PrecisionWebAccessibilityStyles } from '@precision-calm/ui';

export default function Root({ children }: PropsWithChildren) {
  return <html lang="en"><head><meta charSet="utf-8" /><meta httpEquiv="X-UA-Compatible" content="IE=edge" /><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" /><ScrollViewStyleReset /><PrecisionWebAccessibilityStyles /></head><body>{children}</body></html>;
}
`,
    'app/+not-found.tsx': `import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { Page, PageHeader, ScrollScreen, Section, StateView } from '@precision-calm/ui';

export default function NotFoundScreen() {
  const router = usePrecisionRouter();
  return <ScrollScreen><Page width="reading" header={<PageHeader eyebrow="PAGE NOT FOUND" title="This destination does not exist" description="The link may be outdated or the address may have been entered incorrectly." />}><Section><StateView kind="error" title="We could not find that page" message="Return to the application home to continue safely." actionLabel="Return home" onAction={() => router.replace('/')} /></Section></Page></ScrollScreen>;
}
`,
    'app.config.ts': `import type { ExpoConfig } from 'expo/config';\nimport { appBrand } from './brand';\n\ntype PrecisionExpoConfig = ExpoConfig & { newArchEnabled?: boolean };\nconst config: PrecisionExpoConfig = {\n  name: appBrand.name, slug: ${JSON.stringify(config.slug)}, version: '1.0.0', orientation: 'default', scheme: ${JSON.stringify(config.slug)}, userInterfaceStyle: 'automatic', newArchEnabled: true,\n  ios: { bundleIdentifier: ${JSON.stringify(config.identifier)}${config.linkHost ? `, associatedDomains: ['applinks:${config.linkHost}']` : ''} }, android: { package: ${JSON.stringify(config.identifier)}${config.linkHost ? `, intentFilters: [{ action: 'VIEW', autoVerify: true, data: [{ scheme: 'https', host: ${JSON.stringify(config.linkHost)} }], category: ['BROWSABLE', 'DEFAULT'] }]` : ''} },\n  web: { output: 'static' }, plugins: ${JSON.stringify(appPlugins)}, experiments: { typedRoutes: true },\n};\nexport default config;\n`,
    'babel.config.js': `module.exports = function (api) { api.cache(true); return { presets: ['babel-preset-expo'], plugins: [['react-native-unistyles/plugin', { root: 'app', autoProcessImports: ['@precision-calm/ui'] }]] }; };\n`,
    'tsconfig.json': JSON.stringify({ extends: '../../tsconfig.base.json', compilerOptions: { noEmit: true, types: ['react', 'react-native'] }, include: ['app/**/*.ts', 'app/**/*.tsx', '*.ts'] }, null, 2) + '\n',
    'app/_layout.tsx': `import '../unistyles';
import { useUnistyles } from 'react-native-unistyles';
import { ProtectedRouterStack, useCaptureReturnIntent } from '@precision-calm/navigation-router';
import { PrecisionRuntimeProvider, PrecisionSessionSecurityBootstrap, usePrecisionAuth, usePrecisionAuthAccess } from '@precision-calm/runtime';
import { LoadingState, Screen } from '@precision-calm/ui';
import { services } from '../services';
import { linking } from '../linking';
import { authReturnIntent } from '../auth';
import { sessionSecurity } from '../sessionSecurity';
import { capabilities } from '../capabilities';
import { ThemeRuntimeSync } from '../ThemeRuntimeSync';
import { precisionRoutes } from '../routes';

function RootNavigation() {
  const { theme } = useUnistyles();
  const auth = usePrecisionAuth();
  const access = usePrecisionAuthAccess();
  useCaptureReturnIntent({ access, capture: auth.captureReturnIntent, publicPaths: ['/sign-in', '/session-loading', '/session-error', '/link-error', '/unlock'] });
  if (auth.status === 'loading') return <Screen><LoadingState label="Restoring account session…" /></Screen>;
  return <ProtectedRouterStack access={access} routes={{ always: ['link-error', '+not-found', ...precisionRoutes.public], authenticated: ['index', ...precisionRoutes.authenticated], signedOut: ['sign-in'], booting: ['session-loading'], error: ['session-error'], locked: ['unlock'] }} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background.canvas } }} />;
}

export default function RootLayout() {
  return <><ThemeRuntimeSync /><PrecisionRuntimeProvider i18n={{ fallbackLocale: 'en-US' }} capabilities={capabilities} services={services} linking={linking} auth={{ returnIntentChannel: authReturnIntent }} sessionSecurity={{ adapter: sessionSecurity }}><PrecisionSessionSecurityBootstrap fallback={<Screen><LoadingState label="Restoring secure session…" /></Screen>}><RootNavigation /></PrecisionSessionSecurityBootstrap></PrecisionRuntimeProvider></>;
}
`,
    'app/index.tsx': `import { ScrollScreen } from '@precision-calm/ui';\nimport { Button, Card } from '@precision-calm/ui';\nimport { Text, VStack } from '@precision-calm/ui';\nimport { DashboardLayout } from '@precision-calm/ui';\nimport { Metric, MetricGroup } from '@precision-calm/ui';\nimport { appBrand } from '../brand';\n\nexport default function HomeScreen() {\n  const metrics = <MetricGroup><Metric label="Primary metric" value="$8,420" trend="+14.2%" trendTone="positive" /><Metric label="Secondary metric" value="24" trend="Current" /></MetricGroup>;\n  return <ScrollScreen><DashboardLayout eyebrow={appBrand.name.toUpperCase()} title="Production foundation" description="This screen is composed from portable Precision Calm patterns without feature-owned geometry." metrics={metrics} primary={<Card variant="elevated"><VStack gap="lg"><Text variant="h2">Primary workspace</Text><Text tone="secondary">Replace this content with your first product vertical slice.</Text><Button label="Primary action" onPress={() => {}} /></VStack></Card>} secondary={<Card variant="subtle"><VStack gap="md"><Text variant="h3">Context</Text><Text tone="secondary">Adaptive layouts determine where this panel belongs.</Text></VStack></Card>} /></ScrollScreen>;\n}\n`,
    'app/sign-in.tsx': `import { useState } from 'react';
import { Button, Card, ScrollScreen, Text, TextField, VStack } from '@precision-calm/ui';
import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { usePrecisionAuth } from '@precision-calm/runtime';

export default function SignInScreen() {
  const auth = usePrecisionAuth();
  const router = usePrecisionRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = async () => { if (await auth.signIn({ email, password })) router.replace(auth.consumeReturnIntent('/')); };
  return <ScrollScreen><Card><VStack gap="lg"><Text variant="h2">Sign in</Text><Text tone="secondary">Protected routes remain unavailable until authentication is confirmed.</Text><TextField id="email" label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" /><TextField id="password" label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />{auth.errorCode === 'sign_in_failed' ? <Text tone="negative">Sign-in could not be completed. Try again.</Text> : null}<Button label="Sign in" loading={auth.actionStatus === 'signing-in'} onPress={() => { void submit(); }} /></VStack></Card></ScrollScreen>;
}
`,
    'app/session-loading.tsx': `import { LoadingState, Screen } from '@precision-calm/ui';
export default function SessionLoadingScreen() { return <Screen><LoadingState label="Restoring secure session…" /></Screen>; }
`,
    'app/session-error.tsx': `import { Screen, StateView } from '@precision-calm/ui';
import { usePrecisionAuth } from '@precision-calm/runtime';
export default function SessionErrorScreen() { const auth = usePrecisionAuth(); return <Screen><StateView kind="error" title="Session could not be restored" message="Protected information remains hidden until the session check succeeds." actionLabel="Retry" actionLoading={auth.actionStatus === 'refreshing'} onAction={() => { void auth.refresh(); }} /></Screen>; }
`,
    'app/unlock.tsx': `import { useState } from 'react';
import { Button, Card, ScrollScreen, Text, VStack } from '@precision-calm/ui';
import { usePrecisionAuth, usePrecisionSessionSecurity } from '@precision-calm/runtime';
import { usePrecisionRouter } from '@precision-calm/navigation-router';

export default function UnlockScreen() {
  const security = usePrecisionSessionSecurity();
  const auth = usePrecisionAuth();
  const router = usePrecisionRouter();
  const [result, setResult] = useState<'idle' | 'denied' | 'error'>('idle');
  const unlock = async () => { const next = await security.requestUnlock(); if (next === 'unlocked') { setResult('idle'); router.replaceResolvedPath(auth.consumeReturnIntent('/')); return; } setResult(next); };
  return <ScrollScreen><Card><VStack gap="lg"><Text variant="h2">Unlock session</Text><Text tone="secondary">Protected content remains hidden until the local session-security adapter approves access.</Text>{security.status === 'error' || result === 'error' ? <Text tone="negative">Session security could not be verified. Protected content remains locked.</Text> : null}{result === 'denied' ? <Text tone="negative">Unlock was not approved.</Text> : null}<Button label="Unlock" loading={security.status === 'loading'} onPress={() => { void unlock(); }} /></VStack></Card></ScrollScreen>;
}
`,
    'auth.ts': `import { createReturnIntentChannel } from '@precision-calm/auth';\n\nexport const authReturnIntent = createReturnIntentChannel({ excludedPrefixes: ['/sign-in', '/session-loading', '/session-error', '/link-error', '/unlock', '/auth'] });\n`,
    'sessionSecurity.ts': `import { MemorySessionSecurityAdapter } from '@precision-calm/session-security';\n\n// Replace with a device-backed adapter before production launch.\nexport const sessionSecurity = new MemorySessionSecurityAdapter();\n`,
    'linking.ts': `import { createPrecisionLinkingRuntime } from '@precision-calm/linking';\nimport { ExpoExternalNavigationAdapter } from '@precision-calm/linking-expo';\nimport { authReturnIntent } from './auth';\n\nexport const linking = createPrecisionLinkingRuntime({\n  adapter: new ExpoExternalNavigationAdapter(),\n  onIncomingRoute: (route) => { authReturnIntent.capture(route); },\n  externalPolicy: { allowHttps: true, allowedHosts: ${config.linkHost ? `[{ host: ${JSON.stringify(config.linkHost)}, allowSubdomains: false }]` : '[]'}, allowMailto: false, allowTel: false },\n  incomingPolicy: { appSchemes: [${JSON.stringify(config.slug)}], universalLinkHosts: ${config.linkHost ? `[{ host: ${JSON.stringify(config.linkHost)}, allowSubdomains: false }]` : '[]'}, rejectedRoute: '/link-error' },\n});\n`,
    'app/+native-intent.tsx': `import { linking } from '../linking';\n\nexport function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {\n  try { return linking.redirectIncoming(path, { initial }); }\n  catch { return '/link-error'; }\n}\n`,
    'app/link-error.tsx': `import { Button, Card, ScrollScreen, Text, VStack } from '@precision-calm/ui';\nimport { usePrecisionRouter } from '@precision-calm/navigation-router';\n\nexport default function LinkErrorScreen() {\n  const router = usePrecisionRouter();\n  return <ScrollScreen><Card><VStack gap=\"lg\"><Text variant=\"h2\">This link cannot be opened safely</Text><Text tone=\"secondary\">The destination is malformed, unsupported, or not trusted by this application.</Text><Button label=\"Return home\" onPress={() => router.replace('/')} /></VStack></Card></ScrollScreen>;\n}\n`,
    'services.ts': `import { createDemoServices } from '@precision-calm/adapters';\n\n// Replace this explicit demo composition with production adapters before launch.\nexport const services = createDemoServices();\n`,
    'serverState.ts': `import { precisionQueryKey, type PrecisionQueryValue } from '@precision-calm/server-state';\n\n// Keep product query identity here; loaders remain behind services/adapters.\nexport const appQueryKeys = {\n  entity: (id: string) => precisionQueryKey.entity('app-entities', id),\n  list: (filters: PrecisionQueryValue = {}) => precisionQueryKey.list('app-entities', filters),\n};\n`,
    'capabilities.ts': `import { createPrecisionCapabilityRegistry } from '@precision-calm/capabilities';\n${capabilityImports.join('\n')}\n\n// Generated capability profile: ${config.capabilities.join(', ') || 'minimal kernel (no native capability dependencies)'}.\n// Configure adapters here, never inside a product route.\nexport const capabilities = createPrecisionCapabilityRegistry({${capabilityEntries.length ? `\n  ${capabilityEntries.join(',\n  ')},\n` : ''}});\n`,
    '.env.example': '# Product-specific environment variables belong here. The design system has no backend dependency.\n'
  };
}

function parseArgs(argv) {
  const out = { accent: 'blue', force: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (key === '--help' || key === '-h') out.help = true;
    else if (key === '--force') out.force = true;
    else if (key === '--name') out.name = argv[++index];
    else if (key === '--slug') out.slug = argv[++index];
    else if (key === '--accent') out.accent = argv[++index];
    else if (key === '--directory') out.directory = argv[++index];
    else if (key === '--link-host') out.linkHost = argv[++index];
    else if (key === '--capabilities') out.capabilities = argv[++index];
    else fail(`Unknown argument: ${key}`);
  }
  return out;
}
function printUsage() { console.log('create-precision-app --name "App Name" --slug app-name [--accent blue|violet|green|orange] [--capabilities secure-storage,preferences,runtime-signals,sharing,media,local-auth,notifications,updates,device,haptics,observability] [--directory path] [--link-host app.example.com] [--force]'); }
function resolveCapabilityProfiles(value) {
  if (value === undefined || value.trim() === '') return [];
  const selected = [...new Set(value.split(',').map((name) => name.trim()).filter(Boolean))];
  for (const name of selected) if (!Object.hasOwn(CAPABILITY_PROFILES, name)) fail(`Unknown capability "${name}". Choose one of: ${Object.keys(CAPABILITY_PROFILES).join(', ')}.`);
  return selected;
}
function firstGlyph(value) { return Array.from(value.trim())[0]?.toUpperCase() ?? 'A'; }
function isValidHost(value) { try { if (!value || /[/:?#@]/.test(value)) return false; const parsed = new URL(`https://${value}`); return parsed.hostname === value.toLowerCase() && !parsed.port && parsed.pathname === '/'; } catch { return false; } }
function fail(message) { console.error(message); process.exit(1); }
