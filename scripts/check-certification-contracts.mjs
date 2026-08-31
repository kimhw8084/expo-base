import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const requiredRoutes = [
  'index.tsx', 'forms.tsx', 'navigation.tsx', 'overlays.tsx', 'lists.tsx', 'data.tsx',
  'visualization.tsx', 'feedback.tsx', 'accessibility-motion.tsx', 'golden.tsx', 'system.tsx', 'stress.tsx', 'services.tsx',
  'auth-session.tsx', 'authorization.tsx', 'admin-demo.tsx', 'sign-in.tsx', 'session-loading.tsx', 'session-error.tsx',
];
const appDir = path.join(root, 'apps/reference/app');
const missing = requiredRoutes.filter((file) => !fs.existsSync(path.join(appDir, file)));
if (missing.length) {
  console.error('Reference certification routes missing:\n' + missing.map((file) => `- ${file}`).join('\n'));
  process.exit(1);
}

const stressSource = fs.readFileSync(path.join(appDir, 'stress.tsx'), 'utf8');
const stressMarkers = ['LONG ENGLISH', 'GERMAN-LENGTH STRESS', 'NON-LATIN STRESS', '$9,999,999,999.99', 'PriorityActionBar', 'AsyncStateView'];
const missingStress = stressMarkers.filter((marker) => !stressSource.includes(marker));
if (missingStress.length) {
  console.error('Stress route is missing required torture cases:\n' + missingStress.map((marker) => `- ${marker}`).join('\n'));
  process.exit(1);
}

const servicesSource = fs.readFileSync(path.join(appDir, 'services.tsx'), 'utf8');
const serviceMarkers = ['usePrecisionServices', 'usePrecisionAuth', 'auth.signOut', 'services.storage.get', 'services.analytics.track', 'services.images.resolve'];
const missingServices = serviceMarkers.filter((marker) => !servicesSource.includes(marker));
if (missingServices.length) {
  console.error('Services route is missing adapter acceptance cases:\n' + missingServices.map((marker) => `- ${marker}`).join('\n'));
  process.exit(1);
}

const authSources = [
  fs.readFileSync(path.join(appDir, 'sign-in.tsx'), 'utf8'),
  fs.readFileSync(path.join(appDir, '_layout.tsx'), 'utf8'),
].join('\n');
const authMarkers = ['auth.signIn', 'consumeReturnIntent', 'ProtectedRouterStack', 'usePrecisionAuthAccess', 'useCaptureReturnIntent'];
const missingAuth = authMarkers.filter((marker) => !authSources.includes(marker));
if (missingAuth.length) {
  console.error('Auth/session acceptance coverage missing:\n' + missingAuth.map((marker) => `- ${marker}`).join('\n'));
  process.exit(1);
}


const authorizationSources = [
  fs.readFileSync(path.join(appDir, 'authorization.tsx'), 'utf8'),
  fs.readFileSync(path.join(appDir, '_layout.tsx'), 'utf8'),
].join('\n');
const authorizationMarkers = ['usePrecisionAuthorizationRequirement', 'CapabilityGate', 'conditionalAuthenticated', 'settings.manage'];
const missingAuthorization = authorizationMarkers.filter((marker) => !authorizationSources.includes(marker));
if (missingAuthorization.length) {
  console.error('Authorization/capability acceptance coverage missing:\n' + missingAuthorization.map((marker) => `- ${marker}`).join('\n'));
  process.exit(1);
}

const systemSource = fs.readFileSync(path.join(appDir, 'system.tsx'), 'utf8');
const publicFamilies = ['Button', 'IconButton', 'TextField', 'SelectField', 'Checkbox', 'RadioGroup', 'SwitchField', 'MetricGroup', 'LineChart', 'BarChart', 'AlertBanner', 'StateView', 'ThemeScope', 'DensityProvider'];
const missingFamilies = publicFamilies.filter((name) => !systemSource.includes(name));
if (missingFamilies.length) {
  console.error('Component laboratory coverage missing:\n' + missingFamilies.map((name) => `- ${name}`).join('\n'));
  process.exit(1);
}

console.log(`Certification contract check passed (${requiredRoutes.length} reference routes, ${stressMarkers.length} stress markers, ${serviceMarkers.length} service markers, ${authMarkers.length} auth markers, ${authorizationMarkers.length} authorization markers, ${publicFamilies.length} component families).`);
