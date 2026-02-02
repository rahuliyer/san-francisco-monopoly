import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

describe('Escape key closes dialogs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const startGame = async () => {
    renderGame()

    // Click "Play Now" to dismiss the splash screen
    const playNowButton = screen.getByRole('button', { name: /play now/i })
    await userEvent.click(playNowButton)

    // Fill in player names using userEvent for proper handling
    const nameInputs = screen.getAllByRole('textbox')
    await userEvent.clear(nameInputs[0])
    await userEvent.type(nameInputs[0], 'Alice')
    await userEvent.clear(nameInputs[1])
    await userEvent.type(nameInputs[1], 'Bob')

    // Start the game
    const startButton = screen.getByRole('button', { name: /start game/i })
    await userEvent.click(startButton)

    return { nameInputs }
  }

  describe('Trade modal', () => {
    it('should close trade modal when Escape is pressed', async () => {
      await startGame()

      // Open trade modal
      const tradeButton = screen.getByRole('button', { name: /trade/i })
      await userEvent.click(tradeButton)

      // Verify trade modal is open
      await waitFor(() => {
        expect(screen.getByText(/make a trade/i)).toBeInTheDocument()
      })

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' })

      // Verify trade modal is closed
      await waitFor(() => {
        expect(screen.queryByText(/make a trade/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Escape key behavior', () => {
    it('should only close one modal at a time when Escape is pressed', async () => {
      await startGame()

      // Open trade modal
      const tradeButton = screen.getByRole('button', { name: /trade/i })
      await userEvent.click(tradeButton)

      // Verify trade modal is open
      await waitFor(() => {
        expect(screen.getByText(/make a trade/i)).toBeInTheDocument()
      })

      // Press Escape once
      fireEvent.keyDown(document, { key: 'Escape' })

      // Verify trade modal is closed
      await waitFor(() => {
        expect(screen.queryByText(/make a trade/i)).not.toBeInTheDocument()
      })

      // Verify game is still running - roll dice button should be visible
      expect(screen.getByRole('button', { name: /roll dice/i })).toBeInTheDocument()
    })

    it('should close trade modal and allow reopening', async () => {
      await startGame()

      // Open trade modal
      const tradeButton = screen.getByRole('button', { name: /trade/i })
      await userEvent.click(tradeButton)

      // Verify trade modal is open
      await waitFor(() => {
        expect(screen.getByText(/make a trade/i)).toBeInTheDocument()
      })

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' })

      // Verify trade modal is closed
      await waitFor(() => {
        expect(screen.queryByText(/make a trade/i)).not.toBeInTheDocument()
      })

      // Reopen trade modal
      await userEvent.click(tradeButton)

      // Verify trade modal is open again
      await waitFor(() => {
        expect(screen.getByText(/make a trade/i)).toBeInTheDocument()
      })
    })
  })

  describe('Non-Escape keys', () => {
    it('should not close modal when non-Escape key is pressed', async () => {
      await startGame()

      // Open trade modal
      const tradeButton = screen.getByRole('button', { name: /trade/i })
      await userEvent.click(tradeButton)

      // Verify trade modal is open
      await waitFor(() => {
        expect(screen.getByText(/make a trade/i)).toBeInTheDocument()
      })

      // Press Enter (not Escape)
      fireEvent.keyDown(document, { key: 'Enter' })

      // Verify trade modal is still open
      expect(screen.getByText(/make a trade/i)).toBeInTheDocument()

      // Press a random key
      fireEvent.keyDown(document, { key: 'a' })

      // Verify trade modal is still open
      expect(screen.getByText(/make a trade/i)).toBeInTheDocument()
    })
  })
})
