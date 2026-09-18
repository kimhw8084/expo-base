import { expect, test, type Page } from '@playwright/test';

async function openSignedOutSignIn(page: Page) {
  await page.goto('/auth-session');
  await page.getByRole('button', { name: 'Sign out and test guard' }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
}

function buttonSurface(page: Page) {
  return page.getByRole('button', { name: 'Sign in' }).locator('div').first();
}

async function submitCount(page: Page) {
  return page.evaluate(() => (window as Window & { __chg110SubmitCount?: number }).__chg110SubmitCount ?? 0);
}

async function installSubmitCounter(page: Page) {
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (!form) throw new Error('Sign-in form is missing.');
    const state = window as Window & { __chg110SubmitCount?: number };
    state.__chg110SubmitCount = 0;
    form.addEventListener('submit', () => { state.__chg110SubmitCount = (state.__chg110SubmitCount ?? 0) + 1; });
  });
}

test('CHG-110 submit Button keeps governed web interaction and semantic form behavior', async ({ page }) => {
  await openSignedOutSignIn(page);

  const form = page.locator('form');
  const password = page.getByLabel('Password');
  const submit = page.getByRole('button', { name: 'Sign in' });
  const surface = buttonSurface(page);
  await expect(form).toHaveCount(1);
  await expect(password).toHaveAttribute('data-testid', 'sign-in-password');
  expect(await password.evaluate((field) => field.closest('form') !== null)).toBe(true);
  await expect(submit).toHaveAttribute('type', 'submit');
  expect(await submit.evaluate((button) => button.closest('form') !== null)).toBe(true);

  await password.focus();
  await page.keyboard.press('Tab');
  await expect(submit).toBeFocused();
  await expect.poll(async () => surface.evaluate((element) => window.getComputedStyle(element).boxShadow)).not.toBe('none');

  await page.mouse.move(1, 1);
  const restBackground = await surface.evaluate((element) => window.getComputedStyle(element).backgroundColor);
  await submit.hover();
  await expect.poll(async () => surface.evaluate((element) => window.getComputedStyle(element).backgroundColor)).not.toBe(restBackground);
  await page.mouse.move(0, 0);
  await expect.poll(async () => surface.evaluate((element) => window.getComputedStyle(element).backgroundColor)).toBe(restBackground);
});

test('CHG-110 Enter and click each submit once through the semantic sign-in path', async ({ page }) => {
  await openSignedOutSignIn(page);
  const email = page.getByLabel('Email');
  const password = page.getByLabel('Password');
  const submit = page.getByRole('button', { name: 'Sign in' });
  await installSubmitCounter(page);
  await email.fill('invalid-email');
  await password.press('Enter');
  await expect.poll(() => submitCount(page)).toBe(1);
  await expect(submit).toBeEnabled();

  await openSignedOutSignIn(page);
  const clickEmail = page.getByLabel('Email');
  const clickSubmit = page.getByRole('button', { name: 'Sign in' });
  await installSubmitCounter(page);
  await clickEmail.fill('invalid-email');
  await clickSubmit.click();
  await expect.poll(() => submitCount(page)).toBe(1);
  await expect(clickSubmit).toBeEnabled();

});

test('CHG-110 disabled/loading submit state is semantic and non-submitting', async ({ page }) => {
  await page.goto('/chg-110-submit');
  const submit = page.getByTestId('chg-110-compact-submit');
  const submissions = page.getByTestId('chg-110-submissions');
  const pressCallbacks = page.getByTestId('chg-110-press-callbacks');
  const surface = submit.locator('div').first();
  await page.getByRole('button', { name: 'Start loading' }).click();
  await expect(submit).toBeDisabled();
  await expect(submit).toHaveAttribute('aria-disabled', 'true');
  await expect(submit).toHaveAttribute('aria-busy', 'true');
  await expect(surface).toHaveCSS('opacity', /0\.[0-9]+/);
  await submit.click({ force: true });
  await expect(submissions).toHaveText('Form submissions: 0');
  await expect(pressCallbacks).toHaveText('Submit press callbacks: 0');
  await page.getByRole('button', { name: 'Stop loading' }).click();
  await page.getByRole('button', { name: 'Disable submit' }).click();
  await expect(submit).toBeDisabled();
  await expect(submit).toHaveAttribute('aria-busy', 'false');
  await submit.click({ force: true });
  await expect(submissions).toHaveText('Form submissions: 0');
  await expect(pressCallbacks).toHaveText('Submit press callbacks: 0');
});

test('CHG-110 pointer-origin focus does not show keyboard focus treatment', async ({ page }) => {
  await page.goto('/chg-110-submit');
  const password = page.getByLabel('Password');
  const submit = page.getByTestId('chg-110-compact-submit');
  const surface = submit.locator('div').first();
  await password.focus();
  await submit.click();
  await expect(page.getByTestId('chg-110-submissions')).toHaveText('Form submissions: 1');
  await expect(page.getByTestId('chg-110-press-callbacks')).toHaveText('Submit press callbacks: 0');
  await expect.poll(async () => surface.evaluate((element) => window.getComputedStyle(element).boxShadow)).toBe('none');
});

test('CHG-110 submit widths preserve fullWidth and compact-full responsive geometry', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/chg-110-submit');
  const full = page.getByTestId('chg-110-full-submit');
  const compact = page.getByTestId('chg-110-compact-submit');
  const compactFull = await compact.boundingBox();
  const compactWide = await full.boundingBox();
  expect(compactFull).not.toBeNull();
  expect(compactWide).not.toBeNull();
  expect(Math.abs(compactFull!.width - compactWide!.width)).toBeLessThanOrEqual(2);

  await page.setViewportSize({ width: 1280, height: 800 });
  const mediumFullWidth = (await full.boundingBox())?.width ?? 0;
  const mediumCompactWidth = (await compact.boundingBox())?.width ?? 0;
  expect(mediumFullWidth).toBeGreaterThan(mediumCompactWidth + 2);
});
