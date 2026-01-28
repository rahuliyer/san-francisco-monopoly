import { test, expect } from '@playwright/test';

test.describe('Game Setup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
  });

  test('should display the game setup screen on initial load', async ({ page }) => {
    // Check for the main title (Art Deco styled)
    await expect(page.getByRole('heading', { name: 'SAN FRANCISCO' })).toBeVisible();
    await expect(page.getByText('MONOPOLY')).toBeVisible();
    await expect(page.getByText('The City by the Bay Edition')).toBeVisible();

    // Check for player count selector
    await expect(page.getByText('Number of Players')).toBeVisible();
    await expect(page.getByRole('button', { name: '2 Players' })).toBeVisible();
    await expect(page.getByRole('button', { name: '3 Players' })).toBeVisible();
    await expect(page.getByRole('button', { name: '4 Players' })).toBeVisible();

    // Check for start game button
    await expect(page.getByRole('button', { name: 'START GAME' })).toBeVisible();
  });

  test('should default to 2 players selected', async ({ page }) => {
    // The 2 Players button should be highlighted (Art Deco golden gradient)
    const twoPlayersBtn = page.getByRole('button', { name: '2 Players' });
    await expect(twoPlayersBtn).toHaveClass(/from-\[#d4af37\]/);

    // Should show 2 player input fields
    const playerInputs = page.getByPlaceholder(/Player \d/);
    await expect(playerInputs).toHaveCount(2);
  });

  test('should allow selecting 3 players', async ({ page }) => {
    await page.getByRole('button', { name: '3 Players' }).click();

    // The 3 Players button should now be highlighted (Art Deco golden gradient)
    const threePlayersBtn = page.getByRole('button', { name: '3 Players' });
    await expect(threePlayersBtn).toHaveClass(/from-\[#d4af37\]/);

    // Should show 3 player input fields
    const playerInputs = page.getByPlaceholder(/Player \d/);
    await expect(playerInputs).toHaveCount(3);
  });

  test('should allow selecting 4 players', async ({ page }) => {
    await page.getByRole('button', { name: '4 Players' }).click();

    // The 4 Players button should now be highlighted (Art Deco golden gradient)
    const fourPlayersBtn = page.getByRole('button', { name: '4 Players' });
    await expect(fourPlayersBtn).toHaveClass(/from-\[#d4af37\]/);

    // Should show 4 player input fields
    const playerInputs = page.getByPlaceholder(/Player \d/);
    await expect(playerInputs).toHaveCount(4);
  });

  test('should show default player names', async ({ page }) => {
    await page.getByRole('button', { name: '4 Players' }).click();

    await expect(page.locator('input[value="Player 1"]')).toBeVisible();
    await expect(page.locator('input[value="Player 2"]')).toBeVisible();
    await expect(page.locator('input[value="Player 3"]')).toBeVisible();
    await expect(page.locator('input[value="Player 4"]')).toBeVisible();
  });

  test('should allow editing player names', async ({ page }) => {
    const player1Input = page.locator('input[value="Player 1"]');
    await player1Input.fill('Alice');

    await expect(page.locator('input[value="Alice"]')).toBeVisible();
  });

  test('should display token selection buttons', async ({ page }) => {
    // Each player should have token selection buttons with the token icons
    // The tokens are Cable Car (🚃), Crab (🦀), Victorian House (🏠), Golden Gate (🌉)
    const tokenButtons = page.locator('button[title]');
    await expect(tokenButtons.first()).toBeVisible();
  });

  test('should assign default tokens to players', async ({ page }) => {
    await page.getByRole('button', { name: '4 Players' }).click();

    // Each player should have a different token selected by default
    // Check that player sections with Art Deco border exist
    const playerSections = page.locator('.rounded-lg.border.p-3');
    await expect(playerSections).toHaveCount(4);
  });

  test('should prevent selecting already-taken tokens', async ({ page }) => {
    await page.getByRole('button', { name: '2 Players' }).click();

    // Get the player sections (Art Deco styled)
    const playerSections = page.locator('.rounded-lg.border.p-3');

    // Find a disabled token button in the second player's section
    // Player 1 has token 0, so Player 2 should see token 0 as disabled
    const player2Section = playerSections.nth(1);
    const disabledTokenBtn = player2Section.locator('button[disabled]');
    await expect(disabledTokenBtn).toHaveCount(1);
    await expect(disabledTokenBtn).toHaveClass(/opacity-30/);
  });

  test('should allow changing token selection', async ({ page }) => {
    await page.getByRole('button', { name: '2 Players' }).click();

    // Get the first player section (Art Deco styled)
    const playerSections = page.locator('.rounded-lg.border.p-3');
    const player1Section = playerSections.first();

    // Click on a different token (index 2 - Victorian House)
    const tokenButtons = player1Section.locator('button[title]');
    const thirdToken = tokenButtons.nth(2);
    await thirdToken.click();

    // The third token should now be selected (have the ring class)
    await expect(thirdToken).toHaveClass(/ring-2/);
  });

  test('should start the game when clicking Start Game', async ({ page }) => {
    await page.getByRole('button', { name: 'START GAME' }).click();

    // Should now see the game board (center has SAN FRANCISCO and MONOPOLY - Art Deco styled)
    await expect(page.locator('.col-span-9.row-span-9').getByText('SAN FRANCISCO')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.col-span-9.row-span-9').getByText('MONOPOLY')).toBeVisible();

    // Should see player panels
    await expect(page.getByText("Player 1's Turn").first()).toBeVisible();

    // Should see the Roll Dice button
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible();
  });

  test('should start game with custom player names', async ({ page }) => {
    // Change player names
    const player1Input = page.locator('input[value="Player 1"]');
    const player2Input = page.locator('input[value="Player 2"]');

    await player1Input.fill('Alice');
    await player2Input.fill('Bob');

    await page.getByRole('button', { name: 'START GAME' }).click();

    // Should see the custom player names in the game
    await expect(page.getByRole('heading', { name: 'Alice' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Bob' })).toBeVisible();
    await expect(page.getByText("Alice's Turn")).toBeVisible();
  });

  test('should start game with 3 players', async ({ page }) => {
    await page.getByRole('button', { name: '3 Players' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();

    // Should see 3 player panels
    await expect(page.getByRole('heading', { name: 'Player 1' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Player 2' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Player 3' })).toBeVisible();
  });

  test('should start game with 4 players', async ({ page }) => {
    await page.getByRole('button', { name: '4 Players' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();

    // Should see 4 player panels
    await expect(page.getByRole('heading', { name: 'Player 1' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Player 2' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Player 3' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Player 4' })).toBeVisible();
  });

  test('should show starting money of $1,500 for each player', async ({ page }) => {
    await page.getByRole('button', { name: 'START GAME' }).click();

    // Each player should start with $1,500
    const moneyDisplays = page.getByText('$1,500');
    await expect(moneyDisplays.first()).toBeVisible({ timeout: 10000 });
  });
});
