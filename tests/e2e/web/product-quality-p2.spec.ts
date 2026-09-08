import { expect, test, type Locator, type Page } from '@playwright/test';

function pseudoRtl(value: string) {
  const expanded = value.replace(/[A-Za-z]/g, (character) => 'aeiou'.includes(character.toLowerCase()) ? `${character}${character}` : character);
  return `\u202e［${expanded}］\u202c`;
}

function monitorRuntime(page: Page, options: { allowDocumentNotFound?: boolean } = {}) {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    const text = message.text();
    if (text.includes('unreachable code after return statement')) return;
    if (options.allowDocumentNotFound && text === 'Failed to load resource: the server responded with a status of 404 (Not Found)') return;
    if (message.type() === 'error' || message.type() === 'warning') failures.push(`${message.type()}: ${text}`);
  });
  return () => expect(failures, 'P2-certified surfaces must not emit browser warnings or errors').toEqual([]);
}

async function isVisuallyClipped(locator: Locator) {
  return locator.evaluate((node) => {
    const element = node as HTMLElement;
    return element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
  });
}

test('GPQ-011 table headers remain complete and legible at the expanded threshold', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/data');
  const table = page.getByRole('table', { name: 'Data table' });
  for (const label of ['Annual fee', 'Reward value', 'Utilization']) {
    const heading = table.getByRole('columnheader').filter({ hasText: label }).getByText(label, { exact: true });
    await expect(heading).toBeVisible();
    expect(await isVisuallyClipped(heading), `${label} must not be visually truncated`).toBe(false);
  }
  await expect(table.getByRole('columnheader').filter({ hasText: 'Reward value' })).toHaveAttribute('aria-sort', 'descending');
  await expect(table.getByText('DESC', { exact: true })).toHaveCount(0);
  assertRuntime();
});

test('GPQ-012 copy and reveal actions have contextual accessible names', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.goto('/golden-plus');
  await expect(page.getByRole('button', { name: 'Copy Workspace identifier' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Reveal Sensitive reference' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Copy Sensitive reference' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Copy Configuration example' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Copy CSV export preview' })).toHaveCount(1);
  assertRuntime();
});

test('GPQ-013 visible capability results and assistive announcements do not duplicate visually', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.goto('/capabilities');
  await page.getByRole('button', { name: 'Read connectivity' }).click();
  const matches = page.getByText('Connectivity: online', { exact: true });
  await expect(matches).toHaveCount(2);
  const geometries = await matches.evaluateAll((nodes) => nodes.map((node) => ({ width: (node as HTMLElement).offsetWidth, height: (node as HTMLElement).offsetHeight })));
  expect(geometries.filter(({ width, height }) => width > 1 || height > 1)).toHaveLength(1);
  const announcement = page.locator('[aria-live="polite"]').filter({ hasText: 'Connectivity: online' });
  await expect(announcement).toHaveCount(1);
  expect(await announcement.evaluate((node) => ({ width: (node as HTMLElement).offsetWidth, height: (node as HTMLElement).offsetHeight }))).toEqual({ width: 1, height: 1 });
  assertRuntime();
});

test('GPQ-014 skeletons retain visible semantic contrast on subtle surfaces', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.goto('/feedback');
  const skeleton = page.getByRole('progressbar', { name: 'Loading account rows' });
  const colors = await skeleton.evaluate((root) => {
    const visibleBackground = (node: Element) => {
      const color = getComputedStyle(node).backgroundColor;
      return color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent' ? color : null;
    };
    const skeletonColors = [...root.querySelectorAll('div')].map(visibleBackground).filter(Boolean);
    let parent = root.parentElement;
    let surface: string | null = null;
    while (parent && !surface) { surface = visibleBackground(parent); parent = parent.parentElement; }
    return { skeletonColors: [...new Set(skeletonColors)], surface };
  });
  expect(colors.surface).not.toBeNull();
  expect(colors.skeletonColors.some((color) => color !== colors.surface)).toBe(true);
  assertRuntime();
});

test('GPQ-015 pseudo locale transforms representative UI copy while preserving literal data', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Locale: Pseudo RTL' }).click();
  await page.getByRole('main').getByText(pseudoRtl('Stress matrix'), { exact: true }).last().click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toContainText('［');
  const transformed = await page.getByRole('main').evaluate((root) => [...root.querySelectorAll('*')].filter((node) => node.children.length === 0 && (node.textContent ?? '').includes('［')).length);
  expect(transformed).toBeGreaterThanOrEqual(12);
  await expect(page.getByText('$9,999,999,999.99', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Alexandria Maximiliana/).first()).not.toContainText('［');
  for (const [routeLabel, minimumTransformedCopy] of [
    ['Forms', 10],
    ['Data display', 8],
    ['System lab', 10],
    ['Overlays', 6],
    ['Visualization', 6],
    ['Workflow lab', 8],
    ['Golden Plus breadth', 10],
  ] as const) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Locale: Pseudo RTL' }).click();
    await page.getByRole('main').getByText(pseudoRtl(routeLabel), { exact: true }).last().click();
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toContainText('［');
    const transformedRouteCopy = await page.getByRole('main').evaluate((root) => [...root.querySelectorAll('*')].filter((node) => node.children.length === 0 && (node.textContent ?? '').includes('［')).length);
    expect(transformedRouteCopy, `${routeLabel} must exercise representative pseudo-localized copy`).toBeGreaterThanOrEqual(minimumTransformedCopy);
  }
  assertRuntime();
});

test('GPQ-016 code and technical values remain LTR-isolated inside RTL pages', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Locale: Pseudo RTL' }).click();
  await page.getByRole('main').getByText(pseudoRtl('Golden Plus breadth'), { exact: true }).last().click();
  const code = page.getByTestId('golden-plus-code');
  await expect(code).toContainText('"density": "compact"');
  expect(await code.evaluate((node) => getComputedStyle(node).direction)).toBe('ltr');
  const identifier = page.getByTestId('golden-plus-copy-value-value');
  expect(await identifier.evaluate((node) => getComputedStyle(node).direction)).toBe('ltr');
  assertRuntime();
});

test('GPQ-017 authentication specimen exposes one operative pattern action', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.goto('/golden');
  const next = page.getByRole('button', { name: 'Next pattern' });
  for (let index = 0; index < 10; index += 1) await next.click();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(next).toHaveCount(1);
  await next.click();
  await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  assertRuntime();
});

test('GPQ-018 client navigation never exposes an empty application shell', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.goto('/');
  await expect(page.getByRole('main')).toBeVisible();
  await page.evaluate(() => {
    (window as typeof window & { __precisionEmptyMain?: boolean }).__precisionEmptyMain = false;
    const inspect = () => {
      const main = document.querySelector('main');
      if (!main || !(main.textContent ?? '').trim()) (window as typeof window & { __precisionEmptyMain?: boolean }).__precisionEmptyMain = true;
    };
    new MutationObserver(inspect).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  await page.getByRole('link', { name: 'Data', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Adaptive data workspace' })).toBeVisible();
  expect(await page.evaluate(() => (window as typeof window & { __precisionEmptyMain?: boolean }).__precisionEmptyMain)).toBe(false);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  assertRuntime();
});

test('GPQ-019 long trailing-icon buttons preserve one coherent content row', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/data');
  const button = page.getByRole('button', { name: 'Continue to visualization' });
  const geometry = await button.evaluate((node) => {
    const text = node.querySelector('[dir], span') as HTMLElement | null;
    const image = node.querySelector('[role="img"], svg') as HTMLElement | null;
    if (!text || !image) return null;
    const textBox = text.getBoundingClientRect();
    const imageBox = image.getBoundingClientRect();
    return { textCenter: textBox.y + textBox.height / 2, iconCenter: imageBox.y + imageBox.height / 2 };
  });
  expect(geometry).not.toBeNull();
  expect(Math.abs(geometry!.textCenter - geometry!.iconCenter)).toBeLessThanOrEqual(2);
  assertRuntime();
});

test('GPQ-020 feedback state choices use product-readable labels', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.goto('/feedback');
  await expect(page.getByRole('button', { name: 'No results', exact: true })).toBeVisible();
  await expect(page.getByText('noResults', { exact: true })).toHaveCount(0);
  assertRuntime();
});

test('GPQ-021 server-applied form errors immediately summarize and focus the field', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.goto('/forms');
  await page.getByRole('button', { name: 'Apply server validation' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Review the highlighted fields' })).toContainText('This email address is already in use.');
  await expect(page.locator('[data-testid="demo-email"][aria-invalid="true"]')).toBeFocused();
  assertRuntime();
});

test('GPQ-022/023 chart fallbacks expose table cells without duplicate datum controls', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.goto('/visualization');
  const portfolioTable = page.getByRole('table', { name: 'Portfolio value data' });
  await expect(portfolioTable.getByRole('columnheader')).toHaveCount(2);
  await expect(portfolioTable.getByRole('cell')).toHaveCount(16);
  await expect(page.getByRole('button', { name: 'Jan: 6200' })).toHaveCount(1);
  await page.goto('/golden-plus');
  const seriesTable = page.getByRole('table', { name: 'Quarterly workspace status data' });
  await expect(seriesTable.getByRole('columnheader')).toHaveCount(4);
  await expect(seriesTable.getByRole('cell')).toHaveCount(12);
  assertRuntime();
});

test('GPQ-024 memory-only capabilities do not initialize native notification code', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.goto('/capabilities');
  await page.getByRole('button', { name: 'Notification token' }).click();
  await expect(page.getByText('Notification token: unavailable', { exact: true }).first()).toBeVisible();
  assertRuntime();
});

test('GPQ-025 overflowing tabs advertise continuation and reveal keyboard selection', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/navigation');
  const tablist = page.getByRole('tablist', { name: 'Sections' });
  await expect(page.getByTestId('tabs-overflow-affordance')).toBeVisible();
  const tabs = tablist.getByRole('tab');
  await tabs.first().focus();
  await page.keyboard.press('End');
  await expect(tabs.last()).toBeFocused();
  const [listBox, activeBox] = await Promise.all([tablist.boundingBox(), tabs.last().boundingBox()]);
  expect(listBox).not.toBeNull();
  expect(activeBox).not.toBeNull();
  const visibleWidth = Math.max(0, Math.min(activeBox!.x + activeBox!.width, listBox!.x + listBox!.width) - Math.max(activeBox!.x, listBox!.x));
  expect(visibleWidth / activeBox!.width).toBeGreaterThanOrEqual(0.95);
  await expect(page.getByTestId('tabs-overflow-affordance')).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  assertRuntime();
});

test('GPQ-026 wrapping ListRow preserves full stress content and accessible context', async ({ page }) => {
  const assertRuntime = monitorRuntime(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/stress');
  const title = page.getByText(/Alexandria Maximiliana/).last();
  const subtitle = page.getByText(/Jahresgebührenüberprüfungsbenachrichtigung.*アカウント接続/).last();
  expect(await isVisuallyClipped(title)).toBe(false);
  expect(await isVisuallyClipped(subtitle)).toBe(false);
  assertRuntime();
});

test('GPQ-027 unknown direct entries render a themed recovery route', async ({ page }) => {
  const assertRuntime = monitorRuntime(page, { allowDocumentNotFound: true });
  const response = await page.goto('/definitely-not-a-real-route');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'This destination does not exist' })).toBeVisible();
  await page.getByRole('button', { name: 'Return home' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Universal application foundation' })).toBeVisible();
  assertRuntime();
});
