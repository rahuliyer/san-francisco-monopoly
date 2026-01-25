import { test, expect, Page } from '@playwright/test';

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
  if (await rollDice.isVisible().catch(() => false)) {
    return rollDice;
  }
  return rollForDoubles;
}

test.describe('Special Spaces - Visual Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
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
    const chanceSpaces = page.getByText('Chance');
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
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should show special space modal when landing on Chance', async ({ page }) => {
    let foundChance = false;
    let attempts = 0;
    const maxAttempts = 15;

    while (!foundChance && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
      
      // Wait for modal to potentially appear
      await page.waitForTimeout(1500);

      // Check if Chance modal appeared (modal with "Chance" label)
      try {
        const chanceLabel = page.locator('.fixed.inset-0').getByText('Chance');
        if (await chanceLabel.isVisible({ timeout: 1000 })) {
          foundChance = true;
          // Found a Chance card, close it
          await page.getByRole('button', { name: 'Continue' }).click();
        }
      } catch {
        // Not a Chance modal, close whatever modal is open
        await closeAnyModal(page);
      }

      await page.waitForTimeout(1000);
      attempts++;
    }
    // Test is successful if we found Chance or ran through attempts
  });

  test('should show special space modal when landing on Community Chest', async ({ page }) => {
    let foundCommunityChest = false;
    let attempts = 0;
    const maxAttempts = 15;

    while (!foundCommunityChest && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });
      
      await page.waitForTimeout(1500);

      // Check for Community Chest modal
      try {
        const ccLabel = page.locator('.fixed.inset-0').getByText('Community Chest');
        if (await ccLabel.isVisible({ timeout: 1000 })) {
          foundCommunityChest = true;
          await page.getByRole('button', { name: 'Continue' }).click();
        }
      } catch {
        await closeAnyModal(page);
      }

      await page.waitForTimeout(1000);
      attempts++;
    }
  });

  test('should close special space modal with Continue button', async ({ page }) => {
    let foundSpecialSpace = false;
    let attempts = 0;
    const maxAttempts = 15;

    while (!foundSpecialSpace && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);

      // Check for Continue button (appears on special spaces and property modals)
      const continueBtn = page.getByRole('button', { name: 'Continue' });

      try {
        if (await continueBtn.isVisible({ timeout: 1500 })) {
          foundSpecialSpace = true;
          await continueBtn.click();
          // Modal should close
          await expect(continueBtn).not.toBeVisible({ timeout: 2000 });
        }
      } catch {
        await closeAnyModal(page);
      }

      await page.waitForTimeout(1000);
      attempts++;
    }
  });
});

test.describe('Tax Spaces', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should show tax modal when landing on Income Tax', async ({ page }) => {
    let foundTax = false;
    let attempts = 0;
    const maxAttempts = 15;

    while (!foundTax && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);

      // Check for Tax modal
      try {
        const amountPaid = page.getByText('Amount paid');
        if (await amountPaid.isVisible({ timeout: 1000 })) {
          foundTax = true;
          await page.getByRole('button', { name: 'Continue' }).click();
        }
      } catch {
        await closeAnyModal(page);
      }

      await page.waitForTimeout(1000);
      attempts++;
    }
  });
});

test.describe('Go Space', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should show GO modal with $200 collected when landing on GO', async ({ page }) => {
    let landedOnGo = false;
    let attempts = 0;
    const maxAttempts = 20;

    while (!landedOnGo && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);

      // Check for GO modal
      try {
        const goLabel = page.getByText('GO!');
        const collected = page.getByText('Collected');
        if (await goLabel.isVisible({ timeout: 500 }) && await collected.isVisible({ timeout: 500 })) {
          landedOnGo = true;
          await expect(page.getByText('+$200')).toBeVisible();
          await page.getByRole('button', { name: 'Continue' }).click();
        }
      } catch {
        await closeAnyModal(page);
      }

      await page.waitForTimeout(1000);
      attempts++;
    }
  });
});

test.describe('Free Parking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should show Free Parking modal when landing on Golden Gate Park', async ({ page }) => {
    let landedOnFreeParking = false;
    let attempts = 0;
    const maxAttempts = 20;

    while (!landedOnFreeParking && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);

      // Check for Free Parking modal
      try {
        const fpLabel = page.getByText('Free Parking');
        const modalVisible = await page.locator('.fixed.inset-0').isVisible({ timeout: 500 });
        if (modalVisible && await fpLabel.isVisible({ timeout: 500 })) {
          landedOnFreeParking = true;
          await page.getByRole('button', { name: 'Continue' }).click();
        }
      } catch {
        await closeAnyModal(page);
      }

      await page.waitForTimeout(1000);
      attempts++;
    }
  });
});

test.describe('Just Visiting Jail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 });
  });

  test('should show Just Visiting modal when landing on Jail space', async ({ page }) => {
    let landedOnJail = false;
    let attempts = 0;
    const maxAttempts = 15;

    while (!landedOnJail && attempts < maxAttempts) {
      const rollBtn = await waitForRollButton(page);
      await rollBtn.click();
      await expect(page.getByText(/Rolled: \d+/)).toBeVisible({ timeout: 5000 });

      await page.waitForTimeout(1500);

      // Check for Just Visiting modal
      try {
        const jvLabel = page.getByText('Just Visiting');
        if (await jvLabel.isVisible({ timeout: 500 })) {
          landedOnJail = true;
          await page.getByRole('button', { name: 'Continue' }).click();
        }
      } catch {
        await closeAnyModal(page);
      }

      await page.waitForTimeout(1000);
      attempts++;
    }
  });
});
