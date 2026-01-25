import { test, expect, Page } from '@playwright/test';

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
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should display game controls container', async ({ page }) => {
    const controlsContainer = page.locator('.flex.flex-col.items-center.gap-4.rounded-lg.bg-white.p-4.shadow-md');
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

    // Handle modals - wait a bit for them to appear
    await page.waitForTimeout(1500);

    try {
      const continueBtn = page.getByRole('button', { name: 'Continue' });
      if (await continueBtn.isVisible({ timeout: 2000 })) {
        await continueBtn.click();
      }
    } catch {
      // No modal
    }

    try {
      const passBtn = page.getByRole('button', { name: 'Pass' });
      if (await passBtn.isVisible({ timeout: 1000 })) {
        await passBtn.click();
      }
    } catch {
      // No modal
    }

    // Wait for Player 2's turn
    await expect(page.getByText("Player 2's Turn")).toBeVisible({ timeout: 15000 });

    // Roll button should be enabled for Player 2
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeEnabled({ timeout: 5000 });
  });
});

test.describe('Jail Controls', () => {
  // Helper to get a player in jail
  async function getPlayerInJail(page: Page) {
    let inJail = false;
    let attempts = 0;
    const maxAttempts = 35;

    while (!inJail && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);
      await closeAnyModal(page);
      await page.waitForTimeout(1000);

      // Check if current player is in jail
      try {
        const rollForDoubles = page.getByRole('button', { name: 'Roll for Doubles' });
        if (await rollForDoubles.isVisible({ timeout: 500 })) {
          inJail = true;
        }
      } catch {
        // Not in jail
      }

      attempts++;
    }

    return inJail;
  }

  test('should show jail-specific controls when in jail', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    const inJail = await getPlayerInJail(page);

    if (inJail) {
      await expect(page.getByText('🔒 In Alcatraz')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Roll for Doubles' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Pay $50 to Leave' })).toBeVisible();
    }
  });

  test('should show turn count in jail', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    const inJail = await getPlayerInJail(page);

    if (inJail) {
      await expect(page.getByText(/Turn \d+ of 3/)).toBeVisible();
    }
  });

  test('should indicate escape instructions', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    const inJail = await getPlayerInJail(page);

    if (inJail) {
      await expect(page.getByText(/Roll doubles to escape!/)).toBeVisible();
    }
  });
});

test.describe('Game Controls Styling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should have amber-styled roll button', async ({ page }) => {
    const rollButton = page.getByRole('button', { name: 'Roll Dice' });
    await expect(rollButton).toHaveClass(/bg-amber-500/);
  });

  test('should have shadow on game controls container', async ({ page }) => {
    // The game controls container has shadow-md class
    const controlsContainer = page.locator('.rounded-lg.bg-white.p-4.shadow-md');
    await expect(controlsContainer).toBeVisible();
  });
});
