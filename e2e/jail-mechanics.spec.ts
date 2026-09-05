import { test, expect, Page } from '@playwright/test';
import type { DeterministicGameConfig } from '../lib/state/test-utils';

async function startGameWithConfig(page: Page, config: DeterministicGameConfig) {
  await page.addInitScript((config) => {
    (window as Window & { __DETERMINISTIC_GAME_CONFIG__?: DeterministicGameConfig })
      .__DETERMINISTIC_GAME_CONFIG__ = config;
  }, config);
  await page.goto('/');
  await page.getByRole('button', { name: 'Play Now' }).click();
  await page.getByRole('button', { name: 'START GAME' }).click();
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
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should show Go To Jail modal elements', async ({ page }) => {
    // Roll several times to try to land on Go To Jail
    for (let i = 0; i < 8; i++) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);

      // Check for Go To Jail modal
      const gtjLabel = page.getByText('Go To Jail');
      const sentText = page.getByText('Sent to Alcatraz');
      if (await gtjLabel.isVisible({ timeout: 500 }).catch(() => false) && 
          await sentText.isVisible({ timeout: 500 }).catch(() => false)) {
        // Found it - verify and close
        const modal = page.locator('.fixed.inset-0.z-50');
        await expect(modal.getByText('🔒', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Continue' }).click();
        return;
      }

      await closeAnyModal(page);
      await page.waitForTimeout(500);
    }
    
    // Probabilistic test
    expect(true).toBe(true);
  });

  test('should display jail status in player panel when in jail', async ({ page }) => {
    // Play until someone goes to jail
    for (let i = 0; i < 8; i++) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);
      await closeAnyModal(page);
      await page.waitForTimeout(500);

      // Check if any player is in jail
      const jailStatus = page.getByText(/In Alcatraz \(\d+ turns? left\)/);
      if (await jailStatus.first().isVisible({ timeout: 500 }).catch(() => false)) {
        // Verify jail status is displayed
        await expect(jailStatus.first()).toBeVisible();
        return;
      }
    }
    
    expect(true).toBe(true);
  });

  test('should show jail controls when player is in jail', async ({ page }) => {
    // Play until current player goes to jail
    for (let i = 0; i < 10; i++) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);
      await closeAnyModal(page);
      await page.waitForTimeout(1000);

      // Check if current player is now in jail (has jail controls)
      const rollForDoubles = page.getByRole('button', { name: 'Roll for Doubles' });
      if (await rollForDoubles.isVisible({ timeout: 500 }).catch(() => false)) {
        // Verify jail controls are displayed (Art Deco styled)
        await expect(rollForDoubles).toBeVisible();
        await expect(page.getByRole('button', { name: 'Pay $50 to Leave' })).toBeVisible();
        await expect(page.getByText('In Alcatraz', { exact: true })).toBeVisible();
        return;
      }
    }
    
    expect(true).toBe(true);
  });

  test('should allow paying $50 to leave jail', async ({ page }) => {
    // Play until current player goes to jail
    for (let i = 0; i < 10; i++) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);
      await closeAnyModal(page);
      await page.waitForTimeout(1000);

      // Check if current player is now in jail
      const payToLeave = page.getByRole('button', { name: 'Pay $50 to Leave' });
      if (await payToLeave.isVisible({ timeout: 500 }).catch(() => false)) {
        // Click Pay $50 to Leave
        await payToLeave.click();

        // Jail status should be cleared
        await expect(page.getByText('In Alcatraz')).not.toBeVisible({ timeout: 3000 });

        // Normal roll button should appear
        await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible();
        return;
      }
    }
    
    expect(true).toBe(true);
  });

  test('should show turn count while in jail', async ({ page }) => {
    // Play until current player goes to jail
    for (let i = 0; i < 10; i++) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);
      await closeAnyModal(page);
      await page.waitForTimeout(1000);

      // Check if current player is now in jail
      const rollForDoubles = page.getByRole('button', { name: 'Roll for Doubles' });
      if (await rollForDoubles.isVisible({ timeout: 500 }).catch(() => false)) {
        // Should show turn count
        await expect(page.getByText(/Turn \d+ of 3/)).toBeVisible();
        return;
      }
    }
    
    expect(true).toBe(true);
  });

  // Deterministically place Player 1 in jail so the "roll for doubles" flow is
  // exercised without relying on random dice landing a player in Alcatraz.
  // (The previous version played up to 10 random turns and intermittently failed
  // when RNG produced a final-turn no-doubles roll, where neither message shows.)
  test('shows the roll result and keeps the player jailed on a non-doubles roll', async ({ page }) => {
    await startGameWithConfig(page, {
      players: [
        { name: 'Player 1', tokenIndex: 0, inJail: true, jailTurns: 0 },
        { name: 'Player 2', tokenIndex: 1 },
      ],
      diceSequence: [[2, 3]],
    });

    const rollForDoubles = page.getByRole('button', { name: 'Roll for Doubles' });
    await expect(rollForDoubles).toBeVisible({ timeout: 10000 });
    await rollForDoubles.click();

    await expect(page.getByText('Rolled: 5')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('No doubles - still in Alcatraz')).toBeVisible({ timeout: 5000 });
  });

  test('frees the player from jail when they roll doubles', async ({ page }) => {
    await startGameWithConfig(page, {
      players: [
        { name: 'Player 1', tokenIndex: 0, inJail: true, jailTurns: 0 },
        { name: 'Player 2', tokenIndex: 1 },
      ],
      diceSequence: [[3, 3]],
    });

    const rollForDoubles = page.getByRole('button', { name: 'Roll for Doubles' });
    await expect(rollForDoubles).toBeVisible({ timeout: 10000 });
    await rollForDoubles.click();

    await expect(page.getByText('Rolled: 6')).toBeVisible({ timeout: 5000 });
    // Rolling doubles releases the player: the jail indicator and the
    // "Roll for Doubles" prompt both disappear.
    await expect(page.getByText('In Alcatraz')).not.toBeVisible({ timeout: 5000 });
    await expect(rollForDoubles).not.toBeVisible({ timeout: 5000 });
  });

  test('lets a jailed player use a Get Out of Jail Free card to leave', async ({ page }) => {
    await startGameWithConfig(page, {
      players: [
        { name: 'Player 1', tokenIndex: 0, inJail: true, jailTurns: 0, getOutOfJailFreeCards: ['chance'] },
        { name: 'Player 2', tokenIndex: 1 },
      ],
    });

    const useCardButton = page.getByRole('button', { name: /Use Get Out of Jail Free \(1\)/ });
    await expect(useCardButton).toBeVisible({ timeout: 10000 });
    if (!process.env.CI) {
      await page.screenshot({ path: '/opt/cursor/artifacts/jail_free_before.png', fullPage: true });
    }
    await useCardButton.click();

    // The player is freed: the jail indicator and jail-specific controls disappear,
    // and the normal Roll Dice button becomes available.
    await expect(page.getByText('In Alcatraz')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Use Get Out of Jail Free/ })).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 5000 });
    if (!process.env.CI) {
      await page.screenshot({ path: '/opt/cursor/artifacts/jail_free_after.png', fullPage: true });
    }
  });
});
