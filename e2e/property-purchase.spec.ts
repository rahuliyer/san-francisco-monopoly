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

test.describe('Property Purchase', () => {
  test('should show property card with buy options when landing on unowned property', async ({ page }) => {
    // Roll [1, 2] = 3 to land on Bayview (position 3)
    await setDiceRolls(page, [[1, 2]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 8000 });

    // Property modal should appear
    const propertyModal = page.getByText('Title Deed');
    const passButton = page.getByRole('button', { name: 'Pass' });

    await expect(propertyModal).toBeVisible({ timeout: 3000 });
    await expect(passButton).toBeVisible();
    await expect(page.getByRole('button', { name: /Buy for \$/ })).toBeVisible();
  });

  test('should allow buying a property', async ({ page }) => {
    // Roll [1, 2] = 3 to land on Bayview
    await setDiceRolls(page, [[1, 2]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    const buyButton = page.getByRole('button', { name: /Buy for \$/ });
    await expect(buyButton).toBeVisible({ timeout: 3000 });
    await buyButton.click();

    // Verify the property was bought (modal should close)
    await expect(buyButton).not.toBeVisible({ timeout: 3000 });
  });

  test('should allow passing on a property', async ({ page }) => {
    // Roll [1, 2] = 3 to land on Bayview
    await setDiceRolls(page, [[1, 2]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1500);

    const passButton = page.getByRole('button', { name: 'Pass' });
    await expect(passButton).toBeVisible({ timeout: 3000 });
    await passButton.click();

    // Verify modal closes
    await expect(passButton).not.toBeVisible({ timeout: 3000 });
  });

  test('should show property price in buy button', async ({ page }) => {
    // Roll [1, 2] = 3 to land on Bayview ($60)
    await setDiceRolls(page, [[1, 2]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    const buyButton = page.getByRole('button', { name: /Buy for \$\d+/ });
    await expect(buyButton).toBeVisible({ timeout: 3000 });
    // Verify the button text contains a price
    const buttonText = await buyButton.textContent();
    expect(buttonText).toMatch(/Buy for \$\d+/);
  });

  test('should decrease player money after buying property', async ({ page }) => {
    // Roll [1, 2] = 3 to land on Bayview ($60)
    await setDiceRolls(page, [[1, 2]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Get initial money
    const initialMoney = await page.getByText('$1,500').first().textContent();
    expect(initialMoney).toBe('$1,500');

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    const buyButton = page.getByRole('button', { name: /Buy for \$/ });
    await expect(buyButton).toBeVisible({ timeout: 3000 });
    await buyButton.click();

    // Wait for modal to close
    await expect(buyButton).not.toBeVisible({ timeout: 3000 });

    // Player 1 bought Bayview for $60, should now have $1,440
    await expect(page.getByText('$1,440')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Property Ownership Display', () => {
  test('should show owned property in player panel after purchase', async ({ page }) => {
    // Roll [1, 2] = 3 to land on Bayview
    await setDiceRolls(page, [[1, 2]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    const buyButton = page.getByRole('button', { name: /Buy for \$/ });
    await expect(buyButton).toBeVisible({ timeout: 3000 });
    await buyButton.click();
    await page.waitForTimeout(500);

    // Check that Properties section appears in player panel
    const propertiesSection = page.getByText(/Properties \(\d+\)/);
    await expect(propertiesSection.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show owner indicator on property space on board', async ({ page }) => {
    await setDiceRolls(page, [[1, 2]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

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
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should display property card with all rent tiers for properties', async ({ page }) => {
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
    await page.getByText('SF Water').click();

    await expect(page.getByText('Title Deed')).toBeVisible();
    await expect(page.getByText('Price: $150')).toBeVisible();
    await expect(page.getByText('If one Utility is owned, rent is 4x the dice roll.')).toBeVisible();
    await expect(page.getByText('If both Utilities are owned, rent is 10x the dice roll.')).toBeVisible();
  });

  test('should show house cost and mortgage value', async ({ page }) => {
    await page.getByText('Pacific Heights').click();

    await expect(page.getByText('House Cost')).toBeVisible();
    await expect(page.getByText('Mortgage Value')).toBeVisible();
  });
});
