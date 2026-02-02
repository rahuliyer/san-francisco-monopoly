import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameStoreProvider } from '@/components/game-store-context'
import MonopolyGame from '@/app/page'
import { createGameStore, createInitialGameState, type GameState } from '@/lib/game-store'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    fill,
    priority,
    ...props
  }: {
    alt: string
    src: string
    fill?: boolean
    priority?: boolean
  }) => {
    void priority
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} data-fill={fill ? 'true' : undefined} />
  },
}))

function createInjectedStore() {
  const store = createGameStore(createInitialGameState())
  ;(window as { __GAME_STORE__?: typeof store }).__GAME_STORE__ = store
  return store
}

function renderGameWithStore() {
  return render(
    <GameStoreProvider>
      <MonopolyGame />
    </GameStoreProvider>
  )
}

async function startGame() {
  const user = userEvent.setup()
  renderGameWithStore()

  await user.click(screen.getByRole('button', { name: /play now/i }))
  await user.click(screen.getByRole('button', { name: /start game/i }))

  return user
}

describe('Victory modal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    delete (window as { __GAME_STORE__?: unknown }).__GAME_STORE__
  })

  it('shows a victory modal when the game ends', async () => {
    const store = createInjectedStore()
    await startGame()

    act(() => {
      store.setState((prev) => {
        const updatedPlayers = prev.players.map((player, index) => ({
          ...player,
          isBankrupt: index !== 0,
          money: index === 0 ? 1500 : 0,
          properties: [],
          inJail: false,
          jailTurns: 0,
        }))

        return {
          ...prev,
          players: updatedPlayers,
          gameOver: true,
          winnerId: updatedPlayers[0].id,
        } satisfies GameState
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Victory!')).toBeInTheDocument()
    })
    expect(screen.getByText(/wins the game after every opponent went bankrupt/i)).toBeInTheDocument()
  })

  it('closes the victory modal when Continue is clicked', async () => {
    const store = createInjectedStore()
    const user = await startGame()

    act(() => {
      store.setState((prev) => ({
        ...prev,
        players: prev.players.map((player, index) => ({
          ...player,
          isBankrupt: index !== 0,
        })),
        gameOver: true,
        winnerId: prev.players[0].id,
      }))
    })

    const continueButton = await screen.findByRole('button', { name: /continue/i })
    await user.click(continueButton)

    await waitFor(() => {
      expect(screen.queryByText('Victory!')).not.toBeInTheDocument()
    })
  })
})
