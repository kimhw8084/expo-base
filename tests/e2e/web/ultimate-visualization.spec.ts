import { expect, test } from '@playwright/test';

test('advanced visualization module keeps 44px named selections and faithful fallbacks', async ({ page }) => {
  await page.goto('/golden-plus');
  await expect(page.getByTestId('advanced-scatter-plot')).toBeVisible();
  await expect(page.getByTestId('advanced-histogram')).toBeVisible();
  await expect(page.getByTestId('advanced-heatmap')).toBeVisible();
  const point = page.getByRole('button', { name: 'North: 18' });
  const pointBox = await point.boundingBox();
  expect(pointBox).not.toBeNull();
  expect(pointBox!.width).toBeGreaterThanOrEqual(44);
  expect(pointBox!.height).toBeGreaterThanOrEqual(44);
  await point.click();
  await expect(point).toHaveAttribute('aria-pressed', 'true');
  const cell = page.getByRole('button', { name: /New, Week 1: 0\.92/ });
  await cell.click();
  await expect(cell).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('table', { name: 'Regional relationship data' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Regional relationship data' }).getByRole('columnheader', { name: 'X' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Regional relationship data' }).getByRole('columnheader', { name: 'Y' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Observed distribution data' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Cohort retention data' })).toBeVisible();
});

test('advanced charts expose shared axis anatomy and retained chart states', async ({ page }) => {
  await page.goto('/golden-plus');
  const scatterAxes = page.getByTestId('advanced-scatter-axes');
  await expect(scatterAxes).toBeVisible();
  await expect(page.getByTestId('advanced-histogram-axes')).toBeVisible();
  const axisLabels = await scatterAxes.locator('text').allTextContents();
  expect(axisLabels.some((label) => label.trim() === '0')).toBeTruthy();
  expect(axisLabels.some((label) => label.trim() === '100')).toBeTruthy();
});
