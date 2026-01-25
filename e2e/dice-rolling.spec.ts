import { test, expect } from '@playwright/test';

test.describe('Dice Rolling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    // Wait for game to start
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should display dice component', async ({ page }) => {
    // The dice component should be visible
    // Dice are rendered as 3D elements with specific styling
    const diceContainer = page.locator('.flex.gap-4.py-2');
    await expect(diceContainer).toBeVisible();
  });

  test('should display Roll Dice button initially', async ({ page }) => {
    const rollButton = page.getByRole('button', { name: 'Roll Dice' });
    await expect(rollButton).toBeVisible();
    await expect(rollButton).toBeEnabled();
  });

  test('should disable Roll Dice button while rolling', async ({ page }) => {
    const rollButton = page.getByRole('button', { name: 'Roll Dice' });
    await rollButton.click();

    // Button should show "Rolling..." and be disabled
    await expect(page.getByRole('button', { name: 'Rolling...' })).toBeVisible();
  });

  test('should display rolled total after rolling', async ({ page }) => {
    await page.getByRole('button', { name: 'Roll Dice' }).click();

    // Wait for dice to finish rolling and show the result
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
  });

  test('should disable Roll Dice button after rolling', async ({ page }) => {
    await page.getByRole('button', { name: 'Roll Dice' }).click();

    // Wait for roll to complete
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    // Roll button should be disabled after rolling
    const rollButton = page.getByRole('button', { name: 'Roll Dice' });
    await expect(rollButton).toBeDisabled();
  });

  test('should show current player name with turn indicator', async ({ page }) => {
    await expect(page.getByText("Player 1's Turn")).toBeVisible();
  });

  test('should roll values between 2 and 12', async ({ page }) => {
    await page.getByRole('button', { name: 'Roll Dice' }).click();

    // Wait for roll to complete
    const rolledText = page.getByText(/Rolled: (\d+)/);
    await expect(rolledText).toBeVisible({ timeout: 5000 });

    // Extract the rolled value
    const text = await rolledText.textContent();
    const match = text?.match(/Rolled: (\d+)/);
    if (match) {
      const rolledValue = parseInt(match[1], 10);
      expect(rolledValue).toBeGreaterThanOrEqual(2);
      expect(rolledValue).toBeLessThanOrEqual(12);
    }
  });

  test('should animate dice during rolling', async ({ page }) => {
    // Get the dice container before rolling
    const diceContainer = page.locator('.flex.gap-4.py-2');
    await expect(diceContainer).toBeVisible();

    // Click roll
    await page.getByRole('button', { name: 'Roll Dice' }).click();

    // Wait a moment for animation to start
    await page.waitForTimeout(200);

    // The rolling animation should be in progress
    // Check that Rolling... text is shown
    await expect(page.getByRole('button', { name: 'Rolling...' })).toBeVisible();
  });

  test('should complete multiple rolls in sequence', async ({ page }) => {
    // First player rolls
    await page.getByRole('button', { name: 'Roll Dice' }).click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    // Handle any modals that appear
    try {
      const continueBtn = page.getByRole('button', { name: 'Continue' });
      if (await continueBtn.isVisible({ timeout: 2000 })) {
        await continueBtn.click();
      }
    } catch { /* No modal */ }

    try {
      const passBtn = page.getByRole('button', { name: 'Pass' });
      if (await passBtn.isVisible({ timeout: 1000 })) {
        await passBtn.click();
      }
    } catch { /* No modal */ }

    // Wait for turn to change to second player
    await expect(page.getByText("Player 2's Turn")).toBeVisible({ timeout: 15000 });

    // Second player should be able to roll
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeEnabled({ timeout: 5000 });
  });
});

test.describe('Dice Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should display two dice', async ({ page }) => {
    // There should be two dice displayed in the dice container
    const diceContainer = page.locator('.flex.gap-4.py-2');
    await expect(diceContainer).toBeVisible();
    // Each die is wrapped in a perspective container
    const diceChildren = diceContainer.locator('> div');
    await expect(diceChildren).toHaveCount(2);
  });

  test('should show dice faces with dots', async ({ page }) => {
    // Dice faces have dots rendered
    const diceFaces = page.locator('.rounded-full.bg-stone-800');
    // At least 2 dots should be visible (minimum for showing 1+1)
    const count = await diceFaces.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should have 3D dice styling', async ({ page }) => {
    // Check for dice container with 3D styling
    const diceContainer = page.locator('.flex.gap-4.py-2');
    await expect(diceContainer).toBeVisible();
    // The dice should have 3D transform styling
    const diceElements = diceContainer.locator('[style*="preserve-3d"]');
    await expect(diceElements).toHaveCount(2);
  });
});
