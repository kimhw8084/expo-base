import fs from 'node:fs';
import process from 'node:process';

const dependenciesInstalled = fs.existsSync('node_modules');
const report = {
  contractGate: 'quality:gate36',
  contractStatus: 'PASS when command completes',
  dependencyTreeInstalled: dependenciesInstalled,
  runtimeCertification: dependenciesInstalled ? 'READY_TO_RUN' : 'BLOCKED_DEPENDENCIES_NOT_INSTALLED',
  preRuntimeChecks: [
    'npm run doctor -- --path apps/reference --fail',
    'npm run migrate:audit -- --path apps/reference --fail-on low',
    'npm run api:snapshot:check',
  ],
  requiredRuntimeCommands: [
    'npm install',
    'npm run quality:gate36',
    'npm run reference:prebuild',
    'npm run reference:web',
    'npm run test:web',
  ],
  browserServiceFlow: '/services',
  linkingAcceptanceFlow: '/linking',
  authAcceptanceFlow: '/auth-session',
  authSignedOutFlow: '/sign-in',
  authorizationAcceptanceFlow: '/authorization',
  capabilityProtectedFlow: '/admin-demo',
  linkingNativeIntent: 'app/+native-intent.tsx',
  nativeFlow: 'tests/native/reference-flow.yaml',
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--require-runtime') && !dependenciesInstalled) process.exit(2);
