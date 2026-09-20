import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const navigation = readFileSync(join(root, 'packages', 'navigation', 'src', 'NavigationItemButton.tsx'), 'utf8');
const pageHeader = readFileSync(join(root, 'packages', 'layouts', 'src', 'PageHeader.tsx'), 'utf8');
const pagePatterns = readFileSync(join(root, 'packages', 'patterns', 'src', 'PagePatterns.tsx'), 'utf8');
const golden = readFileSync(join(root, 'apps', 'reference', 'app', 'golden.tsx'), 'utf8');
const forms = readFileSync(join(root, 'apps', 'reference', 'app', 'forms.tsx'), 'utf8');
const overlays = readFileSync(join(root, 'apps', 'reference', 'app', 'overlays.tsx'), 'utf8');
const serverState = readFileSync(join(root, 'apps', 'reference', 'app', 'server-state.tsx'), 'utf8');
const swift = [
  readFileSync(join(root, 'tests', 'native', 'ios', 'ExpoBaseNativeUITests.swift'), 'utf8'),
  readFileSync(join(root, 'tests', 'native', 'ios', 'NativeRobots.swift'), 'utf8'),
].join('\n');
const android = readFileSync(join(root, 'tests', 'native', 'android', 'ExpoBaseNativeAndroidTest.java'), 'utf8');
const checks = [
  ['navigation route targets', navigation.includes('testID={`navigation-item-${item.key}`}')],
  ['home landmark', swift.includes('Universal application foundation')],
  ['shared PageHeader native selector', pageHeader.includes("testID = 'page-header-title'") && pageHeader.includes('<Text variant="h1" testID={testID}>')],
  ['Golden pattern header forwards selector ownership', pagePatterns.includes('testID?: string | undefined') && pagePatterns.includes('{ testID }')],
  ['Golden Dashboard route owns a stable header selector', golden.includes("testID:'golden-page-header-title'")],
  ['form name selector', swift.includes('demo-name')],
  ['geometry assertion', swift.includes('frame.width') && swift.includes('frame.height')],
  ['hittability assertion', swift.includes('isHittable')],
  ['android navigation semantic target', android.includes('navigation-item-') && android.includes('By.descContains')],
  ['android form semantic target', android.includes('demo-name') && android.includes('Full name')],
  ['android native target fallback', android.includes('By.res(PACKAGE, id)') && android.includes('By.textContains')],
  ['Android launch uses a stable home resource-id', android.includes('launchReleaseProduct') && android.includes('assertTarget("home-adaptive-section-header"')],
  ['Android home scroll uses the existing metric-group resource-id', android.includes('touchScrollReachesHomeContent') && android.includes('assertTarget("home-metric-group"')],
  ['decisive Android route assertions avoid display-text helpers', !android.includes('assertText(') && !android.includes('findSemanticText(') && !android.includes('hasText(')],
  ['decisive Android targets fail closed on resource-id ownership', android.includes('scrollToStableResource(id)') && android.includes('Missing Android resource-id target') && android.includes('if (id != null) return scrollToStableResource(id);')],
  ['Android convenience fallback remains separate from decisive targets', android.includes('scrollToAccessibleTarget') && android.includes('By.descContains(description)') && android.includes('By.textContains(text)')],
  ['form validation uses stable summary and field ownership', forms.includes('testID="adapter-form-error-summary"') && forms.includes('id="demo-email"') && android.includes('adapter-form-error-summary') && android.includes('demo-email-error') && !android.includes('Enter your email.')],
  ['overlay opening uses stable reference controls', overlays.includes('testID="overlay-dialog-trigger"') && overlays.includes('testID="overlay-bottom-sheet-trigger"') && overlays.includes('testID="overlay-dialog-review-action"') && android.includes('card-action-menu')],
  ['overlay dismissal checks stable target disappearance', android.includes('assertTargetAbsent("overlay-dialog-review-action"') && android.includes('assertTargetAbsent("bottom-sheet-panel"') && android.includes('Until.gone(By.res(PACKAGE, id))') && !android.includes('did not dismiss the dialog')],
  ['flagship route identity uses PageHeader resource ids', android.includes('analytics-page-header-title') && android.includes('finance-page-header-title') && android.includes('monitoring-page-header-title')],
  ['server-state uses stable count and control ownership', serverState.includes('testID="server-state-refresh"') && android.includes('server-state-load-count') && android.includes('server-state-refresh') && android.includes('server-state-mutation-count')],
  ['R5 generic display-text strategy cannot return as decisive path', !android.includes('Expected Android text was not rendered') && !android.includes('findSemanticText') && !android.includes('SystemClock')],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
if (failures.length) {
  console.error(`Native UI selector contract failed: ${failures.join(', ')}`);
  process.exit(1);
}
console.log(`Native UI selector contract passed: ${checks.length} ownership checks.`);
