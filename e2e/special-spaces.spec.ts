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
    if (await passBtn.isVisible({ timeout: 500 })) {
      await passBtn.click();
      await page.waitForTimeout(500);
      return;
    }
  } catch { /* No modal */ }

  // Try to close special space modal (Continue button)
  try {
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    if (await continueBtn.isVisible({ timeout: 500 })) {
      await continueBtn.click();
      await page.waitForTimeout(500);
      return;
    }
  } catch { /* No modal */ }
}

// Helper function to wait for roll button and handle any blocking modals
async function waitForRollButton(page: Page) {
  // First close any modals that might be open
  await closeAnyModal(page);
  
  // Now wait for the roll button to be enabled
  // Also check for jail controls (Roll for Doubles)
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

test.describe('Special Spaces - Visual Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should display GO space (Fisherman\'s Wharf)', async ({ page }) => {
    await expect(page.getByText("Fisherman's Wharf")).toBeVisible();
  });

  test('should display Jail space (Alcatraz)', async ({ page }) => {
    // There are two instances: "Alcatraz" and "Go To Alcatraz"
    await expect(page.getByText('Alcatraz').first()).toBeVisible();
  });

  test('should display Free Parking space (Golden Gate Park)', async ({ page }) => {
    await expect(page.getByText('Golden Gate Park')).toBeVisible();
  });

  test('should display Go To Jail space', async ({ page }) => {
    await expect(page.getByText('Go To Alcatraz')).toBeVisible();
  });

  test('should display Income Tax space', async ({ page }) => {
    await expect(page.getByText('Income Tax')).toBeVisible();
  });

  test('should display Luxury Tax space', async ({ page }) => {
    await expect(page.getByText('Luxury Tax')).toBeVisible();
  });

  test('should display Chance spaces', async ({ page }) => {
    const chanceSpaces = page.getByText('Chance', { exact: true });
    const count = await chanceSpaces.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display Community Chest spaces', async ({ page }) => {
    const communityChestSpaces = page.getByText('Community Chest');
    const count = await communityChestSpaces.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Special Space Cards', () => {
  test('should show Continue button when landing on special spaces', async ({ page }) => {
    // Roll [1, 3] = 4 to land on Income Tax (position 4)
    await setDiceRolls(page, [[1, 3]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(1200);

    // Income Tax shows Continue button
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeVisible({ timeout: 3000 });
    await continueBtn.click();
    await page.waitForTimeout(300);
  });

  test('should close special space modal with Continue button', async ({ page }) => {
    // Roll [1, 3] = 4 to land on Income Tax (position 4)
    await setDiceRolls(page, [[1, 3]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(1200);

    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeVisible({ timeout: 3000 });
    await continueBtn.click();
    // Modal should close
    await expect(continueBtn).not.toBeVisible({ timeout: 2000 });
  });
});

test.describe('Tax Spaces', () => {
  test('should display tax amount when landing on tax space', async ({ page }) => {
    // Roll [1, 3] = 4 to land on Income Tax (position 4)
    await setDiceRolls(page, [[1, 3]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(1200);

    // Check for Tax modal
    const amountPaid = page.getByText('Amount paid');
    await expect(amountPaid).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: 'Continue' }).click();
  });
});

test.describe('Go Space', () => {
  test('should display +$200 on GO modal', async ({ page }) => {
    // Roll sequence to reach position 40 (GO): P1 rolls [6,5]=11, P2 rolls, P1 rolls [6,5]=11, etc.
    // Position: 0 -> 11 -> 22 -> 33 -> 40 (GO)
    await setDiceRolls(page, [[6, 5], [1, 2], [6, 5], [1, 2], [6, 5], [1, 2], [4, 3]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // P1 rolls [6,5] = 11, position 11
    let rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1200);
    await closeAnyModal(page);
    await page.waitForTimeout(300);

    // P2 rolls [1,2] = 3
    rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1200);
    await closeAnyModal(page);
    await page.waitForTimeout(300);

    // P1 rolls [6,5] = 11, position 22
    rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1200);
    await closeAnyModal(page);
    await page.waitForTimeout(300);

    // P2 rolls [1,2] = 3
    rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1200);
    await closeAnyModal(page);
    await page.waitForTimeout(300);

    // P1 rolls [6,5] = 11, position 33
    rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1200);
    await closeAnyModal(page);
    await page.waitForTimeout(300);

    // P2 rolls [1,2] = 3
    rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1200);
    await closeAnyModal(page);
    await page.waitForTimeout(300);

    // P1 rolls [4,3] = 7, position 40 = GO
    rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1200);

    // Check for GO modal
    const goLabel = page.getByText('GO!');
    await expect(goLabel).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('+$200')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
  });
});

test.describe('Free Parking', () => {
  test('should show Free Parking message', async ({ page }) => {
    // Roll sequence to reach position 20 (Free Parking): P1 rolls [6,5]=11, P2 rolls, P1 rolls [4,5]=9
    // Position: 0 -> 11 -> 20 (Free Parking)
    await setDiceRolls(page, [[6, 5], [1, 2], [4, 5]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // P1 rolls [6,5] = 11, position 11
    let rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1200);
    await closeAnyModal(page);
    await page.waitForTimeout(300);

    // P2 rolls [1,2] = 3
    rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1200);
    await closeAnyModal(page);
    await page.waitForTimeout(300);

    // P1 rolls [4,5] = 9, position 20 (Free Parking)
    rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1200);

    // Check for Free Parking modal
    const fpMessage = page.getByText('Take a break and enjoy the view of Golden Gate Park!');
    await expect(fpMessage).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: 'Continue' }).click();
  });
});

test.describe('Just Visiting Jail', () => {
  test('should show Just Visiting message', async ({ page }) => {
    // Roll [4, 6] = 10 to land on Just Visiting Jail (position 10)
    await setDiceRolls(page, [[4, 6]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(1200);

    // Check for Just Visiting modal
    const jvLabel = page.getByText('Just Visiting');
    await expect(jvLabel).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("You're just visiting. No penalty!")).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
  });
});
