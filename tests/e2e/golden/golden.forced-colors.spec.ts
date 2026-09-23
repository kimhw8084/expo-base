import { expect, test } from '@playwright/test';
import { assertLabelHasVisiblePixels } from './label-pixels.mjs';

async function expectRenderedLabel(page: import('@playwright/test').Page, label: string) {
  const text = page.getByText(label, { exact: true });
  await expect(text).toBeVisible();
  const pixels = await text.screenshot({ animations: 'disabled', caret: 'hide', scale: 'css' });
  expect(assertLabelHasVisiblePixels(pixels, label)).toBeGreaterThanOrEqual(8);
}

test('@semantic @qualification forcedColors/label-task shared labels render pixels and preserve local tasks', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/state-workbench');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

  const primary = page.getByRole('button', { name: 'Enabled action' });
  const danger = page.getByRole('button', { name: 'Destructive action' });
  const dangerText = page.getByText('Destructive action', { exact: true });

  await expectRenderedLabel(page, 'Enabled action');
  await primary.click();
  const error = page.getByRole('alert');
  const errorTitle = error.getByRole('heading', { name: 'Fixture error' });
  await expect(error).toBeVisible();
  await expect(errorTitle).toBeVisible();
  await expectRenderedLabel(page, 'Fixture error');

  await expectRenderedLabel(page, 'Destructive action');
  await danger.click();
  await expect(page.getByRole('heading', { name: 'No fixture results' })).toBeVisible();

  const choice = page.getByRole('radio', { name: 'Needs review' });
  await expectRenderedLabel(page, 'Needs review');
  await choice.check();
  await expect(choice).toBeChecked();

  const field = page.getByRole('textbox', { name: 'Fixture label' });
  await expectRenderedLabel(page, 'Fixture label');
  await field.fill('Forced colors task completed');
  await expect(field).toHaveValue('Forced colors task completed');

  await expect(danger).toHaveAccessibleName('Destructive action');
  await expect(dangerText).toBeVisible();
  expect(await danger.evaluate((element) => getComputedStyle(element).getPropertyValue('forced-color-adjust'))).toBe('auto');
  const dangerBox = await dangerText.boundingBox();
  await dangerText.evaluate((element) => { (element as HTMLElement).style.opacity = '0'; });
  await expect(dangerText).toBeVisible();
  expect(await dangerText.boundingBox()).toEqual(dangerBox);
  const invisibleLabelPixels = await dangerText.screenshot({ animations: 'disabled', caret: 'hide', scale: 'css' });
  expect(() => assertLabelHasVisiblePixels(invisibleLabelPixels, 'Destructive action')).toThrow(/label pixels absent or indistinguishable/);

  await primary.click();
  await expect(errorTitle).toBeVisible();
  await danger.click();
  await expect(page.getByRole('heading', { name: 'No fixture results' })).toBeVisible();
});
