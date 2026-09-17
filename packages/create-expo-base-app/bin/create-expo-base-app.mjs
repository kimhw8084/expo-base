#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { renderGoldenCatalog } from '../../../scripts/golden-catalog-lib.mjs';
import { renderGoldenPatterns } from '../../../scripts/golden-pattern-lib.mjs';

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
if (!['standalone', 'workspace'].includes(args.mode)) fail('--mode must be standalone or workspace.');

const CAPABILITY_PROFILES = Object.freeze({
  'secure-storage': {
    workspace: '@expo-base/secure-storage', external: ['expo-secure-store'], plugins: ['expo-secure-store'],
    imports: ["import { ExpoSecureStorage } from '@expo-base/secure-storage';"],
    entries: (config) => [`secureStorage: new ExpoSecureStorage({ namespace: ${JSON.stringify(config.identifier)} })`],
  },
  preferences: {
    workspace: '@expo-base/preferences', external: ['@react-native-async-storage/async-storage'], plugins: [],
    imports: ["import { DevicePreferences } from '@expo-base/preferences';"],
    entries: (config) => [`preferences: new DevicePreferences({ namespace: ${JSON.stringify(config.slug)} })`],
  },
  'runtime-signals': {
    workspace: '@expo-base/runtime-capabilities', external: ['expo-network'], plugins: [],
    imports: ["import { ExpoConnectivity, ReactNativeAppLifecycle } from '@expo-base/runtime-capabilities';"],
    entries: () => ['connectivity: new ExpoConnectivity()', 'appLifecycle: new ReactNativeAppLifecycle()'],
  },
  sharing: {
    workspace: '@expo-base/sharing', external: ['expo-clipboard', 'expo-sharing'], plugins: [],
    imports: ["import { ExpoClipboard, ExpoSharing } from '@expo-base/sharing/runtime';"],
    entries: () => ['clipboard: new ExpoClipboard()', 'sharing: new ExpoSharing()'],
  },
  media: {
    workspace: '@expo-base/media', external: ['expo-camera', 'expo-document-picker', 'expo-image-picker'], plugins: ['expo-camera', 'expo-document-picker', 'expo-image-picker'],
    imports: ["import { ExpoDocumentPicker, ExpoMediaAcquisition } from '@expo-base/media';"],
    entries: () => ['documents: new ExpoDocumentPicker()', 'media: new ExpoMediaAcquisition()'],
  },
  'local-auth': {
    workspace: '@expo-base/local-auth', external: ['expo-local-authentication'], plugins: ['expo-local-authentication'],
    imports: ["import { ExpoLocalAuthentication } from '@expo-base/local-auth';"],
    entries: () => ['localAuthentication: new ExpoLocalAuthentication()'],
  },
  notifications: {
    workspace: '@expo-base/notifications', external: ['expo-notifications'], plugins: ['expo-notifications'],
    imports: ["import { ExpoNotifications } from '@expo-base/notifications';"],
    entries: () => ['notifications: new ExpoNotifications()'],
  },
  updates: {
    workspace: '@expo-base/updates', external: ['expo-updates'], plugins: ['expo-updates'],
    imports: ["import { ExpoUpdates } from '@expo-base/updates';"],
    entries: () => ['updates: new ExpoUpdates()'],
  },
  device: {
    workspace: '@expo-base/device', external: ['expo-application', 'expo-device'], plugins: [],
    imports: ["import { ExpoDevice } from '@expo-base/device';"],
    entries: () => ['device: new ExpoDevice()'],
  },
  haptics: {
    workspace: '@expo-base/haptics', external: ['expo-haptics'], plugins: [],
    imports: ["import { ExpoHaptics } from '@expo-base/haptics';"],
    entries: () => ['haptics: new ExpoHaptics()'],
  },
  observability: {
    workspace: '@expo-base/observability', external: [], plugins: [],
    imports: ["import { NoopObservability } from '@expo-base/observability';"],
    entries: () => ['observability: new NoopObservability()'],
  },
});

const REQUIRED_APP_PACKAGES = Object.freeze([
  '@expo-base/adapters', '@expo-base/auth', '@expo-base/authorization', '@expo-base/capabilities',
  '@expo-base/form-rhf', '@expo-base/linking', '@expo-base/linking-expo', '@expo-base/navigation-router',
  '@expo-base/platform', '@expo-base/runtime', '@expo-base/server-state', '@expo-base/session-security',
  '@expo-base/tokens', '@expo-base/ui',
]);

const selectedCapabilities = resolveCapabilityProfiles(args.capabilities);
const root = process.cwd();
const compatibilityPath = path.join(root, 'expo-base.compatibility.json');
if (!fs.existsSync(compatibilityPath)) fail('expo-base.compatibility.json is required at the workspace root.');
const compatibility = JSON.parse(fs.readFileSync(compatibilityPath, 'utf8'));
const destination = path.resolve(root, args.directory ?? path.join('apps', args.slug));
if (fs.existsSync(destination) && fs.readdirSync(destination).length > 0 && !args.force) fail(`Destination is not empty: ${destination}. Use --force to replace it.`);
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(path.join(destination, 'app'), { recursive: true });
const identifier = `com.expobase.${args.slug.replaceAll('-', '')}`;
const shortName = firstGlyph(args.name);
const workspaceRelative = path.relative(destination, root).split(path.sep).join('/') || '.';
const sourceMetadata = readSourceMetadata(root);
const files = args.mode === 'standalone'
  ? buildStandaloneFiles({ ...args, identifier, shortName, capabilities: selectedCapabilities, sourceMetadata }, compatibility, root)
  : buildWorkspaceFiles({ ...args, identifier, shortName, workspaceRelative, capabilities: selectedCapabilities, sourceMetadata }, compatibility);
for (const [relative, content] of Object.entries(files)) {
  const target = path.join(destination, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
console.log(`Created Expo Base ${args.mode} app at ${path.relative(root, destination) || destination}`);
console.log(`Brand: ${args.name} · Accent: ${args.accent}`);
if (selectedCapabilities.length) console.log(`Capabilities: ${selectedCapabilities.join(', ')}`);
console.log(args.mode === 'standalone' ? 'Next: cd into the generated repository, run npm install, then npm run verify.' : 'Next: npm install, then npm run start -w ' + JSON.stringify(`@apps/${args.slug}`));

function buildWorkspaceFiles(config, versions) {
  const capabilityProfiles = config.capabilities.map((name) => CAPABILITY_PROFILES[name]);
  const capabilityDependencies = Object.fromEntries(capabilityProfiles.flatMap((profile) => [[profile.workspace, '*'], ...profile.external.map((dependency) => [dependency, versions[dependency]])]));
  const capabilityPlugins = [...new Set(capabilityProfiles.flatMap((profile) => profile.plugins))];
  const appPlugins = [['expo-router', { asyncRoutes: { web: 'production' } }], ...capabilityPlugins];
  const capabilityImports = capabilityProfiles.flatMap((profile) => profile.imports);
  const capabilityEntries = capabilityProfiles.flatMap((profile) => profile.entries(config));
  const pkg = {
    name: `@apps/${config.slug}`,
    version: '1.0.0', private: true, main: 'index.ts',
    scripts: { start: 'expo start --dev-client', web: 'expo start --web', prebuild: 'expo prebuild --clean', 'check:golden-architecture': `node ${config.workspaceRelative}/scripts/check-golden-architecture.mjs --config golden-architecture.config.json`, 'scaffold:screen': `node ${config.workspaceRelative}/packages/create-expo-base-app/bin/scaffold-expo-base-screen.mjs --app .` },
    dependencies: {
      '@expo-base/adapters': '*', '@expo-base/auth': '*', '@expo-base/authorization': '*', '@expo-base/capabilities': '*', '@expo-base/form-rhf': '*', '@expo-base/linking': '*', '@expo-base/linking-expo': '*', '@expo-base/navigation-router': '*', '@expo-base/platform': '*', '@expo-base/runtime': '*', '@expo-base/server-state': '*', '@expo-base/session-security': '*', '@expo-base/tokens': '*', '@expo-base/ui': '*',
      expo: versions.expo, 'expo-linking': versions['expo-linking'], 'expo-router': versions['expo-router'], react: versions.react, 'react-dom': versions['react-dom'], 'react-hook-form': versions['react-hook-form'], 'react-native': versions['react-native'], 'react-native-keyboard-controller': versions['react-native-keyboard-controller'], 'react-native-nitro-modules': versions['react-native-nitro-modules'], 'react-native-reanimated': versions['react-native-reanimated'], 'react-native-svg': versions['react-native-svg'], 'react-native-unistyles': versions['react-native-unistyles'], 'react-native-web': versions['react-native-web'], 'react-native-worklets': versions['react-native-worklets'], 'lucide-react-native': versions['lucide-react-native'], ...capabilityDependencies
    },
    devDependencies: { 'babel-preset-expo': versions['babel-preset-expo'], typescript: versions.typescript }
  };
  return {
    'package.json': JSON.stringify(pkg, null, 2) + '\n',
    'README.md': `# ${config.name}\n\nGenerated from Expo Base.\n\n## Start\n\n- \`npm install\` from the workspace root\n- \`npm run start -w @apps/${config.slug}\`\n- \`npm run web -w @apps/${config.slug}\`\n\n## Golden development contract\n\nRead \`AGENTS.md\`, which forwards to the canonical workspace contract. Start feature work from \`${config.workspaceRelative}/docs/GOLDEN_CATALOG.md\`, \`${config.workspaceRelative}/docs/GOLDEN_WORKFLOWS.md\`, and their machine-readable catalogs. Use \`npm run scaffold:screen -- --name customers --pattern data-workspace\` for a standard route, then replace only explicit domain TODOs. Run \`npm run check:golden-architecture\` before broader certification. Product screens should compose Expo Base components and patterns rather than introduce raw geometry, raw platform APIs, direct networking, persistence, or local overlay/feedback mechanics. Remote data uses a service adapter plus \`@expo-base/server-state\`; \`serverState.ts\` demonstrates deterministic key ownership.\n\n## Optional capabilities\n\nThis app selected: \`${config.capabilities.join(', ') || 'none (minimal kernel profile)'}\`. Root registrations are in \`capabilities.ts\`. Add or change a capability only through the root composition and follow \`${config.workspaceRelative}/docs/RUNTIME_CAPABILITIES.md\`; do not import Expo capability modules in a route.\n\nBrand configuration lives in \`brand.ts\`.${config.linkHost ? `\n\nVerified web-link host requested: \`${config.linkHost}\`. You must still publish the Android Digital Asset Links file and iOS AASA file on that domain before App/Universal Links can verify.` : ''}\n`,
    'AGENTS.md': `# Generated Expo Base app contract\n\nThis app inherits the canonical workspace contract at \`${config.workspaceRelative}/AGENTS.md\`. Read that file before changing a route or shared integration.\n\nUse \`${config.workspaceRelative}/docs/GOLDEN_CATALOG.md\`, \`${config.workspaceRelative}/docs/GOLDEN_WORKFLOWS.md\`, \`${config.workspaceRelative}/golden.catalog.json\`, and \`${config.workspaceRelative}/golden.patterns.json\` to choose owners. For a standard feature, use \`npm run scaffold:screen -- --name route-name --pattern pattern-id\`; do not create a new page architecture when a Golden pattern matches. Product routes in \`app/\` own domain logic, models, copy, and unique visualizations; they do not own raw geometry, React Native controls, platform branches, direct networking/persistence, overlays, feedback anatomy, query caches, retry loops, or optimistic rollback bookkeeping. Remote data uses a service adapter plus \`@expo-base/server-state\`.\n\nOptional capability profile: \`${config.capabilities.join(', ') || 'minimal'}\`. Root registrations live in \`capabilities.ts\`; add a selected Expo Base capability there, never a direct Expo capability import in a feature route. Read \`${config.workspaceRelative}/docs/RUNTIME_CAPABILITIES.md\` before changing capability selection.\n\nRun \`npm run check:golden-architecture\` after feature work. Add a narrow, rationale-bearing entry to \`golden-architecture.config.json\` only for a reviewed exception.\n`,
    'golden-architecture.config.json': JSON.stringify({ schemaVersion: 1, extends: `${config.workspaceRelative}/golden-architecture.config.json`, featureRoots: ['app'], excludePaths: ['app/_layout.tsx', 'app/+html.tsx', 'app/+native-intent.tsx'], allowlists: [] }, null, 2) + '\n',
    'expo-base.capabilities.json': JSON.stringify({ schemaVersion: 1, capabilities: config.capabilities }, null, 2) + '\n',
    'expo-base.routes.json': JSON.stringify({ schemaVersion: 1, authenticated: [], public: [] }, null, 2) + '\n',
    'routes.ts': `// Generated route registry. Add product routes with npm run scaffold:screen.\nexport const expoBaseRoutes = { authenticated: [] as readonly string[], public: [] as readonly string[] } as const;\n`,
    'index.ts': `import './unistyles';\nimport 'expo-router/entry';\n`,
    'brand.ts': `import { brandPresets, type ExpoBaseBrand } from '@expo-base/tokens';\n\nexport const appBrand: ExpoBaseBrand = {\n  ...brandPresets.${config.accent},\n  name: ${JSON.stringify(config.name)},\n  shortName: ${JSON.stringify(config.shortName)},\n};\n`,
    'unistyles.ts': `import { Appearance, Platform } from 'react-native';\nimport { StyleSheet } from 'react-native-unistyles';\nimport { breakpoints, createExpoBaseThemes } from '@expo-base/tokens';\nimport { appBrand } from './brand';\n\nconst themes = createExpoBaseThemes(appBrand);\ntype AppThemes = typeof themes;\ntype AppBreakpoints = typeof breakpoints;\ndeclare module 'react-native-unistyles' { export interface UnistylesThemes extends AppThemes {} export interface UnistylesBreakpoints extends AppBreakpoints {} }\nStyleSheet.configure({ themes, breakpoints, settings: { initialTheme: Platform.OS === 'web' ? 'light' : Appearance.getColorScheme() === 'dark' ? 'dark' : 'light', nativeBreakpointsMode: 'points' } });\n`,
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
import { ExpoBaseWebAccessibilityStyles } from '@expo-base/ui';

export default function Root({ children }: PropsWithChildren) {
  return <html lang="en"><head><meta charSet="utf-8" /><meta httpEquiv="X-UA-Compatible" content="IE=edge" /><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" /><ScrollViewStyleReset /><ExpoBaseWebAccessibilityStyles /></head><body>{children}</body></html>;
}
`,
    'app/+not-found.tsx': `import { useExpoBaseRouter } from '@expo-base/navigation-router';
import { Page, PageHeader, ScrollScreen, Section, StateView } from '@expo-base/ui';

export default function NotFoundScreen() {
  const router = useExpoBaseRouter();
  return <ScrollScreen><Page width="reading" header={<PageHeader eyebrow="PAGE NOT FOUND" title="This destination does not exist" description="The link may be outdated or the address may have been entered incorrectly." />}><Section><StateView kind="error" title="We could not find that page" message="Return to the application home to continue safely." actionLabel="Return home" onAction={() => router.replace('/')} /></Section></Page></ScrollScreen>;
}
`,
    'app.config.ts': `import type { ExpoConfig } from 'expo/config';\nimport { appBrand } from './brand';\n\ntype ExpoBaseConfig = ExpoConfig & { newArchEnabled?: boolean };\nconst config: ExpoBaseConfig = {\n  name: appBrand.name, slug: ${JSON.stringify(config.slug)}, version: '1.0.0', orientation: 'default', scheme: ${JSON.stringify(config.slug)}, userInterfaceStyle: 'automatic', newArchEnabled: true,\n  ios: { bundleIdentifier: ${JSON.stringify(config.identifier)}${config.linkHost ? `, associatedDomains: ['applinks:${config.linkHost}']` : ''} }, android: { package: ${JSON.stringify(config.identifier)}${config.linkHost ? `, intentFilters: [{ action: 'VIEW', autoVerify: true, data: [{ scheme: 'https', host: ${JSON.stringify(config.linkHost)} }], category: ['BROWSABLE', 'DEFAULT'] }]` : ''} },\n  web: { output: 'static' }, plugins: ${JSON.stringify(appPlugins)}, experiments: { typedRoutes: true },\n};\nexport default config;\n`,
    'babel.config.js': `module.exports = function (api) { api.cache(true); return { presets: ['babel-preset-expo'], plugins: [['react-native-unistyles/plugin', { root: 'app', autoProcessImports: ['@expo-base/ui'] }]] }; };\n`,
    'tsconfig.json': JSON.stringify({ extends: '../../tsconfig.base.json', compilerOptions: { noEmit: true, types: ['react', 'react-native'] }, include: ['app/**/*.ts', 'app/**/*.tsx', '*.ts'] }, null, 2) + '\n',
    'app/_layout.tsx': `import '../unistyles';
import { useUnistyles } from 'react-native-unistyles';
import { ProtectedRouterStack, useCaptureReturnIntent } from '@expo-base/navigation-router';
import { ExpoBaseRuntimeProvider, ExpoBaseSessionSecurityBootstrap, useExpoBaseAuth, useExpoBaseAuthAccess } from '@expo-base/runtime';
import { LoadingState, Screen } from '@expo-base/ui';
import { services } from '../services';
import { linking } from '../linking';
import { authReturnIntent } from '../auth';
import { sessionSecurity } from '../sessionSecurity';
import { capabilities } from '../capabilities';
import { ThemeRuntimeSync } from '../ThemeRuntimeSync';
import { expoBaseRoutes } from '../routes';

function RootNavigation() {
  const { theme } = useUnistyles();
  const auth = useExpoBaseAuth();
  const access = useExpoBaseAuthAccess();
  useCaptureReturnIntent({ access, capture: auth.captureReturnIntent, publicPaths: ['/sign-in', '/session-loading', '/session-error', '/link-error', '/unlock'] });
  if (auth.status === 'loading') return <Screen><LoadingState label="Restoring account session…" /></Screen>;
  return <ProtectedRouterStack access={access} routes={{ always: ['link-error', '+not-found', ...expoBaseRoutes.public], authenticated: ['index', ...expoBaseRoutes.authenticated], signedOut: ['sign-in'], booting: ['session-loading'], error: ['session-error'], locked: ['unlock'] }} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background.canvas } }} />;
}

export default function RootLayout() {
  return <><ThemeRuntimeSync /><ExpoBaseRuntimeProvider i18n={{ fallbackLocale: 'en-US' }} capabilities={capabilities} services={services} linking={linking} auth={{ returnIntentChannel: authReturnIntent }} sessionSecurity={{ adapter: sessionSecurity }}><ExpoBaseSessionSecurityBootstrap fallback={<Screen><LoadingState label="Restoring secure session…" /></Screen>}><RootNavigation /></ExpoBaseSessionSecurityBootstrap></ExpoBaseRuntimeProvider></>;
}
`,
    'app/index.tsx': `import { ScrollScreen } from '@expo-base/ui';\nimport { Button, Card } from '@expo-base/ui';\nimport { Text, VStack } from '@expo-base/ui';\nimport { DashboardLayout } from '@expo-base/ui';\nimport { Metric, MetricGroup } from '@expo-base/ui';\nimport { appBrand } from '../brand';\n\nexport default function HomeScreen() {\n  const metrics = <MetricGroup><Metric label="Primary metric" value="$8,420" trend="+14.2%" trendTone="positive" /><Metric label="Secondary metric" value="24" trend="Current" /></MetricGroup>;\n  return <ScrollScreen><DashboardLayout eyebrow={appBrand.name.toUpperCase()} title="Production foundation" description="This screen is composed from portable Expo Base patterns without feature-owned geometry." metrics={metrics} primary={<Card variant="elevated"><VStack gap="lg"><Text variant="h2">Primary workspace</Text><Text tone="secondary">Replace this content with your first product vertical slice.</Text><Button label="Primary action" onPress={() => {}} /></VStack></Card>} secondary={<Card variant="subtle"><VStack gap="md"><Text variant="h3">Context</Text><Text tone="secondary">Adaptive layouts determine where this panel belongs.</Text></VStack></Card>} /></ScrollScreen>;\n}\n`,
    'app/sign-in.tsx': `import { useState } from 'react';
import { Button, Card, ScrollScreen, Text, TextField, VStack } from '@expo-base/ui';
import { useExpoBaseRouter } from '@expo-base/navigation-router';
import { useExpoBaseAuth } from '@expo-base/runtime';

export default function SignInScreen() {
  const auth = useExpoBaseAuth();
  const router = useExpoBaseRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = async () => { if (await auth.signIn({ email, password })) router.replace(auth.consumeReturnIntent('/')); };
  return <ScrollScreen><Card><VStack gap="lg"><Text variant="h2">Sign in</Text><Text tone="secondary">Protected routes remain unavailable until authentication is confirmed.</Text><TextField id="email" label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" /><TextField id="password" label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />{auth.errorCode === 'sign_in_failed' ? <Text tone="negative">Sign-in could not be completed. Try again.</Text> : null}<Button label="Sign in" loading={auth.actionStatus === 'signing-in'} onPress={() => { void submit(); }} /></VStack></Card></ScrollScreen>;
}
`,
    'app/session-loading.tsx': `import { LoadingState, Screen } from '@expo-base/ui';
export default function SessionLoadingScreen() { return <Screen><LoadingState label="Restoring secure session…" /></Screen>; }
`,
    'app/session-error.tsx': `import { Screen, StateView } from '@expo-base/ui';
import { useExpoBaseAuth } from '@expo-base/runtime';
export default function SessionErrorScreen() { const auth = useExpoBaseAuth(); return <Screen><StateView kind="error" title="Session could not be restored" message="Protected information remains hidden until the session check succeeds." actionLabel="Retry" actionLoading={auth.actionStatus === 'refreshing'} onAction={() => { void auth.refresh(); }} /></Screen>; }
`,
    'app/unlock.tsx': `import { useState } from 'react';
import { Button, Card, ScrollScreen, Text, VStack } from '@expo-base/ui';
import { useExpoBaseAuth, useExpoBaseSessionSecurity } from '@expo-base/runtime';
import { useExpoBaseRouter } from '@expo-base/navigation-router';

export default function UnlockScreen() {
  const security = useExpoBaseSessionSecurity();
  const auth = useExpoBaseAuth();
  const router = useExpoBaseRouter();
  const [result, setResult] = useState<'idle' | 'denied' | 'error'>('idle');
  const unlock = async () => { const next = await security.requestUnlock(); if (next === 'unlocked') { setResult('idle'); router.replaceResolvedPath(auth.consumeReturnIntent('/')); return; } setResult(next); };
  return <ScrollScreen><Card><VStack gap="lg"><Text variant="h2">Unlock session</Text><Text tone="secondary">Protected content remains hidden until the local session-security adapter approves access.</Text>{security.status === 'error' || result === 'error' ? <Text tone="negative">Session security could not be verified. Protected content remains locked.</Text> : null}{result === 'denied' ? <Text tone="negative">Unlock was not approved.</Text> : null}<Button label="Unlock" loading={security.status === 'loading'} onPress={() => { void unlock(); }} /></VStack></Card></ScrollScreen>;
}
`,
    'auth.ts': `import { createReturnIntentChannel } from '@expo-base/auth';\n\nexport const authReturnIntent = createReturnIntentChannel({ excludedPrefixes: ['/sign-in', '/session-loading', '/session-error', '/link-error', '/unlock', '/auth'] });\n`,
    'sessionSecurity.ts': `import { MemorySessionSecurityAdapter } from '@expo-base/session-security';\n\n// Replace with a device-backed adapter before production launch.\nexport const sessionSecurity = new MemorySessionSecurityAdapter();\n`,
    'linking.ts': `import { createExpoBaseLinkingRuntime } from '@expo-base/linking';\nimport { ExpoExternalNavigationAdapter } from '@expo-base/linking-expo';\nimport { authReturnIntent } from './auth';\n\nexport const linking = createExpoBaseLinkingRuntime({\n  adapter: new ExpoExternalNavigationAdapter(),\n  onIncomingRoute: (route) => { authReturnIntent.capture(route); },\n  externalPolicy: { allowHttps: true, allowedHosts: ${config.linkHost ? `[{ host: ${JSON.stringify(config.linkHost)}, allowSubdomains: false }]` : '[]'}, allowMailto: false, allowTel: false },\n  incomingPolicy: { appSchemes: [${JSON.stringify(config.slug)}], universalLinkHosts: ${config.linkHost ? `[{ host: ${JSON.stringify(config.linkHost)}, allowSubdomains: false }]` : '[]'}, rejectedRoute: '/link-error' },\n});\n`,
    'app/+native-intent.tsx': `import { linking } from '../linking';\n\nexport function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {\n  try { return linking.redirectIncoming(path, { initial }); }\n  catch { return '/link-error'; }\n}\n`,
    'app/link-error.tsx': `import { Button, Card, ScrollScreen, Text, VStack } from '@expo-base/ui';\nimport { useExpoBaseRouter } from '@expo-base/navigation-router';\n\nexport default function LinkErrorScreen() {\n  const router = useExpoBaseRouter();\n  return <ScrollScreen><Card><VStack gap=\"lg\"><Text variant=\"h2\">This link cannot be opened safely</Text><Text tone=\"secondary\">The destination is malformed, unsupported, or not trusted by this application.</Text><Button label=\"Return home\" onPress={() => router.replace('/')} /></VStack></Card></ScrollScreen>;\n}\n`,
    'services.ts': `import { createDemoServices } from '@expo-base/adapters';\n\n// Replace this explicit demo composition with production adapters before launch.\nexport const services = createDemoServices();\n`,
    'serverState.ts': `import { expoBaseQueryKey, type ExpoBaseQueryValue } from '@expo-base/server-state';\n\n// Keep product query identity here; loaders remain behind services/adapters.\nexport const appQueryKeys = {\n  entity: (id: string) => expoBaseQueryKey.entity('app-entities', id),\n  list: (filters: ExpoBaseQueryValue = {}) => expoBaseQueryKey.list('app-entities', filters),\n};\n`,
    'capabilities.ts': `import { createExpoBaseCapabilityRegistry } from '@expo-base/capabilities';\n${capabilityImports.join('\n')}\n\n// Generated capability profile: ${config.capabilities.join(', ') || 'minimal kernel (no native capability dependencies)'}.\n// Configure adapters here, never inside a product route.\nexport const capabilities = createExpoBaseCapabilityRegistry({${capabilityEntries.length ? `\n  ${capabilityEntries.join(',\n  ')},\n` : ''}});\n`,
    '.env.example': '# Product-specific environment variables belong here. The design system has no backend dependency.\n'
  };
}

function buildStandaloneFiles(config, versions, sourceRoot) {
  const files = buildWorkspaceFiles({ ...config, workspaceRelative: '.' }, versions);
  const packageNames = collectInternalPackageNames(sourceRoot, [...REQUIRED_APP_PACKAGES, ...config.capabilities.map((name) => CAPABILITY_PROFILES[name].workspace)]);
  const catalog = buildStandaloneCatalog(sourceRoot, new Set([...packageNames, '@expo-base/create-app']));
  const patterns = { ...readJsonFile(path.join(sourceRoot, 'golden.patterns.json')), scaffoldApp: '.' };
  const appPackage = JSON.parse(files['package.json']);
  const rootPackage = {
    ...appPackage,
    name: `@apps/${config.slug}`,
    workspaces: ['packages/*'],
    scripts: {
      start: 'expo start --dev-client',
      web: 'expo start --web',
      prebuild: 'expo prebuild --clean',
      typecheck: 'tsc -p tsconfig.json --noEmit',
      'check:golden-architecture': 'node scripts/check-golden-architecture.mjs --config golden-architecture.config.json',
      'check:golden-patterns': 'node scripts/check-golden-patterns.mjs',
      'golden:catalog:write': 'node scripts/generate-golden-catalog-docs.mjs --write',
      'golden:patterns:write': 'node scripts/generate-golden-pattern-docs.mjs --write',
      'scaffold:screen': 'node packages/create-expo-base-app/bin/scaffold-expo-base-screen.mjs --app .',
      verify: 'npm run typecheck && npm run check:golden-patterns && npm run check:golden-architecture',
    },
  };
  files['package.json'] = JSON.stringify(rootPackage, null, 2) + '\n';
  files['README.md'] = standaloneReadme(config);
  files['AGENTS.md'] = standaloneAgents(config);
  files['golden-architecture.config.json'] = JSON.stringify({
    schemaVersion: 1,
    catalog: 'golden.catalog.json',
    featureRoots: ['app'],
    excludePaths: ['app/_layout.tsx', 'app/+html.tsx', 'app/+native-intent.tsx'],
    allowlists: [],
  }, null, 2) + '\n';
  files['tsconfig.base.json'] = fs.readFileSync(path.join(sourceRoot, 'tsconfig.base.json'), 'utf8');
  files['tsconfig.json'] = JSON.stringify({ extends: './tsconfig.base.json', compilerOptions: { noEmit: true, types: ['react', 'react-native'] }, include: ['app/**/*.ts', 'app/**/*.tsx', '*.ts'] }, null, 2) + '\n';
  files['golden.catalog.json'] = JSON.stringify(catalog, null, 2) + '\n';
  files['golden.patterns.json'] = JSON.stringify(patterns, null, 2) + '\n';
  files['expo-base.api.json'] = JSON.stringify(buildStandaloneApi(sourceRoot, new Set(packageNames)), null, 2) + '\n';
  files['docs/GOLDEN_CATALOG.md'] = renderGoldenCatalog(catalog);
  files['docs/GOLDEN_WORKFLOWS.md'] = renderGoldenPatterns(patterns);
  files['.expo-base/source.json'] = JSON.stringify(config.sourceMetadata, null, 2) + '\n';

  for (const script of [
    'check-golden-architecture.mjs', 'golden-architecture-lib.mjs', 'golden-catalog-lib.mjs',
    'golden-pattern-lib.mjs', 'check-golden-patterns.mjs', 'generate-golden-catalog-docs.mjs',
    'generate-golden-pattern-docs.mjs',
  ]) files[`scripts/${script}`] = fs.readFileSync(path.join(sourceRoot, 'scripts', script), 'utf8');
  for (const document of standaloneDocumentationPaths(catalog)) {
    if (!files[document]) files[document] = fs.readFileSync(path.join(sourceRoot, document), 'utf8');
  }

  for (const packageName of packageNames) addVendoredPackage(files, sourceRoot, packageName, packageNames, versions);
  addScaffolderPackage(files, sourceRoot);
  return files;
}

function collectInternalPackageNames(sourceRoot, roots) {
  const manifests = new Map();
  const packagesRoot = path.join(sourceRoot, 'packages');
  for (const entry of fs.readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(packagesRoot, entry.name, 'package.json');
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = readJsonFile(manifestPath);
    if (manifest?.name?.startsWith('@expo-base/')) manifests.set(manifest.name, { manifest });
  }
  const selected = new Set();
  const queue = [...roots];
  while (queue.length) {
    const name = queue.shift();
    if (selected.has(name)) continue;
    const packageInfo = manifests.get(name);
    if (!packageInfo) throw new Error(`Cannot vendor internal Expo Base package "${name}"; no source package manifest exists.`);
    selected.add(name);
    for (const dependency of Object.keys({ ...(packageInfo.manifest.dependencies ?? {}), ...(packageInfo.manifest.optionalDependencies ?? {}), ...(packageInfo.manifest.peerDependencies ?? {}) })) {
      if (dependency.startsWith('@expo-base/')) queue.push(dependency);
    }
  }
  return [...selected].sort();
}

function addVendoredPackage(files, sourceRoot, packageName, packageNames, versions) {
  const sourceDirectory = packageDirectory(sourceRoot, packageName);
  const targetDirectory = path.join('packages', path.basename(sourceDirectory));
  copyTree(files, sourceDirectory, targetDirectory, (relative) => relative !== 'package.json');
  const manifest = readJsonFile(path.join(sourceDirectory, 'package.json'));
  files[path.join(targetDirectory, 'package.json')] = JSON.stringify(normalizeVendoredManifest(manifest, packageNames, versions), null, 2) + '\n';
}

function addScaffolderPackage(files, sourceRoot) {
  const sourceDirectory = path.join(sourceRoot, 'packages', 'create-expo-base-app');
  files['packages/create-expo-base-app/package.json'] = JSON.stringify({
    name: '@expo-base/create-app', version: '1.0.0', private: true, type: 'module',
    bin: { 'scaffold-expo-base-screen': 'bin/scaffold-expo-base-screen.mjs' },
  }, null, 2) + '\n';
  for (const relative of ['bin/scaffold-expo-base-screen.mjs', 'lib/screen-scaffold.mjs']) {
    files[path.join('packages/create-expo-base-app', relative)] = fs.readFileSync(path.join(sourceDirectory, relative), 'utf8');
  }
}

function normalizeVendoredManifest(manifest, packageNames, versions) {
  const normalized = { ...manifest };
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    if (!normalized[field]) continue;
    normalized[field] = Object.fromEntries(Object.entries(normalized[field]).map(([name, value]) => {
      if (name.startsWith('@expo-base/')) {
        if (!packageNames.includes(name)) throw new Error(`Vendored package ${manifest.name} requires internal package ${name}, but it was not selected.`);
        return [name, '*'];
      }
      if (versions[name] === undefined) throw new Error(`Compatibility authority has no version for external dependency ${name} used by ${manifest.name}.`);
      return [name, versions[name]];
    }));
  }
  return normalized;
}

function buildStandaloneCatalog(sourceRoot, packageNames) {
  const source = readJsonFile(path.join(sourceRoot, 'golden.catalog.json'));
  const items = (source.items ?? []).filter((item) => packageNames.has(item.package));
  const itemIds = new Set(items.map((item) => item.id));
  const discoveryChallenges = (source.discoveryChallenges ?? []).filter((challenge) => challenge.requiredItems.every((id) => itemIds.has(id)));
  return {
    ...source,
    items,
    ownership: (source.ownership ?? []).filter((owner) => owner.id !== 'reference'),
    discoveryChallenges,
    requiredDiscoveryIntents: discoveryChallenges.map((challenge) => challenge.intent),
  };
}

function buildStandaloneApi(sourceRoot, packageNames) {
  const source = readJsonFile(path.join(sourceRoot, 'expo-base.api.json'));
  const packages = Object.fromEntries(Object.entries(source.packages ?? {}).filter(([name]) => packageNames.has(`@expo-base/${name}`)));
  return { ...source, packages, symbolCount: Object.values(packages).reduce((total, symbols) => total + symbols.length, 0) };
}

function standaloneDocumentationPaths(catalog) {
  return [...new Set([
    'docs/GOLDEN_PATTERNS.md', 'docs/GOLDEN_TEMPLATE_AUDIT.md',
    ...(catalog.ownership ?? []).map((owner) => owner.docs),
    ...(catalog.items ?? []).map((item) => item.recipeReference),
    catalog.audit,
  ].filter(Boolean))];
}

function copyTree(files, sourceDirectory, targetDirectory, include = () => true) {
  const walk = (current, relative = '') => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (['node_modules', '.git', '.expo', 'dist'].includes(entry.name)) continue;
      const nextRelative = path.join(relative, entry.name);
      const source = path.join(current, entry.name);
      if (entry.isDirectory()) walk(source, nextRelative);
      else if (include(nextRelative)) files[path.join(targetDirectory, nextRelative)] = fs.readFileSync(source);
    }
  };
  walk(sourceDirectory);
}

function packageDirectory(sourceRoot, packageName) {
  const directoryName = packageName.slice('@expo-base/'.length);
  return path.join(sourceRoot, 'packages', directoryName);
}

function readSourceMetadata(sourceRoot) {
  const rootPackage = readJsonFile(path.join(sourceRoot, 'package.json'));
  const generatorPackage = readJsonFile(path.join(sourceRoot, 'packages/create-expo-base-app/package.json'));
  let sourceCommit;
  try {
    sourceCommit = execFileSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch (error) {
    throw new Error(`Unable to determine the Expo Base source commit: ${error instanceof Error ? error.message : String(error)}`);
  }
  let sourceRepository = 'https://github.com/kimhw8084/expo-base';
  try {
    const remote = execFileSync('git', ['-C', sourceRoot, 'config', '--get', 'remote.origin.url'], { encoding: 'utf8' }).trim();
    if (remote) sourceRepository = normalizeRepositoryUrl(remote);
  } catch { /* A source checkout without an origin still gets canonical provenance. */ }
  return {
    schemaVersion: 1,
    sourceRepository,
    sourceCommit,
    sourceVersion: rootPackage?.version ?? 'unknown',
    generatorVersion: generatorPackage?.version ?? 'unknown',
  };
}

function normalizeRepositoryUrl(value) {
  if (value.startsWith('git@github.com:')) return `https://github.com/${value.slice('git@github.com:'.length).replace(/\.git$/, '')}`;
  return value.replace(/\.git$/, '');
}

function standaloneReadme(config) {
  return `# ${config.name}\n\nThis is a standalone Expo Base product repository. It contains the selected Expo Base source packages and local Golden tooling; it does not depend on the Expo Base source workspace.\n\n## Start\n\n\`\`\`sh\nnpm install\nnpm run verify\nnpm run start\n\`\`\`\n\n## Product ownership\n\nProduct code owns routes in \`app/\`, domain models and state, product copy, branding in \`brand.ts\`, backend/service adapters, authorization choices, and unique visualizations. Replace the generated demo adapters before production use.\n\nExpo Base owns semantic UI and layout, responsive composition, navigation/auth/session boundaries, server-state ownership, root capability registration, accessibility, overlays, and feedback anatomy. Compose the vendored \`@expo-base/*\` owners instead of recreating those platform rules in routes.\n\n## Local Golden workflow\n\nStart with \`golden.catalog.json\`, \`golden.patterns.json\`, \`docs/GOLDEN_CATALOG.md\`, and \`docs/GOLDEN_WORKFLOWS.md\`. For a scaffoldable route run \`npm run scaffold:screen -- --name customers --pattern data-workspace\`; add \`--capabilities runtime-signals\` only when the selected capability manifest already includes it. Replace only the scaffold's explicit product TODOs.\n\nSelected capabilities: \`${config.capabilities.join(', ') || 'none (minimal kernel profile)'}\`. Root registrations live in \`capabilities.ts\`.\n\n## Verification\n\n- \`npm run typecheck\`\n- \`npm run check:golden-architecture\`\n- \`npm run check:golden-patterns\`\n- \`npm run verify\`\n`;
}

function standaloneAgents(config) {
  return `# Expo Base product repository contract\n\nThis repository is standalone. Do not look for a parent Expo Base workspace or copy paths from outside this repository. The vendored \`@expo-base/*\` packages and local Golden files are the complete platform contract for this product.\n\n## Ownership\n\nProduct code owns routes, domain models and state, product copy, branding, backend/service adapters, product integrations, authorization choices, and unique visualizations.\n\nExpo Base owns semantic UI and layout, responsive composition, navigation/auth/session boundaries, server-state ownership, root capability registration, accessibility and RTL-safe behavior, overlays, and loading/error/empty/feedback anatomy. Routes should compose those owners rather than own raw geometry, platform APIs, query caches, or overlay mechanics.\n\n## Golden discovery and scaffolding\n\nRead \`golden.catalog.json\`, \`golden.patterns.json\`, \`docs/GOLDEN_CATALOG.md\`, and \`docs/GOLDEN_WORKFLOWS.md\`. For a standard route, run \`npm run scaffold:screen -- --name route-name --pattern pattern-id\`; use \`--public\` for public access and \`--capabilities capability-name\` only for capabilities selected in \`expo-base.capabilities.json\`. Keep domain TODOs in product code and preserve the root runtime/capability composition.\n\nSelected capability profile: \`${config.capabilities.join(', ') || 'minimal'}\`.\n\n## Exact local verification\n\nRun \`npm install\`, then \`npm run typecheck\`, \`npm run check:golden-architecture\`, and \`npm run verify\`. Use \`npm run check:golden-patterns\` when changing the local pattern registry.\n`;
}

function parseArgs(argv) {
  const out = { accent: 'blue', force: false, help: false, mode: 'standalone' };
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
    else if (key === '--mode') out.mode = argv[++index];
    else if (key === '--workspace') out.mode = 'workspace';
    else fail(`Unknown argument: ${key}`);
  }
  return out;
}
function printUsage() { console.log('create-expo-base-app --name "App Name" --slug app-name [--mode standalone|workspace] [--accent blue|violet|green|orange] [--capabilities secure-storage,preferences,runtime-signals,sharing,media,local-auth,notifications,updates,device,haptics,observability] [--directory path] [--link-host app.example.com] [--force]'); }
function resolveCapabilityProfiles(value) {
  if (value === undefined || value.trim() === '') return [];
  const selected = [...new Set(value.split(',').map((name) => name.trim()).filter(Boolean))];
  for (const name of selected) if (!Object.hasOwn(CAPABILITY_PROFILES, name)) fail(`Unknown capability "${name}". Choose one of: ${Object.keys(CAPABILITY_PROFILES).join(', ')}.`);
  return selected;
}
function firstGlyph(value) { return Array.from(value.trim())[0]?.toUpperCase() ?? 'A'; }
function isValidHost(value) { try { if (!value || /[/:?#@]/.test(value)) return false; const parsed = new URL(`https://${value}`); return parsed.hostname === value.toLowerCase() && !parsed.port && parsed.pathname === '/'; } catch { return false; } }
function readJsonFile(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function fail(message) { console.error(message); process.exit(1); }
