import { expect, test } from '@playwright/test';
import fs from 'node:fs';

const ownerCertification = JSON.parse(fs.readFileSync('golden.owner-certification.json', 'utf8'));

test('owner state workbench renders declared fixtures and controlled interactions', async ({ page }) => {
  await page.goto('/state-workbench');
  await expect(page.getByRole('heading', { name: 'Owner state workbench' })).toBeVisible();
  await expect(page.getByTestId('owner-workbench-components.actions-detail')).toBeVisible();
  await expect(page.getByTestId('owner-workbench-forms.text-entry-detail')).toBeVisible();
  await expect(page.getByTestId('owner-workbench-feedback.async-detail')).toBeVisible();
  await expect(page.getByTestId('owner-workbench-data.table-detail')).toBeVisible();

  for (const owner of ownerCertification.owners) {
    const fixture = page.getByTestId(`owner-workbench-${owner.id}`);
    await expect(fixture).toBeVisible();
    await expect(page.getByTestId(`owner-workbench-${owner.id}-states`)).toContainText(owner.states[0]);
  }

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

test('@owner-state components.actions/enabled enabled action activates shared error feedback', async ({ page }) => {
  await page.goto('/state-workbench');
  await page.getByRole('button', { name: 'Enabled action' }).click();
  await expect(page.getByRole('alert').getByRole('heading', { name: 'Fixture error' })).toBeVisible();
});

test('@owner-state components.actions/disabled disabled action remains unavailable', async ({ page }) => {
  await page.goto('/state-workbench');
  const button = page.getByRole('button', { name: 'Disabled action' });
  await expect(button).toBeDisabled();
  await button.dispatchEvent('click');
  await expect(page.getByRole('heading', { name: 'No fixture results' })).toBeVisible();
});

test('@owner-state components.actions/loading loading action is busy and non-activating', async ({ page }) => {
  await page.goto('/state-workbench');
  const button = page.getByRole('button', { name: 'Loading action' });
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button).toBeDisabled();
  await button.dispatchEvent('click');
  await expect(page.getByRole('heading', { name: 'No fixture results' })).toBeVisible();
});

test('@owner-state components.actions/destructive danger action restores empty feedback', async ({ page }) => {
  await page.goto('/state-workbench');
  await page.getByRole('button', { name: 'Show error' }).click();
  await expect(page.getByRole('alert').getByRole('heading', { name: 'Fixture error' })).toBeVisible();
  await page.getByRole('button', { name: 'Destructive action' }).click();
  await expect(page.getByRole('heading', { name: 'No fixture results' })).toBeVisible();
});

test('@owner-state forms.text-entry/enabled text field edits controlled value', async ({ page }) => {
  await page.goto('/state-workbench');
  const field = page.getByRole('textbox', { name: 'Fixture label' });
  await expect(field).toBeEnabled();
  await field.fill('Edited owner state');
  await expect(field).toHaveValue('Edited owner state');
});

test('@owner-state forms.static-choice/selected radio choice becomes selected', async ({ page }) => {
  await page.goto('/state-workbench');
  const choice = page.getByRole('radio', { name: 'Needs review' });
  await choice.check();
  await expect(choice).toBeChecked();
});

test('@owner-state forms.searchable-choice/open combobox opens its options list', async ({ page }) => {
  await page.goto('/forms');
  const combobox = page.getByRole('combobox', { name: 'Primary issuer', exact: true });
  await combobox.focus();
  await combobox.press('Enter');
  const search = page.getByRole('combobox', { name: 'Search Primary issuer' });
  await expect(search).toBeFocused();
  await expect(page.getByRole('listbox', { name: 'Primary issuer results' })).toBeVisible();
  await expect(page.getByRole('option')).toHaveCount(4);
});

test('@owner-state overlays.dialog-alert/open destructive alert opens as modal alert dialog', async ({ page }) => {
  await page.goto('/overlays');
  await page.getByRole('button', { name: 'Open destructive alert' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Remove this configuration?' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('[aria-modal="true"]')).toHaveCount(1);
});

test('@owner-state overlays.menu/expanded action menu reveals available commands', async ({ page }) => {
  await page.goto('/overlays');
  await page.getByRole('button', { name: 'Open action menu' }).click();
  const menu = page.getByRole('menu', { name: 'Card actions' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Edit card' })).toBeVisible();
});

test('@owner-state feedback.async/empty empty result renders recovery task', async ({ page }) => {
  await page.goto('/state-workbench');
  await expect(page.getByRole('heading', { name: 'No fixture results' })).toBeVisible();
  await page.getByRole('button', { name: 'Show error' }).click();
  await expect(page.getByRole('alert').getByRole('heading', { name: 'Fixture error' })).toBeVisible();
});

test('@owner-state feedback.async/error error result renders alert and recovery task', async ({ page }) => {
  await page.goto('/state-workbench');
  await page.getByRole('button', { name: 'Show error' }).click();
  await expect(page.getByRole('alert')).toContainText('The shared error anatomy keeps recovery visible.');
  await page.getByRole('button', { name: 'Restore empty' }).click();
  await expect(page.getByRole('heading', { name: 'No fixture results' })).toBeVisible();
});

test('@owner-state feedback.async/loading loading feedback exposes one named progress task', async ({ page }) => {
  await page.goto('/state-workbench');
  await expect(page.getByRole('progressbar', { name: 'Loading fixture state' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Loading fixture state' })).toHaveCount(1);
});
