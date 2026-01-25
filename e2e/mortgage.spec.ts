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

async function buyPropertyForCurrentPlayer(page: Page): Promise<string> {
  const maxAttempts = 15;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const rollBtn = await waitForRollButton(page);
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

        return propertyName as string;
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
  await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

  await page.waitForTimeout(1500);
  await closeAnyModal(page);
}

test.describe('Property Mortgage Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should mortgage and unmortgage an owned property', async ({ page }) => {
    const propertyName = await buyPropertyForCurrentPlayer(page);

    // Wait for turn to advance to Player 2, then back to Player 1
    await expect(page.getByText("Player 2's Turn")).toBeVisible({ timeout: 15000 });
    await resolveSingleTurn(page);
    await expect(page.getByText("Player 1's Turn")).toBeVisible({ timeout: 15000 });

    // Open Player 1 properties modal
    await page.getByRole('button', { name: /Properties \(\d+\)/ }).first().click();
    const propertiesModal = page.locator('.fixed.inset-0.z-50').filter({ hasText: "Player 1's Properties" });
    await expect(propertiesModal).toBeVisible({ timeout: 5000 });

    // Open the purchased property card from the modal
    await propertiesModal
      .getByRole('button', { name: new RegExp(escapeRegExp(propertyName)) })
      .click();

    // Mortgage the property
    const mortgageButton = page.getByRole('button', { name: /Mortgage for \$/ });
    await expect(mortgageButton).toBeVisible({ timeout: 5000 });
    await mortgageButton.click();

    await expect(page.getByText('Mortgaged to the bank')).toBeVisible({ timeout: 3000 });
    const liftMortgageButton = page.getByRole('button', { name: /Lift Mortgage for \$/ });
    await expect(liftMortgageButton).toBeVisible({ timeout: 3000 });

    // Lift the mortgage
    await liftMortgageButton.click();
    await expect(page.getByText('Mortgaged to the bank')).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: /Mortgage for \$/ })).toBeVisible({ timeout: 3000 });
  });
});
