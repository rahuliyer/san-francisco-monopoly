import { test, expect } from '@playwright/test'

test('shows victory modal when a winner is set', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play Now' }).click()
  await page.getByRole('button', { name: /start game/i }).click()

  await page.waitForFunction(() => {
    return window.__GAME_LOOP__?.getState().players.length
  })

  await page.evaluate(() => {
    const loop = window.__GAME_LOOP__
    if (!loop) return
    const state = loop.getState()
    if (!state.players.length) return
    const players = state.players.map((player, index) => ({
      ...player,
      isBankrupt: index !== 0,
      money: index === 0 ? 1500 : 0,
      properties: [],
      inJail: false,
      jailTurns: 0,
    }))

    loop.state = {
      ...state,
      players,
      gameOver: true,
      winnerId: players[0]?.id ?? null,
      awaitingPropertyDecision: false,
      awaitingSpecialSpace: false,
      selectedSpace: null,
      specialSpace: null,
      viewingPropertiesForPlayer: null,
    }
    loop.notifyListeners()
  })

  await expect(page.getByText('Victory!')).toBeVisible()
  await expect(
    page.getByText(/wins the game after every opponent went bankrupt/i)
  ).toBeVisible()

  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Victory!')).toHaveCount(0)
})
