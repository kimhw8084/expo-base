import { expect, test, type Page } from '@playwright/test';

async function resetScroll(page: Page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    for (const node of document.querySelectorAll<HTMLElement>('*')) {
      if (node.scrollTop > 0) node.scrollTop = 0;
    }
  });
}

test.describe('mobile visual certification', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'standard-phone-chromium', 'Canonical mobile screenshots use one deterministic Chromium phone profile; interaction parity runs across all profiles.');
  });

  test('@mobile-visual home compact light', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Density: Compact' }).click();
    await resetScroll(page);
    await expect(page.getByRole('main')).toHaveScreenshot('home-compact-light.png');
  });

  test('@mobile-visual forms compact dark', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Theme: Dark' }).click();
    await page.getByRole('button', { name: 'Density: Compact' }).click();
    await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Build' }).click();
    await resetScroll(page);
    await expect(page.getByRole('main')).toHaveScreenshot('forms-compact-dark.png');
  });

  test('@mobile-visual data compact pseudo rtl', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Density: Compact' }).click();
    await page.getByRole('button', { name: 'Locale: Pseudo RTL' }).click();
    await page.getByRole('navigation', { name: /Primary navigation/ }).getByRole('link').nth(2).click();
    await resetScroll(page);
    await expect(page.getByRole('main')).toHaveScreenshot('data-compact-pseudo-rtl.png');
  });

  test('@mobile-visual bottom sheet short height dark', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 568 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Theme: Dark' }).click();
    await page.getByRole('main').getByText('Overlays', { exact: true }).last().click();
    await page.getByRole('button', { name: 'Open bottom sheet' }).click();
    await expect(page.getByRole('dialog', { name: 'Quick actions' })).toHaveScreenshot('bottom-sheet-short-dark.png');
  });
});
