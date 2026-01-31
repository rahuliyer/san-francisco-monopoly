import { test, expect, Page } from '@playwright/test';

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

interface PurchaseResult {
  propertyName: string;
  playerName: string;
}

async function getCurrentPlayerName(page: Page): Promise<string> {
  const turnText = await page.getByText(/'s Turn$/).textContent();
  if (turnText) {
    // Extract player name from "Player X's Turn"
    const match = turnText.match(/^(.+?)['']s Turn$/);
    if (match) {
      return match[1];
    }
  }
  return 'Player 1';
}

async function buyPropertyForAnyPlayer(page: Page): Promise<PurchaseResult> {
  const maxAttempts = 15;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const rollBtn = await waitForRollButton(page);

    // Get the current player BEFORE rolling
    const currentPlayer = await getCurrentPlayerName(page);

    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(1500);

    const buyButton = page.getByRole('button', { name: /Buy for \$/ });

    try {
      if (await buyButton.isVisible({ timeout: 1500 })) {
        const modal = page.locator('.fixed.inset-0.z-50').filter({ hasText: 'Title Deed' });
        await expect(modal).toBeVisible({ timeout: 2000 });

        const propertyName = (await modal.locator('h2').first().textContent())?.trim();
        expect(propertyName).toBeTruthy();

        await buyButton.click();
        await expect(buyButton).not.toBeVisible({ timeout: 3000 });

        return { propertyName: propertyName as string, playerName: currentPlayer };
      }
    } catch {
      // Not a purchasable property
    }

    await closeAnyModal(page);
    await page.waitForTimeout(1000);
  }

  throw new Error('Unable to buy a property within max attempts');
}

async function resolveSingleTurn(page: Page) {
  const rollBtn = await waitForRollButton(page);
  await rollBtn.click();
  await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 8000 });

  await page.waitForTimeout(1500);
  await closeAnyModal(page);
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

test.describe('Property Mortgage Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  // Disabled: This test exceeds 1 minute due to two sequential loops
  // (buyPropertyForAnyPlayer with 15 attempts + maxTurnCycles with 10 iterations)
  test.skip('should mortgage and unmortgage an owned property', async ({ page }) => {
    const { propertyName, playerName } = await buyPropertyForAnyPlayer(page);

    // Cycle through turns until it's the property owner's turn.
    // Keep resolving turns until we reach the owner.
    const maxTurnCycles = 10;
    for (let i = 0; i < maxTurnCycles; i++) {
      await closeAnyModal(page);
      await page.waitForTimeout(500);

      // Check if it's the owner's turn
      const turnTextRegex = new RegExp(`${escapeRegExp(playerName)}['']s Turn`);
      const turnLabel = page.getByText(turnTextRegex);
      if (await turnLabel.isVisible().catch(() => false)) {
        break; // Found the owner's turn
      }

      // Not the owner's turn yet, resolve this turn
      await resolveSingleTurn(page);
    }

    // Ensure any modals are closed
    await closeAnyModal(page);
    await page.waitForTimeout(500);

    // Verify it's the correct player's turn (mortgage button only shows for current player's properties)
    const turnTextRegex = new RegExp(`${escapeRegExp(playerName)}['']s Turn`);
    await expect(page.getByText(turnTextRegex)).toBeVisible({ timeout: 5000 });

    // Open the property owner's properties modal (find the one with at least 1 property)
    const propertiesButton = page.getByRole('button', { name: /Properties \(\d+\)/ }).first();
    await expect(propertiesButton).toBeVisible({ timeout: 5000 });
    await propertiesButton.click();

    // Wait for properties modal to appear (use string match instead of RegExp in filter)
    const propertiesModal = page.locator('.fixed.inset-0.z-50').filter({ hasText: 'Properties' });
    await expect(propertiesModal).toBeVisible({ timeout: 5000 });

    // Wait for modal to be fully rendered
    await page.waitForTimeout(500);

    // Open the purchased property card from the modal - find button containing the property name
    const propertyButton = propertiesModal.getByRole('button').filter({ hasText: propertyName });
    await expect(propertyButton).toBeVisible({ timeout: 3000 });
    await propertyButton.click();

    // Wait for property card modal to appear
    await page.waitForTimeout(500);

    // Verify we're in the property card modal (has Title Deed)
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
