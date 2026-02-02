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

test.describe('Player Panel Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should display player panels for all players', async ({ page }) => {
    // With 2 players, should see 2 player panels
    await expect(page.getByRole('heading', { name: 'Player 1' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Player 2' })).toBeVisible();
  });

  test('should show player names', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Player 1' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Player 2' })).toBeVisible();
  });

  test('should show player money amounts', async ({ page }) => {
    // Both players start with $1,500
    const moneyDisplays = page.getByText('$1,500');
    await expect(moneyDisplays.first()).toBeVisible();
    await expect(moneyDisplays.nth(1)).toBeVisible();
  });

  test('should highlight current player with "Your Turn" badge', async ({ page }) => {
    // First player should have "Your Turn" badge
    await expect(page.getByText('Your Turn')).toBeVisible();
  });

  test('should highlight current player panel with amber border', async ({ page }) => {
    // Current player panel should have Art Deco golden border with ring-2 highlight
    const currentPlayerPanel = page.locator('.ring-2').first();
    await expect(currentPlayerPanel).toBeVisible();
  });

  test('should show player tokens', async ({ page }) => {
    // Player tokens are displayed as emoji in 3D-styled containers
    // Check for token container elements
    const tokenContainers = page.locator('.rounded-lg.shadow-md');
    const count = await tokenContainers.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should allow turn to advance after rolling', async ({ page }) => {
    await setDiceRolls(page, [[1, 1]]);
    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // First player's turn
    await expect(page.getByText("Player 1's Turn")).toBeVisible();

    // Roll dice
    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    // Wait for modal to potentially appear
    await page.waitForTimeout(1500);
    await closeAnyModal(page);

    // Wait for turn to change
    const nextRoll = await waitForRollButton(page);
    await expect(nextRoll).toBeEnabled();
  });

  test('should keep "Your Turn" badge visible after rolling', async ({ page }) => {
    await setDiceRolls(page, [[1, 1]]);
    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Roll and wait for turn change
    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    // Wait for modal to potentially appear
    await page.waitForTimeout(1500);
    await closeAnyModal(page);

    // Wait for turn to change
    const nextRoll = await waitForRollButton(page);
    await expect(nextRoll).toBeEnabled();

    // "Your Turn" badge should still exist
    await expect(page.getByText('Your Turn')).toBeVisible();
  });
});

test.describe('Player Panel with 3 Players', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: '3 Players' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should display 3 player panels', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Player 1' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Player 2' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Player 3' })).toBeVisible();
  });

  test('should show $1,500 for all 3 players', async ({ page }) => {
    const moneyDisplays = page.getByText('$1,500');
    await expect(moneyDisplays).toHaveCount(3);
  });
});

test.describe('Player Panel with 4 Players', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: '4 Players' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should display 4 player panels', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Player 1' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Player 2' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Player 3' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Player 4' })).toBeVisible();
  });

  test('should show $1,500 for all 4 players', async ({ page }) => {
    const moneyDisplays = page.getByText('$1,500');
    await expect(moneyDisplays).toHaveCount(4);
  });
});

test.describe('Player Properties Display', () => {
  test('should show properties section after buying property', async ({ page }) => {
    // Roll [1, 2] = 3 to land on Bayview (position 3, brown property)
    await setDiceRolls(page, [[1, 2]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Roll and buy the property
    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1500);

    const buyButton = page.getByRole('button', { name: /Buy for \$/ });
    await expect(buyButton).toBeVisible({ timeout: 3000 });
    await buyButton.click();
    await page.waitForTimeout(500);

    // Properties section should appear
    await expect(page.getByText(/Properties \(\d+\)/)).toBeVisible({ timeout: 5000 });
  });

  test('should open properties modal when clicking on properties section', async ({ page }) => {
    // Roll [1, 2] = 3 to land on Bayview
    await setDiceRolls(page, [[1, 2]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Roll and buy the property
    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1500);

    const buyButton = page.getByRole('button', { name: /Buy for \$/ });
    await expect(buyButton).toBeVisible({ timeout: 3000 });
    await buyButton.click();
    await page.waitForTimeout(500);

    // Click on properties section
    const propertiesButton = page.getByText(/Properties \(\d+\)/).first();
    await propertiesButton.click();

    // Properties modal should open showing the player's properties
    await expect(page.getByText(/'s Properties$/)).toBeVisible({ timeout: 3000 });
  });

  test('should show color indicators for owned properties', async ({ page }) => {
    // Roll [1, 2] = 3 to land on Bayview
    await setDiceRolls(page, [[1, 2]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Roll and buy the property
    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1500);

    const buyButton = page.getByRole('button', { name: /Buy for \$/ });
    await expect(buyButton).toBeVisible({ timeout: 3000 });
    await buyButton.click();
    await page.waitForTimeout(500);

    // Small color indicators should appear (h-3 w-3 rounded-sm)
    const colorIndicators = page.locator('.h-3.w-3.rounded-sm');
    const count = await colorIndicators.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should close properties modal with X button', async ({ page }) => {
    // Roll [1, 2] = 3 to land on Bayview
    await setDiceRolls(page, [[1, 2]]);

    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });

    // Roll and buy the property
    const rollBtn = await waitForRollButton(page);
    await rollBtn.click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1500);

    const buyButton = page.getByRole('button', { name: /Buy for \$/ });
    await expect(buyButton).toBeVisible({ timeout: 3000 });
    await buyButton.click();
    await page.waitForTimeout(500);

    // Click on properties section to open modal
    const propertiesButton = page.getByText(/Properties \(\d+\)/).first();
    await propertiesButton.click();

    // Wait for modal
    await expect(page.getByText(/'s Properties$/)).toBeVisible({ timeout: 3000 });

    // Click X button to close (Art Deco styled)
    const closeButton = page.locator('.rounded-full.p-2').first();
    await closeButton.click();

    // Modal should close
    await page.waitForTimeout(500);
    await expect(page.getByText(/'s Properties$/)).not.toBeVisible({ timeout: 3000 });
  });
});
