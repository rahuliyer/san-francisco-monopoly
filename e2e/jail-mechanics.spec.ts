import { test, expect, Page } from '@playwright/test';

async function setDiceRolls(page: Page, rolls: Array<[number, number]>) {
  await page.addInitScript((sequence) => {
    (globalThis as { __TEST_DICE_ROLLS__?: [number, number][] }).__TEST_DICE_ROLLS__ = sequence;
  }, rolls);
}

// Helper function to close any open modals
async function closeAnyModal(page: Page) {
  // Try to close property modal (Pass button)
  try {
    const passBtn = page.getByRole('button', { name: 'Pass' });
    if (await passBtn.isVisible({ timeout: 300 })) {
      await passBtn.click();
      return;
    }
  } catch { /* No modal */ }

  // Try to close special space modal (Continue button)
  try {
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    if (await continueBtn.isVisible({ timeout: 300 })) {
      await continueBtn.click();
      return;
    }
  } catch { /* No modal */ }
}

// Helper function to wait for roll button and handle any blocking modals
async function waitForRollButton(page: Page) {
  // First close any modals that might be open
  await closeAnyModal(page);
  
  // Now wait for the roll button to be enabled
  const rollDice = page.getByRole('button', { name: 'Roll Dice' });
  const rollForDoubles = page.getByRole('button', { name: 'Roll for Doubles' });
  
  // Wait for either button to be enabled
  await expect(rollDice.or(rollForDoubles)).toBeEnabled({ timeout: 15000 });
  
  // Return which button is available
  if (await rollForDoubles.isVisible().catch(() => false)) {
    return rollForDoubles;
  }
  return rollDice;
}

test.describe('Jail Mechanics', () => {
  test('should show Go To Jail modal elements', async ({ page }) => {
    // Use 3 consecutive doubles to send player to jail
    await setDiceRolls(page, [[3, 3], [3, 3], [3, 3]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Roll dice - 3 doubles sends player to jail
    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();

    // Check for Go To Jail modal
    const gtjLabel = page.getByText('Go To Jail');
    await expect(gtjLabel).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Sent to Alcatraz')).toBeVisible();

    // Verify modal has lock emoji
    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal.getByText('🔒', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Continue' }).click();
  });

  test('should display jail status in player panel when in jail', async ({ page }) => {
    // Use 3 consecutive doubles to send player to jail
    await setDiceRolls(page, [[3, 3], [3, 3], [3, 3]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Roll dice - 3 doubles sends player to jail
    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();

    // Wait for Go To Jail modal then close it
    await expect(page.getByText('Go To Jail')).toBeVisible({ timeout: 5000 });
    await closeAnyModal(page);

    // Check if player is in jail
    const jailStatus = page.getByText(/In Alcatraz \(\d+ turns? left\)/);
    await expect(jailStatus.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show jail controls when player is in jail', async ({ page }) => {
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
    await expect(page.getByRole('button', { name: 'Pay $50 to Leave' })).toBeVisible();
    await expect(page.getByText('In Alcatraz', { exact: true })).toBeVisible();
  });

  test('should allow paying $50 to leave jail', async ({ page }) => {
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
    const payToLeave = page.getByRole('button', { name: 'Pay $50 to Leave' });
    await expect(payToLeave).toBeVisible({ timeout: 10000 });

    // Click Pay $50 to Leave
    await payToLeave.click();

    // Jail status should be cleared
    await expect(page.getByText('🔒 In Alcatraz')).not.toBeVisible({ timeout: 3000 });

    // Normal roll button should appear
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible();
  });

  test('should show turn count while in jail', async ({ page }) => {
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
    // Should show turn count
    await expect(page.getByText(/Turn \d+ of 3/)).toBeVisible();
  });

  test('should show roll result when rolling for doubles in jail', async ({ page }) => {
    // Use 3 consecutive doubles to send player to jail, then non-double for player 2, then non-double for jail roll
    await setDiceRolls(page, [[3, 3], [3, 3], [3, 3], [1, 2], [1, 2]]);

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

    // Roll for doubles
    await rollForDoubles.click();

    // Wait for roll to complete
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    // Should show "still in Alcatraz" message (since we rolled non-double [1,2])
    await expect(page.getByText('No doubles - still in Alcatraz')).toBeVisible({ timeout: 5000 });
  });
});
