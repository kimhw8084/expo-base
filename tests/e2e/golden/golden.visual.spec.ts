import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const certification = JSON.parse(fs.readFileSync('golden.certification.json', 'utf8'));
const routeLabels: Record<string, string> = {
  '/system': 'System lab', '/forms': 'Forms', '/data': 'Data display', '/feedback': 'Feedback',
  '/workflows': 'Workflow lab', '/stress': 'Stress matrix', '/overlays': 'Overlays', '/visualization': 'Visualization',
  '/golden-plus': 'Golden Plus breadth',
};
const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pseudoCopy = (value: string, direction: 'ltr' | 'rtl') => {
  const expanded = value.replace(/[A-Za-z]/g, (character) => 'aeiou'.includes(character.toLowerCase()) ? `${character}${character}` : character);
  return direction === 'rtl' ? `\u202e［${expanded}］\u202c` : `［${expanded}］`;
};

async function openScenario(page: Page, scenario: any) {
  await page.setViewportSize(scenario.viewport === 'compact' ? { width: 390, height: 844 } : { width: 1280, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: `Theme: ${scenario.theme === 'dark' ? 'Dark' : 'Light'}` }).click();
  await page.getByRole('button', { name: `Density: ${scenario.density === 'compact' ? 'Compact' : 'Comfortable'}` }).click();
  if (scenario.locale === 'en-XA') await page.getByRole('button', { name: 'Locale: Pseudo LTR' }).click();
  if (scenario.locale === 'en-XB') await page.getByRole('button', { name: 'Locale: Pseudo RTL' }).click();
  if (scenario.motion === 'reduced') await page.getByRole('button', { name: 'Motion: Reduced' }).click();
  const routeLabel = scenario.locale
    ? pseudoCopy(routeLabels[scenario.route], scenario.locale === 'en-XB' ? 'rtl' : 'ltr')
    : routeLabels[scenario.route];
  await page.getByRole('main').getByText(routeLabel, { exact: true }).last().click();
  await expect(page).toHaveURL(new RegExp(`${scenario.route.replace('/', '\\/')}$`));
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('main')).toBeVisible();
  if (scenario.action === 'open-destructive-dialog') await page.getByRole('button', { name: 'Open destructive alert' }).click();
}

for (const scenario of certification.visualBaselines) {
  test(`@visual ${scenario.id}`, async ({ page }) => {
    await openScenario(page, scenario);
    const target = scenario.targetTestId
      ? page.getByTestId(scenario.targetTestId)
      : scenario.captureRole
        ? page.getByRole(scenario.captureRole)
        : page;
    await expect(target).toHaveScreenshot(`${scenario.id}.png`);
  });
}
