import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const destination = path.join(root, 'apps', '.tmp-generated-app');
const capabilityDestination = path.join(root, 'apps', '.tmp-generated-capability-app');
const standaloneDestination = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-base-chg102-minimal-'));
const standaloneCapabilityDestination = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-base-chg102-capability-'));
const builtInBrand = fs.readFileSync(path.join(root, 'packages/tokens/src/brand.ts'), 'utf8');
const expoBasePresetNames = [...builtInBrand.matchAll(/name: 'Expo Base', shortName: '([^']+)'/g)].map((match) => match[1]);
assert.deepEqual(expoBasePresetNames, ['E', 'E', 'E', 'E'], 'all built-in Expo Base brand presets use the Expo Base short name');
fs.rmSync(destination, { recursive: true, force: true });
fs.rmSync(capabilityDestination, { recursive: true, force: true });
try {
  const run = spawnSync(process.execPath, ['packages/create-expo-base-app/bin/create-expo-base-app.mjs', '--name', 'Orbit Ledger', '--slug', 'orbit-ledger', '--accent', 'violet', '--link-host', 'app.example.com', '--mode', 'workspace', '--directory', destination], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const typecheck = spawnSync('tsc', ['-p', path.join(destination, 'tsconfig.json'), '--noEmit'], { cwd: root, encoding: 'utf8' });
  assert.equal(typecheck.status, 0, typecheck.stderr || typecheck.stdout);
  for (const file of ['package.json','brand.ts','unistyles.ts','ThemeRuntimeSync.tsx','app/+html.tsx','app/+not-found.tsx','app.config.ts','babel.config.js','tsconfig.json','app/_layout.tsx','app/index.tsx','app/sign-in.tsx','app/session-loading.tsx','app/session-error.tsx','app/+native-intent.tsx','app/link-error.tsx','services.ts','serverState.ts','capabilities.ts','linking.ts','auth.ts','sessionSecurity.ts','routes.ts','expo-base.routes.json','.expo-base/task-effects.json','app/unlock.tsx','AGENTS.md','golden-architecture.config.json','expo-base.capabilities.json','.env.example']) assert.ok(fs.existsSync(path.join(destination, file)), file);
  const brand = fs.readFileSync(path.join(destination, 'brand.ts'), 'utf8');
  assert.ok(brand.includes('brandPresets.violet'));
  assert.ok(brand.includes("name: \"Orbit Ledger\""));
  assert.ok(brand.includes('shortName: "O"'), 'generated product brand keeps its product-derived short name override');
  const appConfig = fs.readFileSync(path.join(destination, 'app.config.ts'), 'utf8');
  assert.equal(appConfig.includes("import { appBrand } from './brand';"), false, 'Expo config must not depend on runtime TypeScript brand loading');
  assert.ok(appConfig.includes('name: "Orbit Ledger"'));
  assert.ok(appConfig.includes("version: '1.0.0'"));
  assert.ok(appConfig.includes('com.expobase.orbitledger'));
  assert.ok(appConfig.includes("associatedDomains: ['applinks:app.example.com']"));
  assert.ok(appConfig.includes("autoVerify: true"));
  assert.ok(appConfig.includes("host: \"app.example.com\""));
  assert.ok(appConfig.includes('asyncRoutes'));
  assert.ok(appConfig.includes("web: { output: 'static' }"));
  assert.ok(fs.existsSync(path.join(destination, 'public/favicon.svg')));
  const generatedFaviconHtml = fs.readFileSync(path.join(destination, 'app/+html.tsx'), 'utf8');
  assert.ok(generatedFaviconHtml.includes('<link rel="icon" href="/favicon.svg" type="image/svg+xml" />'));
  const signIn = fs.readFileSync(path.join(destination, 'app/sign-in.tsx'), 'utf8');
  assert.ok(signIn.includes('FormScreen onSubmit'));
  assert.ok(signIn.includes('<Button type="submit"'));
  assert.ok(signIn.includes("router.replaceResolvedPath(auth.consumeReturnIntent('/'))"));
  assert.equal(signIn.includes('router.replace(auth.consumeReturnIntent'), false);
  const services = fs.readFileSync(path.join(destination, 'services.ts'), 'utf8');
  assert.ok(services.includes('createDemoServices'));
  const compatibility = JSON.parse(fs.readFileSync(path.join(root, 'expo-base.compatibility.json'), 'utf8'));
  const generatedPackage = JSON.parse(fs.readFileSync(path.join(destination, 'package.json'), 'utf8'));
  assert.equal(generatedPackage.version, '1.0.0');
  assert.equal(generatedPackage.devDependencies.xcode, undefined, 'native certification tooling must not leak into generated apps');
  for (const dep of ['expo','expo-router','react','react-dom','react-native','react-native-unistyles','react-native-reanimated','react-native-svg','react-native-web','expo-linking']) assert.equal(generatedPackage.dependencies[dep], compatibility[dep], dep);
  assert.equal(generatedPackage.devDependencies.typescript, compatibility.typescript);
  assert.equal(generatedPackage.dependencies['@expo-base/ui'], '*');
  assert.equal(generatedPackage.dependencies['@expo-base/auth'], '*');
  assert.equal(generatedPackage.dependencies['@expo-base/authorization'], '*');
  assert.equal(generatedPackage.dependencies['@expo-base/runtime'], '*');
  assert.equal(generatedPackage.dependencies['@expo-base/server-state'], '*');
  assert.equal(generatedPackage.dependencies['@expo-base/session-security'], '*');
  assert.equal(generatedPackage.dependencies['@expo-base/capabilities'], '*');
  assert.equal(generatedPackage.scripts['scaffold:screen'], 'node ../../packages/create-expo-base-app/bin/scaffold-expo-base-screen.mjs --app .');
  assert.equal(generatedPackage.dependencies['expo-haptics'], undefined, 'minimal apps must not install optional haptics');
  for (const dependency of ['@expo-base/visualization-advanced', 'expo-secure-store', 'expo-network', 'expo-clipboard', 'expo-sharing', 'expo-document-picker', 'expo-image-picker', 'expo-camera', 'expo-local-authentication', 'expo-notifications', 'expo-updates', 'expo-device']) assert.equal(generatedPackage.dependencies[dependency], undefined, `minimal app must not install ${dependency}`);
  assert.equal(generatedPackage.scripts['check:golden-architecture'], 'node ../../scripts/check-golden-architecture.mjs --config golden-architecture.config.json');
  assert.equal(generatedPackage.scripts['check:task-effects'], 'node ../../scripts/check-task-effects.mjs --path .');
  const emptyTaskEffectCheck = spawnSync(process.execPath, ['../../scripts/check-task-effects.mjs', '--path', '.'], { cwd: destination, encoding: 'utf8' });
  assert.equal(emptyTaskEffectCheck.status, 0, emptyTaskEffectCheck.stderr || emptyTaskEffectCheck.stdout);
  assert.match(emptyTaskEffectCheck.stdout, /0 actions \(0 unresolved/);
  const generatedAgentContract = fs.readFileSync(path.join(destination, 'AGENTS.md'), 'utf8');
  assert.ok(generatedAgentContract.includes('../../AGENTS.md'));
  assert.ok(generatedAgentContract.includes('../../golden.catalog.json'));
  assert.ok(generatedAgentContract.includes('../../golden.patterns.json'));
  assert.ok(generatedAgentContract.includes('scaffold:screen'));
  assert.ok(generatedAgentContract.includes('check:golden-architecture'));
  assert.ok(generatedAgentContract.includes('.expo-base/task-effects.json'));
  assert.ok(generatedAgentContract.includes('@expo-base/server-state'));
  const generatedGoldenConfig = JSON.parse(fs.readFileSync(path.join(destination, 'golden-architecture.config.json'), 'utf8'));
  assert.equal(generatedGoldenConfig.extends, '../../golden-architecture.config.json');
  assert.deepEqual(generatedGoldenConfig.featureRoots, ['app']);
  assert.deepEqual(generatedGoldenConfig.allowlists, []);
  const generatedGoldenCheck = spawnSync(process.execPath, ['../../scripts/check-golden-architecture.mjs', '--config', 'golden-architecture.config.json'], { cwd: destination, encoding: 'utf8' });
  assert.equal(generatedGoldenCheck.status, 0, generatedGoldenCheck.stderr || generatedGoldenCheck.stdout);
  const generatedReadme = fs.readFileSync(path.join(destination, 'README.md'), 'utf8');
  assert.ok(generatedReadme.includes('Golden development contract'));
  assert.ok(generatedReadme.includes('check:golden-architecture'));
  assert.ok(generatedReadme.includes('scaffold:screen'));
  assert.ok(generatedReadme.includes('.expo-base/task-effects.json'));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(destination, 'expo-base.routes.json'), 'utf8')), { schemaVersion: 1, authenticated: [], public: [] });
  const generatedRoutes = fs.readFileSync(path.join(destination, 'routes.ts'), 'utf8');
  assert.ok(generatedRoutes.includes('expoBaseRoutes'));
  const rootLayout = fs.readFileSync(path.join(destination, 'app/_layout.tsx'), 'utf8');
  assert.ok(rootLayout.includes('ExpoBaseRuntimeProvider'));
  assert.ok(rootLayout.includes('capabilities={capabilities}'));
  assert.ok(rootLayout.includes("from '../capabilities'"));
  assert.ok(rootLayout.includes("i18n={{ fallbackLocale: 'en-US' }}"));
  assert.ok(rootLayout.includes('ExpoBaseSessionSecurityBootstrap'));
  assert.ok(rootLayout.includes('Restoring secure session…'));
  assert.ok(rootLayout.includes('ProtectedRouterStack'));
  assert.ok(rootLayout.includes('useExpoBaseAuthAccess'));
  assert.ok(rootLayout.includes('useCaptureReturnIntent'));
  assert.ok(rootLayout.includes("from '../routes'"));
  assert.ok(rootLayout.includes('...expoBaseRoutes.public'));
  assert.ok(rootLayout.includes('...expoBaseRoutes.authenticated'));
  assert.ok(rootLayout.includes("auth.status === 'loading'"));
  assert.equal(rootLayout.includes('restrictiveRedirects'), false);
  assert.ok(rootLayout.includes("signedOut: ['sign-in']"));
  assert.ok(rootLayout.includes("booting: ['session-loading']"));
  assert.ok(rootLayout.includes("error: ['session-error']"));
  assert.ok(rootLayout.includes("always: ['link-error', '+not-found'"));
  const notFound = fs.readFileSync(path.join(destination, 'app/+not-found.tsx'), 'utf8');
  assert.ok(notFound.includes('We could not find that page'));
  assert.ok(notFound.includes("router.replace('/')"));
  const sessionError = fs.readFileSync(path.join(destination, 'app/session-error.tsx'), 'utf8');
  assert.ok(sessionError.includes("actionLoading={auth.actionStatus === 'refreshing'}"));
  assert.ok(rootLayout.includes("locked: ['unlock']"));
  assert.ok(rootLayout.includes('services={services}'));
  assert.ok(rootLayout.includes('linking={linking}'));
  assert.ok(rootLayout.includes("from '../linking'"));
  assert.ok(rootLayout.includes("from '../services'"));
  assert.ok(rootLayout.includes("from '../auth'"));
  assert.ok(rootLayout.includes('returnIntentChannel: authReturnIntent'));
  assert.ok(rootLayout.includes('sessionSecurity={{ adapter: sessionSecurity }}'));
  assert.ok(rootLayout.includes("from '../sessionSecurity'"));
  assert.ok(rootLayout.includes("from '../ThemeRuntimeSync'"));
  assert.ok(rootLayout.includes('<ThemeRuntimeSync />'));
  const generatedUnistyles = fs.readFileSync(path.join(destination, 'unistyles.ts'), 'utf8');
  assert.ok(generatedUnistyles.includes("initialTheme: Platform.OS === 'web' ? 'light' : Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'"));
  assert.equal(generatedUnistyles.includes('adaptiveThemes: true'), false);
  const generatedHtml = fs.readFileSync(path.join(destination, 'app/+html.tsx'), 'utf8');
  assert.ok(generatedHtml.includes("import '../unistyles'"));
  assert.ok(generatedHtml.trimStart().startsWith("import '../unistyles'"));
  assert.ok(generatedHtml.includes('ExpoBaseWebAccessibilityStyles'));
  const generatedThemeSync = fs.readFileSync(path.join(destination, 'ThemeRuntimeSync.tsx'), 'utf8');
  assert.ok(generatedThemeSync.includes('useColorScheme'));
  assert.ok(generatedThemeSync.includes('UnistylesRuntime.setTheme'));
  assert.ok(generatedThemeSync.includes('StatusBar'));
  assert.ok(generatedThemeSync.includes("effectiveTheme === 'dark' ? 'light-content' : 'dark-content'"));
  assert.ok(rootLayout.includes("from '../ThemeRuntimeSync'"));
  assert.ok(rootLayout.includes('<ThemeRuntimeSync />'));
  const unistyles = fs.readFileSync(path.join(destination, 'unistyles.ts'), 'utf8');
  assert.ok(unistyles.includes("initialTheme: Platform.OS === 'web' ? 'light' : Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'"));
  assert.equal(unistyles.includes('adaptiveThemes: true'), false);
  const html = fs.readFileSync(path.join(destination, 'app/+html.tsx'), 'utf8');
  assert.ok(html.includes("import '../unistyles'"));
  assert.ok(html.trimStart().startsWith("import '../unistyles'"));
  const themeSync = fs.readFileSync(path.join(destination, 'ThemeRuntimeSync.tsx'), 'utf8');
  assert.ok(themeSync.includes('useColorScheme'));
  assert.ok(themeSync.includes('UnistylesRuntime.setTheme'));
  assert.ok(themeSync.includes('StatusBar'));
  assert.ok(themeSync.includes("effectiveTheme === 'dark' ? 'light-content' : 'dark-content'"));
  assert.equal(rootLayout.includes('KeyboardRootProvider'), false);
  const serverState = fs.readFileSync(path.join(destination, 'serverState.ts'), 'utf8');
  assert.ok(serverState.includes('expoBaseQueryKey.entity'));
  assert.ok(serverState.includes('expoBaseQueryKey.list'));
  assert.equal(serverState.includes('fetch('), false);
  const linking = fs.readFileSync(path.join(destination, 'linking.ts'), 'utf8');
  assert.ok(linking.includes('createExpoBaseLinkingRuntime'));
  assert.ok(linking.includes('ExpoExternalNavigationAdapter'));
  assert.ok(linking.includes('app.example.com'));
  assert.ok(linking.includes('universalLinkHosts'));
  assert.ok(linking.includes('onIncomingRoute'));
  assert.ok(linking.includes('authReturnIntent.capture'));
  const authBridge = fs.readFileSync(path.join(destination, 'auth.ts'), 'utf8');
  assert.ok(authBridge.includes('createReturnIntentChannel'));
  assert.ok(authBridge.includes("'/auth'"));
  assert.ok(authBridge.includes("'/unlock'"));
  const sessionSecurity = fs.readFileSync(path.join(destination, 'sessionSecurity.ts'), 'utf8');
  assert.ok(sessionSecurity.includes('MemorySessionSecurityAdapter'));
  const unlock = fs.readFileSync(path.join(destination, 'app/unlock.tsx'), 'utf8');
  assert.ok(unlock.includes('useExpoBaseSessionSecurity'));
  assert.ok(unlock.includes('requestUnlock'));
  assert.ok(unlock.includes('consumeReturnIntent'));
  assert.ok(unlock.includes('replaceResolvedPath'));
  const nativeIntent = fs.readFileSync(path.join(destination, 'app/+native-intent.tsx'), 'utf8');
  assert.ok(nativeIntent.includes('redirectSystemPath'));
  assert.ok(nativeIntent.includes('try')); assert.ok(nativeIntent.includes('catch'));
  assert.equal(nativeIntent.includes('legacy_subscribe'), false);
  const screen = fs.readFileSync(path.join(destination, 'app/index.tsx'), 'utf8');
  assert.ok(screen.includes('DashboardLayout'));
  assert.ok(screen.includes('<Card variant="elevated">'));
  assert.ok(screen.includes('<Card variant="subtle">'));
  assert.ok(screen.includes("from '@expo-base/ui'"));
  assert.equal(/from ['"]@expo-base\/(?:components|layouts|primitives|patterns|data-display)['"]/.test(screen), false);
  assert.equal(/style\s*=\s*\{\s*\{/.test(screen), false);
  const capabilities = fs.readFileSync(path.join(destination, 'capabilities.ts'), 'utf8');
  assert.ok(capabilities.includes('minimal kernel'));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(destination, 'expo-base.capabilities.json'), 'utf8')), { schemaVersion: 1, capabilities: [] });

  const capabilityRun = spawnSync(process.execPath, ['packages/create-expo-base-app/bin/create-expo-base-app.mjs', '--name', 'Capability Ledger', '--slug', 'capability-ledger', '--mode', 'workspace', '--directory', capabilityDestination, '--capabilities', 'secure-storage,runtime-signals,media,local-auth,notifications,updates,device,haptics,observability'], { cwd: root, encoding: 'utf8' });
  assert.equal(capabilityRun.status, 0, capabilityRun.stderr || capabilityRun.stdout);
  const capabilityTypecheck = spawnSync('tsc', ['-p', path.join(capabilityDestination, 'tsconfig.json'), '--noEmit'], { cwd: root, encoding: 'utf8' });
  assert.equal(capabilityTypecheck.status, 0, capabilityTypecheck.stderr || capabilityTypecheck.stdout);
  const capabilityPackage = JSON.parse(fs.readFileSync(path.join(capabilityDestination, 'package.json'), 'utf8'));
  for (const dependency of ['@expo-base/secure-storage', '@expo-base/runtime-capabilities', '@expo-base/media', '@expo-base/local-auth', '@expo-base/notifications', '@expo-base/updates', '@expo-base/device', '@expo-base/haptics', '@expo-base/observability', 'expo-secure-store', 'expo-network', 'expo-camera', 'expo-document-picker', 'expo-image-picker', 'expo-local-authentication', 'expo-notifications', 'expo-updates', 'expo-application', 'expo-device', 'expo-haptics']) assert.ok(capabilityPackage.dependencies[dependency], dependency);
  const capabilityConfig = fs.readFileSync(path.join(capabilityDestination, 'app.config.ts'), 'utf8');
  for (const plugin of ['expo-secure-store', 'expo-camera', 'expo-document-picker', 'expo-image-picker', 'expo-local-authentication', 'expo-notifications', 'expo-updates']) assert.ok(capabilityConfig.includes(plugin), plugin);
  const capabilityRegistry = fs.readFileSync(path.join(capabilityDestination, 'capabilities.ts'), 'utf8');
  for (const owner of ['ExpoSecureStorage', 'ExpoConnectivity', 'ReactNativeAppLifecycle', 'ExpoDocumentPicker', 'ExpoMediaAcquisition', 'ExpoLocalAuthentication', 'ExpoNotifications', 'ExpoUpdates', 'ExpoDevice', 'ExpoHaptics', 'NoopObservability']) assert.ok(capabilityRegistry.includes(owner), owner);
  const capabilityGoldenCheck = spawnSync(process.execPath, ['../../scripts/check-golden-architecture.mjs', '--config', 'golden-architecture.config.json'], { cwd: capabilityDestination, encoding: 'utf8' });
  assert.equal(capabilityGoldenCheck.status, 0, capabilityGoldenCheck.stderr || capabilityGoldenCheck.stdout);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(capabilityDestination, 'expo-base.capabilities.json'), 'utf8')).capabilities, ['secure-storage', 'runtime-signals', 'media', 'local-auth', 'notifications', 'updates', 'device', 'haptics', 'observability']);

  assert.ok(!standaloneDestination.startsWith(root), 'standalone fixture must live outside the source workspace');
  assert.ok(!standaloneCapabilityDestination.startsWith(root), 'optional standalone fixture must live outside the source workspace');
  for (const [target, args] of [
    [standaloneDestination, ['--name', 'Standalone Ledger', '--slug', 'standalone-ledger', '--accent', 'green']],
    [standaloneCapabilityDestination, ['--name', 'Standalone Media Ledger', '--slug', 'standalone-media-ledger', '--capabilities', 'secure-storage,runtime-signals,media']],
  ]) {
    const generated = spawnSync(process.execPath, ['packages/create-expo-base-app/bin/create-expo-base-app.mjs', ...args, '--directory', target], { cwd: root, encoding: 'utf8' });
    assert.equal(generated.status, 0, generated.stderr || generated.stdout);
    const generatedPackage = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
    assert.deepEqual(generatedPackage.workspaces, ['packages/*']);
    const generatedReadme = fs.readFileSync(path.join(target, 'README.md'), 'utf8');
    assert.ok(generatedReadme.includes('verify:acceptance'));
    assert.ok(generatedReadme.includes('does not make this consuming product production-ready'));
    assert.ok(generatedReadme.includes('migrate:upgrade-plan'));
    assert.ok(generatedReadme.includes('Never regenerate over this product repository'));
    const generatedAcceptanceAgents = fs.readFileSync(path.join(target, 'AGENTS.md'), 'utf8');
    assert.ok(generatedAcceptanceAgents.includes('Fast verify versus final acceptance'));
    assert.ok(generatedAcceptanceAgents.includes('verify:acceptance'));
    assert.ok(generatedAcceptanceAgents.includes('not a production-ready product claim'));
    assert.ok(generatedAcceptanceAgents.includes('task-effects.json'));
    assert.ok(generatedAcceptanceAgents.includes('migrate:upgrade-plan'));
    assert.ok(generatedAcceptanceAgents.includes('never regenerate over this product'));
    for (const script of ['typecheck', 'check:golden-architecture', 'check:task-effects', 'scaffold:screen', 'verify', 'verify:acceptance']) assert.equal(typeof generatedPackage.scripts[script], 'string', script);
    for (const field of ['dependencies', 'devDependencies']) {
      for (const [name, version] of Object.entries(generatedPackage[field] ?? {})) {
        if (!name.startsWith('@expo-base/')) assert.equal(version, compatibility[name], `${target} ${name}`);
      }
    }
    for (const packageName of fs.readdirSync(path.join(target, 'packages'))) {
      const manifest = JSON.parse(fs.readFileSync(path.join(target, 'packages', packageName, 'package.json'), 'utf8'));
      for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
        for (const [name, version] of Object.entries(manifest[field] ?? {})) {
          if (!name.startsWith('@expo-base/')) assert.equal(version, compatibility[name], `${target}/packages/${packageName} ${name}`);
        }
      }
    }
    for (const contractFile of ['README.md', 'AGENTS.md', 'package.json', 'tsconfig.json', 'golden-architecture.config.json']) {
      const contract = fs.readFileSync(path.join(target, contractFile), 'utf8');
      assert.doesNotMatch(contract, /\.\.\/\.\/(?:AGENTS|docs|scripts|packages|tsconfig\.base)/, `${contractFile} escapes the generated repository`);
    }
    const generatedGitignore = fs.readFileSync(path.join(target, '.gitignore'), 'utf8');
    for (const pattern of ['node_modules/', '.expo/', 'dist/', 'build/', '*.log', '.expo-base/acceptance-dist/', '.DS_Store']) assert.ok(generatedGitignore.includes(pattern), `${target} .gitignore missing ${pattern}`);
    assert.equal(generatedGitignore.includes('.expo-base/\n'), false);
    assert.equal(generatedGitignore.includes('docs/'), false);
    assert.equal(generatedGitignore.includes('package-lock.json'), false);
    const provenance = JSON.parse(fs.readFileSync(path.join(target, '.expo-base/source.json'), 'utf8'));
    assert.equal(provenance.schemaVersion, 1);
    assert.equal(provenance.sourceRepository, 'https://github.com/kimhw8084/expo-base');
    assert.equal(provenance.sourceCommit, spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim());
    assert.equal(provenance.sourceVersion, '1.0.0');
    assert.equal(provenance.generatorVersion, '1.0.0');
    assert.equal(provenance.sourceTree, spawnSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd: root, encoding: 'utf8' }).stdout.trim());
    const acceptanceObligations = JSON.parse(fs.readFileSync(path.join(target, '.expo-base/acceptance-obligations.json'), 'utf8'));
    assert.equal(acceptanceObligations.schemaVersion, 1);
    assert.ok(acceptanceObligations.obligations.every((obligation) => obligation.status === 'unresolved' && obligation.requiredForProduction === true));
    const acceptanceScript = fs.readFileSync(path.join(target, 'scripts/verify-acceptance.mjs'), 'utf8');
    assert.ok(acceptanceScript.includes('chromium.launch'));
    assert.ok(acceptanceScript.includes("checkCommand('task-effects'"));
    assert.ok(acceptanceScript.includes('browser console/page errors and warnings'));
    assert.ok(acceptanceScript.includes("getByRole('progressbar', { name: 'Restoring secure session…' })"));
    assert.ok(acceptanceScript.includes("getByRole('alert').getByRole('heading', { name: 'Session could not be restored' })"));
    assert.ok(fs.existsSync(path.join(target, 'scripts/serve-static-web.mjs')));
    const install = spawnSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: target, encoding: 'utf8' });
    assert.equal(install.status, 0, install.stderr || install.stdout);
    const expoConfig = spawnSync('npx', ['expo', 'config', '--type', 'public'], { cwd: target, encoding: 'utf8' });
    assert.equal(expoConfig.status, 0, expoConfig.stderr || expoConfig.stdout);
    const resolved = spawnSync(process.execPath, ['-e', "process.stdout.write(require.resolve('@expo-base/ui/package.json'))"], { cwd: target, encoding: 'utf8', env: { ...process.env, NODE_PATH: '' } });
    assert.equal(resolved.status, 0, resolved.stderr || resolved.stdout);
    assert.ok(path.resolve(resolved.stdout).startsWith(fs.realpathSync(target)), `@expo-base/ui resolved outside generated repository: ${resolved.stdout}`);
    const verify = spawnSync('npm', ['run', 'verify'], { cwd: target, encoding: 'utf8' });
    assert.equal(verify.status, 0, verify.stderr || verify.stdout);
    const acceptance = spawnSync('npm', ['run', 'verify:acceptance'], { cwd: target, encoding: 'utf8' });
    assert.equal(acceptance.status, 0, acceptance.stderr || acceptance.stdout);
    const acceptanceResult = JSON.parse(fs.readFileSync(path.join(target, '.expo-base/acceptance-result.json'), 'utf8'));
    assert.equal(acceptanceResult.status, 'accepted-with-unresolved-obligations');
    assert.equal(acceptanceResult.productionReadiness, 'not-claimed');
    assert.equal(acceptanceResult.claimRequested, 'foundation');
    assert.deepEqual(acceptanceResult.provenance.source, provenance);
    assert.deepEqual(acceptanceResult.checks.map((check) => check.id), ['package-locality', 'typecheck', 'golden-patterns', 'golden-architecture', 'task-effects', 'expo-public-config', 'static-web-export-and-runtime', 'browser-shell-smoke']);
    assert.deepEqual(acceptanceResult.taskEffects, { total: 0, unresolved: [] });
    assert.ok(acceptanceResult.checks.every((check) => check.outcome === 'pass'));
    assert.equal(acceptanceResult.obligations.filter((obligation) => obligation.status === 'unresolved').length, acceptanceObligations.obligations.length);
    assert.ok(fs.existsSync(path.join(target, '.expo-base/acceptance-summary.md')));
    assert.ok(fs.existsSync(path.join(target, '.expo-base/acceptance.log')));

    if (target === standaloneDestination) {
      const resolvedObligations = {
        ...acceptanceObligations,
        obligations: acceptanceObligations.obligations.map((obligation, index) => ({
          ...obligation,
          status: index % 2 === 0 ? 'replaced' : 'qualified',
          evidence: `synthetic regression evidence for ${obligation.id}`,
        })),
      };
      fs.writeFileSync(path.join(target, '.expo-base/acceptance-obligations.json'), `${JSON.stringify(resolvedObligations, null, 2)}\n`);
      const rejectedClaim = spawnSync('npm', ['run', 'verify:acceptance', '--', '--claim', 'production-ready'], { cwd: target, encoding: 'utf8' });
      assert.notEqual(rejectedClaim.status, 0, 'production-ready request must fail closed');
      const rejectedResult = JSON.parse(fs.readFileSync(path.join(target, '.expo-base/acceptance-result.json'), 'utf8'));
      assert.equal(rejectedResult.status, 'failed');
      assert.equal(rejectedResult.claimRequested, 'production-ready');
      assert.equal(rejectedResult.productionReadiness, 'unsupported');
      assert.notEqual(rejectedResult.productionReadiness, 'claimed');
      assert.equal(rejectedResult.checks.find((check) => check.id === 'production-readiness-claim')?.outcome, 'fail');
      assert.ok(rejectedResult.obligations.every((obligation) => ['replaced', 'qualified'].includes(obligation.status) && obligation.evidence));
      assert.match(fs.readFileSync(path.join(target, '.expo-base/acceptance.log'), 'utf8'), /production-ready claims are unsupported/);
    }
  }
  const standalonePackageDirs = fs.readdirSync(path.join(standaloneDestination, 'packages'));
  assert.equal(standalonePackageDirs.includes('secure-storage'), false, 'minimal standalone profile must omit secure-storage');
  assert.equal(standalonePackageDirs.includes('media'), false, 'minimal standalone profile must omit media');
  const optionalPackageDirs = fs.readdirSync(path.join(standaloneCapabilityDestination, 'packages'));
  for (const packageName of ['secure-storage', 'runtime-capabilities', 'media']) assert.ok(optionalPackageDirs.includes(packageName), packageName);
  assert.equal(optionalPackageDirs.includes('haptics'), false, 'unselected haptics must not be vendored');
  const localScaffold = spawnSync('npm', ['run', 'scaffold:screen', '--', '--name', 'imports', '--pattern', 'import-workflow'], { cwd: standaloneCapabilityDestination, encoding: 'utf8' });
  assert.equal(localScaffold.status, 0, localScaffold.stderr || localScaffold.stdout);
  const localScaffoldVerify = spawnSync('npm', ['run', 'verify'], { cwd: standaloneCapabilityDestination, encoding: 'utf8' });
  assert.equal(localScaffoldVerify.status, 0, localScaffoldVerify.stderr || localScaffoldVerify.stdout);
  const importedEffects = JSON.parse(fs.readFileSync(path.join(standaloneCapabilityDestination, '.expo-base/task-effects.json'), 'utf8'));
  assert.equal(importedEffects.actions.length, 1);
  assert.equal(importedEffects.actions[0].route, 'imports');
  assert.equal(importedEffects.actions[0].pattern, 'import-workflow');
  assert.equal(importedEffects.actions[0].status, 'unresolved');
  const importedAcceptance = spawnSync('npm', ['run', 'verify:acceptance'], { cwd: standaloneCapabilityDestination, encoding: 'utf8' });
  assert.equal(importedAcceptance.status, 0, importedAcceptance.stderr || importedAcceptance.stdout);
  const importedAcceptanceResult = JSON.parse(fs.readFileSync(path.join(standaloneCapabilityDestination, '.expo-base/acceptance-result.json'), 'utf8'));
  assert.equal(importedAcceptanceResult.taskEffects.total, 1);
  assert.equal(importedAcceptanceResult.taskEffects.unresolved[0].actionKey, 'imports:cancel');
  assert.match(fs.readFileSync(path.join(standaloneCapabilityDestination, '.expo-base/acceptance-summary.md'), 'utf8'), /imports \/ Cancel/);
  console.log('Generator tests passed (minimal and opt-in capability-profile branded app scaffolds).');
} finally {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.rmSync(capabilityDestination, { recursive: true, force: true });
  fs.rmSync(standaloneDestination, { recursive: true, force: true });
  fs.rmSync(standaloneCapabilityDestination, { recursive: true, force: true });
}
