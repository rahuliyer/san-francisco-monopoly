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


test.describe('Property Mortgage Flow', () => {
  test('should mortgage and unmortgage an owned property', async ({ page }) => {
    // P1 rolls [1, 2] = 3 → Bayview (position 3, $60), P2 rolls [4, 6] = 10 → Just Visiting
    await setDiceRolls(page, [[1, 2], [4, 6]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Player 1 rolls and lands on Bayview
    let rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1500);

    // Buy the property
    const buyButton = page.getByRole('button', { name: /Buy for \$/ });
    await expect(buyButton).toBeVisible({ timeout: 3000 });
    await buyButton.click();
    await expect(buyButton).not.toBeVisible({ timeout: 3000 });

    // Player 2's turn
    rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1500);
    await closeAnyModal(page);
    await page.waitForTimeout(500);

    // Now it's Player 1's turn again
    await expect(page.getByText("Player 1's Turn")).toBeVisible({ timeout: 10000 });

    // Open Player 1's properties modal
    const propertiesButton = page.getByRole('button', { name: /Properties \(\d+\)/ }).first();
    await expect(propertiesButton).toBeVisible({ timeout: 5000 });
    await propertiesButton.click();

    // Wait for properties modal to appear
    const propertiesModal = page.locator('.fixed.inset-0.z-50').filter({ hasText: 'Properties' });
    await expect(propertiesModal).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Open the Bayview property card
    const propertyButton = propertiesModal.getByRole('button').filter({ hasText: 'Bayview' });
    await expect(propertyButton).toBeVisible({ timeout: 3000 });
    await propertyButton.click();
    await page.waitForTimeout(500);

    // Verify we're in the property card modal
    const propertyCardModal = page.locator('.fixed.inset-0.z-50').filter({ hasText: 'Title Deed' });
    await expect(propertyCardModal).toBeVisible({ timeout: 5000 });

    // Mortgage the property
    const mortgageButton = page.getByRole('button', { name: /Mortgage for \$/ });
    await expect(mortgageButton).toBeVisible({ timeout: 5000 });
    await mortgageButton.click();

    await expect(page.getByText('Mortgaged to the bank')).toBeVisible({ timeout: 5000 });
    const liftMortgageButton = page.getByRole('button', { name: /Lift Mortgage for \$/ });
    await expect(liftMortgageButton).toBeVisible({ timeout: 5000 });

    // Lift the mortgage
    await liftMortgageButton.click();
    await expect(page.getByText('Mortgaged to the bank')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Mortgage for \$/ })).toBeVisible({ timeout: 5000 });
  });
});
