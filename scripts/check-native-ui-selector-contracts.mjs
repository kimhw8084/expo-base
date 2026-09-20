import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const navigation = readFileSync(join(root, 'packages', 'navigation', 'src', 'NavigationItemButton.tsx'), 'utf8');
const swift = [
  readFileSync(join(root, 'tests', 'native', 'ios', 'ExpoBaseNativeUITests.swift'), 'utf8'),
  readFileSync(join(root, 'tests', 'native', 'ios', 'NativeRobots.swift'), 'utf8'),
].join('\n');
const android = readFileSync(join(root, 'tests', 'native', 'android', 'ExpoBaseNativeAndroidTest.java'), 'utf8');
const androidTextHelper = android.match(/private UiObject2 findSemanticText\(String value\) \{[\s\S]*?\n  \}/)?.[0] ?? '';
const androidWaitHelper = android.match(/private UiObject2 waitForSemanticSelector\(BySelector selector, long deadline\) \{[\s\S]*?\n  \}/)?.[0] ?? '';
const androidTextAssertion = android.match(/private UiObject2 assertText\(String value\) \{[\s\S]*?\n  \}/)?.[0] ?? '';
const checks = [
  ['navigation route targets', navigation.includes('testID={`navigation-item-${item.key}`}')],
  ['home landmark', swift.includes('Universal application foundation')],
  ['form name selector', swift.includes('demo-name')],
  ['geometry assertion', swift.includes('frame.width') && swift.includes('frame.height')],
  ['hittability assertion', swift.includes('isHittable')],
  ['android navigation semantic target', android.includes('navigation-item-') && android.includes('By.descContains')],
  ['android form semantic target', android.includes('demo-name') && android.includes('Full name')],
  ['android native target fallback', android.includes('By.res(PACKAGE, id)') && android.includes('By.textContains')],
  ['android text assertion uses semantic fallback', androidTextAssertion.includes('findSemanticText(value)') && !androidTextAssertion.includes('By.textContains')],
  ['android text helper checks native text and content description', androidTextHelper.includes('By.textContains(value)') && androidTextHelper.includes('By.descContains(value)')],
  ['android text helper uses bounded waits', androidTextHelper.includes('SystemClock.uptimeMillis()') && androidWaitHelper.includes('Until.findObject') && androidWaitHelper.includes('Math.min(remaining, SEMANTIC_POLL_MS)')],
  ['android text assertion fails closed', androidTextAssertion.includes('assertNotNull("Expected Android text was not rendered: " + value, object)')],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(`Native UI selector contract failed: ${failures.join(', ')}`);
  process.exit(1);
}
console.log(`Native UI selector contract passed: ${checks.length} ownership checks.`);
