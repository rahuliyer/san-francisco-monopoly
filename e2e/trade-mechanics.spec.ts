import { test, expect, Page } from '@playwright/test';

async function startGame(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play Now' }).click();
  await page.getByRole('button', { name: 'START GAME' }).click();
  await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
}

async function openTradeModal(page: Page) {
  await page.getByRole('button', { name: 'Trade' }).click();
  await expect(page.getByText('Make a Trade')).toBeVisible();
}

test.describe('Trading Mechanics', () => {
  test('should open trade modal and block empty trade', async ({ page }) => {
    await startGame(page);

    await openTradeModal(page);
    await expect(page.getByLabel('Trade partner')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Complete Trade' })).toBeDisabled();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Make a Trade')).not.toBeVisible();
  });

  test('should complete a cash-only trade', async ({ page }) => {
    await startGame(page);

    await openTradeModal(page);

    await page.getByLabel('Cash you give').fill('100');
    await page.getByLabel('Cash you receive').fill('50');
    await page.getByRole('button', { name: 'Complete Trade' }).click();

    await expect(page.getByText('Make a Trade')).not.toBeVisible();
    await expect(page.getByText('$1,450')).toBeVisible();
    await expect(page.getByText('$1,550')).toBeVisible();
  });
});
