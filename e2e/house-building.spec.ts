import { test, expect, Page } from '@playwright/test'
import type { DeterministicGameConfig } from '../lib/state/test-utils'

async function injectDeterministicGame(page: Page, config: DeterministicGameConfig) {
  await page.addInitScript((config) => {
    (window as Window & { __DETERMINISTIC_GAME_CONFIG__?: DeterministicGameConfig })
      .__DETERMINISTIC_GAME_CONFIG__ = config
  }, config)
}

async function startGameWithConfig(page: Page, config: DeterministicGameConfig) {
  await injectDeterministicGame(page, config)
  await page.goto('/')
  await page.getByRole('button', { name: 'Play Now' }).click()
  await page.getByRole('button', { name: 'START GAME' }).click()
  await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible({ timeout: 10000 })
}

test.describe('House building flow', () => {
  test('player can build houses without landing on the property', async ({ page }) => {
    const deterministicConfig: DeterministicGameConfig = {
      players: [
        { name: 'Player 1', tokenIndex: 0 },
        { name: 'Player 2', tokenIndex: 1 },
      ],
      initialProperties: [
        { propertyId: 1, ownerId: 0 },
        { propertyId: 3, ownerId: 0 },
      ],
    }

    await startGameWithConfig(page, deterministicConfig)

    await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeEnabled()

    const manageButton = page.getByRole('button', { name: 'Manage Properties' })
    await manageButton.click()

    const propertiesModal = page.locator('.fixed.inset-0.z-50').filter({ hasText: 'Properties' })
    await expect(propertiesModal).toBeVisible({ timeout: 5000 })

    await propertiesModal.getByRole('button', { name: /tenderloin/i }).click()

    const buildButton = page.getByRole('button', { name: /build house/i })
    await expect(buildButton).toBeVisible({ timeout: 5000 })
    await buildButton.click()

    await expect(page.getByText('1 House')).toBeVisible({ timeout: 5000 })
  })
})
