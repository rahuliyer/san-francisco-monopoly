import { test, expect, Page } from '@playwright/test';

async function setDiceRolls(page: Page, rolls: Array<[number, number]>) {
  await page.addInitScript((sequence) => {
    (globalThis as { __TEST_DICE_ROLLS__?: [number, number][] }).__TEST_DICE_ROLLS__ = sequence;
  }, rolls);
}

// Helper function to close any open modals
async function closeAnyModal(page: Page) {
  try {
    const passBtn = page.getByRole('button', { name: 'Pass' });
    if (await passBtn.isVisible({ timeout: 300 })) {
      await passBtn.click();
      return;
    }
  } catch { /* No modal */ }

  try {
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    if (await continueBtn.isVisible({ timeout: 300 })) {
      await continueBtn.click();
      return;
    }
  } catch { /* No modal */ }
}

// Helper function to wait for roll button
async function waitForRollButton(page: Page) {
  await closeAnyModal(page);
  
  const rollDice = page.getByRole('button', { name: 'Roll Dice' });
  const rollForDoubles = page.getByRole('button', { name: 'Roll for Doubles' });
  
  await expect(rollDice.or(rollForDoubles)).toBeEnabled({ timeout: 15000 });
  
  if (await rollForDoubles.isVisible().catch(() => false)) {
    return rollForDoubles;
  }
  return rollDice;
}

test.describe('Game Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should display game controls container', async ({ page }) => {
    // Game controls container has Art Deco styling with gradient background
    const controlsContainer = page.locator('.flex.flex-col.items-center.gap-4.rounded-lg.p-4.shadow-md');
    await expect(controlsContainer).toBeVisible();
  });

  test('should display current player name in controls', async ({ page }) => {
    await expect(page.getByText("Player 1's Turn")).toBeVisible();
  });

  test('should show dice values after rolling', async ({ page }) => {
    await page.getByRole('button', { name: 'Roll Dice' }).click();

    // Wait for roll to complete
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    // The rolled value should be between 2 and 12
    const rolledText = await page.getByText(/Rolled: (\d+)/).textContent();
    const match = rolledText?.match(/Rolled: (\d+)/);
    if (match) {
      const value = parseInt(match[1], 10);
      expect(value).toBeGreaterThanOrEqual(2);
      expect(value).toBeLessThanOrEqual(12);
    }
  });

  test('should disable roll button after rolling', async ({ page }) => {
    await page.getByRole('button', { name: 'Roll Dice' }).click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    // Roll button should be disabled
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeDisabled();
  });

  test('should enable roll button for next player', async ({ page }) => {
    // Player 1 rolls
    await page.getByRole('button', { name: 'Roll Dice' }).click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    // Handle any modals that appear
    await closeAnyModal(page);

    // Wait for Player 2's turn (or Player 1's if in jail)
    await expect(page.getByText("Player 2's Turn").or(page.getByText("Player 1's Turn"))).toBeVisible({ timeout: 15000 });

    // Roll button or Roll for Doubles should be enabled for next player
    const rollDice = page.getByRole('button', { name: 'Roll Dice' });
    const rollForDoubles = page.getByRole('button', { name: 'Roll for Doubles' });
    await expect(rollDice.or(rollForDoubles)).toBeEnabled({ timeout: 5000 });
  });
});

test.describe('Jail Controls', () => {
  test('should show jail-specific controls when in jail', async ({ page }) => {
    // Use 3 consecutive doubles to send player to jail, then a non-double for player 2
    await setDiceRolls(page, [[3, 3], [3, 3], [3, 3], [1, 2]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Roll dice - 3 doubles sends player 1 to jail
    let rollBtn = await waitForRollButton(page);
    await rollBtn.click();

    // Wait for Go To Jail modal then close it
    await expect(page.getByText('Go To Jail')).toBeVisible({ timeout: 5000 });
    await closeAnyModal(page);

    // Player 2's turn
    rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await closeAnyModal(page);

    // Now it's player 1's turn again (who is in jail)
    const rollForDoubles = page.getByRole('button', { name: 'Roll for Doubles' });
    await expect(rollForDoubles).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('🔒 In Alcatraz')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pay $50 to Leave' })).toBeVisible();
  });

  test('should show turn count in jail', async ({ page }) => {
    // Use 3 consecutive doubles to send player to jail, then a non-double for player 2
    await setDiceRolls(page, [[3, 3], [3, 3], [3, 3], [1, 2]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Roll dice - 3 doubles sends player 1 to jail
    let rollBtn = await waitForRollButton(page);
    await rollBtn.click();

    // Wait for Go To Jail modal then close it
    await expect(page.getByText('Go To Jail')).toBeVisible({ timeout: 5000 });
    await closeAnyModal(page);

    // Player 2's turn
    rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await closeAnyModal(page);

    // Now it's player 1's turn again (who is in jail)
    await expect(page.getByRole('button', { name: 'Roll for Doubles' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Turn \d+ of 3/)).toBeVisible();
  });

  test('should indicate escape instructions', async ({ page }) => {
    // Use 3 consecutive doubles to send player to jail, then a non-double for player 2
    await setDiceRolls(page, [[3, 3], [3, 3], [3, 3], [1, 2]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Roll dice - 3 doubles sends player 1 to jail
    let rollBtn = await waitForRollButton(page);
    await rollBtn.click();

    // Wait for Go To Jail modal then close it
    await expect(page.getByText('Go To Jail')).toBeVisible({ timeout: 5000 });
    await closeAnyModal(page);

    // Player 2's turn
    rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await closeAnyModal(page);

    // Now it's player 1's turn again (who is in jail)
    await expect(page.getByRole('button', { name: 'Roll for Doubles' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Roll doubles to escape!/)).toBeVisible();
  });
});

test.describe('Game Controls Styling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should have amber-styled roll button', async ({ page }) => {
    // Art Deco styled golden gradient button
    const rollButton = page.getByRole('button', { name: 'Roll Dice' });
    await expect(rollButton).toHaveClass(/from-\[#d4af37\]/);
  });

  test('should have shadow on game controls container', async ({ page }) => {
    // The game controls container has shadow-md class with Art Deco gradient background
    const controlsContainer = page.locator('.flex.flex-col.items-center.gap-4.rounded-lg.p-4.shadow-md');
    await expect(controlsContainer).toBeVisible();
  });
});
