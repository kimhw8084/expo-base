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
const files = buildFiles({ ...args, identifier, shortName }, compatibility);
for (const [relative, content] of Object.entries(files)) {
  const target = path.join(destination, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
console.log(`Created Precision Calm app at ${path.relative(root, destination) || destination}`);
console.log(`Brand: ${args.name} · Accent: ${args.accent}`);
console.log('Next: npm install, then npm run start -w ' + JSON.stringify(`@apps/${args.slug}`));

function buildFiles(config, versions) {
  const pkg = {
    name: `@apps/${config.slug}`,
    version: '0.1.0', private: true, main: 'index.ts',
    scripts: { start: 'expo start --dev-client', web: 'expo start --web', prebuild: 'expo prebuild --clean' },
    dependencies: {
      '@precision-calm/adapters': '*', '@precision-calm/auth': '*', '@precision-calm/authorization': '*', '@precision-calm/form-rhf': '*', '@precision-calm/linking': '*', '@precision-calm/linking-expo': '*', '@precision-calm/navigation-router': '*', '@precision-calm/platform': '*', '@precision-calm/runtime': '*', '@precision-calm/tokens': '*', '@precision-calm/ui': '*',
      expo: versions.expo, 'expo-haptics': versions['expo-haptics'], 'expo-linking': versions['expo-linking'], 'expo-router': versions['expo-router'], react: versions.react, 'react-hook-form': versions['react-hook-form'], 'react-native': versions['react-native'], 'react-native-keyboard-controller': versions['react-native-keyboard-controller'], 'react-native-nitro-modules': versions['react-native-nitro-modules'], 'react-native-reanimated': versions['react-native-reanimated'], 'react-native-svg': versions['react-native-svg'], 'react-native-unistyles': versions['react-native-unistyles'], 'react-native-web': versions['react-native-web'], 'react-native-worklets': versions['react-native-worklets'], 'lucide-react-native': versions['lucide-react-native']
    },
    devDependencies: { 'babel-preset-expo': versions['babel-preset-expo'], typescript: versions.typescript }
  };
  return {
    'package.json': JSON.stringify(pkg, null, 2) + '\n',
    'README.md': `# ${config.name}\n\nGenerated from Precision Calm Universal.\n\n## Start\n\n- \`npm install\` from the workspace root\n- \`npm run start -w @apps/${config.slug}\`\n- \`npm run web -w @apps/${config.slug}\`\n\nBrand configuration lives in \`brand.ts\`. Product screens should compose Precision Calm components and patterns rather than introduce raw geometry.${config.linkHost ? `\n\nVerified web-link host requested: \`${config.linkHost}\`. You must still publish the Android Digital Asset Links file and iOS AASA file on that domain before App/Universal Links can verify.` : ''}\n`,
    'index.ts': `import 'expo-router/entry';\nimport './unistyles';\n`,
    'brand.ts': `import { brandPresets, type PrecisionBrand } from '@precision-calm/tokens';\n\nexport const appBrand: PrecisionBrand = {\n  ...brandPresets.${config.accent},\n  name: ${JSON.stringify(config.name)},\n  shortName: ${JSON.stringify(config.shortName)},\n};\n`,
    'unistyles.ts': `import { StyleSheet } from 'react-native-unistyles';\nimport { breakpoints, createPrecisionThemes } from '@precision-calm/tokens';\nimport { appBrand } from './brand';\n\nconst themes = createPrecisionThemes(appBrand);\ntype AppThemes = typeof themes;\ntype AppBreakpoints = typeof breakpoints;\ndeclare module 'react-native-unistyles' { export interface UnistylesThemes extends AppThemes {} export interface UnistylesBreakpoints extends AppBreakpoints {} }\nStyleSheet.configure({ themes, breakpoints, settings: { adaptiveThemes: true, nativeBreakpointsMode: 'points' } });\n`,
    'app.config.ts': `import type { ExpoConfig } from 'expo/config';\nimport { appBrand } from './brand';\n\nconst config: ExpoConfig = {\n  name: appBrand.name, slug: ${JSON.stringify(config.slug)}, version: '0.1.0', orientation: 'default', scheme: ${JSON.stringify(config.slug)}, userInterfaceStyle: 'automatic', newArchEnabled: true,\n  ios: { bundleIdentifier: ${JSON.stringify(config.identifier)}${config.linkHost ? `, associatedDomains: ['applinks:${config.linkHost}']` : ''} }, android: { package: ${JSON.stringify(config.identifier)}${config.linkHost ? `, intentFilters: [{ action: 'VIEW', autoVerify: true, data: [{ scheme: 'https', host: ${JSON.stringify(config.linkHost)} }], category: ['BROWSABLE', 'DEFAULT'] }]` : ''} },\n  web: { output: 'static' }, plugins: ['expo-router'], experiments: { typedRoutes: true },\n};\nexport default config;\n`,
    'babel.config.js': `module.exports = function (api) { api.cache(true); return { presets: ['babel-preset-expo'], plugins: [['react-native-unistyles/plugin', { root: 'app', autoProcessImports: ['@precision-calm/ui'] }]] }; };\n`,
    'tsconfig.json': JSON.stringify({ extends: '../../tsconfig.base.json', compilerOptions: { noEmit: true, types: ['react', 'react-native'] }, include: ['app/**/*.ts', 'app/**/*.tsx', '*.ts'] }, null, 2) + '\n',
    'app/_layout.tsx': `import { useUnistyles } from 'react-native-unistyles';
import { ProtectedRouterStack, useCaptureReturnIntent } from '@precision-calm/navigation-router';
import { PrecisionRuntimeProvider, usePrecisionAuth, usePrecisionAuthAccess } from '@precision-calm/runtime';
import { services } from '../services';
import { linking } from '../linking';
import { authReturnIntent } from '../auth';

function RootNavigation() {
  const { theme } = useUnistyles();
  const auth = usePrecisionAuth();
  const access = usePrecisionAuthAccess();
  useCaptureReturnIntent({ access, capture: auth.captureReturnIntent, publicPaths: ['/sign-in', '/session-loading', '/session-error', '/link-error'] });
  return <ProtectedRouterStack access={access} routes={{ always: ['link-error'], authenticated: ['index'], signedOut: ['sign-in'], booting: ['session-loading'], error: ['session-error'] }} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background.canvas } }} />;
}

export default function RootLayout() {
  return <PrecisionRuntimeProvider services={services} linking={linking} auth={{ returnIntentChannel: authReturnIntent }}><RootNavigation /></PrecisionRuntimeProvider>;
}
`,
    'app/index.tsx': `import { ScrollScreen } from '@precision-calm/ui';\nimport { Button, Card } from '@precision-calm/ui';\nimport { Text, VStack } from '@precision-calm/ui';\nimport { DashboardLayout } from '@precision-calm/ui';\nimport { Metric, MetricGroup } from '@precision-calm/ui';\nimport { appBrand } from '../brand';\n\nexport default function HomeScreen() {\n  const metrics = <MetricGroup><Metric label="Primary metric" value="$8,420" trend="+14.2%" trendTone="positive" /><Metric label="Secondary metric" value="24" trend="Current" /></MetricGroup>;\n  return <ScrollScreen><DashboardLayout eyebrow={appBrand.name.toUpperCase()} title="Production foundation" description="This screen is composed from portable Precision Calm patterns without feature-owned geometry." metrics={metrics} primary={<Card><VStack gap="lg"><Text variant="h2">Primary workspace</Text><Text tone="secondary">Replace this content with your first product vertical slice.</Text><Button label="Primary action" onPress={() => {}} /></VStack></Card>} secondary={<Card><VStack gap="md"><Text variant="h3">Context</Text><Text tone="secondary">Adaptive layouts determine where this panel belongs.</Text></VStack></Card>} /></ScrollScreen>;\n}\n`,
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
export default function SessionErrorScreen() { const auth = usePrecisionAuth(); return <Screen><StateView kind="error" title="Session could not be restored" message="Protected information remains hidden until the session check succeeds." actionLabel="Retry" onAction={() => { void auth.refresh(); }} /></Screen>; }
`,
    'auth.ts': `import { createReturnIntentChannel } from '@precision-calm/auth';\n\nexport const authReturnIntent = createReturnIntentChannel({ excludedPrefixes: ['/sign-in', '/session-loading', '/session-error', '/link-error', '/auth'] });\n`,
    'linking.ts': `import { createPrecisionLinkingRuntime } from '@precision-calm/linking';\nimport { ExpoExternalNavigationAdapter } from '@precision-calm/linking-expo';\nimport { authReturnIntent } from './auth';\n\nexport const linking = createPrecisionLinkingRuntime({\n  adapter: new ExpoExternalNavigationAdapter(),\n  onIncomingRoute: (route) => { authReturnIntent.capture(route); },\n  externalPolicy: { allowHttps: true, allowedHosts: ${config.linkHost ? `[{ host: ${JSON.stringify(config.linkHost)}, allowSubdomains: false }]` : '[]'}, allowMailto: false, allowTel: false },\n  incomingPolicy: { appSchemes: [${JSON.stringify(config.slug)}], universalLinkHosts: ${config.linkHost ? `[{ host: ${JSON.stringify(config.linkHost)}, allowSubdomains: false }]` : '[]'}, rejectedRoute: '/link-error' },\n});\n`,
    'app/+native-intent.tsx': `import { linking } from '../linking';\n\nexport function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {\n  try { return linking.redirectIncoming(path, { initial }); }\n  catch { return '/link-error'; }\n}\n`,
    'app/link-error.tsx': `import { Button, Card, ScrollScreen, Text, VStack } from '@precision-calm/ui';\nimport { usePrecisionRouter } from '@precision-calm/navigation-router';\n\nexport default function LinkErrorScreen() {\n  const router = usePrecisionRouter();\n  return <ScrollScreen><Card><VStack gap=\"lg\"><Text variant=\"h2\">This link cannot be opened safely</Text><Text tone=\"secondary\">The destination is malformed, unsupported, or not trusted by this application.</Text><Button label=\"Return home\" onPress={() => router.replace('/')} /></VStack></Card></ScrollScreen>;\n}\n`,
    'services.ts': `import { createDemoServices } from '@precision-calm/adapters';\n\n// Replace this explicit demo composition with production adapters before launch.\nexport const services = createDemoServices();\n`,
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
    else fail(`Unknown argument: ${key}`);
  }
  return out;
}
function printUsage() { console.log('create-precision-app --name "App Name" --slug app-name [--accent blue|violet|green|orange] [--directory path] [--link-host app.example.com] [--force]'); }
function firstGlyph(value) { return Array.from(value.trim())[0]?.toUpperCase() ?? 'A'; }
function isValidHost(value) { try { if (!value || /[/:?#@]/.test(value)) return false; const parsed = new URL(`https://${value}`); return parsed.hostname === value.toLowerCase() && !parsed.port && parsed.pathname === '/'; } catch { return false; } }
function fail(message) { console.error(message); process.exit(1); }
