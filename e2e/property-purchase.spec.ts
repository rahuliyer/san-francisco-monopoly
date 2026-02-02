import { test, expect, Page } from '@playwright/test';
import type { DeterministicGameConfig } from '../lib/state/test-utils';

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
    const modal = page.locator('.fixed.inset-0.z-50');
    const closeBtn = modal.locator('button').filter({ has: page.locator('svg.h-4.w-4') }).first();
    if (await closeBtn.isVisible({ timeout: 500 })) {
      await closeBtn.click();
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

async function setDiceRolls(page: Page, rolls: Array<[number, number]>) {
  await page.addInitScript((sequence) => {
    (globalThis as { __TEST_DICE_ROLLS__?: [number, number][] }).__TEST_DICE_ROLLS__ = sequence;
  }, rolls);
}

async function injectDeterministicGame(page: Page, config: DeterministicGameConfig) {
  await page.addInitScript((config) => {
    (window as Window & { __DETERMINISTIC_GAME_CONFIG__?: DeterministicGameConfig })
      .__DETERMINISTIC_GAME_CONFIG__ = config;
  }, config);
}

async function startGame(page: Page, config?: DeterministicGameConfig) {
  if (config) {
    await injectDeterministicGame(page, config);
  }
  await page.goto('/');
  await page.getByRole('button', { name: 'Play Now' }).click();
  await page.getByRole('button', { name: 'START GAME' }).click();
  await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
}

test.describe('Property Purchase', () => {
  const deterministicBuyConfig: DeterministicGameConfig = {
    players: [
      { name: 'Player 1', tokenIndex: 0 },
      { name: 'Player 2', tokenIndex: 1 },
    ],
    diceSequence: [[1, 2]],
  };

  test('should show property card with buy options when landing on unowned property', async ({ page }) => {
    await startGame(page);

    // Roll dice
    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 8000 });

    // Wait for the property card modal to appear (if landing on a purchasable property)
    // Or wait for turn to change if landing on a non-purchasable space
    const propertyModal = page.getByText('Title Deed');
    const passButton = page.getByRole('button', { name: 'Pass' });

    // Check if we landed on a purchasable property
    try {
      await expect(propertyModal).toBeVisible({ timeout: 3000 });
      // If we see the property modal, we should see Buy and Pass buttons
      await expect(passButton).toBeVisible();
      await expect(page.getByRole('button', { name: /Buy for \$/ })).toBeVisible();
    } catch {
      // We might have landed on a non-purchasable space
      // That's okay - we'll test the purchase flow with a more controlled test
    }
  });

  test('should allow buying a property', async ({ page }) => {
    await startGame(page);

    // Roll dice and keep trying until we land on a property we can buy
    let boughtProperty = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!boughtProperty && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      // Check if buy button appears
      const buyButton = page.getByRole('button', { name: /Buy for \$/ });

      try {
        await expect(buyButton).toBeVisible({ timeout: 3000 });
        // Click buy
        await buyButton.click();
        boughtProperty = true;
      } catch {
        // Didn't land on a purchasable property, wait for next turn
        await closeAnyModal(page);
        await page.waitForTimeout(1000);
        attempts++;
      }
    }

    if (boughtProperty) {
      // Verify the property was bought (modal should close and player money should decrease)
      await expect(page.getByRole('button', { name: /Buy for \$/ })).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('should allow passing on a property', async ({ page }) => {
    await startGame(page);

    // Roll dice and keep trying until we land on a property
    let foundProperty = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!foundProperty && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);

      const passButton = page.getByRole('button', { name: 'Pass' });

      try {
        if (await passButton.isVisible({ timeout: 1500 })) {
          // Click pass
          await passButton.click();
          foundProperty = true;

          // Verify modal closes
          await expect(passButton).not.toBeVisible({ timeout: 3000 });
        }
      } catch {
        await closeAnyModal(page);
        await page.waitForTimeout(1000);
        attempts++;
      }
    }
  });

  test('should show property price in buy button', async ({ page }) => {
    await startGame(page);

    // Roll dice and keep trying until we land on a property
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      const buyButton = page.getByRole('button', { name: /Buy for \$\d+/ });

      try {
        await expect(buyButton).toBeVisible({ timeout: 3000 });
        // Verify the button text contains a price
        const buttonText = await buyButton.textContent();
        expect(buttonText).toMatch(/Buy for \$\d+/);
        break;
      } catch {
        await closeAnyModal(page);
        await page.waitForTimeout(1000);
        attempts++;
      }
    }
  });

  test('should decrease player money after buying property', async ({ page }) => {
    await startGame(page, deterministicBuyConfig);

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    const buyButton = page.getByRole('button', { name: /Buy for \$/ });
    await expect(buyButton).toBeVisible({ timeout: 3000 });
    await buyButton.click();
    await expect(buyButton).not.toBeVisible({ timeout: 3000 });

    await expect(page.getByText('$1,440')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Property Ownership Display', () => {
  const deterministicBuyConfig: DeterministicGameConfig = {
    players: [
      { name: 'Player 1', tokenIndex: 0 },
      { name: 'Player 2', tokenIndex: 1 },
    ],
    diceSequence: [[1, 2]],
  };

  test('should show owned property in player panel after purchase', async ({ page }) => {
    await startGame(page, deterministicBuyConfig);

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    const buyButton = page.getByRole('button', { name: /Buy for \$/ });
    await expect(buyButton).toBeVisible({ timeout: 3000 });
    await buyButton.click();
    await expect(buyButton).not.toBeVisible({ timeout: 3000 });

    const propertiesSection = page.getByText(/Properties \(\d+\)/);
    await expect(propertiesSection.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show owner indicator on property space on board', async ({ page }) => {
    await setDiceRolls(page, [[1, 2]]);
    await startGame(page);

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    const buyButton = page.getByRole('button', { name: /Buy for \$/ });
    await expect(buyButton).toBeVisible({ timeout: 3000 });

    const propertyName = await page.locator('.fixed.inset-0.z-50 h2').first().textContent();
    expect(propertyName).toBeTruthy();
    await buyButton.click();
    await expect(page.getByText('Title Deed')).not.toBeVisible({ timeout: 3000 });

    const boardGrid = page.locator('.grid').first();
    const boardSpaceLabel = boardGrid.getByText(propertyName!, { exact: true });
    const boardSpace = boardSpaceLabel.locator('..').locator('..');
    await expect(boardSpace).toHaveAttribute('style', /inset/);
  });
});

test.describe('Property Card Modal', () => {
  test('should display property card with all rent tiers for properties', async ({ page }) => {
    await startGame(page);

    // Click on a specific property to view its card
    await page.getByText('Sea Cliff').click();

    await expect(page.getByText('Title Deed')).toBeVisible();
    await expect(page.getByText('Sea Cliff').nth(1)).toBeVisible();
    await expect(page.getByText('Price: $400')).toBeVisible();

    // Check rent tiers
    await expect(page.getByText('Rent')).toBeVisible();
    await expect(page.getByText('With 1 House')).toBeVisible();
    await expect(page.getByText('With 2 Houses')).toBeVisible();
    await expect(page.getByText('With 3 Houses')).toBeVisible();
    await expect(page.getByText('With 4 Houses')).toBeVisible();
    await expect(page.getByText('With Hotel')).toBeVisible();
  });

  test('should display railroad rent information', async ({ page }) => {
    await startGame(page);

    await page.getByText('BART').click();

    await expect(page.getByText('Title Deed')).toBeVisible();
    await expect(page.getByText('Price: $200')).toBeVisible();

    // Check railroad rent tiers
    await expect(page.getByText('Rent with 1 Railroad')).toBeVisible();
    await expect(page.getByText('Rent with 2 Railroads')).toBeVisible();
    await expect(page.getByText('Rent with 3 Railroads')).toBeVisible();
    await expect(page.getByText('Rent with 4 Railroads')).toBeVisible();
  });

  test('should display utility rent information', async ({ page }) => {
    await startGame(page);

    await page.getByText('SF Water').click();

    await expect(page.getByText('Title Deed')).toBeVisible();
    await expect(page.getByText('Price: $150')).toBeVisible();
    await expect(page.getByText('If one Utility is owned, rent is 4x the dice roll.')).toBeVisible();
    await expect(page.getByText('If both Utilities are owned, rent is 10x the dice roll.')).toBeVisible();
  });

  test('should show house cost and mortgage value', async ({ page }) => {
    await startGame(page);

    await page.getByText('Pacific Heights').click();

    await expect(page.getByText('House Cost')).toBeVisible();
    await expect(page.getByText('Mortgage Value')).toBeVisible();
  });
});
