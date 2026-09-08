import { expect, test } from '@playwright/test';

test('advanced visualization module keeps touch-sized named selections and fallbacks', async ({ page }) => {
  await page.goto('/golden-plus');
  await expect(page.getByTestId('advanced-scatter-plot')).toBeVisible();
  await expect(page.getByTestId('advanced-histogram')).toBeVisible();
  await expect(page.getByTestId('advanced-heatmap')).toBeVisible();
  const point = page.getByRole('button', { name: 'North: 18' });
  await point.click();
  await expect(point).toHaveAttribute('aria-pressed', 'true');
  const cell = page.getByRole('button', { name: /New, Week 1: 0\.92/ });
  await cell.click();
  await expect(cell).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('table', { name: 'Regional relationship data' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Observed distribution data' })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Cohort retention data' })).toBeVisible();
});
