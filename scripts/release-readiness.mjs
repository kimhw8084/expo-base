import fs from 'node:fs';
import process from 'node:process';

const dependenciesInstalled = fs.existsSync('node_modules');
const report = {
  project: 'expo-base',
  designLanguage: 'Precision Calm',
  candidateVersion: '1.0.0',
  sourceMilestone: 'development-complete',
  developmentReadiness: 'READY_FOR_FINAL_REVIEW',
  developmentGateStatus: 'PASS_AT_LAST_CERTIFICATION',
  dependencyTreeInstalled: dependenciesInstalled,
  webCertification: dependenciesInstalled ? '180_OF_180_AT_LAST_CERTIFICATION' : 'BLOCKED_DEPENDENCIES_NOT_INSTALLED',
  nativeRuntimeAcceptance: 'DEFERRED_LOCAL_ENVIRONMENT_UNAVAILABLE',
  iosRuntimeAcceptance: 'REQUIRED_BEFORE_FINAL_RELEASE',
  androidRuntimeAcceptance: 'DEFERRED_WAIVED_FOR_1_0_POLICY_B',
  nativeBuildNumbers: 'OWNER_MANAGED_MONOTONIC_INDEPENDENT_OF_SEMVER',
  licenseStatus: 'LICENSE_APPROVAL_REQUIRED_BEFORE_PUBLIC_RELEASE',
  releaseReviewStatus: 'BLOCKED_VALIDATION_GATES',
  releaseModel: 'PRIVATE_REPOSITORY_TEMPLATE',
  packagePublication: 'NOT_CONFIGURED',
  releaseChecklist: 'docs/RELEASE_READINESS.md',
  proposedReleaseNotes: 'docs/RELEASE_NOTES_1.0.0.md',
  primaryCommands: {
    webDevelopment: 'npm run runtime:web',
    webCertification: 'npm run runtime:test:web',
    iosDevelopmentBuild: 'npm run runtime:ios',
    androidDevelopmentBuild: 'npm run runtime:android',
  },
  acceptanceFlows: [
    '/', '/system', '/golden', '/stress', '/forms', '/navigation', '/overlays', '/lists', '/data',
    '/visualization', '/feedback', '/accessibility-motion', '/services', '/auth-session', '/authorization', '/linking',
  ],
  nativeFlow: 'tests/native/reference-flow.yaml',
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--require-runtime') && !dependenciesInstalled) process.exit(2);
