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

test.describe('Computer player', () => {
  test('automatically rolls, buys a property, and ends its turn', async ({ page }) => {
    // Seat 0 is the computer, seat 1 is a human. The computer should drive its
    // entire turn (roll -> buy an unowned property -> end turn) with no clicks.
    await startGameWithConfig(page, {
      players: [
        { name: 'Computer 1', tokenIndex: 0, isComputer: true },
        { name: 'Player 2', tokenIndex: 1 },
      ],
      // Roll of 3 (not doubles) lands the computer on the first buyable property.
      diceSequence: [[1, 2]],
    });

    // Before the AI acts: it is the computer's turn.
    await expect(page.getByText("Computer 1's Turn")).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: '/opt/cursor/artifacts/ai_turn_start.png', fullPage: true });

    // The AI buys the property it lands on: its panel shows one property.
    await expect(page.getByText('Properties (1)')).toBeVisible({ timeout: 15000 });

    // Having finished, the AI hands the turn to the human player.
    await expect(page.getByText("Player 2's Turn")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeEnabled({ timeout: 5000 });

    await page.screenshot({ path: '/opt/cursor/artifacts/ai_turn_done.png', fullPage: true });
  });

  test('automatically uses a Get Out of Jail Free card when jailed', async ({ page }) => {
    // Computer starts in jail holding a Get Out of Jail Free card. It should
    // use the card automatically and then take a normal turn.
    await startGameWithConfig(page, {
      players: [
        { name: 'Computer 1', tokenIndex: 0, isComputer: true, inJail: true, getOutOfJailFreeCards: 1 },
        { name: 'Player 2', tokenIndex: 1 },
      ],
      diceSequence: [[1, 2]],
    });

    await expect(page.getByText("Computer 1's Turn")).toBeVisible({ timeout: 10000 });

    // The AI escapes jail on its own and finishes the turn, handing off to the human.
    await expect(page.getByText("Player 2's Turn")).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeEnabled({ timeout: 5000 });
  });

  test('hands off from a human turn to a computer turn', async ({ page }) => {
    // Seat 0 is the human, seat 1 is the computer. After the human plays, the
    // computer should take over automatically.
    await startGameWithConfig(page, {
      players: [
        { name: 'Player 1', tokenIndex: 0 },
        { name: 'Computer 2', tokenIndex: 1, isComputer: true },
      ],
      // First roll: human lands on a property (declines). Second roll: computer
      // lands on the same (now still unowned) property and buys it. Neither is doubles.
      diceSequence: [[1, 2], [1, 2]],
    });

    await expect(page.getByText("Player 1's Turn")).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Roll Dice' }).click();

    // Human declines the property they land on.
    const passBtn = page.getByRole('button', { name: 'Pass' });
    await expect(passBtn).toBeVisible({ timeout: 10000 });
    await passBtn.click();

    // Control passes to the computer, which then finishes and returns the turn.
    await expect(page.getByText("Computer 2's Turn")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Player 1's Turn")).toBeVisible({ timeout: 20000 });
  });
});
