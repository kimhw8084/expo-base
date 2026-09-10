import { certificationNodeMajor, isSupportedNodeVersion, minimumNodeVersion } from './node-version-policy.mjs';

const certification = process.argv.includes('--certification');
const supported = isSupportedNodeVersion(process.version, { certification });

if (!supported) {
  console.error('');
  console.error(certification
    ? `Expo Base 1.0 certification requires Node.js ${certificationNodeMajor}.x >= ${minimumNodeVersion.join('.')}.`
    : `Expo Base requires Node.js >= ${minimumNodeVersion.join('.')}.`);
  console.error(`Current Node.js: ${process.versions.node}`);
  console.error('Switch to Node 22 LTS, then reinstall dependencies.');
  console.error('');
  process.exit(1);
}

console.log(certification
  ? `Node.js ${process.versions.node} satisfies Expo Base 1.0 certification Node.js ${certificationNodeMajor}.x >= ${minimumNodeVersion.join('.')}`
  : `Node.js ${process.versions.node} satisfies Expo Base >= ${minimumNodeVersion.join('.')}`);
