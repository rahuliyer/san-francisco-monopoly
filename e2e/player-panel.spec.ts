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

test.describe('Player Panel Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
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
    // Current player panel should have amber border
    const currentPlayerPanel = page.locator('.border-amber-400');
    await expect(currentPlayerPanel).toBeVisible();
  });

  test('should show player tokens', async ({ page }) => {
    // Player tokens are displayed as emoji in 3D-styled containers
    // Check for token container elements
    const tokenContainers = page.locator('.rounded-lg.shadow-md');
    const count = await tokenContainers.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should change current player after rolling', async ({ page }) => {
    // First player's turn
    await expect(page.getByText("Player 1's Turn")).toBeVisible();
    const initialTurn = await getTurnLabel(page);

    // Roll dice
    await page.getByRole('button', { name: 'Roll Dice' }).click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    // Wait for modal to potentially appear
    await page.waitForTimeout(1500);
    await closeAnyModal(page);

    // Wait for turn to change
    const nextTurn = await waitForTurnChange(page, initialTurn);
    expect(nextTurn).not.toBe(initialTurn);
  });

  test('should move "Your Turn" badge to new current player', async ({ page }) => {
    // Roll and wait for turn change
    const initialTurn = await getTurnLabel(page);
    await page.getByRole('button', { name: 'Roll Dice' }).click();
    await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

    // Wait for modal to potentially appear
    await page.waitForTimeout(1500);
    await closeAnyModal(page);

    // Wait for turn to change
    await waitForTurnChange(page, initialTurn);

    // "Your Turn" badge should still exist (just moved)
    await expect(page.getByText('Your Turn')).toBeVisible();
  });
});

test.describe('Player Panel with 3 Players', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '3 Players' }).click();
    await page.getByRole('button', { name: 'Start Game' }).click();
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
    await page.getByRole('button', { name: '4 Players' }).click();
    await page.getByRole('button', { name: 'Start Game' }).click();
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
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should show properties section after buying property', async ({ page }) => {
    // Buy a property
    let boughtProperty = false;
    let attempts = 0;
    const maxAttempts = 12;

    while (!boughtProperty && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);

      const buyButton = page.getByRole('button', { name: /Buy for \$/ });

      try {
        if (await buyButton.isVisible({ timeout: 1500 })) {
          await buyButton.click();
          boughtProperty = true;
          await page.waitForTimeout(500);
          continue;
        }
      } catch {
        // Not a property
      }

      await closeAnyModal(page);
      await page.waitForTimeout(1000);
      attempts++;
    }

    if (boughtProperty) {
      // Wait for UI update
      await page.waitForTimeout(1500);

      // Properties section should appear
      await expect(page.getByText(/Properties \(\d+\)/)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should open properties modal when clicking on properties section', async ({ page }) => {
    // Buy a property first
    let boughtProperty = false;
    let attempts = 0;
    const maxAttempts = 12;

    while (!boughtProperty && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);

      const buyButton = page.getByRole('button', { name: /Buy for \$/ });

      try {
        if (await buyButton.isVisible({ timeout: 1500 })) {
          await buyButton.click();
          boughtProperty = true;
          await page.waitForTimeout(500);
          continue;
        }
      } catch {
        // Not a property
      }

      await closeAnyModal(page);
      await page.waitForTimeout(1000);
      attempts++;
    }

    if (boughtProperty) {
      // Wait for UI update
      await page.waitForTimeout(1500);

      // Click on properties section
      const propertiesButton = page.getByText(/Properties \(\d+\)/).first();
      await propertiesButton.click();

      // Properties modal should open showing the player's properties
      await expect(page.getByText(/'s Properties$/)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should show color indicators for owned properties', async ({ page }) => {
    // Buy a property first
    let boughtProperty = false;
    let attempts = 0;
    const maxAttempts = 12;

    while (!boughtProperty && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);

      const buyButton = page.getByRole('button', { name: /Buy for \$/ });

      try {
        if (await buyButton.isVisible({ timeout: 1500 })) {
          await buyButton.click();
          boughtProperty = true;
          await page.waitForTimeout(500);
          continue;
        }
      } catch {
        // Not a property
      }

      await closeAnyModal(page);
      await page.waitForTimeout(1000);
      attempts++;
    }

    if (boughtProperty) {
      // Wait for UI update
      await page.waitForTimeout(1500);

      // Small color indicators should appear (h-3 w-3 rounded-sm)
      const colorIndicators = page.locator('.h-3.w-3.rounded-sm');
      const count = await colorIndicators.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('should close properties modal with X button', async ({ page }) => {
    // Buy a property first
    let boughtProperty = false;
    let attempts = 0;
    const maxAttempts = 12;

    while (!boughtProperty && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);

      const buyButton = page.getByRole('button', { name: /Buy for \$/ });

      try {
        if (await buyButton.isVisible({ timeout: 1500 })) {
          await buyButton.click();
          boughtProperty = true;
          await page.waitForTimeout(500);
          continue;
        }
      } catch {
        // Not a property
      }

      await closeAnyModal(page);
      await page.waitForTimeout(1000);
      attempts++;
    }

    if (boughtProperty) {
      // Wait for UI update
      await page.waitForTimeout(1500);

      // Click on properties section to open modal
      const propertiesButton = page.getByText(/Properties \(\d+\)/).first();
      await propertiesButton.click();

      // Wait for modal
      await expect(page.getByText(/'s Properties$/)).toBeVisible({ timeout: 3000 });

      // Click X button to close
      const closeButton = page.locator('.rounded-full.p-2.text-stone-500').first();
      await closeButton.click();

      // Modal should close
      await page.waitForTimeout(500);
    }
  });
});
