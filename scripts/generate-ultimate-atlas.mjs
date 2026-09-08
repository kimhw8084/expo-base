import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const output = path.resolve(process.argv[2] ?? 'test-results/ultimate-golden-pass2/atlas');
const baseURL = process.env.PRECISION_CALM_BASE_URL ?? 'http://127.0.0.1:8081';
const routes = ['/', '/forms', '/data', '/overlays', '/visualization', '/golden-plus', '/state-workbench', '/analytics-showcase', '/finance-showcase', '/monitoring-showcase'];
const profiles = [
  { id: 'desktop-light', viewport: { width: 1440, height: 900 }, theme: 'Light', density: 'Comfortable' },
  { id: 'desktop-dark-compact', viewport: { width: 1440, height: 900 }, theme: 'Dark', density: 'Compact' },
  { id: 'tablet-light', viewport: { width: 1024, height: 800 }, theme: 'Light', density: 'Comfortable' },
  { id: 'phone-light', viewport: { width: 390, height: 844 }, theme: 'Light', density: 'Comfortable' },
  { id: 'phone-dark-compact', viewport: { width: 390, height: 844 }, theme: 'Dark', density: 'Compact' },
  { id: 'phone-pseudo-rtl', viewport: { width: 320, height: 700 }, theme: 'Dark', density: 'Compact', locale: 'Pseudo RTL' },
];

await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await context.newPage();
const manifest = [];
for (const profile of profiles) {
  for (const route of routes) {
    await page.setViewportSize(profile.viewport);
    await page.goto(`${baseURL}/`);
    await page.getByRole('button', { name: `Theme: ${profile.theme}` }).click();
    await page.getByRole('button', { name: `Density: ${profile.density}` }).click();
    if (profile.locale) await page.getByRole('button', { name: `Locale: ${profile.locale}` }).click();
    if (route !== '/') await page.goto(`${baseURL}${route}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(350);
    const file = `${profile.id}-${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}.png`;
    await page.screenshot({ path: path.join(output, file), fullPage: false });
    manifest.push({ route, profile: profile.id, viewport: profile.viewport, theme: profile.theme, density: profile.density, locale: profile.locale ?? 'en-US', file });
  }
}
await fs.writeFile(path.join(output, 'manifest.json'), `${JSON.stringify({ baseURL, screenshotCount: manifest.length, routes, profiles, screenshots: manifest }, null, 2)}\n`);
await browser.close();
console.log(`Ultimate atlas generated (${manifest.length} screenshots) at ${path.relative(root, output)}.`);
