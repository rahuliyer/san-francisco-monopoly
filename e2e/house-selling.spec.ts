import { test, expect, Page } from '@playwright/test';
import type { DeterministicGameConfig } from '../lib/state/test-utils';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function closeAnyModal(page: Page) {
  try {
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    if (await continueBtn.isVisible({ timeout: 500 })) {
      await continueBtn.click();
      await page.waitForTimeout(300);
    }
  } catch { /* no modal */ }
}

async function waitForTurn(page: Page, playerName: string) {
  const turnLabel = page.getByText(new RegExp(`${escapeRegExp(playerName)}['’]s Turn`));
  await expect
    .poll(async () => {
      await closeAnyModal(page);
      return turnLabel.isVisible();
    }, { timeout: 20000 })
    .toBe(true);
}

async function startGameWithConfig(page: Page, config: DeterministicGameConfig) {
  await page.addInitScript((config) => {
    (window as Window & { __DETERMINISTIC_GAME_CONFIG__?: DeterministicGameConfig })
      .__DETERMINISTIC_GAME_CONFIG__ = config;
  }, config);
  await page.goto('/');
  await page.getByRole('button', { name: 'Play Now' }).click();
  await page.getByRole('button', { name: 'START GAME' }).click();
  await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
}

test.describe('Voluntary House Selling', () => {
  test('sells a house from an owned monopoly and refunds half the build cost', async ({ page }) => {
    // Player 1 owns the full light-blue monopoly (Sunset 6, Richmond 8, Outer Mission 9),
    // each with one house. House cost is $50, so selling refunds $25.
    const config: DeterministicGameConfig = {
      players: [
        { name: 'Player 1', tokenIndex: 0 },
        { name: 'Player 2', tokenIndex: 1 },
      ],
      initialProperties: [
        { propertyId: 6, ownerId: 0, houseCount: 1 },
        { propertyId: 8, ownerId: 0, houseCount: 1 },
        { propertyId: 9, ownerId: 0, houseCount: 1 },
      ],
    };

    await startGameWithConfig(page, config);
    await waitForTurn(page, 'Player 1');

    // Open Player 1's properties and select Sunset District.
    const propertiesButton = page.getByRole('button', { name: /Properties \(\d+\)/ }).first();
    await expect(propertiesButton).toBeVisible({ timeout: 5000 });
    await propertiesButton.click();

    const propertiesModal = page.locator('.fixed.inset-0.z-50').filter({ hasText: 'Properties' });
    await expect(propertiesModal).toBeVisible({ timeout: 5000 });
    const propertyButton = propertiesModal.getByRole('button').filter({ hasText: 'Sunset District' });
    await expect(propertyButton).toBeVisible({ timeout: 3000 });
    await propertyButton.click();

    const propertyCardModal = page.locator('.fixed.inset-0.z-50').filter({ hasText: 'Title Deed' });
    await expect(propertyCardModal).toBeVisible({ timeout: 5000 });

    // The sell button shows the $25 refund.
    const sellButton = page.getByRole('button', { name: /Sell House/ });
    await expect(sellButton).toBeVisible({ timeout: 5000 });
    await expect(sellButton).toContainText('+$25');
    await propertyCardModal.screenshot({ path: '/opt/cursor/artifacts/sell_house_before.png' });

    await sellButton.click();

    // After selling the only house, the sell button disappears and cash rises to $1,525.
    await expect(page.getByRole('button', { name: /Sell House|Sell Hotel/ })).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('$1,525')).toBeVisible({ timeout: 5000 });
    await propertyCardModal.screenshot({ path: '/opt/cursor/artifacts/sell_house_after.png' });
  });
});
