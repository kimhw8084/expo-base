import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

type PseudoDirection = 'ltr' | 'rtl';
type PseudoCoverageClass = { name: string; source: string };
type PseudoCoverageRoute = {
  path: string;
  launchLabel: string | null;
  classes: readonly PseudoCoverageClass[];
  intentionalLiterals: readonly string[];
};

const certification = JSON.parse(fs.readFileSync('golden.certification.json', 'utf8')) as {
  pseudoCoverage: { routes: readonly PseudoCoverageRoute[] };
};

function pseudoCopy(value: string, direction: PseudoDirection = 'ltr') {
  const expanded = value.replace(/[A-Za-z]/g, (character) => 'aeiou'.includes(character.toLowerCase()) ? `${character}${character}` : character);
  return direction === 'rtl' ? `\u202e［${expanded}］\u202c` : `［${expanded}］`;
}

async function openPseudoRoute(page: Page, route: PseudoCoverageRoute, direction: PseudoDirection = 'ltr') {
  await page.goto(route.path === '/' || route.launchLabel ? '/' : route.path);
  await page.getByRole('button', { name: `Locale: Pseudo ${direction === 'rtl' ? 'RTL' : 'LTR'}` }).click();
  if (route.path !== '/') {
    if (route.launchLabel) {
      await page.getByRole('main').getByText(pseudoCopy(route.launchLabel, direction), { exact: true }).last().click();
    }
  }
  await expect(page).toHaveURL(new RegExp(`${route.path === '/' ? '\\/$' : `${route.path.replace('/', '\\/')}$`}`));
  await expect(page.getByRole('main')).toBeVisible();
}

async function setCompactMode(page: Page, direction: PseudoDirection) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Density: Compact' }).click();
  await page.getByRole('button', { name: `Locale: Pseudo ${direction === 'rtl' ? 'RTL' : 'LTR'}` }).click();
}

async function expectAnyVisibleText(page: Page, text: string, message: string) {
  await expect.poll(
    () => page.getByText(text, { exact: true }).evaluateAll((nodes) => nodes.some((node) => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0;
    })),
    message,
  ).toBe(true);
}

for (const scenario of [
  { width: 320, height: 740, direction: 'ltr' as const },
  { width: 390, height: 844, direction: 'ltr' as const },
  { width: 320, height: 740, direction: 'rtl' as const },
  { width: 390, height: 844, direction: 'rtl' as const },
]) {
  test(`FIQ-001 visualization header remains contained at ${scenario.width}px pseudo-${scenario.direction}`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    const route = certification.pseudoCoverage.routes.find((entry) => entry.path === '/visualization');
    if (!route) throw new Error('Visualization must remain pseudo-covered.');
    await openPseudoRoute(page, route, scenario.direction);

    const card = page.getByTestId('visualization-portfolio-card');
    const header = page.getByTestId('visualization-portfolio-header');
    await expect(card).toBeVisible();
    await expect(header).toBeVisible();
    await expect(header.getByText(pseudoCopy('Portfolio value', scenario.direction), { exact: true })).toBeVisible();
    await expect(header.getByText(pseudoCopy('Area treatment, semantic accent series, quiet grid, tap-selection zones.', scenario.direction), { exact: true })).toBeVisible();

    const geometry = await header.evaluate((node) => {
      const headerBox = node.getBoundingClientRect();
      const surfaceBox = node.closest('[data-testid="visualization-portfolio-card"]')?.getBoundingClientRect();
      const meaningfulChildren = [...node.querySelectorAll('*')]
        .filter((child) => child.textContent?.trim())
        .map((child) => child.getBoundingClientRect())
        .filter((box) => box.width > 0 && box.height > 0);
      return {
        header: { left: headerBox.left, right: headerBox.right, top: headerBox.top, bottom: headerBox.bottom },
        surface: surfaceBox ? { left: surfaceBox.left, right: surfaceBox.right } : null,
        children: meaningfulChildren.map((box) => ({ left: box.left, right: box.right, top: box.top, bottom: box.bottom })),
      };
    });
    expect(geometry.surface).not.toBeNull();
    expect(geometry.header.left).toBeGreaterThanOrEqual(geometry.surface!.left - 1);
    expect(geometry.header.right).toBeLessThanOrEqual(geometry.surface!.right + 1);
    for (const child of geometry.children) {
      expect(child.left).toBeGreaterThanOrEqual(geometry.surface!.left - 1);
      expect(child.right).toBeLessThanOrEqual(geometry.surface!.right + 1);
    }
  });
}

for (const scenario of [
  { width: 320, height: 740, direction: 'ltr' as const },
  { width: 390, height: 844, direction: 'ltr' as const },
  { width: 320, height: 740, direction: 'rtl' as const },
  { width: 390, height: 844, direction: 'rtl' as const },
]) {
  test(`FIQ-002 compact route labels remain visible and meaningful at ${scenario.width}px pseudo-${scenario.direction}`, async ({ page }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await setCompactMode(page, scenario.direction);
    const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
    await expect(navigation).toBeVisible();
    const destinations = [
      ['home', 'Home'], ['build', 'Build'], ['data', 'Data'], ['patterns', 'Patterns'], ['system', 'System'],
    ] as const;

    for (const [key, label] of destinations) {
      const visibleLabel = navigation.getByTestId(`navigation-label-${key}`);
      const expected = pseudoCopy(label, scenario.direction);
      await expect(visibleLabel).toHaveText(expected);
      const metrics = await visibleLabel.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return {
          clientHeight: node.clientHeight,
          scrollHeight: node.scrollHeight,
          clientWidth: node.clientWidth,
          scrollWidth: node.scrollWidth,
          left: box.left,
          right: box.right,
        };
      });
      expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + 1);
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
      expect(metrics.left).toBeGreaterThanOrEqual(-1);
      expect(metrics.right).toBeLessThanOrEqual(scenario.width + 1);
    }

    const home = navigation.getByRole('link', { name: pseudoCopy('Home', scenario.direction) });
    await expect(home).toHaveAttribute('aria-current', 'page');
    const target = navigation.getByRole('link', { name: pseudoCopy('Data', scenario.direction) });
    const targetBox = await target.boundingBox();
    expect(targetBox).not.toBeNull();
    expect(targetBox!.width).toBeGreaterThanOrEqual(36);
    expect(targetBox!.height).toBeGreaterThanOrEqual(36);
  });
}

test('FIQ-003 every canonical route exercises its declared pseudo-copy classes', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'The complete route matrix is canonical Chromium certification; representative RTL parity runs in every browser.');
  for (const route of certification.pseudoCoverage.routes) {
    await openPseudoRoute(page, route);
    for (const copyClass of route.classes) {
      await expectAnyVisibleText(page, pseudoCopy(copyClass.source), `${route.path} must transform its ${copyClass.name} copy class`);
    }
  }
});

test('FIQ-003 pseudo-copy behavior remains route-safe in RTL across representative canonical surfaces', async ({ page }) => {
  const representativePaths = new Set(['/', '/navigation', '/feedback', '/forms', '/data', '/visualization', '/workflows', '/capabilities']);
  for (const route of certification.pseudoCoverage.routes.filter((entry) => representativePaths.has(entry.path))) {
    await openPseudoRoute(page, route, 'rtl');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expectAnyVisibleText(page, pseudoCopy(route.classes[0]!.source, 'rtl'), `${route.path} must retain visible RTL pseudo copy`);
  }
});

test('FIQ-004 router-owned destinations are genuine links with current-page state and client navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/data');
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  const data = navigation.getByRole('link', { name: 'Data', exact: true });
  const home = navigation.getByRole('link', { name: 'Home', exact: true });
  await expect(navigation.getByRole('link')).toHaveCount(5);
  await expect(data).toHaveAttribute('href', '/data');
  await expect(data).toHaveAttribute('aria-current', 'page');
  await expect(home).toHaveAttribute('href', '/');
  await expect(home).not.toHaveAttribute('aria-current');
  await expect(navigation.getByRole('button')).toHaveCount(0);

  await home.focus();
  await expect(home).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('FIQ-004 modifier click is not intercepted into same-tab router navigation', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const forms = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Build', exact: true });
  await expect(forms.evaluate((node) => node.tagName)).resolves.toBe('A');
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await forms.click({ modifiers: [modifier] });
  await page.waitForTimeout(100);
  await expect(page).toHaveURL(/\/$/);
});
