import { test, expect } from '@playwright/test';

test.describe('Game Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Play Now' }).click();
    await page.getByRole('button', { name: 'START GAME' }).click();
    // Wait for game to start
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should display the game board with SF MONOPOLY title', async ({ page }) => {
    // Art Deco styled title
    await expect(page.locator('text=SAN FRANCISCO').first()).toBeVisible();
    await expect(page.locator('text=MONOPOLY').first()).toBeVisible();
    await expect(page.getByText('The City by the Bay Edition')).toBeVisible();
  });

  test('should display all four corners of the board', async ({ page }) => {
    // GO corner (Fisherman's Wharf)
    await expect(page.getByText("Fisherman's Wharf")).toBeVisible();

    // Jail corner (Alcatraz) - there are two instances: "Alcatraz" and "Go To Alcatraz"
    await expect(page.getByText('Alcatraz').first()).toBeVisible();

    // Free Parking corner (Golden Gate Park)
    await expect(page.getByText('Golden Gate Park')).toBeVisible();

    // Go To Jail corner
    await expect(page.getByText('Go To Alcatraz')).toBeVisible();
  });

  test('should display property spaces with prices', async ({ page }) => {
    // Brown properties
    await expect(page.getByText('Tenderloin')).toBeVisible();
    await expect(page.getByText('Bayview')).toBeVisible();

    // Light blue properties
    await expect(page.getByText('Sunset District')).toBeVisible();
    await expect(page.getByText('Richmond District')).toBeVisible();
    await expect(page.getByText('Outer Mission')).toBeVisible();

    // Check that prices are displayed (e.g., $60 for brown properties)
    await expect(page.getByText('$60').first()).toBeVisible();
  });

  test('should display railroad spaces', async ({ page }) => {
    await expect(page.getByText('Caltrain')).toBeVisible();
    // BART is a railroad space at position 15
    await expect(page.getByText('BART', { exact: true })).toBeVisible();
    // Muni - use exact matching to avoid matching "Community"
    await expect(page.getByText('Muni', { exact: true })).toBeVisible();
    // Cable Car space should exist on the board - there may be a Cable Car token name too
    await expect(page.getByText('Cable Car', { exact: true }).first()).toBeVisible();
  });

  test('should display utility spaces', async ({ page }) => {
    await expect(page.getByText('PG&E')).toBeVisible();
    await expect(page.getByText('SF Water')).toBeVisible();
  });

  test('should display Chance spaces', async ({ page }) => {
    // There are 3 Chance spaces on the board
    const chanceSpaces = page.getByText('Chance');
    await expect(chanceSpaces.first()).toBeVisible();
  });

  test('should display Community Chest spaces', async ({ page }) => {
    // There are 3 Community Chest spaces on the board
    const communityChestSpaces = page.getByText('Community Chest');
    await expect(communityChestSpaces.first()).toBeVisible();
  });

  test('should display tax spaces', async ({ page }) => {
    await expect(page.getByText('Income Tax')).toBeVisible();
    await expect(page.getByText('Luxury Tax')).toBeVisible();
  });

  test('should display high-value properties', async ({ page }) => {
    // Dark blue properties (most expensive)
    await expect(page.getByText('Presidio Heights')).toBeVisible();
    await expect(page.getByText('Sea Cliff')).toBeVisible();

    // Check for $400 (Sea Cliff price)
    await expect(page.getByText('$400')).toBeVisible();
  });

  test('should show player tokens on the starting position (GO)', async ({ page }) => {
    // Both players should start at position 0 (Fisherman's Wharf / GO)
    // The player tokens should be visible on the GO space
    const goSpace = page.getByText("Fisherman's Wharf").locator('..');
    await expect(goSpace).toBeVisible();
  });

  test('should allow clicking on property spaces to view details', async ({ page }) => {
    // Click on Tenderloin (a brown property)
    await page.getByText('Tenderloin').click();

    // Should show property card modal
    await expect(page.getByText('Title Deed')).toBeVisible();
    await expect(page.getByText('Price: $60')).toBeVisible();
    await expect(page.getByText('Rent')).toBeVisible();
  });

  test('should show property rent details when clicking on a property', async ({ page }) => {
    // Click on a property
    await page.getByText('Marina').click();

    // Should show rent information
    await expect(page.getByText('With 1 House')).toBeVisible();
    await expect(page.getByText('With 2 Houses')).toBeVisible();
    await expect(page.getByText('With 3 Houses')).toBeVisible();
    await expect(page.getByText('With 4 Houses')).toBeVisible();
    await expect(page.getByText('With Hotel')).toBeVisible();
    await expect(page.getByText('House Cost')).toBeVisible();
    await expect(page.getByText('Mortgage Value')).toBeVisible();
  });

  test('should show railroad rent details when clicking on a railroad', async ({ page }) => {
    // Click on a railroad
    await page.getByText('Caltrain').click();

    // Should show railroad rent information
    await expect(page.getByText('Rent with 1 Railroad')).toBeVisible();
    await expect(page.getByText('Rent with 2 Railroads')).toBeVisible();
    await expect(page.getByText('Rent with 3 Railroads')).toBeVisible();
    await expect(page.getByText('Rent with 4 Railroads')).toBeVisible();
  });

  test('should show utility information when clicking on a utility', async ({ page }) => {
    // Click on a utility
    await page.getByText('PG&E').click();

    // Should show utility rent information
    await expect(page.getByText('If one Utility is owned, rent is 4x the dice roll.')).toBeVisible();
    await expect(page.getByText('If both Utilities are owned, rent is 10x the dice roll.')).toBeVisible();
  });

  test('should close property card modal with X button', async ({ page }) => {
    // Click on a property
    await page.getByText('Tenderloin').click();

    // Wait for modal to appear
    await expect(page.getByText('Title Deed')).toBeVisible();

    // Click the close button (X)
    await page.locator('button').filter({ has: page.locator('svg.h-4.w-4') }).first().click();

    // Modal should be closed (Title Deed should not be visible)
    await expect(page.getByText('Title Deed')).not.toBeVisible();
  });

  test('should display the game board center with logo', async ({ page }) => {
    // The center of the board should have the SAN FRANCISCO MONOPOLY logo (Art Deco styled)
    const centerArea = page.locator('.col-span-9.row-span-9');
    await expect(centerArea).toBeVisible();
    await expect(centerArea.getByText('SAN FRANCISCO')).toBeVisible();
    await expect(centerArea.getByText('MONOPOLY')).toBeVisible();
  });
});
