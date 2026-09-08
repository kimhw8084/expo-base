import { expect, test, type Page } from '@playwright/test';

function pseudoCopy(value: string, direction: 'ltr' | 'rtl' = 'ltr') {
  const expanded = value.replace(/[A-Za-z]/g, (character) => 'aeiou'.includes(character.toLowerCase()) ? `${character}${character}` : character);
  return direction === 'rtl' ? `\u202e［${expanded}］\u202c` : `［${expanded}］`;
}

function monitorRuntime(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    const text = message.text();
    if (text.includes('unreachable code after return statement')) return;
    if (message.type() === 'error' || message.type() === 'warning') failures.push(`${message.type()}: ${text}`);
  });
  return () => expect(failures, 'fixed P1 surfaces must not emit browser warnings or errors').toEqual([]);
}

async function box(page: Page, text: string) {
  const result = await page.getByText(text, { exact: true }).first().boundingBox();
  expect(result, `${text} should have measurable geometry`).not.toBeNull();
  return result!;
}

for (const viewport of [
  { name: 'phone-320', width: 320, height: 740 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'short-phone', width: 390, height: 568 },
  { name: 'landscape', width: 740, height: 390 },
]) {
  test(`GPQ-001 compact AdaptiveSplit keeps intrinsic non-overlapping flow at ${viewport.name}`, async ({ page }) => {
    const assertRuntime = monitorRuntime(page);
    await page.setViewportSize(viewport);
    await page.goto('/');
    const primaryEnd = await box(page, 'This deliberately long sentence verifies wrapping without feature-owned widths, truncation hacks, or viewport checks.');
    const inspector = await box(page, 'Inspector');
    const inspectorEnd = await box(page, 'Width is owned by the layout contract rather than hardcoded in the product screen.');
    const following = await box(page, 'Master / detail transformation');
    expect(primaryEnd.y + primaryEnd.height).toBeLessThanOrEqual(inspector.y);
    expect(inspectorEnd.y + inspectorEnd.height).toBeLessThanOrEqual(following.y);
    assertRuntime();
  });
}

test('GPQ-002/003 overlays expose one named modal root and restore focus', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.goto('/overlays');
  const dialogTrigger = page.getByRole('button', { name: 'Open dialog' });
  await dialogTrigger.focus();
  await dialogTrigger.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Review this recommendation' })).toHaveCount(1);
  await expect(page.locator('[aria-modal="true"]')).toHaveCount(1);
  await expect(page.locator('[data-precision-modal-host="true"] > [role="dialog"]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.keyboard.press('Escape');
  await expect(dialogTrigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');

  const alertTrigger = page.getByRole('button', { name: 'Open destructive alert' });
  await alertTrigger.focus();
  await alertTrigger.press('Enter');
  const alertDialog = page.getByRole('alertdialog', { name: 'Remove this configuration?' });
  await expect(alertDialog).toHaveCount(1);
  await expect(page.locator('[aria-modal="true"]')).toHaveCount(1);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(alertDialog.getByText('Alert dialogs require explicit action and do not dismiss on backdrop.')).toBeVisible();
  await expect(alertDialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(alertDialog).toBeVisible();
  await alertDialog.getByRole('button', { name: 'Cancel' }).press('Enter');
  await expect(alertTrigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
  assertRuntime();
});

test('GPQ-004 ActionMenu uses one roving tab stop and complete keyboard traversal', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.goto('/overlays');
  const trigger = page.getByRole('button', { name: 'Open action menu' });
  await trigger.focus();
  await trigger.press('Enter');
  const items = page.getByRole('menuitem');
  await expect(items).toHaveCount(4);
  await expect(items.nth(0)).toBeFocused();
  expect(await items.evaluateAll((nodes) => nodes.map((node) => node.tabIndex))).toEqual([0, -1, -1, -1]);
  await page.keyboard.press('End');
  await expect(items.nth(3)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(items.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(items.nth(0)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.press('Enter');
  await expect(items.nth(0)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Edit selected')).toBeVisible();
  await expect(trigger).toBeFocused();
  assertRuntime();
});

test('GPQ-005 Tabs, radios, and segmented controls use semantic roving focus', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/navigation');
  const tablist = page.getByRole('tablist', { name: 'Sections' });
  const tabs = tablist.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  expect(await tabs.evaluateAll((nodes) => nodes.map((node) => node.tabIndex))).toEqual([0, -1, -1, -1]);
  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(tabs.nth(3)).toBeFocused();

  await page.goto('/system');
  const radios = page.getByRole('radiogroup', { name: 'Density' }).getByRole('radio');
  await expect(radios).toHaveCount(2);
  expect(await radios.evaluateAll((nodes) => nodes.map((node) => node.tabIndex))).toEqual([0, -1]);
  await radios.nth(0).focus();
  await page.keyboard.press('ArrowDown');
  await expect(radios.nth(1)).toBeFocused();
  await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'true');

  const segments = page.getByRole('radiogroup', { name: 'Analytics interval' }).getByRole('radio');
  await expect(segments).toHaveCount(3);
  expect(await segments.evaluateAll((nodes) => nodes.map((node) => node.tabIndex))).toEqual([0, -1, -1]);
  await segments.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(segments.nth(1)).toBeFocused();
  await expect(segments.nth(1)).toHaveAttribute('aria-checked', 'true');
  assertRuntime();
});

test('GPQ-005 compact route navigation uses destination links and current-page state', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/forms');
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  const links = navigation.getByRole('link');
  await expect(links).toHaveCount(5);
  const build = navigation.getByRole('link', { name: 'Build' });
  await expect(build).toHaveAttribute('aria-current', 'page');
  const data = navigation.getByRole('link', { name: 'Data' });
  await data.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/data$/);
  await expect(page.getByRole('link', { name: 'Data' })).toHaveAttribute('aria-current', 'page');
  assertRuntime();
});

test('GPQ-005 horizontal roving focus follows RTL direction deliberately', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Locale: Pseudo RTL' }).click();
  await page.getByRole('main').getByText(pseudoCopy('Navigation', 'rtl'), { exact: true }).last().click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  const tabs = page.getByRole('tablist', { name: 'Sections' }).getByRole('tab');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.last()).toBeFocused();
  await expect(tabs.last()).toHaveAttribute('aria-selected', 'true');
  assertRuntime();
});

test('GPQ-006/007 Combobox uses listbox semantics and retains focus after keyboard selection', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/forms');
  const trigger = page.getByRole('combobox', { name: 'Primary issuer', exact: true });
  await trigger.focus();
  await trigger.press('Enter');
  const input = page.getByRole('combobox', { name: 'Search Primary issuer' });
  const listbox = page.getByRole('listbox', { name: 'Primary issuer results' });
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute('aria-controls', await listbox.getAttribute('id') ?? 'missing');
  await expect(listbox.getByRole('option')).toHaveCount(4);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', /option-2$/);
  await page.keyboard.press('Enter');
  await expect(listbox).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toContainText('Chase');
  await trigger.press('Enter');
  await expect(input).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  assertRuntime();
});

test('GPQ-008 short-height Combobox stays anchor-sized and above persistent navigation', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.setViewportSize({ width: 390, height: 568 });
  await page.goto('/forms');
  const trigger = page.locator('#combobox-trigger');
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const listbox = page.getByRole('listbox', { name: 'Primary issuer results' });
  await expect(listbox).toBeVisible();
  const triggerBox = await trigger.boundingBox();
  const popupBox = await page.getByTestId('precision-popover-panel').boundingBox();
  const navigationBox = await page.getByRole('navigation', { name: 'Primary navigation' }).boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(popupBox).not.toBeNull();
  expect(navigationBox).not.toBeNull();
  expect(popupBox!.width).toBeGreaterThanOrEqual(triggerBox!.width - 1);
  expect(popupBox!.y + popupBox!.height).toBeLessThanOrEqual(navigationBox!.y + 1);
  expect(Math.abs(popupBox!.x - triggerBox!.x)).toBeLessThanOrEqual(2);
  await expect(page.getByRole('combobox', { name: 'Search Primary issuer' })).toBeFocused();
  assertRuntime();
});

test('GPQ-009 FilterDrawer keeps actions visible outside its scrolling content', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.setViewportSize({ width: 390, height: 568 });
  await page.goto('/data');
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Filters' });
  const apply = sheet.getByRole('button', { name: 'Apply filters' });
  await expect(apply).toBeVisible();
  const sheetBox = await sheet.boundingBox();
  const applyBox = await apply.boundingBox();
  expect(sheetBox).not.toBeNull();
  expect(applyBox).not.toBeNull();
  await expect.poll(async () => {
    const current = await apply.boundingBox();
    return current ? current.y + current.height : Number.POSITIVE_INFINITY;
  }).toBeLessThanOrEqual(568);
  const settledSheetBox = await sheet.boundingBox();
  const settledApplyBox = await apply.boundingBox();
  expect(settledApplyBox!.y + settledApplyBox!.height).toBeLessThanOrEqual(settledSheetBox!.y + settledSheetBox!.height);
  await apply.focus();
  await expect(apply).toBeFocused();
  await apply.press('Enter');
  await expect(sheet).toHaveCount(0);
  assertRuntime();
});

test('GPQ-010 expanded AdaptiveDataTable exposes table hierarchy and sort state only on desktop', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/data');
  const table = page.getByRole('table', { name: 'Data table' });
  await expect(table).toBeVisible();
  await expect(table.getByRole('row')).toHaveCount(5);
  await expect(table.getByRole('columnheader')).toHaveCount(7);
  await expect(table.getByRole('cell')).toHaveCount(28);
  const cardHeader = table.getByRole('columnheader').filter({ hasText: 'Card' }).first();
  await expect(cardHeader).toHaveAttribute('aria-sort', 'none');
  await cardHeader.getByRole('button').click();
  await expect(cardHeader).toHaveAttribute('aria-sort', 'ascending');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('table', { name: 'Data table' })).toHaveCount(0);
  await expect(page.getByTestId('card-data-table-compact')).toBeVisible();
  assertRuntime();
});
