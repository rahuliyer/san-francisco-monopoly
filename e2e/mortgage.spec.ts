import { test, expect, Page } from '@playwright/test';
import type { DeterministicGameConfig } from '../lib/state/test-utils';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to close any open modals
async function closeAnyModal(page: Page) {
  try {
    const passBtn = page.getByRole('button', { name: 'Pass' });
    if (await passBtn.isVisible({ timeout: 500 })) {
      await passBtn.click();
      await page.waitForTimeout(500);
      return;
    }
  } catch { /* No modal */ }

  try {
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    if (await continueBtn.isVisible({ timeout: 500 })) {
      await continueBtn.click();
      await page.waitForTimeout(500);
      return;
    }
  } catch { /* No modal */ }

  try {
    const closeButton = page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first();
    if (await closeButton.isVisible({ timeout: 500 })) {
      await closeButton.click();
      await page.waitForTimeout(500);
      return;
    }
  } catch { /* No modal */ }
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

async function injectDeterministicGame(page: Page, config: DeterministicGameConfig) {
  await page.addInitScript((config) => {
    (window as Window & { __DETERMINISTIC_GAME_CONFIG__?: DeterministicGameConfig })
      .__DETERMINISTIC_GAME_CONFIG__ = config;
  }, config);
}

async function startGameWithConfig(page: Page, config: DeterministicGameConfig) {
  await injectDeterministicGame(page, config);
  await page.goto('/');
  await page.getByRole('button', { name: 'Play Now' }).click();
  await page.getByRole('button', { name: 'START GAME' }).click();
  await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
}

test.describe('Property Mortgage Flow', () => {
  test('should mortgage and unmortgage an owned property', async ({ page }) => {
    const deterministicConfig: DeterministicGameConfig = {
      players: [
        { name: 'Player 1', tokenIndex: 0 },
        { name: 'Player 2', tokenIndex: 1 },
      ],
      initialProperties: [{ propertyId: 6, ownerId: 0 }],
    };

    await startGameWithConfig(page, deterministicConfig);

    await waitForTurn(page, 'Player 1');

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

    const mortgageButton = page.getByRole('button', { name: /Mortgage for \$/ });
    await expect(mortgageButton).toBeVisible({ timeout: 5000 });
    await mortgageButton.click();

    await expect(page.getByText('Mortgaged to the bank')).toBeVisible({ timeout: 5000 });
    const liftMortgageButton = page.getByRole('button', { name: /Lift Mortgage for \$/ });
    await expect(liftMortgageButton).toBeVisible({ timeout: 5000 });

    await liftMortgageButton.click();
    await expect(page.getByText('Mortgaged to the bank')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Mortgage for \$/ })).toBeVisible({ timeout: 5000 });
  });
});
