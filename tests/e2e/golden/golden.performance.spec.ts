import fs from 'node:fs';
import { expect, test } from '@playwright/test';

const budgets = JSON.parse(fs.readFileSync('golden.certification.json', 'utf8')).performanceBudgets;

function pseudoLtr(value: string) {
  const expanded = value.replace(/[A-Za-z]/g, (character) => 'aeiou'.includes(character.toLowerCase()) ? `${character}${character}` : character);
  return `［${expanded}］`;
}

test('@performance representative UI interactions settle within the regression budget', async ({ page }) => {
  await page.goto('/');
  const measure = async (action: () => Promise<void>) => {
    const started = performance.now();
    await action();
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    return performance.now() - started;
  };
  expect(await measure(() => page.getByRole('button', { name: 'Theme: Dark' }).click())).toBeLessThan(budgets.uiInteractionMilliseconds);
  expect(await measure(() => page.getByRole('button', { name: 'Density: Compact' }).click())).toBeLessThan(budgets.uiInteractionMilliseconds);
  expect(await measure(() => page.getByRole('button', { name: 'Locale: Pseudo LTR' }).click())).toBeLessThan(budgets.uiInteractionMilliseconds);
  await page.getByRole('main').getByRole('button', { name: new RegExp(pseudoLtr('Workflow lab')) }).last().click();
  await expect(page).toHaveURL(/\/workflows$/);
  expect(await measure(() => page.getByTestId('workflow-command-trigger').click())).toBeLessThan(budgets.uiInteractionMilliseconds);
  await expect(page.getByRole('dialog', { name: 'Command launcher' })).toBeVisible();
});
