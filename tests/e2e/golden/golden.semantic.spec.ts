import { expect, test } from '@playwright/test';

function pseudoRtl(value: string) {
  const expanded = value.replace(/[A-Za-z]/g, (character) => 'aeiou'.includes(character.toLowerCase()) ? `${character}${character}` : character);
  return `\u202e［${expanded}］\u202c`;
}

test('@semantic page shell exposes one main landmark and ordered headings', async ({ page }) => {
  await page.goto('/forms');
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Form interaction acceptance surface' })).toMatchAriaSnapshot(`- heading "Form interaction acceptance surface" [level=1]`);
  await expect(page.getByRole('heading', { name: 'State-library-agnostic controls' })).toMatchAriaSnapshot(`- heading "State-library-agnostic controls" [level=2]`);
  await expect(page.getByRole('heading', { name: 'Profile information' })).toMatchAriaSnapshot(`- heading "Profile information" [level=3]`);
});

test('@semantic validation summary is assertive and focuses the first invalid field', async ({ page }) => {
  await page.goto('/forms');
  await page.getByRole('button', { name: 'Validate form' }).click();
  const summary = page.getByRole('alert').filter({ has: page.getByText('Review the highlighted fields') });
  await expect(summary).toMatchAriaSnapshot(`
    - alert:
      - heading "Review the highlighted fields" [level=3]
      - text: Choose an item to move to the field that needs attention.
      - button /Go to Full name.*/
      - button /Go to Email address.*/
      - button /Go to Password.*/
      - button /Go to Terms and consent.*/
  `);
  await expect(page.getByRole('textbox', { name: 'Full name' })).toBeFocused();
});

test('@semantic dialog and action menu preserve names, states, and focus restoration', async ({ page }) => {
  await page.goto('/overlays');
  const trigger = page.getByRole('button', { name: 'Open dialog' });
  await trigger.focus();
  await trigger.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Review this recommendation' });
  await expect(page.locator('[aria-modal="true"]')).toHaveCount(1);
  await expect(dialog).toMatchAriaSnapshot(`
    - dialog "Review this recommendation":
      - heading "Review this recommendation" [level=3]
      - text: Standard dialogs may dismiss through the backdrop or Escape/back.
      - button "Cancel"
      - button "Review"
  `);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  const menuTrigger = page.getByRole('button', { name: 'Open action menu' });
  await menuTrigger.press('Enter');
  const menu = page.getByRole('menu');
  await expect(menu).toMatchAriaSnapshot(`
    - menu "Card actions":
      - text: General
      - menuitem "Edit card":
        - img
        - text: Edit card E
      - menuitem "Duplicate setup":
        - img
        - text: Duplicate setup D
      - menuitem "Archive":
        - img
        - text: Archive
      - text: Danger zone
      - menuitem "Remove":
        - img
        - text: Remove
  `);
  const menuItems = menu.getByRole('menuitem');
  await expect(menuItems.first()).toBeFocused();
  expect(await menuItems.evaluateAll((items) => items.map((item) => item.tabIndex))).toEqual([0, -1, -1, -1]);
  await page.keyboard.press('ArrowDown');
  await expect(menuItems.nth(1)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menuTrigger).toBeFocused();

  const alertTrigger = page.getByRole('button', { name: 'Open destructive alert' });
  await alertTrigger.press('Enter');
  await expect(page.getByRole('alertdialog', { name: 'Remove this configuration?' })).toHaveCount(1);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('[aria-modal="true"]')).toHaveCount(1);
});

test('@semantic data workspace exposes toolbar, mixed selection, and retained feedback', async ({ page }) => {
  await page.goto('/data');
  await expect(page.getByRole('toolbar', { name: 'Data controls' })).toBeVisible();
  const table = page.getByRole('table', { name: 'Data table' });
  await expect(table.getByRole('row')).toHaveCount(5);
  await expect(table.getByRole('columnheader')).toHaveCount(7);
  await expect(table.getByRole('cell')).toHaveCount(28);
  await page.getByRole('checkbox', { name: 'Select Venture X' }).filter({ visible: true }).click();
  await expect(page.getByLabel('Select all visible rows')).toHaveAttribute('aria-checked', 'mixed');
  await expect(page.getByRole('toolbar', { name: 'Bulk actions' })).toBeVisible();
  await page.goto('/feedback');
  const status = page.getByRole('status').filter({ hasText: 'Offline' }).last();
  await expect(status).toBeVisible();
  await expect(page.getByText('Previously loaded data remains usable')).toBeVisible();
});

test('@semantic keyboard-only command, combobox, form, and overlay path remains operable', async ({ page }) => {
  await page.goto('/workflows');
  await page.getByRole('button', { name: 'Commands' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Command launcher' })).toBeVisible();
  await page.keyboard.type('permission');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Allow document access' })).toBeVisible();
  await page.goto('/system');
  const select = page.getByRole('combobox', { name: 'Institution' });
  await select.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(select).toBeFocused();

  await page.goto('/forms');
  const combobox = page.getByRole('combobox', { name: 'Primary issuer', exact: true });
  await combobox.focus();
  await combobox.press('Enter');
  const search = page.getByRole('combobox', { name: 'Search Primary issuer' });
  const listbox = page.getByRole('listbox', { name: 'Primary issuer results' });
  await expect(search).toBeFocused();
  await expect(listbox.getByRole('option')).toHaveCount(4);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(combobox).toBeFocused();
});

test('@semantic forced colors retain focus and non-color state indicators', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/system');
  const button = page.getByRole('button', { name: 'Primary', exact: true });
  await button.focus();
  expect(await button.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe('none');
  await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('combobox', { name: 'Institution' })).toHaveAttribute('aria-expanded', 'false');
});

test('@semantic zoom, RTL, and reduced motion preserve usable geometry', async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Locale: Pseudo RTL' }).click();
  await page.getByRole('button', { name: 'Motion: Reduced' }).click();
  await page.getByText(pseudoRtl('Stress matrix'), { exact: true }).last().click();
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('main')).toBeVisible();
});

test('@semantic Golden Plus utilities, timeline, date fields, and chart fallback remain explicit', async ({ page }) => {
  await page.goto('/golden-plus');
  await expect(page.getByRole('group', { name: /Workspace maintainers/ })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Workspace history' })).toMatchAriaSnapshot(`
    - list "Workspace history":
      - listitem: Workspace approved Today, 09:30 Complete The review completed with no outstanding exceptions.
      - listitem: Configuration reviewed Yesterday, 16:10 Reviewed Two maintainers reviewed the proposed runtime policy.
      - listitem: Workspace created Sep 2, 11:45 Initial settings were created from the Golden workflow.
  `);
  await expect(page.getByRole('textbox', { name: 'Effective date' })).toHaveValue('2026-09-07');
  await expect(page.getByRole('textbox', { name: 'Review time' })).toHaveValue('14:30');
  await expect(page.getByRole('table', { name: 'Quarterly workspace status data' })).toBeVisible();
  await expect(page.getByTestId('golden-plus-copy-value-copy')).toHaveAttribute('aria-label', 'Copy Workspace identifier');
  await expect(page.getByRole('button', { name: 'Reveal Sensitive reference' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Copy Sensitive reference' })).toHaveCount(1);
});
