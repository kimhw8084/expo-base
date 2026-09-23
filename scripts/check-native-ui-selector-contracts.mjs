import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const navigation = readFileSync(join(root, 'packages', 'navigation', 'src', 'NavigationItemButton.tsx'), 'utf8');
const swift = [
  readFileSync(join(root, 'tests', 'native', 'ios', 'ExpoBaseNativeUITests.swift'), 'utf8'),
  readFileSync(join(root, 'tests', 'native', 'ios', 'NativeRobots.swift'), 'utf8'),
].join('\n');
const formTyping = swift.match(/func type\(_ value: String, into id: String\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
const characterLoop = formTyping.match(/for character in value \{([\s\S]*?)\n        \}/)?.[1] ?? '';
const checks = [
  ['navigation route targets', navigation.includes('testID={`navigation-item-${item.key}`}')],
  ['home landmark', swift.includes('Universal application foundation')],
  ['form name selector', swift.includes('demo-name')],
  ['geometry assertion', swift.includes('frame.width') && swift.includes('frame.height')],
  ['hittability assertion', swift.includes('isHittable')],
  ['controlled typing reacquires field per character', /let fieldForCharacter = textField\(id, timeout: 2\)/.test(characterLoop) && /fieldForCharacter\.typeText/.test(characterLoop)],
  ['controlled typing asserts accumulated value on reacquired field', /let fieldAfterUpdate = textField\(id, timeout: 2\)/.test(characterLoop) && /object: fieldAfterUpdate/.test(characterLoop) && /expectedValue/.test(characterLoop)],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(`Native UI selector contract failed: ${failures.join(', ')}`);
  process.exit(1);
}
console.log(`Native UI selector contract passed: ${checks.length} ownership checks.`);
