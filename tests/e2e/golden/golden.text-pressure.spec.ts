import { expect, test, type Locator, type Page } from '@playwright/test';

const textPressureCss = `
  html { font-size: 20px !important; zoom: 1.25 !important; }
  *:not(svg):not(path) {
    font-size: 24px !important;
    line-height: 1.5 !important;
    letter-spacing: 0.12em !important;
    word-spacing: 0.16em !important;
  }
`;

async function enterPseudoRtl(page: Page, routeTestId?: string) {
  await page.setViewportSize({ width: 390, height: 480 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Locale: Pseudo RTL' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  if (routeTestId) await page.getByTestId(routeTestId).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.addStyleTag({ content: textPressureCss });
  const profile = await page.locator('html').evaluate((element) => ({
    zoom: getComputedStyle(element).getPropertyValue('zoom'),
    fontSize: getComputedStyle(element).fontSize,
    direction: getComputedStyle(element).direction,
  }));
  expect(profile).toEqual({ zoom: '1.25', fontSize: '24px', direction: 'rtl' });
  const textStyles = await page.locator('body *:not(svg):not(path)').first().evaluate((element) => {
    const style = getComputedStyle(element);
    return { fontSize: style.fontSize, lineHeight: style.lineHeight, letterSpacing: style.letterSpacing, wordSpacing: style.wordSpacing };
  });
  expect(textStyles).toEqual({ fontSize: '24px', lineHeight: '36px', letterSpacing: '2.88px', wordSpacing: '3.84px' });
}

async function expectNoPageHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => Math.max(
    document.documentElement.scrollWidth,
    document.body.scrollWidth,
  ) - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectTextNotClipped(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  const result = await locator.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
    const clipped = [] as string[];
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      const box = ancestor.getBoundingClientRect();
      const clipsX = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX);
      const clipsY = ['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY);
      if (rects.some((rect) => (clipsX && (rect.left < box.left - 1 || rect.right > box.right + 1))
        || (clipsY && (rect.top < box.top - 1 || rect.bottom > box.bottom + 1)))) {
        clipped.push(ancestor.tagName.toLowerCase());
      }
    }
    return { text: element.textContent?.trim(), rectCount: rects.length, clipped };
  });
  expect(result.text).toBeTruthy();
  expect(result.rectCount).toBeGreaterThan(0);
  expect(result.clipped).toEqual([]);
}

async function expectReachable(locator: Locator, page: Page) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  const result = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return {
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      receivesCenterHit: Boolean(hit && (hit === element || element.contains(hit))),
    };
  });
  expect(result.rect.left).toBeGreaterThanOrEqual(-1);
  expect(result.rect.top).toBeGreaterThanOrEqual(-1);
  expect(result.rect.right).toBeLessThanOrEqual(result.viewport.width + 1);
  expect(result.rect.bottom).toBeLessThanOrEqual(result.viewport.height + 1);
  expect(result.receivesCenterHit).toBe(true);
  await expectNoPageHorizontalOverflow(page);
}

test('@semantic @qualification largeText/page-header-actions PageHeader actions remain reachable under text pressure, RTL, and short height', async ({ page }) => {
  await enterPseudoRtl(page);
  await expectNoPageHorizontalOverflow(page);
  const heading = page.getByRole('heading', { level: 1 });
  await expectTextNotClipped(heading);
  const systemAction = page.getByTestId('home-header-system-lab');
  await expectTextNotClipped(systemAction);
  await expectReachable(systemAction, page);
  await systemAction.click();
  await expect(page).toHaveURL(/\/system$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expectNoPageHorizontalOverflow(page);
});

test('@semantic @qualification largeText/multi-section-form @owner-state forms.text-entry/error multi-section validation and actions remain usable under text pressure, RTL, and short height', async ({ page }) => {
  await enterPseudoRtl(page, 'home-route-forms');
  await expectNoPageHorizontalOverflow(page);
  await expectTextNotClipped(page.getByRole('heading', { level: 1 }));

  const submit = page.getByTestId('text-pressure-form-submit');
  await expectTextNotClipped(submit);
  await expectReachable(submit, page);
  await submit.click();

  const summary = page.getByTestId('adapter-form-error-summary');
  await expect(summary).toBeVisible();
  const name = page.getByTestId('adapter-profile-section').getByRole('textbox').first();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alert')).toBeVisible();
  await expectNoPageHorizontalOverflow(page);

  await summary.getByRole('button').first().click();
  await expect(name).toBeFocused();
  await name.fill('Pressure qualified');
  await expect(name).toHaveValue('Pressure qualified');
});

test('@semantic @qualification largeText/data-workspace @owner-state data.table/selected filter and row selection remain usable under text pressure, RTL, and short height', async ({ page }) => {
  await enterPseudoRtl(page, 'home-route-data');
  await expectNoPageHorizontalOverflow(page);
  await expectTextNotClipped(page.getByRole('heading', { level: 1 }));

  const search = page.getByTestId('card-data-toolbar').locator('input').first();
  await expectReachable(search, page);
  await search.fill('Venture X');
  await expect(search).toHaveValue('Venture X');
  await expect(page.getByText('Venture X', { exact: true }).filter({ visible: true }).first()).toBeVisible();

  const selection = page.getByRole('checkbox', { name: 'Select Venture X' }).filter({ visible: true });
  await expectReachable(selection, page);
  await selection.click();
  await expect(selection).toHaveAttribute('aria-checked', 'true');
  const actions = page.getByRole('toolbar', { name: 'Bulk actions' });
  await expect(actions).toBeVisible();
  const clear = actions.getByRole('button', { name: 'Clear selection' });
  await expectReachable(clear, page);
  await clear.click();
  await expect(actions).toHaveCount(0);
  await expectNoPageHorizontalOverflow(page);
});

test('@semantic @qualification largeText/long-sheet-final-action @owner-state overlays.sheet/open @owner-state overlays.sheet/scrolling constrained bottom sheet keeps its final task reachable under text pressure, RTL, and short height', async ({ page }) => {
  await enterPseudoRtl(page, 'home-route-overlays');
  await expectNoPageHorizontalOverflow(page);
  await expectTextNotClipped(page.getByRole('heading', { level: 1 }));

  const open = page.getByTestId('text-pressure-sheet-open');
  await expectReachable(open, page);
  await open.click();
  const sheet = page.getByTestId('bottom-sheet-panel');
  const scroll = page.getByTestId('bottom-sheet-scroll');
  await expect(sheet).toBeVisible();
  const initial = await scroll.evaluate((element) => ({ top: element.scrollTop, height: element.clientHeight, contentHeight: element.scrollHeight }));
  expect(initial.contentHeight).toBeGreaterThan(initial.height + 1);

  const finish = page.getByTestId('text-pressure-sheet-finish');
  await finish.scrollIntoViewIfNeeded();
  expect(await scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expectTextNotClipped(finish);
  await expectReachable(finish, page);
  await finish.click();
  await expect(sheet).toBeHidden();
  await expectNoPageHorizontalOverflow(page);
});
