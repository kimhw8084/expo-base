import { expect, test, type Page, type TestInfo } from '@playwright/test';

const routeLabels: Record<string, string> = {
  '/forms': 'Forms',
  '/data': 'Data display',
  '/visualization': 'Visualization',
  '/overlays': 'Overlays',
  '/workflows': 'Workflow lab',
};

function pseudoCopy(value: string, direction: 'ltr' | 'rtl' = 'ltr') {
  const expanded = value.replace(/[A-Za-z]/g, (character) => 'aeiou'.includes(character.toLowerCase()) ? `${character}${character}` : character);
  return direction === 'rtl' ? `\u202e［${expanded}］\u202c` : `［${expanded}］`;
}

function watchRuntime(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') failures.push(`${message.type()}: ${message.text()}`);
  });
  return () => expect(failures, 'mobile certification surfaces must not emit browser errors or warnings').toEqual([]);
}

async function assertNoHorizontalOverflow(page: Page) {
  const result = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(result.documentWidth, 'document must not overflow the mobile viewport').toBeLessThanOrEqual(result.viewport + 1);
  expect(result.bodyWidth, 'body must not overflow the mobile viewport').toBeLessThanOrEqual(result.viewport + 1);
}

async function setRuntimeControls(page: Page, options: { theme?: 'light' | 'dark'; density?: 'comfortable' | 'compact'; locale?: 'en-XA' | 'en-XB'; motion?: 'reduced' } = {}) {
  if (options.theme) await page.getByRole('button', { name: `Theme: ${options.theme === 'dark' ? 'Dark' : 'Light'}` }).click();
  if (options.density) await page.getByRole('button', { name: `Density: ${options.density === 'compact' ? 'Compact' : 'Comfortable'}` }).click();
  if (options.locale) await page.getByRole('button', { name: `Locale: ${options.locale === 'en-XA' ? 'Pseudo LTR' : 'Pseudo RTL'}` }).click();
  if (options.motion === 'reduced') await page.getByRole('button', { name: 'Motion: Reduced' }).click();
}

async function openRoute(page: Page, route: string, options: { theme?: 'light' | 'dark'; density?: 'comfortable' | 'compact'; locale?: 'en-XA' | 'en-XB'; motion?: 'reduced' } = {}) {
  await page.goto('/');
  await setRuntimeControls(page, options);
  if (route === '/') return;
  const label = options.locale ? pseudoCopy(routeLabels[route]!, options.locale === 'en-XB' ? 'rtl' : 'ltr') : routeLabels[route]!;
  if (route === '/forms' || route === '/data') {
    const navigationLabel = route === '/forms' ? 'Build' : 'Data';
    await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: options.locale ? pseudoCopy(navigationLabel, options.locale === 'en-XB' ? 'rtl' : 'ltr') : navigationLabel }).tap();
  } else {
    await page.getByRole('main').getByText(label, { exact: true }).last().tap();
  }
  await expect(page).toHaveURL(new RegExp(`${route.replace('/', '\\/')}$`));
  await expect(page.getByRole('main')).toBeVisible();
  if (route === '/forms') await expect(page.getByRole('textbox', { name: 'Text field' })).toBeVisible();
  if (route === '/data') await expect(page.getByTestId('card-data-table-compact')).toBeVisible();
}

async function tapBackdrop(page: Page, label: string) {
  const backdrop = page.getByLabel(label);
  const box = await backdrop.boundingBox();
  expect(box).not.toBeNull();
  await page.touchscreen.tap(Math.max(4, box!.x + 4), Math.max(4, box!.y + 4));
}

function profileHasPortraitPhone(testInfo: TestInfo) {
  return testInfo.project.name.includes('phone') && !testInfo.project.name.includes('landscape');
}

test('mobile contexts expose touch semantics and stable phone geometry', async ({ page }, testInfo) => {
  test.skip(!profileHasPortraitPhone(testInfo), 'Representative portrait phone profiles only.');
  const assertRuntime = watchRuntime(page);
  await openRoute(page, '/');
  const context = await page.evaluate(() => ({
    maxTouchPoints: navigator.maxTouchPoints,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    dpr: window.devicePixelRatio,
  }));
  expect(testInfo.project.use.hasTouch, 'profile must request touch semantics').toBe(true);
  expect(testInfo.project.use.isMobile, 'profile must request mobile device semantics').toBe(true);
  if (testInfo.project.name.includes('chromium')) {
    expect(context.maxTouchPoints).toBeGreaterThan(0);
    expect(context.coarsePointer).toBe(true);
  }
  expect(context.dpr).toBeGreaterThanOrEqual(2);
  expect(context.viewport.width).toBeLessThanOrEqual(430);
  await assertNoHorizontalOverflow(page);
  assertRuntime();
});

test('touch navigation keeps bottom destinations readable and current', async ({ page }) => {
  const assertRuntime = watchRuntime(page);
  await openRoute(page, '/forms');
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  const links = navigation.getByRole('link');
  await expect(links).toHaveCount(5);
  const boxes = await links.evaluateAll((nodes) => nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    const label = node.querySelector('[data-testid^="navigation-label-"]')?.textContent?.trim() ?? '';
    return { left: rect.left, right: rect.right, width: rect.width, label, clipped: Boolean(node.querySelector('[data-testid^="navigation-label-"]') && (node.querySelector('[data-testid^="navigation-label-"]') as HTMLElement).scrollWidth > (node.querySelector('[data-testid^="navigation-label-"]') as HTMLElement).clientWidth + 1) };
  }));
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(boxes.every((box) => box.width >= 44 && box.left >= -1 && box.right <= viewportWidth + 1)).toBe(true);
  expect(boxes.every((box) => box.label.length > 1 && !box.clipped)).toBe(true);
  await navigation.getByRole('link', { name: 'Data' }).tap();
  await expect(page).toHaveURL(/\/data$/);
  await expect(navigation.getByRole('link', { name: 'Data' })).toHaveAttribute('aria-current', 'page');
  await assertNoHorizontalOverflow(page);
  assertRuntime();
});

test('touch form controls update state and remain reachable in a keyboard-sized viewport', async ({ page }) => {
  const assertRuntime = watchRuntime(page);
  await openRoute(page, '/forms', { density: 'compact' });
  const text = page.getByRole('textbox', { name: 'Text field' });
  await text.fill('Mobile value');
  await expect(text).toHaveValue('Mobile value');

  const includeFees = page.getByRole('checkbox', { name: 'Include annual fees' });
  const checkedBefore = await includeFees.getAttribute('aria-checked');
  await includeFees.tap();
  await expect(includeFees).toHaveAttribute('aria-checked', checkedBefore === 'true' ? 'false' : 'true');

  const radio = page.getByRole('radio', { name: 'Highest value' });
  await radio.tap();
  await expect(radio).toHaveAttribute('aria-checked', 'true');

  const combobox = page.locator('#combobox-trigger');
  await combobox.tap();
  await expect(page.getByRole('listbox', { name: 'Primary issuer results' })).toBeVisible();
  await page.getByRole('option', { name: 'Chase' }).tap();
  await expect(combobox).toContainText('Chase');

  await page.setViewportSize({ width: 390, height: 390 });
  const notes = page.getByRole('textbox', { name: 'Notes' });
  await notes.scrollIntoViewIfNeeded();
  await expect(notes).toBeVisible();
  await assertNoHorizontalOverflow(page);
  assertRuntime();
});

test('combobox stays within the usable short-height phone viewport and scroll-locks only the overlay', async ({ page }) => {
  const assertRuntime = watchRuntime(page);
  await page.setViewportSize({ width: 390, height: 568 });
  await openRoute(page, '/forms');
  const trigger = page.locator('#combobox-trigger');
  await trigger.scrollIntoViewIfNeeded();
  await trigger.tap();
  const listbox = page.getByRole('listbox', { name: 'Primary issuer results' });
  await expect(listbox).toBeVisible();
  const popup = page.getByTestId('precision-popover-panel');
  const popupBox = await popup.boundingBox();
  const navBox = await page.getByRole('navigation', { name: 'Primary navigation' }).boundingBox();
  expect(popupBox).not.toBeNull();
  expect(navBox).not.toBeNull();
  expect(popupBox!.y).toBeGreaterThanOrEqual(-1);
  expect(popupBox!.y + popupBox!.height).toBeLessThanOrEqual(navBox!.y + 1);
  await page.getByRole('option', { name: 'American Express' }).tap();
  await expect(listbox).toHaveCount(0);
  await expect(trigger).toContainText('American Express');
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
  assertRuntime();
});

test('touch sheets and dialogs remain bounded, scrollable, and dismissible', async ({ page }, testInfo) => {
  const assertRuntime = watchRuntime(page);
  await page.setViewportSize({ width: testInfo.project.name.includes('landscape') ? 844 : 390, height: testInfo.project.name.includes('landscape') ? 390 : 568 });
  await openRoute(page, '/overlays', { motion: 'reduced' });
  await page.getByRole('button', { name: 'Open long sheet' }).tap();
  const sheet = page.getByRole('dialog', { name: 'Scrollable sheet acceptance' });
  await expect(sheet).toBeVisible();
  const sheetBox = await sheet.boundingBox();
  expect(sheetBox).not.toBeNull();
  expect(sheetBox!.x).toBeGreaterThanOrEqual(-1);
  const viewport = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  expect(sheetBox!.x + sheetBox!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(sheetBox!.y + sheetBox!.height).toBeLessThanOrEqual(viewport.height + 1);
  const scroll = page.getByTestId('bottom-sheet-scroll');
  await scroll.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  await expect(page.getByRole('button', { name: 'Finish long-sheet review' })).toBeVisible();
  await tapBackdrop(page, 'Dismiss sheet');
  await expect(sheet).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');

  await page.getByRole('button', { name: 'Open destructive alert' }).tap();
  const alert = page.getByRole('alertdialog', { name: 'Remove this configuration?' });
  await expect(alert).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).tap();
  await expect(alert).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
  assertRuntime();
});

test('mobile command launcher supports touch search, result selection, and visible dismissal', async ({ page }) => {
  const assertRuntime = watchRuntime(page);
  await openRoute(page, '/workflows');
  await page.getByRole('button', { name: 'Commands' }).tap();
  const dialog = page.getByRole('dialog', { name: 'Command launcher' });
  await expect(dialog).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search commands' }).fill('offline');
  await expect(dialog.getByText('Show offline workspace')).toBeVisible();
  await dialog.getByText('Show offline workspace').tap();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Commands' }).tap();
  await tapBackdrop(page, 'Dismiss dialog');
  await expect(dialog).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
  assertRuntime();
});

test('orientation changes retain typed state and recompute compact composition', async ({ page }) => {
  const assertRuntime = watchRuntime(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openRoute(page, '/forms');
  const text = page.getByRole('textbox', { name: 'Text field' });
  await text.fill('Retained through rotation');
  await page.setViewportSize({ width: 844, height: 390 });
  await assertNoHorizontalOverflow(page);
  await expect(text).toHaveValue('Retained through rotation');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(text).toHaveValue('Retained through rotation');
  await assertNoHorizontalOverflow(page);
  assertRuntime();
});

test('data workspace remains touch-usable in compact mode', async ({ page }) => {
  const assertRuntime = watchRuntime(page);
  await openRoute(page, '/data', { theme: 'dark', density: 'compact', locale: 'en-XB' });
  await expect(page.getByTestId('card-data-table-compact')).toBeVisible();
  const search = page.getByRole('searchbox').first();
  await search.tap();
  await search.fill('Chase');
  const row = page.getByTestId('card-data-table-compact-row-sapphire');
  await expect(row).toBeVisible();
  await expect(row.getByText('Sapphire Preferred', { exact: true })).toBeVisible();
  await row.tap();
  await expect(page.getByTestId('selected-record-details')).toContainText('Sapphire Preferred');
  await assertNoHorizontalOverflow(page);
  expect(await page.locator('html').getAttribute('dir')).toBe('rtl');
  assertRuntime();
});

test('mobile pseudo RTL and reduced motion preserve landmarks and touch actions', async ({ page }) => {
  const assertRuntime = watchRuntime(page);
  await openRoute(page, '/visualization', { locale: 'en-XB', motion: 'reduced' });
  expect(await page.locator('html').getAttribute('dir')).toBe('rtl');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByText(pseudoCopy('Tokenized charts with bounded geometry', 'rtl'), { exact: true })).toBeVisible();
  await assertNoHorizontalOverflow(page);
  assertRuntime();
});

test('touch scrolling restores the page after a modal closes', async ({ page }) => {
  const assertRuntime = watchRuntime(page);
  await openRoute(page, '/overlays');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const before = await page.evaluate(() => window.scrollY);
  await page.getByRole('button', { name: 'Open dialog' }).tap();
  await expect(page.getByRole('dialog', { name: 'Review this recommendation' })).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await tapBackdrop(page, 'Dismiss dialog');
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
  const after = await page.evaluate(() => window.scrollY);
  expect(Math.abs(after - before)).toBeLessThanOrEqual(2);
  assertRuntime();
});
