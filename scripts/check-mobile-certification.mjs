import fs from 'node:fs';
import { devices } from '@playwright/test';

const matrix = JSON.parse(fs.readFileSync('mobile.certification.json', 'utf8'));
if (matrix.schemaVersion !== 1) throw new Error('mobile.certification.json must use schemaVersion 1.');
if (!Array.isArray(matrix.profiles) || matrix.profiles.length < 4) throw new Error('Mobile certification requires at least four representative profiles.');

const ids = new Set();
const browsers = new Set();
for (const profile of matrix.profiles) {
  if (!profile.id || ids.has(profile.id)) throw new Error(`Duplicate or missing mobile profile id: ${profile.id ?? '<missing>'}`);
  ids.add(profile.id);
  if (!devices[profile.device]) throw new Error(`Unknown Playwright device descriptor: ${profile.device}`);
  if (!['chromium', 'webkit'].includes(profile.browser)) throw new Error(`Unsupported mobile browser: ${profile.browser}`);
  if (!Number.isInteger(profile.viewport?.width) || !Number.isInteger(profile.viewport?.height) || profile.viewport.width <= 0 || profile.viewport.height <= 0) {
    throw new Error(`Invalid viewport for mobile profile ${profile.id}`);
  }
  if (!Number.isFinite(profile.deviceScaleFactor) || profile.deviceScaleFactor < 1) throw new Error(`Invalid DPR for mobile profile ${profile.id}`);
  browsers.add(profile.browser);
}

if (!browsers.has('chromium') || !browsers.has('webkit')) throw new Error('Mobile certification must cover Chromium and WebKit.');
if (!matrix.coverage?.safeArea || matrix.coverage.safeArea.mode !== 'source-contract-and-solver') throw new Error('Safe-area strategy must distinguish source contracts from browser runtime evidence.');
if (matrix.coverage.safeArea.webInsets !== 'zero-by-platform-runtime') throw new Error('Mobile certification must not claim browser safe-area values are native insets.');
if (matrix.coverage.keyboardViewport !== 'test-only viewport reduction; not native keyboard execution') throw new Error('Keyboard strategy must remain explicitly simulation-only.');

console.log(`Mobile certification matrix: ${matrix.profiles.length} profiles · ${[...browsers].sort().join(' + ')} · source-contract safe-area strategy`);
