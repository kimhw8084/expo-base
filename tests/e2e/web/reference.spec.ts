import { expect, test } from '@playwright/test';

const routes = ['/', '/forms', '/navigation', '/overlays', '/lists', '/data', '/visualization', '/feedback', '/server-state', '/accessibility-motion', '/golden', '/workflows', '/system', '/golden-plus', '/stress', '/services', '/auth-session', '/authorization', '/admin-demo', '/linking', '/analytics-showcase', '/finance-showcase', '/monitoring-showcase'];
const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];

for (const route of routes) {
  test(`${route} renders without page-level horizontal overflow`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('body')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

for (const viewport of viewports) {
  test(`stress route remains bounded at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/stress');
    await expect(page.getByRole('button', { name: 'Save required changes' }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const buttonBoxes = await page.getByRole('button').evaluateAll((buttons) =>
      buttons.flatMap((button) => {
        const rect = button.getBoundingClientRect();
        const style = window.getComputedStyle(button);
        const visible =
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0;

        return visible ? [{ width: rect.width, height: rect.height }] : [];
      }),
    );

    expect(buttonBoxes.length).toBeGreaterThan(0);

    for (const box of buttonBoxes) {
      expect(box.width).toBeGreaterThanOrEqual(36);
      expect(box.height).toBeGreaterThanOrEqual(36);
    }
  });
}

test('auth guards remove protected access and restore safe return intent after sign-in', async ({ page }) => {
  await page.goto('/auth-session');
  await expect(page.getByText('Authentication session acceptance')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out and test guard' }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByText('Authentication session acceptance')).toHaveCount(0);
  await expect(page.getByText('Expo Base', { exact: true })).toHaveCount(0);
  await page.getByLabel('Email').fill('reference@example.com');
  await page.getByLabel('Password').fill('demo');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Authentication session acceptance')).toBeVisible();
  await expect(page.getByText('reference@example.com')).toBeVisible();
});

test('session security bootstrap preserves direct entry and explicit unlock restores protected intent', async ({ page }) => {
  await page.goto('/session-security');
  await expect(page.getByText('Session security acceptance')).toBeVisible();
  await expect(page.getByText('Security status')).toBeVisible();

  await page.getByRole('button', { name: 'Lock session' }).click();
  await expect(page).toHaveURL(/\/unlock$/);
  await expect(page.getByRole('heading', { name: 'Unlock session' })).toBeVisible();
  await expect(page.getByText('Session security acceptance')).toHaveCount(0);

  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page).toHaveURL(/\/session-security$/);
  await expect(page.getByText('Session security acceptance')).toBeVisible();
});

test('service adapters remain behind runtime boundary across auth transition', async ({ page }) => {
  await page.goto('/services');
  await expect(page.getByText('Service + auth runtime acceptance surface')).toBeVisible();
  await page.getByRole('button', { name: 'Verify storage adapter' }).click();
  await expect(page.getByText(/Storage returned reference-user/)).toBeVisible();
  await page.getByRole('button', { name: 'Sign out through auth runtime' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await page.getByLabel('Email').fill('reference@example.com');
  await page.getByLabel('Password').fill('demo');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Service + auth runtime acceptance surface')).toBeVisible();
});

test('server-state lab deduplicates, retains stale data, retries, invalidates, and rolls back', async ({ page }) => {
  await page.goto('/server-state');
  await expect(page.getByRole('heading', { name: 'Server-state lifecycle laboratory' })).toBeVisible();
  await expect(page.getByTestId('server-state-load-count')).toHaveText('Service requests: 1');
  await expect(page.getByText('Consumer A: content · 3')).toBeVisible();
  await expect(page.getByText('Consumer B: content · 3')).toBeVisible();
  await page.getByRole('button', { name: 'Recompose runtime provider' }).click();
  await expect(page.getByTestId('server-state-load-count')).toHaveText('Service requests: 1');

  await page.getByRole('button', { name: 'Fail next refresh' }).click();
  await expect(page.getByText('Update failed', { exact: true })).toBeVisible();
  await expect(page.getByText('Publish Golden Catalog', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('Update failed', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Toggle first task' }).click();
  await expect(page.getByText('platform · Open', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Mutation: success', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Prove optimistic rollback' }).click();
  await expect(page.getByText('Mutation: error', { exact: true })).toBeVisible();
  await expect(page.getByText('platform · Open', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Platform tasks' }).click();
  await expect(page.getByText('Consumer A: content · 2')).toBeVisible();
  await expect(page.getByText('Consumer B: content · 2')).toBeVisible();
});

test('workflow lab keeps command discovery, permission rationale, and completion handoff in shared owners', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/workflows');
  await expect(page.getByRole('heading', { name: 'Activity', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Commands' }).click();
  const dialog = page.getByRole('dialog', { name: 'Command launcher' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Search commands').fill('permission');
  await expect(dialog.getByText('Show permission rationale', { exact: true })).toBeVisible();
  await dialog.getByText('Show permission rationale', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Allow document access' })).toBeVisible();

  await page.getByRole('button', { name: 'Commands' }).click();
  await dialog.getByLabel('Search commands').fill('completion');
  await dialog.getByText('Show completion handoff', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Import complete' })).toBeVisible();
});


test('capability requirement controls nested protected route', async ({ page }) => {
  await page.goto('/authorization');
  await expect(page.getByText('Authorization capability acceptance')).toBeVisible();
  await expect(page.getByText(/reports\.view, rewards\.optimize, settings\.manage/)).toBeVisible();
  await page.getByRole('button', { name: 'Open capability-protected route' }).click();
  await expect(page.getByRole('heading', { name: 'Capability-protected route' })).toBeVisible();
});

test('direct-entry compact Back control falls back home safely', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/forms');
  await expect(page.getByText('Form interaction acceptance surface')).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Universal application foundation')).toBeVisible();
});

test('desktop reference shell exposes five grouped Expo Base destinations', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/visualization');
  await expect(page).toHaveURL(/\/visualization$/);
  await expect(page.getByText('Expo Base', { exact: true })).toBeVisible();
  for (const destination of ['Home', 'Build', 'Data', 'Patterns', 'System']) {
    await expect(page.getByRole('link', { name: destination, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('link', { name: 'Data', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toHaveCount(0);
});

test('compact reference shell uses five primary route links and category aliases', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/overlays');
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  const links = navigation.getByRole('link');
  await expect(links).toHaveCount(5);
  for (const destination of ['Home', 'Build', 'Data', 'Patterns', 'System']) {
    await expect(navigation.getByRole('link', { name: destination })).toBeVisible();
  }
  await expect(navigation.getByRole('link', { name: 'Build' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('compact page-header actions become full-width stacked actions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const system = page
    .getByRole('button', { name: 'System lab', exact: true })
    .filter({ hasText: /^System lab$/ });
  const stress = page.getByRole('button', { name: 'Stress test', exact: true });
  const compactSystem = await system.boundingBox();
  const compactStress = await stress.boundingBox();
  expect(compactSystem).not.toBeNull();
  expect(compactStress).not.toBeNull();
  if (compactSystem && compactStress) {
    expect(compactSystem.width).toBeGreaterThan(280);
    expect(compactStress.width).toBeGreaterThan(280);
    expect(compactStress.y).toBeGreaterThan(compactSystem.y);
  }

  await page.setViewportSize({ width: 1024, height: 800 });
  const desktopSystem = await system.boundingBox();
  const desktopStress = await stress.boundingBox();
  expect(desktopSystem).not.toBeNull();
  expect(desktopStress).not.toBeNull();
  if (desktopSystem && desktopStress) {
    expect(desktopSystem.width).toBeLessThan(240);
    expect(desktopStress.width).toBeLessThan(240);
    expect(Math.abs(desktopSystem.y - desktopStress.y)).toBeLessThanOrEqual(2);
  }
});

test('semantic card surfaces preserve hierarchy across themes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const initialCanvas = await page.getByRole('main').evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.getByRole('main').getByRole('button', { name: 'Theme: Dark' }).click();
  await expect(page.getByRole('main').getByTestId('runtime-settings-status')).toContainText('Active: Dark theme');
  await expect.poll(() => page.getByRole('main').evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(initialCanvas);
  await page.getByRole('main')
    .getByRole('button', { name: 'System lab', exact: true })
    .filter({ hasText: /^System lab$/ })
    .click();

  const surface = page.getByTestId('surface-card-default');
  const subtle = page.getByTestId('surface-card-subtle');
  const elevated = page.getByTestId('surface-card-elevated');
  await expect(surface).toBeVisible();
  await expect(subtle).toBeVisible();
  await expect(elevated).toBeVisible();

  const dark = await Promise.all([surface, subtle, elevated].map((locator) => locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return { backgroundColor: style.backgroundColor, boxShadow: style.boxShadow };
  })));
  expect(dark[0]?.backgroundColor).not.toBe(dark[1]?.backgroundColor);
  expect(dark[2]?.boxShadow).not.toBe('none');

  await page.getByRole('main').getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Universal application foundation' })).toBeVisible();
  const darkCanvas = await page.getByRole('main').evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.getByRole('main').getByRole('button', { name: 'Theme: Light' }).click();
  await expect(page.getByRole('main').getByTestId('runtime-settings-status')).toContainText('Active: Light theme');
  await expect.poll(() => page.getByRole('main').evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(darkCanvas);
  await page.getByRole('main')
    .getByRole('button', { name: 'System lab', exact: true })
    .filter({ hasText: /^System lab$/ })
    .click();
  const lightSurface = await page.getByTestId('surface-card-default').evaluate((element) => getComputedStyle(element).backgroundColor);
  const lightSubtle = await page.getByTestId('surface-card-subtle').evaluate((element) => getComputedStyle(element).backgroundColor);
  const lightElevatedShadow = await page.getByTestId('surface-card-elevated').evaluate((element) => getComputedStyle(element).boxShadow);
  expect(lightSurface).not.toBe(lightSubtle);
  expect(lightElevatedShadow).not.toBe('none');
  expect(lightSurface).not.toBe(dark[0]?.backgroundColor);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 1024, height: 768 }, { width: 1440, height: 900 }]) {
  test(`header actions remain bounded and responsive at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    for (const name of ['System lab', 'Stress test']) {
      const button = page.getByRole('button', { name: new RegExp(`^${name}`) }).first();
      if (await button.count() === 0) continue;
      const box = await button.boundingBox();
      if (!box) continue;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test('bottom sheet scrim is immediate and sheet content is independently presented', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/overlays');
  await page.getByRole('button', { name: 'Open bottom sheet' }).click();
  await expect(page.getByText('Quick actions')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dismiss sheet' })).toBeVisible();
  const backdrop = page.getByTestId('bottom-sheet-backdrop');
  const panel = page.getByTestId('bottom-sheet-panel');
  await expect(backdrop).toBeVisible();
  await expect(panel).toBeVisible();
  const panelBox = await panel.boundingBox();
  expect(panelBox).not.toBeNull();
  if (panelBox) expect(panelBox.width).toBeLessThanOrEqual(641);
});

test('long bottom sheet keeps content scrollable within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/overlays');
  await page.getByRole('button', { name: 'Open long sheet' }).click();
  await expect(page.getByRole('heading', { name: 'Scrollable sheet acceptance' })).toBeVisible();

  const panel = page.getByTestId('bottom-sheet-panel');
  const scroll = page.getByTestId('bottom-sheet-scroll');
  await expect(panel).toBeVisible();
  await expect(scroll).toBeVisible();

  const panelBox = await panel.boundingBox();
  expect(panelBox).not.toBeNull();
  if (panelBox) expect(panelBox.height).toBeLessThanOrEqual(700 * 0.89);

  const metrics = await scroll.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);

  await scroll.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect(page.getByRole('button', { name: 'Finish long-sheet review' })).toBeVisible();
});

test('overlay keyboard dismissal honors policy and restores trigger focus', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/overlays');

  const dialogTrigger = page.getByRole('button', { name: 'Open dialog' });
  await dialogTrigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Review this recommendation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' }).first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Review' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Review this recommendation' })).toHaveCount(0);
  await expect(dialogTrigger).toBeFocused();

  const alertTrigger = page.getByRole('button', { name: 'Open destructive alert' });
  await alertTrigger.focus();
  await page.keyboard.press('Enter');
  const alertHeading = page.getByRole('heading', { name: 'Remove this configuration?' });
  await expect(alertHeading).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(alertHeading).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(alertHeading).toHaveCount(0);
  await expect(alertTrigger).toBeFocused();

  const menuTrigger = page.getByRole('button', { name: 'Open action menu' });
  await menuTrigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(menuTrigger).toBeFocused();
});

test('toast is bounded, dismissible, and does not span the desktop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/overlays');
  await page.getByRole('button', { name: 'Show toast' }).click();
  await expect(page.getByText('Saved successfully')).toBeVisible();
  const close = page.getByRole('button', { name: 'Dismiss notification' });
  await expect(close).toBeVisible();
  await expect(page.getByTestId('toast-lifetime')).toBeVisible();
  const toastTextBox = await page.getByText('Saved successfully').boundingBox();
  expect(toastTextBox).not.toBeNull();
  const closeBox = await close.boundingBox();
  expect(closeBox).not.toBeNull();
  if (toastTextBox && closeBox) expect(closeBox.x).toBeGreaterThan(toastTextBox.x);
  await close.click();
  await expect(page.getByText('Saved successfully')).toHaveCount(0);
});

test('visualization interaction does not leak responder handlers into SVG DOM', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/visualization');
  await expect(page.getByText('Tokenized charts with bounded geometry')).toBeVisible();
  // The chart's SVG hit target remains the primary interactive surface; Phase 6
  // also adds an equivalent keyboard/table fallback with the same accessible name.
  await page.getByRole('button', { name: /Jan: 6200/ }).first().click();
  expect(errors.filter((message) => message.includes('onResponderTerminate'))).toEqual([]);
});

test('representative runtime routes stay free of known SVG and motion diagnostics', async ({ page }) => {
  const diagnostics: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') diagnostics.push(message.text());
  });

  for (const route of ['/golden', '/system']) {
    await page.goto(route);
    await expect(page.locator('body')).toBeVisible();
  }

  for (const forbidden of ['transform-origin', 'props.pointerEvents is deprecated', 'Reduced motion setting is overwritten']) {
    expect(diagnostics.filter((message) => message.includes(forbidden))).toEqual([]);
  }
});

test('system lab renders identity specimens without crashing', async ({ page }) => {
  await page.goto('/system');
  await expect(page.getByText('System acceptance laboratory')).toBeVisible();
  await expect(page.getByLabel('Alex Kim avatar')).toBeVisible();
});

test('home recomposes live when the viewport crosses compact and wide regimes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const metrics = page.getByTestId('home-metric-group');
  const interaction = page.getByText('Interaction hierarchy', { exact: true });
  const status = page.getByText('Semantic status', { exact: true });

  await expect(metrics).toBeVisible();
  await expect(page.getByText('Wide', { exact: true })).toBeVisible();

  const wideMetrics = await metrics.boundingBox();
  const wideInteraction = await interaction.boundingBox();
  const wideStatus = await status.boundingBox();

  expect(wideMetrics).not.toBeNull();
  expect(wideInteraction).not.toBeNull();
  expect(wideStatus).not.toBeNull();

  if (wideMetrics && wideInteraction && wideStatus) {
    expect(wideMetrics.width).toBeGreaterThan(700);
    expect(Math.abs(wideInteraction.y - wideStatus.y)).toBeLessThan(100);
  }

  await page.setViewportSize({ width: 390, height: 844 });

  await expect(page.getByTestId('responsive-regime-compact')).toBeVisible();

  const compactMetrics = await metrics.boundingBox();
  const compactInteraction = await interaction.boundingBox();
  const compactStatus = await status.boundingBox();

  expect(compactMetrics).not.toBeNull();
  expect(compactInteraction).not.toBeNull();
  expect(compactStatus).not.toBeNull();

  if (compactMetrics && compactInteraction && compactStatus) {
    expect(compactMetrics.x + compactMetrics.width).toBeLessThanOrEqual(391);
    expect(compactStatus.y).toBeGreaterThan(
      compactInteraction.y + compactInteraction.height
    );
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});


test('reference runtime controls switch theme and density without a reload', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const status = page.getByTestId('runtime-settings-status');
  await expect(status).toContainText('System theme · Comfortable density');
  await page.getByRole('button', { name: 'Theme: Dark' }).click();
  await expect(status).toContainText('Dark theme · Comfortable density');
  await page.getByRole('button', { name: 'Density: Compact' }).click();
  await expect(status).toContainText('Dark theme · Compact density');
  await page.getByRole('button', { name: 'Theme: System' }).click();
  await expect(status).toContainText('System theme · Compact density');
});

test('form keyboard flow advances focus and validation returns to the first invalid field', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/forms');

  const name = page.getByLabel('Full name', { exact: true });
  const email = page.getByTestId('demo-email');
  const password = page.getByLabel('Password', { exact: true });
  const terms = page.getByRole('checkbox', { name: 'I agree to the terms' });

  await expect(name).toBeEditable();
  await expect(email).toBeEditable();
  await expect(password).toBeEditable();

  await name.fill('Alex Morgan');
  await name.press('Enter');
  await expect(email).toBeFocused();

  await email.fill('alex@example.com');
  await email.press('Enter');
  await expect(password).toBeFocused();

  await password.fill('demonstration');
  await password.press('Enter');
  await expect(terms).toBeFocused();
  await expect(terms).toHaveAttribute('aria-invalid', 'true');
  await expect(terms).toHaveAttribute('aria-describedby', 'demo-terms-message');
  await expect(terms).toHaveAttribute('aria-errormessage', 'demo-terms-message');
  await expect(page.getByTestId('demo-terms-error')).toHaveText('Accept the terms to continue.');

  await page.getByRole('button', { name: 'Reset' }).click();
  await page.getByRole('button', { name: 'Validate form' }).click();
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toHaveAttribute('aria-describedby', 'demo-name-message');
  await expect(name).toHaveAttribute('aria-errormessage', 'demo-name-message');
  await expect(page.getByTestId('demo-name-error')).toHaveText('Enter your name.');
  await expect(page.locator('#demo-name-message')).toHaveAttribute('aria-live', 'polite');
});


test('form actions become full width only on compact layouts', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/forms');
  const validate = page.getByRole('button', { name: 'Validate form' });
  const reset = page.getByRole('button', { name: 'Reset' });
  const compactValidate = await validate.boundingBox();
  const compactReset = await reset.boundingBox();
  expect(compactValidate).not.toBeNull();
  expect(compactReset).not.toBeNull();
  if (compactValidate && compactReset) {
    expect(compactValidate.width).toBeGreaterThan(280);
    expect(compactReset.width).toBeGreaterThan(280);
    expect(compactReset.y).toBeGreaterThan(compactValidate.y);
  }

  await page.setViewportSize({ width: 1024, height: 800 });
  const desktopValidate = await validate.boundingBox();
  expect(desktopValidate).not.toBeNull();
  if (desktopValidate) expect(desktopValidate.width).toBeLessThan(300);
});


test('visual RC4 keeps native keyboard chrome off web and compact nav labels intact', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/forms');
  await expect(page.getByText('Form interaction acceptance surface')).toBeVisible();
  await expect(page.getByText('Done', { exact: true })).toHaveCount(0);

  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  for (const label of ['Home', 'Build', 'Data', 'Patterns', 'System']) {
    const link = page.getByRole('link', { name: label });
    await expect(link).toBeVisible();
    const text = link.getByText(label, { exact: true });
    const fits = await text.evaluate((element) => element.scrollWidth <= element.clientWidth + 1);
    expect(fits, `${label} bottom-navigation label is truncated at 320px`).toBeTruthy();
  }
});

test('visual RC4 shows navigation focus rings for keyboard, not pointer clicks', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const build = page.getByRole('link', { name: 'Build' });
  await build.click();
  const pointerShadow = await build.evaluate((element) => getComputedStyle(element).boxShadow);
  expect(pointerShadow).toBe('none');

  await page.goto('/');
  const home = page.getByRole('link', { name: 'Home', exact: true });
  await expect(home).toBeVisible();
  await expect(home).toHaveAttribute('tabindex', '0');

  await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  });
  await home.focus();

  const keyboardShadow = await home.evaluate((element) => getComputedStyle(element).boxShadow);
  expect(keyboardShadow).not.toBe('none');
});


test('data details stack key/value pairs at compact width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/data');
  const detailRow = page.getByTestId('selected-record-details-card');
  await expect(detailRow).toBeVisible();
  await expect.poll(() => detailRow.evaluate((element) => getComputedStyle(element).flexDirection)).toBe('column');

  await page.setViewportSize({ width: 1200, height: 800 });
  await expect.poll(() => detailRow.evaluate((element) => getComputedStyle(element).flexDirection)).toBe('row');
});

test('virtualized activity list exposes production loading and empty states', async ({ page }) => {
  await page.goto('/lists');
  await expect(page.getByTestId('activity-row-activity-1')).toBeVisible();

  await page.getByRole('button', { name: 'Loading state', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: 'Loading activity list' })).toBeVisible();

  await page.getByRole('button', { name: 'Empty state', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No activity yet' })).toBeVisible();

  await page.getByRole('button', { name: 'Show sample data', exact: true }).click();
  await expect(page.getByTestId('activity-row-activity-1')).toBeVisible();
});

test('desktop sidebar navigation stays scrollable at constrained heights', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 320 });
  await page.goto('/system');
  const navigation = page.getByTestId('sidebar-navigation-scroll');
  await expect(navigation).toBeVisible();
  const dimensions = await navigation.evaluate((element) => ({ clientHeight: element.clientHeight, scrollHeight: element.scrollHeight }));
  expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);
});


test('data workspace search and filters produce deterministic results', async ({ page }) => {
  await page.goto('/data');
  const search = page.getByLabel('Search cards', { exact: true }).last();
  const summary = page.getByTestId('card-data-toolbar-summary');

  await expect(summary).toHaveText('7 of 7 cards');
  await search.fill('venture');
  await expect(summary).toHaveText('1 of 7 cards');

  await page.getByRole('button', { name: 'Issuer: Chase', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No cards match', exact: true })).toBeVisible();

  await search.fill('');
  await expect(summary).toHaveText('2 of 7 cards');

  await page.getByRole('button', { name: 'Status: Review', exact: true }).click();
  await expect(summary).toHaveText('1 of 7 cards');

  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(summary).toHaveText('7 of 7 cards');
});

test('data toolbar owns compact search composition', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/data');

  const toolbar = page.getByTestId('card-data-toolbar');
  const shell = page.getByTestId('card-data-toolbar-search-shell');
  const toolbarBox = await toolbar.boundingBox();
  const searchBox = await shell.boundingBox();

  expect(toolbarBox).not.toBeNull();
  expect(searchBox).not.toBeNull();
  expect(searchBox!.width).toBeGreaterThan(toolbarBox!.width * 0.75);

  const search = page.getByLabel('Search cards', { exact: true }).last();
  await search.fill('chase');
  await expect(page.getByRole('button', { name: 'Clear search cards', exact: true })).toBeVisible();
});

test('desktop sidebar exposes a named navigation landmark', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/data');
  await expect(page.getByRole('navigation', { name: 'Primary navigation', exact: true })).toBeVisible();
});

test('action menu owns grouped commands, shortcut hints, and close-before-action behavior', async ({ page }) => {
  await page.goto('/overlays');
  await page.getByRole('button', { name: 'Open action menu', exact: true }).click();
  const menu = page.getByRole('menu', { name: 'Card actions', exact: true });
  await expect(menu).toBeVisible();
  await expect(menu.getByText('General', { exact: true })).toBeVisible();
  await expect(menu.getByText('Danger zone', { exact: true })).toBeVisible();
  await expect(menu.getByText('E', { exact: true })).toBeVisible();
  await page.getByRole('menuitem', { name: 'Duplicate setup', exact: true }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByText('Setup duplicated', { exact: true })).toBeVisible();
});

test('form rows stack related fields on compact and pair them on medium layouts', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/forms');
  const name = page.getByLabel('Full name', { exact: true });
  const email = page.getByTestId('demo-email');
  const compactName = await name.boundingBox();
  const compactEmail = await email.boundingBox();
  expect(compactName).not.toBeNull();
  expect(compactEmail).not.toBeNull();
  if (compactName && compactEmail) expect(compactEmail.y).toBeGreaterThan(compactName.y + compactName.height);

  await page.setViewportSize({ width: 1024, height: 800 });
  const mediumName = await name.boundingBox();
  const mediumEmail = await email.boundingBox();
  expect(mediumName).not.toBeNull();
  expect(mediumEmail).not.toBeNull();
  if (mediumName && mediumEmail) expect(Math.abs(mediumName.y - mediumEmail.y)).toBeLessThan(12);
});

test('dashboard section hierarchy keeps metadata and adaptive accessory bounded', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByText('Adaptive', { exact: true })).toBeVisible();
  await expect(page.getByText('Portable', { exact: true })).toBeVisible();
  const header = page.getByTestId('home-adaptive-section-header');
  await expect(header).toBeVisible();
  await expect(page.getByTestId('responsive-regime-compact')).toBeVisible();
  const compactBox = await header.boundingBox();
  expect(compactBox).not.toBeNull();
  if (compactBox) expect(compactBox.x + compactBox.width).toBeLessThanOrEqual(391);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByText('Wide', { exact: true })).toBeVisible();
  const wideBox = await header.boundingBox();
  expect(wideBox).not.toBeNull();
  if (wideBox) expect(wideBox.width).toBeGreaterThan(700);
});


test('sortable data table cycles shared sort state across the visible page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/data');

  const valueSort = page.getByTestId('card-data-table-sort-value');
  await expect(valueSort).toHaveAccessibleName('Sort by Reward value, descending');
  await expect(page.getByTestId('card-data-table-expanded-row-venture-x')).toBeVisible();
  await expect(page.getByTestId('card-data-table-expanded-row-freedom')).toHaveCount(0);

  await valueSort.click();
  await expect(valueSort).toHaveAccessibleName('Sort by Reward value, ascending');
  await expect(page.getByTestId('card-data-table-expanded-row-freedom')).toBeVisible();
  await expect(page.getByTestId('card-data-table-expanded-row-venture-x')).toHaveCount(0);
});

test('bulk selection exposes mixed select-all state and a responsive action bar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/data');

  const venture = page.getByRole('checkbox', { name: 'Select Venture X', exact: true });
  const selectVisible = page.getByRole('checkbox', { name: 'Select all visible rows', exact: true });
  await venture.click();
  await expect(venture).toHaveAttribute('aria-checked', 'true');
  await expect(selectVisible).toHaveAttribute('aria-checked', 'mixed');

  const selectionBar = page.getByTestId('card-selection-bar');
  await expect(selectionBar).toBeVisible();
  await expect(selectionBar.getByText('1 selected', { exact: true })).toBeVisible();

  await selectVisible.click();
  await expect(page.getByRole('checkbox', { name: 'Deselect all visible rows', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(selectionBar.getByText('4 selected', { exact: true })).toBeVisible();

  await selectionBar.getByRole('button', { name: 'Clear selection', exact: true }).click();
  await expect(selectionBar).toHaveCount(0);
});

test('form section group exposes production hierarchy without compact overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/forms');

  const sections = page.getByTestId('adapter-form-sections');
  const actions = page.getByTestId('adapter-form-actions');
  await expect(page.getByRole('heading', { name: 'Profile information', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Account security', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Terms and consent', exact: true })).toBeVisible();
  const profileRequired = page
    .getByTestId('adapter-profile-section')
    .getByText('Required', { exact: true });
  expect(await profileRequired.count()).toBeGreaterThan(0);
  await expect(profileRequired.first()).toBeVisible();

  const sectionBox = await sections.boundingBox();
  const actionsBox = await actions.boundingBox();
  expect(sectionBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  if (sectionBox) expect(sectionBox.x + sectionBox.width).toBeLessThanOrEqual(391);
  if (actionsBox) expect(actionsBox.x + actionsBox.width).toBeLessThanOrEqual(391);
});

test('dashboard metric composition reflows as one bounded shared group', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const metrics = page.getByTestId('home-metric-group');
  await expect(metrics).toBeVisible();
  await expect(page.getByText('Adaptive regimes', { exact: true })).toBeVisible();
  await expect(page.getByText('Target platforms', { exact: true })).toBeVisible();
  await expect(page.getByText('Minimum interaction target', { exact: true })).toBeVisible();

  const compactBox = await metrics.boundingBox();
  expect(compactBox).not.toBeNull();
  if (compactBox) expect(compactBox.x + compactBox.width).toBeLessThanOrEqual(391);

  await page.setViewportSize({ width: 1440, height: 900 });
  const wideBox = await metrics.boundingBox();
  expect(wideBox).not.toBeNull();
  if (wideBox) expect(wideBox.width).toBeGreaterThan(700);
});

test('runtime locale controls provide deterministic pseudo RTL stress without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: 'Locale: Pseudo RTL' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByTestId('runtime-locale-status')).toContainText('Pseudo-localized stress copy');
  await expect(page.getByRole('main').getByText(/［.*］/).first()).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await page.getByRole('button', { name: 'Locale: English' }).click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

test('runtime reduced-motion control reaches an understandable final accessibility state', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Motion: Reduced' }).click();
  await page.getByRole('button', { name: /Accessibility & motion/ }).click();

  await expect(page.getByText('System preference detected: Reduced motion enabled.')).toBeVisible();
  await expect(page.getByText('Purposeful transition')).toBeVisible();
});

test('form lifecycle summarizes errors and protects dirty navigation', async ({ page }) => {
  await page.goto('/forms');
  const summary = page.getByTestId('adapter-form-error-summary');

  await page.getByRole('button', { name: 'Validate form' }).click();
  await expect(summary).toBeVisible();
  await expect(summary).toContainText('Full name: Enter your name.');
  await expect(page.getByLabel('Full name', { exact: true })).toBeFocused();

  await page.getByLabel('Full name', { exact: true }).fill('Alex Morgan');
  await page.getByRole('button', { name: 'Leave form' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Discard unsaved changes?' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep editing' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Discard unsaved changes?' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Leave form' }).click();
  await page.getByRole('button', { name: 'Discard changes' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('form lifecycle maps server errors into the shared summary', async ({ page }) => {
  await page.goto('/forms');
  const summary = page.getByTestId('adapter-form-error-summary');

  await page.getByRole('button', { name: 'Validate form' }).click();
  await page.getByRole('button', { name: 'Apply server validation' }).click();
  await expect(summary).toContainText('Form: The profile could not be saved until the highlighted field is resolved.');
  const emailError = summary.getByRole('button', { name: 'Go to Email address: This email address is already in use.' });
  await emailError.click();
  await expect(page.getByTestId('demo-email')).toBeFocused();
});

test('equivalent 200 percent web zoom keeps form actions and error summary usable', async ({ page }) => {
  // A 640px CSS viewport at a 1280px desktop window exercises the same compact composition as 200% zoom.
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/forms');
  await page.getByRole('button', { name: 'Validate form' }).click();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByTestId('adapter-form-error-summary')).toBeVisible();
  const validate = await page.getByRole('button', { name: 'Validate form' }).boundingBox();
  expect(validate).not.toBeNull();
  if (validate) expect(validate.x + validate.width).toBeLessThanOrEqual(641);
});

test('semantic form depth owns searchable choice, locale-aware numeric entry, and verification-code focus', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/forms');

  const combo = page.getByRole('combobox', { name: 'Primary issuer' });
  await combo.click();
  await expect(combo).toHaveAttribute('aria-expanded', 'true');
  const search = page.getByLabel('Search Primary issuer');
  await search.fill('chase');
  await page.getByRole('option', { name: 'Chase', exact: true }).click();
  await expect(combo).toContainText('Chase');
  await expect(combo).toHaveAttribute('aria-expanded', 'false');

  const currency = page.getByLabel('Credit limit', { exact: true });
  await currency.fill('1234.5');
  await currency.blur();
  await expect(currency).toHaveValue('$1,234.50');

  const firstCodeCell = page.getByLabel('Verification code, digit 1 of 6');
  await firstCodeCell.fill('123456');
  await expect(page.getByLabel('Verification code, digit 6 of 6')).toHaveValue('6');
});

test('component depth owns disclosure state, segmented selection, workflow progress, and media fallbacks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/system');

  const disclosure = page.getByRole('button', { name: 'How semantic disclosure behaves' });
  await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  await disclosure.click();
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Use Disclosure for a single supporting region or Accordion for related sections. Neither owner contains business rules.')).toBeVisible();

  const month = page.getByRole('radio', { name: 'Month' });
  await month.click();
  await expect(month).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('progressbar', { name: /Onboarding progress: step 2 of 3/ })).toBeVisible();

  await expect(page.getByLabel('Blue deterministic reference media')).toBeVisible();
  await expect(page.getByText('Loading media', { exact: true })).toBeVisible();
  await expect(page.getByText('Unable to load media', { exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('data scale owners retain table identity while filter drawer and page controls stay accessible', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/data');
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Filters' });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('checkbox', { name: 'Annual fee' }).click();
  await drawer.getByRole('button', { name: 'Apply filters' }).click();
  await expect(page.getByTestId('card-data-table-expanded').getByText('Annual fee', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('toolbar', { name: 'Pagination' })).toBeVisible();
  await page.getByRole('button', { name: 'Load next sample page' }).click();
  await expect(page.getByRole('toolbar', { name: 'Pagination' }).getByRole('button', { name: 'Previous page' })).toBeEnabled();
});

test('chart state and data fallback remain usable without hover-only interaction', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/visualization');
  await expect(page.getByText('Loading chart data.', { exact: true })).toBeVisible();
  await expect(page.getByText('Category data could not be refreshed.', { exact: true })).toBeVisible();

  const spendData = page.getByRole('table', { name: 'Spend categories data' });
  await expect(spendData).toBeVisible();
  await expect(spendData.getByRole('button')).toHaveCount(0);
  await page.getByRole('button', { name: 'Travel: 1820' }).click();
  await expect(page.getByText('Travel: $1,820.00', { exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Spend composition data' })).toBeVisible();
});

test('Golden Plus breadth owns copying, sensitive reveal, date/time, timeline, and stacked data fallback', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/golden-plus');
  await expect(page.getByRole('heading', { name: 'Abundant reusable depth' })).toBeVisible();
  await page.getByTestId('golden-plus-copy-value-copy').click();
  await expect(page.getByTestId('golden-plus-copy-value-copy')).toHaveAttribute('aria-label', 'Copied Workspace identifier');
  await page.getByRole('button', { name: 'Reveal Sensitive reference' }).click();
  await expect(page.getByLabel('Sensitive reference: secret_reference_9831')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Workspace history' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Effective date' }).fill('2026-10-12');
  await expect(page.getByText('Oct 12, 2026', { exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Quarterly workspace status data' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
