import { expect, test } from '@playwright/test';

test('overlay restores focus to an eligible invoking control after Escape', async ({ page }) => {
  await page.goto('/overlays');
  const trigger = page.getByRole('button', { name: 'Open dialog', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Review this recommendation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('a disabled invoking control falls back only to the explicit eligible owner', async ({ page }) => {
  await page.goto('/overlays');
  const trigger = page.getByRole('button', { name: 'Open dialog', exact: true });
  const triggerElement = await trigger.elementHandle();
  const fallback = page.getByRole('button', { name: 'Show toast', exact: true });
  await fallback.evaluate((element) => { element.id = 'overlay-focus-fallback'; });
  await trigger.click();
  await triggerElement?.evaluate((element) => { (element as HTMLButtonElement).disabled = true; });
  await page.keyboard.press('Escape');
  await expect(fallback).toBeFocused();
  expect(await page.evaluate((element) => document.activeElement === element, triggerElement)).toBe(false);
});

for (const [label, condition] of [
  ['hidden', 'hidden'],
  ['inert', 'inert'],
  ['aria-disabled', 'aria-disabled'],
  ['aria-hidden', 'aria-hidden'],
  ['display:none', 'display-none'],
  ['visibility:hidden', 'visibility-hidden'],
  ['fully transparent', 'transparent'],
] as const) {
  test(`overlay skips a ${label} invoking control and restores to its explicit fallback`, async ({ page }) => {
    await page.goto('/overlays');
    const trigger = page.getByRole('button', { name: 'Open dialog', exact: true });
    const triggerElement = await trigger.elementHandle();
    const fallback = page.getByRole('button', { name: 'Show toast', exact: true });
    await fallback.evaluate((element) => { element.id = 'overlay-focus-fallback'; });
    await trigger.click();
    await triggerElement?.evaluate((element, state) => {
      const target = element as HTMLElement;
      if (state === 'hidden') target.hidden = true;
      else if (state === 'inert') target.inert = true;
      else if (state === 'aria-disabled' || state === 'aria-hidden') target.setAttribute(state, 'true');
      else if (state === 'display-none') target.style.display = 'none';
      else if (state === 'visibility-hidden') target.style.visibility = 'hidden';
      else target.style.opacity = '0';
    }, condition);
    await page.keyboard.press('Escape');
    await expect(fallback).toBeFocused();
    expect(await page.evaluate((element) => document.activeElement === element, triggerElement)).toBe(false);
  });
}

test('when the invoker and explicit fallback are ineligible, restoration does not choose another control', async ({ page }) => {
  await page.goto('/overlays');
  const trigger = page.getByRole('button', { name: 'Open dialog', exact: true });
  const triggerElement = await trigger.elementHandle();
  const fallback = page.getByRole('button', { name: 'Show toast', exact: true });
  const fallbackElement = await fallback.elementHandle();
  await fallback.evaluate((element) => { element.id = 'overlay-focus-fallback'; });
  await trigger.click();
  await triggerElement?.evaluate((element) => { element.setAttribute('aria-hidden', 'true'); });
  await fallbackElement?.evaluate((element) => { element.setAttribute('inert', ''); });
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  expect(await page.evaluate((element) => document.activeElement === element, triggerElement)).toBe(false);
  expect(await page.evaluate((element) => document.activeElement === element, fallbackElement)).toBe(false);
});

test('Tab trapping refreshes eligibility and skips controls made disabled, hidden, or inert', async ({ page }) => {
  await page.goto('/overlays');
  await page.getByRole('button', { name: 'Open dialog', exact: true }).click();
  const cancel = page.getByRole('button', { name: 'Cancel', exact: true });
  const review = page.getByRole('button', { name: 'Review', exact: true });
  const reviewElement = await review.elementHandle();
  await expect(cancel).toBeFocused();

  await reviewElement?.evaluate((element) => { (element as HTMLButtonElement).disabled = true; });
  await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused();

  await reviewElement?.evaluate((element) => { (element as HTMLButtonElement).disabled = false; element.setAttribute('hidden', ''); });
  await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused();

  await reviewElement?.evaluate((element) => { element.removeAttribute('hidden'); (element as HTMLElement).inert = true; });
  await page.keyboard.press('Shift+Tab');
  await expect(cancel).toBeFocused();

  await reviewElement?.evaluate((element) => { (element as HTMLElement).inert = false; });
  await page.keyboard.press('Tab');
  await expect(review).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(cancel).toBeFocused();
});
