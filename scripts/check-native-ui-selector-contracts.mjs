import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const navigation = readFileSync(join(root, 'packages', 'navigation', 'src', 'NavigationItemButton.tsx'), 'utf8');
const swift = [
  readFileSync(join(root, 'tests', 'native', 'ios', 'ExpoBaseNativeUITests.swift'), 'utf8'),
  readFileSync(join(root, 'tests', 'native', 'ios', 'NativeRobots.swift'), 'utf8'),
].join('\n');
const android = readFileSync(join(root, 'tests', 'native', 'android', 'ExpoBaseNativeAndroidTest.java'), 'utf8');
const checks = [
  ['navigation route targets', navigation.includes('testID={`navigation-item-${item.key}`}')],
  ['home landmark', swift.includes('Universal application foundation')],
  ['form name selector', swift.includes('demo-name')],
  ['geometry assertion', swift.includes('frame.width') && swift.includes('frame.height')],
  ['hittability assertion', swift.includes('isHittable')],
  ['android navigation semantic target', android.includes('navigation-item-') && android.includes('By.descContains')],
  ['android form semantic target', android.includes('demo-name') && android.includes('Full name')],
  ['android native target fallback', android.includes('By.res(PACKAGE, id)') && android.includes('By.textContains')],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(`Native UI selector contract failed: ${failures.join(', ')}`);
  process.exit(1);
}
console.log(`Native UI selector contract passed: ${checks.length} ownership checks.`);
