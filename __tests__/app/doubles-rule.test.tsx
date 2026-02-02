import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameStoreProvider } from '@/components/game-store-context'
import MonopolyGame from '@/app/page'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, ...props }: { alt: string; src: string; fill?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} data-fill={fill ? 'true' : undefined} />
  },
}))

function renderGame() {
  return render(
    <GameStoreProvider>
      <MonopolyGame />
    </GameStoreProvider>
  )
}

// Helper to set up dice rolls for tests
function setTestDiceRolls(rolls: [number, number][]) {
  ;(globalThis as { __TEST_DICE_ROLLS__?: [number, number][] }).__TEST_DICE_ROLLS__ = [...rolls]
}

function clearTestDiceRolls() {
  ;(globalThis as { __TEST_DICE_ROLLS__?: [number, number][] }).__TEST_DICE_ROLLS__ = undefined
}

describe('Doubles rule', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    clearTestDiceRolls()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    clearTestDiceRolls()
  })

  const startGame = async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    renderGame()

    // Click "Play Now" to dismiss the splash screen
    const playNowButton = screen.getByRole('button', { name: /play now/i })
    await user.click(playNowButton)

    // Fill in player names
    const nameInputs = screen.getAllByRole('textbox')
    await user.clear(nameInputs[0])
    await user.type(nameInputs[0], 'Alice')
    await user.clear(nameInputs[1])
    await user.type(nameInputs[1], 'Bob')

    // Start the game
    const startButton = screen.getByRole('button', { name: /start game/i })
    await user.click(startButton)

    return user
  }

  const advanceAllTimers = async (ms = 5000) => {
    await act(async () => {
      jest.advanceTimersByTime(ms)
    })
  }

  describe('Rolling doubles grants another turn', () => {
    it('should allow player to roll again after rolling doubles', async () => {
      // Set up: first roll is doubles (3,3=6)
      // Second roll is not doubles (2,1=3)
      setTestDiceRolls([
        [3, 3], // Doubles - Alice rolls again
        [2, 1], // Not doubles - Alice's turn ends
      ])

      const user = await startGame()

      // Verify it's Alice's turn initially
      expect(screen.getByText(/alice's turn/i)).toBeInTheDocument()

      // Alice rolls doubles
      const rollButton = screen.getByRole('button', { name: /roll dice/i })
      await user.click(rollButton)

      // Advance timers to complete roll animation and show modal
      await advanceAllTimers(3000)

      // Close any modal that may have appeared (click close/pass/ok)
      const closeButtons = screen.queryAllByRole('button', { name: /close|pass|ok|continue/i })
      if (closeButtons.length > 0) {
        await user.click(closeButtons[0])
        await advanceAllTimers(1000)
      }

      // Wait for action to complete - since it's doubles, hasRolled should become false again
      await advanceAllTimers(2000)

      // It should STILL be Alice's turn (not Bob's)
      expect(screen.getByText(/alice's turn/i)).toBeInTheDocument()
      expect(screen.queryByText(/bob's turn/i)).not.toBeInTheDocument()

      // Alice should be able to roll again (roll button should be enabled)
      await waitFor(() => {
        const rollAgainButton = screen.getByRole('button', { name: /roll dice/i })
        expect(rollAgainButton).not.toBeDisabled()
      })

      // Roll again (not doubles this time)
      const rollAgainButton = screen.getByRole('button', { name: /roll dice/i })
      await user.click(rollAgainButton)
      await advanceAllTimers(3000)

      // Close any modal
      const closeButtons2 = screen.queryAllByRole('button', { name: /close|pass|ok|continue/i })
      if (closeButtons2.length > 0) {
        await user.click(closeButtons2[0])
        await advanceAllTimers(1000)
      }

      // Wait for turn to end
      await advanceAllTimers(3000)

      // Now it should be Bob's turn
      await waitFor(() => {
        expect(screen.getByText(/bob's turn/i)).toBeInTheDocument()
      })
    })

    it('should keep same player turn after doubles until non-doubles is rolled', async () => {
      // Two consecutive doubles, then non-doubles
      setTestDiceRolls([
        [2, 2], // First doubles
        [3, 3], // Second doubles
        [4, 1], // Not doubles - turn ends
      ])

      const user = await startGame()

      // Roll 1: doubles
      let rollButton = screen.getByRole('button', { name: /roll dice/i })
      await user.click(rollButton)
      await advanceAllTimers(3000)

      let closeButtons = screen.queryAllByRole('button', { name: /close|pass|ok|continue/i })
      if (closeButtons.length > 0) {
        await user.click(closeButtons[0])
        await advanceAllTimers(1000)
      }
      await advanceAllTimers(2000)

      // Still Alice's turn
      expect(screen.getByText(/alice's turn/i)).toBeInTheDocument()

      // Roll 2: doubles again
      await waitFor(() => {
        rollButton = screen.getByRole('button', { name: /roll dice/i })
        expect(rollButton).not.toBeDisabled()
      })
      await user.click(rollButton)
      await advanceAllTimers(3000)

      closeButtons = screen.queryAllByRole('button', { name: /close|pass|ok|continue/i })
      if (closeButtons.length > 0) {
        await user.click(closeButtons[0])
        await advanceAllTimers(1000)
      }
      await advanceAllTimers(2000)

      // Still Alice's turn
      expect(screen.getByText(/alice's turn/i)).toBeInTheDocument()

      // Roll 3: not doubles
      await waitFor(() => {
        rollButton = screen.getByRole('button', { name: /roll dice/i })
        expect(rollButton).not.toBeDisabled()
      })
      await user.click(rollButton)
      await advanceAllTimers(3000)

      closeButtons = screen.queryAllByRole('button', { name: /close|pass|ok|continue/i })
      if (closeButtons.length > 0) {
        await user.click(closeButtons[0])
        await advanceAllTimers(1000)
      }
      await advanceAllTimers(3000)

      // Now Bob's turn
      await waitFor(() => {
        expect(screen.getByText(/bob's turn/i)).toBeInTheDocument()
      })
    })
  })

  describe('Three consecutive doubles sends player to jail', () => {
    it('should send player to jail after rolling doubles three times', async () => {
      // Set up three consecutive doubles
      setTestDiceRolls([
        [2, 2], // First doubles
        [3, 3], // Second doubles
        [4, 4], // Third doubles - goes to jail!
      ])

      const user = await startGame()

      // First roll - doubles
      let rollButton = screen.getByRole('button', { name: /roll dice/i })
      await user.click(rollButton)
      await advanceAllTimers(3000)

      let closeButtons = screen.queryAllByRole('button', { name: /close|pass|ok|continue/i })
      if (closeButtons.length > 0) {
        await user.click(closeButtons[0])
        await advanceAllTimers(1000)
      }
      await advanceAllTimers(2000)

      // Second roll - doubles again
      await waitFor(() => {
        rollButton = screen.getByRole('button', { name: /roll dice/i })
        expect(rollButton).not.toBeDisabled()
      })
      await user.click(rollButton)
      await advanceAllTimers(3000)

      closeButtons = screen.queryAllByRole('button', { name: /close|pass|ok|continue/i })
      if (closeButtons.length > 0) {
        await user.click(closeButtons[0])
        await advanceAllTimers(1000)
      }
      await advanceAllTimers(2000)

      // Third roll - doubles again, should go to jail
      await waitFor(() => {
        rollButton = screen.getByRole('button', { name: /roll dice/i })
        expect(rollButton).not.toBeDisabled()
      })
      await user.click(rollButton)
      await advanceAllTimers(3000)

      // Turn should end and switch to Bob (Alice was sent to jail)
      await advanceAllTimers(3000)

      await waitFor(() => {
        expect(screen.getByText(/bob's turn/i)).toBeInTheDocument()
      })
    })
  })

  describe('Doubles counter resets on turn change', () => {
    it('should reset consecutive doubles counter when turn changes', async () => {
      // Alice rolls doubles twice, then non-doubles
      // Bob should start fresh (not count Alice's doubles)
      setTestDiceRolls([
        [2, 2], // Alice doubles (1st)
        [3, 3], // Alice doubles (2nd)
        [4, 1], // Alice no doubles, turn ends
        [5, 5], // Bob doubles (1st for Bob, should not be 3rd overall)
        [6, 1], // Bob no doubles, turn ends
      ])

      const user = await startGame()

      // Alice's first roll - doubles
      let rollButton = screen.getByRole('button', { name: /roll dice/i })
      await user.click(rollButton)
      await advanceAllTimers(3000)

      let closeButtons = screen.queryAllByRole('button', { name: /close|pass|ok|continue/i })
      if (closeButtons.length > 0) {
        await user.click(closeButtons[0])
        await advanceAllTimers(1000)
      }
      await advanceAllTimers(2000)

      // Alice's second roll - doubles
      await waitFor(() => {
        rollButton = screen.getByRole('button', { name: /roll dice/i })
        expect(rollButton).not.toBeDisabled()
      })
      await user.click(rollButton)
      await advanceAllTimers(3000)

      closeButtons = screen.queryAllByRole('button', { name: /close|pass|ok|continue/i })
      if (closeButtons.length > 0) {
        await user.click(closeButtons[0])
        await advanceAllTimers(1000)
      }
      await advanceAllTimers(2000)

      // Alice's third roll - not doubles, turn ends
      await waitFor(() => {
        rollButton = screen.getByRole('button', { name: /roll dice/i })
        expect(rollButton).not.toBeDisabled()
      })
      await user.click(rollButton)
      await advanceAllTimers(3000)

      closeButtons = screen.queryAllByRole('button', { name: /close|pass|ok|continue/i })
      if (closeButtons.length > 0) {
        await user.click(closeButtons[0])
        await advanceAllTimers(1000)
      }
      await advanceAllTimers(3000)

      // Turn should end and switch to Bob
      await waitFor(() => {
        expect(screen.getByText(/bob's turn/i)).toBeInTheDocument()
      })

      // Bob rolls doubles - this should be his FIRST double, not third
      // So he should NOT go to jail and should get another roll
      rollButton = screen.getByRole('button', { name: /roll dice/i })
      await user.click(rollButton)
      await advanceAllTimers(3000)

      closeButtons = screen.queryAllByRole('button', { name: /close|pass|ok|continue/i })
      if (closeButtons.length > 0) {
        await user.click(closeButtons[0])
        await advanceAllTimers(1000)
      }
      await advanceAllTimers(2000)

      // It should still be Bob's turn (he rolled doubles, gets another turn)
      expect(screen.getByText(/bob's turn/i)).toBeInTheDocument()

      // Bob's roll button should be enabled for another roll
      await waitFor(() => {
        rollButton = screen.getByRole('button', { name: /roll dice/i })
        expect(rollButton).not.toBeDisabled()
      })
    })
  })
})
