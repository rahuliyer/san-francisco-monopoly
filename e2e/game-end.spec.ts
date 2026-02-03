import { test, expect, Page } from '@playwright/test';
import type { DeterministicGameConfig } from '../lib/state/test-utils';

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

async function waitForRollButton(page: Page) {
  const rollDice = page.getByRole('button', { name: 'Roll Dice' });
  const rollForDoubles = page.getByRole('button', { name: 'Roll for Doubles' });
  await expect(rollDice.or(rollForDoubles)).toBeEnabled({ timeout: 15000 });
  if (await rollForDoubles.isVisible().catch(() => false)) {
    return rollForDoubles;
  }
  return rollDice;
}

async function closeAnyModal(page: Page) {
  // Try Pass button
  try {
    const passBtn = page.getByRole('button', { name: 'Pass' });
    if (await passBtn.isVisible({ timeout: 500 })) {
      await passBtn.click();
      await page.waitForTimeout(500);
      return;
    }
  } catch { /* No modal */ }

  // Try Continue button
  try {
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    if (await continueBtn.isVisible({ timeout: 500 })) {
      await continueBtn.click();
      await page.waitForTimeout(500);
      return;
    }
  } catch { /* No modal */ }

  // Try X close button
  try {
    const modal = page.locator('.fixed.inset-0.z-50');
    const closeBtn = modal.locator('button').filter({ has: page.locator('svg.h-4.w-4') }).first();
    if (await closeBtn.isVisible({ timeout: 500 })) {
      await closeBtn.click();
      await page.waitForTimeout(500);
      return;
    }
  } catch { /* No modal */ }
}

test.describe('Game End and Victory', () => {
  test('should show victory modal when a player goes bankrupt and only one remains', async ({ page }) => {
    // Set up a game where Player 2 owns an expensive property
    // Player 1 has very little money and will land on it
    // Pacific Heights (position 26) has rent of $22 (base), $110 (with monopoly), up to $1200 with hotel
    // Position 26 is Pacific Heights ($280, rent $22)
    const config: DeterministicGameConfig = {
      players: [
        { name: 'Alice', tokenIndex: 0, initialPosition: 24, initialMoney: 10 },
        { name: 'Bob', tokenIndex: 1, initialPosition: 0, initialMoney: 1500 },
      ],
      // Player 2 owns Pacific Heights (26), Nob Hill (27), Russian Hill (29) - the green monopoly
      initialProperties: [
        { propertyId: 26, ownerId: 1 },
        { propertyId: 27, ownerId: 1 },
        { propertyId: 29, ownerId: 1 },
      ],
      // Roll 1+1=2 to land on Pacific Heights (from 24 to 26)
      diceSequence: [[1, 1]],
    };

    await startGameWithConfig(page, config);

    // Alice rolls and lands on Bob's property
    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();

    // Wait for dice animation and game processing
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);

    // Close any property modal that appears
    await closeAnyModal(page);
    await page.waitForTimeout(1500);

    // Victory modal should appear since Alice went bankrupt (rent > money)
    await expect(page.getByText('Victory!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Bob wins!')).toBeVisible();
    await expect(page.getByText('San Francisco Tycoon')).toBeVisible();
  });

  test('should display winner stats in victory modal', async ({ page }) => {
    const config: DeterministicGameConfig = {
      players: [
        { name: 'Winner', tokenIndex: 0, initialPosition: 0, initialMoney: 2000 },
        { name: 'Loser', tokenIndex: 1, initialPosition: 24, initialMoney: 10 },
      ],
      // Winner owns Pacific Heights with monopoly
      initialProperties: [
        { propertyId: 26, ownerId: 0 },
        { propertyId: 27, ownerId: 0 },
        { propertyId: 29, ownerId: 0 },
      ],
      // Winner rolls non-doubles (1+2=3), then Loser rolls (1+1=2) to land on Pacific Heights
      diceSequence: [[1, 2], [1, 1]],
    };

    await startGameWithConfig(page, config);

    // Winner's turn first - just roll and close (non-doubles so turn ends)
    let rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1500);
    await closeAnyModal(page);
    await page.waitForTimeout(1000);

    // Now Loser's turn - rolls to land on Winner's property
    rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);
    await closeAnyModal(page);
    await page.waitForTimeout(1500);

    // Victory modal should show
    await expect(page.getByText('Victory!')).toBeVisible({ timeout: 10000 });

    // Check for winner stats
    await expect(page.getByText('Cash')).toBeVisible();
    await expect(page.getByText('Properties', { exact: true })).toBeVisible();
    await expect(page.getByText('Net Worth')).toBeVisible();
  });

  test('should display final standings in victory modal', async ({ page }) => {
    const config: DeterministicGameConfig = {
      players: [
        { name: 'Alice', tokenIndex: 0, initialPosition: 24, initialMoney: 10 },
        { name: 'Bob', tokenIndex: 1, initialPosition: 0, initialMoney: 1500 },
      ],
      initialProperties: [
        { propertyId: 26, ownerId: 1 },
        { propertyId: 27, ownerId: 1 },
        { propertyId: 29, ownerId: 1 },
      ],
      diceSequence: [[1, 1]],
    };

    await startGameWithConfig(page, config);

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);
    await closeAnyModal(page);
    await page.waitForTimeout(1500);

    // Victory modal should show final standings
    await expect(page.getByText('Victory!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Final Standings')).toBeVisible();

    // Both players should be listed in the final standings
    await expect(page.getByRole('heading', { name: 'Alice' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bob' }).first()).toBeVisible();

    // Bankrupt player should show as bankrupt
    await expect(page.getByText('Bankrupt').first()).toBeVisible();
  });

  test('should allow starting new game from victory modal', async ({ page }) => {
    const config: DeterministicGameConfig = {
      players: [
        { name: 'Alice', tokenIndex: 0, initialPosition: 24, initialMoney: 10 },
        { name: 'Bob', tokenIndex: 1, initialPosition: 0, initialMoney: 1500 },
      ],
      initialProperties: [
        { propertyId: 26, ownerId: 1 },
        { propertyId: 27, ownerId: 1 },
        { propertyId: 29, ownerId: 1 },
      ],
      diceSequence: [[1, 1]],
    };

    await startGameWithConfig(page, config);

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);
    await closeAnyModal(page);
    await page.waitForTimeout(1500);

    // Victory modal should appear
    await expect(page.getByText('Victory!')).toBeVisible({ timeout: 10000 });

    // Click Play Again button
    const playAgainBtn = page.getByRole('button', { name: 'Play Again' });
    await expect(playAgainBtn).toBeVisible();
    await playAgainBtn.click();

    // Should return to splash screen
    await expect(page.getByRole('button', { name: 'Play Now' })).toBeVisible({ timeout: 10000 });
  });

  test('should show Game Over in controls when game ends', async ({ page }) => {
    const config: DeterministicGameConfig = {
      players: [
        { name: 'Alice', tokenIndex: 0, initialPosition: 24, initialMoney: 10 },
        { name: 'Bob', tokenIndex: 1, initialPosition: 0, initialMoney: 1500 },
      ],
      initialProperties: [
        { propertyId: 26, ownerId: 1 },
        { propertyId: 27, ownerId: 1 },
        { propertyId: 29, ownerId: 1 },
      ],
      diceSequence: [[1, 1]],
    };

    await startGameWithConfig(page, config);

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);
    await closeAnyModal(page);
    await page.waitForTimeout(1500);

    // Game Over should be visible in controls (behind the modal)
    // The modal covers it but the text exists in the DOM
    await expect(page.getByText('Game Over')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Bankruptcy Detection', () => {
  test('should mark player as bankrupt when money goes negative from rent', async ({ page }) => {
    // Player 1 has $50, Player 2 owns a property with $100 rent
    // When Player 1 lands on it, they go bankrupt
    const config: DeterministicGameConfig = {
      players: [
        { name: 'PoorPlayer', tokenIndex: 0, initialPosition: 24, initialMoney: 20 },
        { name: 'RichPlayer', tokenIndex: 1, initialPosition: 0, initialMoney: 2000 },
      ],
      // Green monopoly with high rent
      initialProperties: [
        { propertyId: 26, ownerId: 1 },
        { propertyId: 27, ownerId: 1 },
        { propertyId: 29, ownerId: 1 },
      ],
      diceSequence: [[1, 1]],
    };

    await startGameWithConfig(page, config);

    // PoorPlayer rolls
    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);
    await closeAnyModal(page);
    await page.waitForTimeout(1500);

    // Victory modal should appear for RichPlayer
    await expect(page.getByText('Victory!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('RichPlayer wins!')).toBeVisible();
  });
});
