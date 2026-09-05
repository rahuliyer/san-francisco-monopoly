import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameSetup } from '@/components/game-setup'
import { PLAYER_TOKENS } from '@/lib/game-data'

describe('GameSetup component', () => {
  const mockOnStartGame = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the game title', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    // Art Deco styled title
    expect(screen.getByText('SAN FRANCISCO')).toBeInTheDocument()
    expect(screen.getByText('MONOPOLY')).toBeInTheDocument()
    expect(screen.getByText('The City by the Bay Edition')).toBeInTheDocument()
  })

  it('should render player count selector buttons', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    expect(screen.getByText('2 Players')).toBeInTheDocument()
    expect(screen.getByText('3 Players')).toBeInTheDocument()
    expect(screen.getByText('4 Players')).toBeInTheDocument()
  })

  it('should start with 2 players selected by default', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(2)
  })

  it('should show player input fields based on player count', async () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    // Initially 2 players
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
    
    // Select 3 players
    await userEvent.click(screen.getByText('3 Players'))
    expect(screen.getAllByRole('textbox')).toHaveLength(3)
    
    // Select 4 players
    await userEvent.click(screen.getByText('4 Players'))
    expect(screen.getAllByRole('textbox')).toHaveLength(4)
    
    // Go back to 2 players
    await userEvent.click(screen.getByText('2 Players'))
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
  })

  it('should have default player names', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs[0]).toHaveValue('Player 1')
    expect(inputs[1]).toHaveValue('Player 2')
  })

  it('should allow editing player names', async () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    const inputs = screen.getAllByRole('textbox')
    
    await userEvent.clear(inputs[0])
    await userEvent.type(inputs[0], 'Alice')
    
    expect(inputs[0]).toHaveValue('Alice')
  })

  it('should render token selection buttons', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    // Each player row should have 4 token buttons with title attributes
    const tokenButtons = screen.getAllByRole('button').filter(
      btn => PLAYER_TOKENS.some(t => btn.getAttribute('title') === t.name)
    )
    // 2 players × 4 tokens = 8 token buttons displayed
    expect(tokenButtons.length).toBeGreaterThanOrEqual(8)
  })

  it('should render Start Game button', () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
  })

  it('should call onStartGame with player data when Start Game is clicked', async () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    await userEvent.click(screen.getByRole('button', { name: /start game/i }))
    
    expect(mockOnStartGame).toHaveBeenCalledTimes(1)
    expect(mockOnStartGame).toHaveBeenCalledWith([
      { name: 'Player 1', tokenIndex: 0, isComputer: false },
      { name: 'Player 2', tokenIndex: 1, isComputer: false },
    ])
  })

  it('should call onStartGame with correct number of players', async () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    // Select 3 players
    await userEvent.click(screen.getByText('3 Players'))
    await userEvent.click(screen.getByRole('button', { name: /start game/i }))
    
    expect(mockOnStartGame).toHaveBeenCalledWith([
      { name: 'Player 1', tokenIndex: 0, isComputer: false },
      { name: 'Player 2', tokenIndex: 1, isComputer: false },
      { name: 'Player 3', tokenIndex: 2, isComputer: false },
    ])
  })

  it('should call onStartGame with custom player names', async () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)
    
    const inputs = screen.getAllByRole('textbox')
    await userEvent.clear(inputs[0])
    await userEvent.type(inputs[0], 'Alice')
    await userEvent.clear(inputs[1])
    await userEvent.type(inputs[1], 'Bob')
    
    await userEvent.click(screen.getByRole('button', { name: /start game/i }))
    
    expect(mockOnStartGame).toHaveBeenCalledWith([
      { name: 'Alice', tokenIndex: 0, isComputer: false },
      { name: 'Bob', tokenIndex: 1, isComputer: false },
    ])
  })

  it('should fill the remaining seats with computer players when fewer humans are chosen', async () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)

    // 3 total players, then choose 1 human -> 2 computer players.
    await userEvent.click(screen.getByText('3 Players'))
    // The Human Players selector exposes buttons labeled 1..playerCount.
    await userEvent.click(screen.getByRole('button', { name: '1' }))

    // Only one human name input remains.
    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    expect(screen.getByText('Computer 2')).toBeInTheDocument()
    expect(screen.getByText('Computer 3')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /start game/i }))
    expect(mockOnStartGame).toHaveBeenCalledWith([
      { name: 'Player 1', tokenIndex: 0, isComputer: false },
      { name: 'Computer 2', tokenIndex: 1, isComputer: true },
      { name: 'Computer 3', tokenIndex: 2, isComputer: true },
    ])
  })

  it('should disable already selected tokens for other players', async () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)

    // Player 1 has token 0, Player 2 has token 1 by default
    // When selecting tokens for player 2, token 0 should be disabled
    const allButtons = screen.getAllByRole('button')
    const tokenButtons = allButtons.filter(
      btn => PLAYER_TOKENS.some(t => btn.getAttribute('title') === t.name)
    )

    // Some token buttons should be disabled (already taken)
    const disabledButtons = tokenButtons.filter(btn => btn.hasAttribute('disabled'))
    expect(disabledButtons.length).toBeGreaterThan(0)
  })

  it('should have proper styling for selected player count', async () => {
    render(<GameSetup onStartGame={mockOnStartGame} />)

    // 2 Players should be highlighted initially with Art Deco golden gradient
    const twoPlayersBtn = screen.getByText('2 Players')
    expect(twoPlayersBtn).toHaveClass('text-white')
    expect(twoPlayersBtn).toHaveClass('border-[#8B6914]')

    // Click 3 Players
    await userEvent.click(screen.getByText('3 Players'))
    expect(screen.getByText('3 Players')).toHaveClass('text-white')
    expect(screen.getByText('2 Players')).toHaveClass('bg-[#faf6ee]')
  })
})
