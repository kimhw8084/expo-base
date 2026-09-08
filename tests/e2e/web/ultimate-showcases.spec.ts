import { expect, test } from '@playwright/test';

const showcaseRoutes = [
  { path: '/analytics-showcase', title: 'A calm view of growth', charts: ['advanced-multi-line-chart', 'advanced-grouped-bar-chart'] },
  { path: '/finance-showcase', title: 'Value, contribution, and control', charts: ['advanced-multi-line-chart', 'advanced-waterfall-chart', 'advanced-bullet-chart'] },
  { path: '/monitoring-showcase', title: 'Know what needs attention', charts: ['advanced-multi-line-chart', 'advanced-range-bar-chart'] },
] as const;

for (const route of showcaseRoutes) {
  test(`${route.path} keeps the flagship composition bounded and data-readable`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route.path);
    await expect(page.getByRole('heading', { name: route.title })).toBeVisible();
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(documentWidth).toBeLessThanOrEqual(1);
    for (const chartTestId of route.charts) await expect(page.getByTestId(chartTestId).first()).toBeVisible();
    await expect(page.getByRole('table').first()).toBeVisible();
  });
}

test('advanced series families retain accessible fallback dimensions on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/analytics-showcase');
  await expect(page.getByRole('table', { name: /Monthly performance data/ })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Current period' }).first()).toBeVisible();
  await expect(page.getByRole('table', { name: /Distribution of value data/ })).toBeVisible();
});
