import { expect, test, type Page } from '@playwright/test';

function monitorRuntime(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    const text = message.text();
    if (text.includes('unreachable code after return statement')) return;
    if (message.type() === 'error' || message.type() === 'warning') failures.push(`${message.type()}: ${text}`);
  });
  return () => expect(failures, 'Pass 4 surfaces must not emit browser warnings or errors').toEqual([]);
}

test('FCQ-001 Command Launcher Escape closes from focused search and restores the trigger', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/workflows');

  const trigger = page.getByRole('button', { name: 'Commands', exact: true });
  const dialog = page.getByRole('dialog', { name: 'Command launcher' });
  const search = dialog.getByLabel('Search commands', { exact: true });
  const openLauncher = async () => {
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await expect(search).toBeFocused();
  };
  const dismissAndAssertFocus = async () => {
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  };

  await openLauncher();
  await search.fill('permission');
  await expect(dialog.getByText('Show permission rationale', { exact: true })).toBeVisible();
  await dismissAndAssertFocus();

  await openLauncher();
  await search.fill('no matching command');
  await expect(dialog.getByText('No matching commands.', { exact: true })).toBeVisible();
  await dismissAndAssertFocus();

  await openLauncher();
  await search.fill('permission');
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: /Show permission rationale/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();

  assertRuntime();
});

test('FCQ-002 enabled forms specimens own deterministic interactive state', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/forms');

  const textField = page.getByLabel('Text field', { exact: true });
  await expect(textField).toHaveValue('Travel setup');
  await textField.fill('Reference edit');
  await expect(textField).toHaveValue('Reference edit');

  const search = page.getByLabel('Search', { exact: true });
  await search.fill('travel');
  await expect(search).toHaveValue('travel');

  const password = page.getByLabel('Password visibility', { exact: true });
  await password.fill('updated password');
  await expect(password).toHaveValue('updated password');

  const email = page.getByLabel('Email address', { exact: true }).last();
  await email.fill('reference@example.com');
  await expect(email).toHaveValue('reference@example.com');

  const checkbox = page.getByRole('checkbox', { name: 'Include annual fees', exact: true });
  await expect(checkbox).toHaveAttribute('aria-checked', 'true');
  await checkbox.click();
  await expect(checkbox).toHaveAttribute('aria-checked', 'false');

  const dining = page.getByRole('checkbox', { name: 'Dining', exact: true });
  await expect(dining).toHaveAttribute('aria-checked', 'false');
  await dining.click();
  await expect(dining).toHaveAttribute('aria-checked', 'true');

  const highestValue = page.getByRole('radiogroup', { name: 'Sort cards' }).getByRole('radio', { name: 'Highest value', exact: true });
  await highestValue.click();
  await expect(highestValue).toHaveAttribute('aria-checked', 'true');

  const notifications = page.getByRole('switch', { name: 'Bonus notifications', exact: true });
  await expect(notifications).toBeChecked();
  await notifications.click();
  await expect(notifications).not.toBeChecked();

  const notes = page.getByLabel('Notes', { exact: true });
  await notes.fill('Updated reference notes');
  await expect(notes).toHaveValue('Updated reference notes');

  assertRuntime();
});

test('Pass 4 spot-check preserves generic dialog, RHF form, navigation, and menu behavior', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.setViewportSize({ width: 1024, height: 800 });

  await page.goto('/overlays');
  const dialogTrigger = page.getByRole('button', { name: 'Open dialog', exact: true });
  await dialogTrigger.click();
  await expect(page.getByRole('dialog', { name: 'Review this recommendation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialogTrigger).toBeFocused();

  await page.goto('/forms');
  await page.getByLabel('Full name', { exact: true }).fill('Reference user');
  await expect(page.getByLabel('Full name', { exact: true })).toHaveValue('Reference user');

  await page.goto('/navigation');
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();

  await page.goto('/overlays');
  const menuTrigger = page.getByRole('button', { name: 'Open action menu', exact: true });
  await menuTrigger.click();
  await expect(page.getByRole('menu', { name: 'Card actions', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menuTrigger).toBeFocused();

  assertRuntime();
});
