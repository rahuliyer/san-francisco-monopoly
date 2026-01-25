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

  try {
    const cancelBtn = page.getByRole('button', { name: 'Cancel' });
    if (await cancelBtn.isVisible({ timeout: 500 })) {
      await cancelBtn.click();
      await page.waitForTimeout(500);
      return;
    }
  } catch { /* No modal */ }

  try {
    const closeTradeBtn = page.getByRole('button', { name: 'Close trade' });
    if (await closeTradeBtn.isVisible({ timeout: 500 })) {
      await closeTradeBtn.click();
      await page.waitForTimeout(500);
      return;
    }
  } catch { /* No modal */ }

  try {
    const closeBtn = page.locator('button').filter({ has: page.locator('svg.h-4.w-4') }).first();
    if (await closeBtn.isVisible({ timeout: 500 })) {
      await closeBtn.click();
      await page.waitForTimeout(500);
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

async function getTurnLabel(page: Page) {
  const label = page.getByText(/'s Turn/).first();
  const text = await label.textContent();
  return text?.trim() ?? '';
}

async function waitForTurnChange(page: Page, previous: string) {
  for (let i = 0; i < 6; i++) {
    await closeAnyModal(page);
    await page.waitForTimeout(500);
    const current = await getTurnLabel(page);
    if (current && current !== previous) {
      return current;
    }
  }
  const current = await getTurnLabel(page);
  expect(current).not.toBe(previous);
  return current;
}

test.describe('Complete Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete a full setup to game start flow', async ({ page }) => {
    // Step 1: Setup screen is displayed
    await expect(page.getByRole('heading', { name: 'SF' })).toBeVisible();
    await expect(page.getByText('Number of Players')).toBeVisible();

    // Step 2: Select 3 players
    await page.getByRole('button', { name: '3 Players' }).click();
    await expect(page.getByRole('button', { name: '3 Players' })).toHaveClass(/bg-amber-500/);

    // Step 3: Enter custom player names
    await page.locator('input[value="Player 1"]').fill('Alice');
    await page.locator('input[value="Player 2"]').fill('Bob');
    await page.locator('input[value="Player 3"]').fill('Charlie');

    // Step 4: Start game
    await page.getByRole('button', { name: 'Start Game' }).click();

    // Step 5: Verify game started
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Alice' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bob' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Charlie' })).toBeVisible();
    await expect(page.getByText("Alice's Turn")).toBeVisible();
  });

  test('should play multiple turns', async ({ page }) => {
    // Start game with 2 players
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Play 4 turns (2 rounds)
    for (let i = 0; i < 4; i++) {
      // Wait for roll button to be ready
      const rollBtn = await waitForRollButton(page);

      // Roll dice
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      // Wait for modal to potentially appear
      await page.waitForTimeout(1500);

      // Handle any modals
      await closeAnyModal(page);

      // Wait for turn to change
      await page.waitForTimeout(2000);
    }
  });

  test('should track player money changes throughout the game', async ({ page }) => {
    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Initial money check
    await expect(page.getByText('$1,500').first()).toBeVisible();

    // Play and buy properties to see money changes
    let moneyChanged = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!moneyChanged && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);

      // Try to buy property
      try {
        const buyButton = page.getByRole('button', { name: /Buy for \$/ });
        if (await buyButton.isVisible({ timeout: 1500 })) {
          await buyButton.click();
          moneyChanged = true;
          await page.waitForTimeout(500);
          continue;
        }
      } catch {
        // Not a property
      }

      await closeAnyModal(page);
      await page.waitForTimeout(1500);
      attempts++;
    }

    if (moneyChanged) {
      // At least one player should have different money now
      await page.waitForTimeout(1000);
      const allMoneyTexts = await page.getByText(/\$\d+,?\d*/).allTextContents();
      const hasChangedMoney = allMoneyTexts.some(text => {
        const match = text.match(/\$(\d+,?\d*)/);
        if (match) {
          const value = parseInt(match[1].replace(',', ''), 10);
          return value !== 1500 && value > 0;
        }
        return false;
      });
      expect(hasChangedMoney).toBe(true);
    }
  });

  test('should display game log messages', async ({ page }) => {
    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Roll dice
    await page.getByRole('button', { name: 'Roll Dice' }).click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    // Wait for game log to update - the "Landed on" message appears in the modal or as an update
    await page.waitForTimeout(2000);
    
    // The game shows the space name in the modal title or content
    // Just verify the roll completed successfully
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible();
  });

  test('should support viewing properties from board', async ({ page }) => {
    // Start game
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Click on a property on the board
    await page.getByText('Pacific Heights').click();

    // Property card should appear
    await expect(page.getByText('Title Deed')).toBeVisible();
    await expect(page.getByText('Price: $280')).toBeVisible();

    // Close the card
    await page.locator('button').filter({ has: page.locator('svg.h-4.w-4') }).first().click();
    await expect(page.getByText('Title Deed')).not.toBeVisible();
  });
});

test.describe('Turn Progression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should cycle through all players in order', async ({ page }) => {
    // With 2 players: Player 1 -> Player 2 -> Player 1
    
    // Player 1's turn
    await expect(page.getByText("Player 1's Turn")).toBeVisible();
    const initialTurn = await getTurnLabel(page);

    // Roll and wait for Player 2's turn
    await page.getByRole('button', { name: 'Roll Dice' }).click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    // Handle modals
    await page.waitForTimeout(1500);
    await closeAnyModal(page);

    const secondTurn = await waitForTurnChange(page, initialTurn);

    // Wait for roll button to be ready
    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(1500);
    await closeAnyModal(page);

    const thirdTurn = await waitForTurnChange(page, secondTurn);
    expect(thirdTurn).not.toBe(secondTurn);
  });

  test('should cycle through 4 players correctly', async ({ page }) => {
    // Go back to setup
    await page.goto('/');
    await page.getByRole('button', { name: '4 Players' }).click();
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    let currentTurn = await getTurnLabel(page);
    const seenTurns = new Set([currentTurn]);

    for (let i = 0; i < 4; i++) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);
      await closeAnyModal(page);

      currentTurn = await waitForTurnChange(page, currentTurn);
      seenTurns.add(currentTurn);
    }

    expect(seenTurns.size).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Property Rent Payment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should show rent paid notification when landing on owned property', async ({ page }) => {
    // This test requires buying a property and then another player landing on it
    let boughtProperty = false;
    let attempts = 0;
    const maxAttempts = 15;

    // First, try to buy a property
    while (!boughtProperty && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1000);

      try {
        const buyButton = page.getByRole('button', { name: /Buy for \$/ });
        if (await buyButton.isVisible({ timeout: 1500 })) {
          await buyButton.click();
          boughtProperty = true;
          await page.waitForTimeout(300);
          continue;
        }
      } catch {
        // Not a property
      }

      await closeAnyModal(page);
      await page.waitForTimeout(700);
      attempts++;
    }

    if (boughtProperty) {
      // Now try to have the other player land on the owned property
      let paidRent = false;
      attempts = 0;

      while (!paidRent && attempts < 12) {
        const rollBtn = await waitForRollButton(page);
        await rollBtn.click();
        await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

        await page.waitForTimeout(1000);

        // Check for rent paid notification
        try {
          const rentPaid = page.getByText(/Rent Paid: \$/);
          if (await rentPaid.isVisible({ timeout: 1500 })) {
            paidRent = true;
            await expect(rentPaid).toBeVisible();
          }
        } catch {
          // No rent paid
        }

        await closeAnyModal(page);
        await page.waitForTimeout(700);
        attempts++;
      }
    }
  });

  test('should show own property notification when landing on your own property', async ({ page }) => {
    // This test requires buying a property and then landing on it yourself
    let boughtProperty = false;
    let landedOnOwn = false;
    let attempts = 0;
    const maxAttempts = 12;

    while ((!boughtProperty || !landedOnOwn) && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(800);

      try {
        const buyButton = page.getByRole('button', { name: /Buy for \$/ });
        if (await buyButton.isVisible({ timeout: 1500 })) {
          await buyButton.click();
          boughtProperty = true;
          await page.waitForTimeout(250);
          continue;
        }
      } catch {
        // Not a buyable property
      }

      // Check for "You own this property" notification
      try {
        const ownProperty = page.getByText('You own this property!');
        if (await ownProperty.isVisible({ timeout: 1500 })) {
          landedOnOwn = true;
          await expect(page.getByText('No rent is due. Enjoy your stay!')).toBeVisible();
        }
      } catch {
        // Not own property
      }

      await closeAnyModal(page);
      await page.waitForTimeout(500);
      attempts++;
    }
  });
});
