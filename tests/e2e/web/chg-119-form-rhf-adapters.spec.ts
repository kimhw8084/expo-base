import { expect, test } from '@playwright/test';

test('CHG-119 RHF date and text-area adapters preserve value, touched, error, focus, and callbacks', async ({ page }) => {
  await page.goto('/form-rhf-adapters');

  const date = page.getByTestId('chg119-date');
  const notes = page.getByTestId('chg119-notes');
  const disabledNotes = page.getByTestId('chg119-disabled-notes');

  await expect(date).toHaveAttribute('placeholder', 'YYYY-MM-DD');
  await expect(date).toHaveAttribute('aria-required', 'true');
  await expect(notes).toHaveAttribute('aria-required', 'true');
  await expect(disabledNotes).toHaveAttribute('readonly', '');
  await expect(disabledNotes).toHaveAttribute('aria-required', 'true');

  await page.getByTestId('chg119-submit').click();
  await expect(date).toBeFocused();
  await expect(date).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByTestId('chg119-date-error')).toHaveText('Effective date is required.');
  await expect(page.getByTestId('chg119-notes-error')).toHaveText('Notes are required.');

  await date.fill('2026-09-18');
  await expect(page.getByTestId('chg119-date-value')).toHaveText('2026-09-18');
  await expect(page.getByTestId('chg119-date-value-change-count')).toHaveText('1');
  await date.blur();
  await expect(page.getByTestId('chg119-date-blur-count')).toHaveText('1');
  await expect(page.getByTestId('chg119-date-touched')).toHaveText('true');

  await notes.fill('first line\nsecond line');
  await expect(page.getByTestId('chg119-notes-value')).toHaveText('first line\nsecond line');
  await notes.blur();
  await expect(page.getByTestId('chg119-text-area-blur-count')).toHaveText('1');
  await expect(page.getByTestId('chg119-notes-touched')).toHaveText('true');

  await date.focus();
  await expect.poll(() => date.evaluate((element) => getComputedStyle(element.parentElement as HTMLElement).boxShadow)).not.toBe('none');
  await date.blur();
  await expect.poll(() => date.evaluate((element) => getComputedStyle(element.parentElement as HTMLElement).boxShadow)).toBe('none');

  await notes.focus();
  await expect.poll(() => notes.evaluate((element) => getComputedStyle(element.parentElement as HTMLElement).boxShadow)).not.toBe('none');
  await notes.blur();
  await expect.poll(() => notes.evaluate((element) => getComputedStyle(element.parentElement as HTMLElement).boxShadow)).toBe('none');
  await expect(page.getByTestId('chg119-text-area-blur-count')).toHaveText('2');
});
