import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];

const tokens = read('packages/tokens/src/foundations.ts');
const card = read('packages/components/src/Card.tsx');
const stateView = read('packages/feedback/src/StateView.tsx');
const loading = read('packages/feedback/src/Loading.tsx');
const banner = read('packages/feedback/src/AlertBanner.tsx');
const pageHeader = read('packages/layouts/src/PageHeader.tsx');
const patterns = read('packages/patterns/src/PagePatterns.tsx');
const generator = read('packages/create-precision-app/bin/create-precision-app.mjs');
const home = read('apps/reference/app/index.tsx');
const system = read('apps/reference/app/system.tsx');
const feedback = read('apps/reference/app/feedback.tsx');
const webTests = read('tests/e2e/web/reference.spec.ts');

if (!tokens.includes('stateMinHeight: 240')) failures.push('Feedback geometry must own a dedicated state minimum-height token.');

for (const variant of ["'surface'", "'subtle'", "'elevated'"]) {
  if (!card.includes(variant)) failures.push(`Card must expose the ${variant} semantic surface variant.`);
}
if (!card.includes('...theme.elevation.low')) failures.push('Elevated cards must consume the shared low-elevation token.');
if (!card.includes("padding?: CardPadding")) failures.push('Card padding must remain an explicit semantic API.');
if (!card.includes("padding_none: {")) failures.push('Card must support geometry-free composition through padding="none".');

if (!stateView.includes('minHeight: theme.feedbackMetrics.stateMinHeight')) failures.push('StateView must use dedicated feedback-state geometry.');
if (!stateView.includes('icon_error: { backgroundColor: theme.colors.feedback.negativeSurface }')) failures.push('Error states must own a semantic negative icon surface.');
if (!stateView.includes('icon_warning: { backgroundColor: theme.colors.feedback.warningSurface }')) failures.push('Offline/reconnect states must own a warning icon surface.');
if (!stateView.includes("flexDirection: { compact: 'column-reverse', medium: 'row' }")) failures.push('State actions must preserve primary-first compact hierarchy and desktop secondary/primary order.');
if ((stateView.match(/responsiveWidth="compact-full"/g) ?? []).length < 2) failures.push('State actions must become full-width on compact layouts.');
if (!stateView.includes('actionLoading?: boolean')) failures.push('State actions must expose shared loading ownership for retry resilience.');
if (!stateView.includes('loading={actionLoading}')) failures.push('State action loading must be delegated to the shared Button contract.');

if (!loading.includes('role="progressbar"') || !loading.includes("label = 'Loading content'")) failures.push('Loading and skeleton states must expose one indeterminate progress semantic.');
if (!loading.includes('minHeight: theme.feedbackMetrics.stateMinHeight')) failures.push('LoadingState must align with StateView vertical rhythm.');

if (!banner.includes("flexDirection: { compact: 'column', medium: 'row' }")) failures.push('Persistent banner actions must move below copy at compact widths.');
if (!banner.includes("alignSelf: { compact: 'stretch', medium: 'center' }")) failures.push('Banner actions must receive a compact stretch composition slot.');

if (!pageHeader.includes("width: { compact: '100%', expanded: 'auto' }")) failures.push('PageHeader action regions must own full compact width.');
if (!pageHeader.includes("alignItems: { compact: 'stretch', expanded: 'flex-end' }")) failures.push('PageHeader actions must stretch compositional wrappers on compact layouts.');

if (!patterns.includes('<Card variant="elevated">{form}</Card>')) failures.push('Authentication pattern must use the prominent elevated surface.');
if (!patterns.includes('<Card variant="subtle"><StateView kind="empty"')) failures.push('Empty-start pattern must use a quiet contextual surface.');
if (!generator.includes('primary={<Card variant="elevated">')) failures.push('Generated applications must demonstrate the prominent primary-workspace surface.');
if (!generator.includes('secondary={<Card variant="subtle">')) failures.push('Generated applications must demonstrate contextual surface hierarchy.');

if (!home.includes('testID="surface-card-elevated"') && !system.includes('testID="surface-card-elevated"')) failures.push('Reference app must expose an elevated surface acceptance hook.');
if (!feedback.includes("label={copy('Loading account rows')}")) failures.push('Feedback lab must expose named pseudo-localized skeleton progress semantics.');
if (!webTests.includes('semantic card surfaces preserve hierarchy across themes')) failures.push('Web certification must cover semantic surface hierarchy.');
if (!webTests.includes('compact page-header actions become full-width stacked actions')) failures.push('Web certification must cover compact action composition.');

if (failures.length) {
  console.error('Surface/feedback contract violations:\n' + failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Surface/feedback contracts passed (semantic cards, resilient states, responsive alerts/actions, generator hierarchy).');
