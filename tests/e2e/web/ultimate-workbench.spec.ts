import { expect, test } from '@playwright/test';

test('owner state workbench renders queryable deterministic fixtures and controlled interactions', async ({ page }) => {
  await page.goto('/state-workbench');
  await expect(page.getByRole('heading', { name: 'Owner state workbench' })).toBeVisible();
  await expect(page.getByTestId('owner-workbench-components.actions')).toBeVisible();
  await expect(page.getByTestId('owner-workbench-forms.fields')).toBeVisible();
  await expect(page.getByTestId('owner-workbench-feedback.async')).toBeVisible();
  await expect(page.getByTestId('owner-workbench-data.table')).toBeVisible();

  const field = page.getByRole('textbox', { name: 'Fixture label' });
  await field.fill('Updated fixture');
  await expect(field).toHaveValue('Updated fixture');

  const optional = page.getByRole('checkbox', { name: 'Include optional state' });
  await optional.check();
  await expect(optional).toBeChecked();

  await page.getByRole('radio', { name: 'Needs review' }).check();
  await expect(page.getByRole('radio', { name: 'Needs review' })).toBeChecked();

  await page.getByRole('button', { name: 'Show error' }).click();
  await expect(page.getByRole('heading', { name: 'Fixture error' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore empty' }).click();
  await expect(page.getByRole('heading', { name: 'No fixture results' })).toBeVisible();
});
