import { expect, test } from '@playwright/test';

const routes = ['/', '/forms', '/navigation', '/overlays', '/lists', '/data', '/visualization', '/feedback', '/accessibility-motion', '/golden', '/system', '/stress', '/services', '/auth-session', '/authorization', '/admin-demo', '/linking'];
const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];

for (const route of routes) {
  test(`${route} renders without page-level horizontal overflow`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('body')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

for (const viewport of viewports) {
  test(`stress route remains bounded at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/stress');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    for (let index = 0; index < count; index += 1) {
      const box = await buttons.nth(index).boundingBox();
      if (!box) continue;
      expect(box.width).toBeGreaterThanOrEqual(36);
      expect(box.height).toBeGreaterThanOrEqual(36);
    }
  });
}

test('auth guards remove protected access and restore safe return intent after sign-in', async ({ page }) => {
  await page.goto('/auth-session');
  await expect(page.getByText('Authentication session acceptance')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out and test guard' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByText('Authentication session acceptance')).toHaveCount(0);
  await page.getByLabel('Email').fill('reference@example.com');
  await page.getByLabel('Password').fill('demo');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Authentication session acceptance')).toBeVisible();
  await expect(page.getByText('reference@example.com')).toBeVisible();
});

test('service adapters remain behind runtime boundary across auth transition', async ({ page }) => {
  await page.goto('/services');
  await expect(page.getByText('Service + auth runtime acceptance surface')).toBeVisible();
  await page.getByRole('button', { name: 'Verify storage adapter' }).click();
  await expect(page.getByText(/Storage returned reference-user/)).toBeVisible();
  await page.getByRole('button', { name: 'Sign out through auth runtime' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.getByLabel('Email').fill('reference@example.com');
  await page.getByLabel('Password').fill('demo');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Service + auth runtime acceptance surface')).toBeVisible();
});


test('capability requirement controls nested protected route', async ({ page }) => {
  await page.goto('/authorization');
  await expect(page.getByText('Authorization capability acceptance')).toBeVisible();
  await expect(page.getByText(/reports\.view, rewards\.optimize, settings\.manage/)).toBeVisible();
  await page.getByRole('button', { name: 'Open capability-protected route' }).click();
  await expect(page.getByText('Capability-protected route')).toBeVisible();
});
