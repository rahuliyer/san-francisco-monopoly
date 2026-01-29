import { render, screen } from '@testing-library/react'
import { PlayerPanel } from '@/components/player-panel'
import { Player, BOARD_SPACES } from '@/lib/game-data'

describe('PlayerPanel component', () => {
  const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: 0,
    name: 'Alice',
    color: '#C4451A',
    token: '🚃',
    money: 1500,
    position: 0,
    properties: [],
    inJail: false,
    jailTurns: 0,
    isBankrupt: false,
    ...overrides,
  })

  it('should display player name', () => {
    render(
      <PlayerPanel
        player={createMockPlayer({ name: 'Bob' })}
        isCurrentTurn={false}
        propertyOwners={{}}
      />
    )
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('should display player money with formatting', () => {
    render(
      <PlayerPanel
        player={createMockPlayer({ money: 1500 })}
        isCurrentTurn={false}
        propertyOwners={{}}
      />
    )
    expect(screen.getByText('$1,500')).toBeInTheDocument()
  })

  it('should display large money amounts with proper formatting', () => {
    render(
      <PlayerPanel
        player={createMockPlayer({ money: 10000 })}
        isCurrentTurn={false}
        propertyOwners={{}}
      />
    )
    expect(screen.getByText('$10,000')).toBeInTheDocument()
  })

  it('should display player token', () => {
    render(
      <PlayerPanel
        player={createMockPlayer({ token: '🦀' })}
        isCurrentTurn={false}
        propertyOwners={{}}
      />
    )
    expect(screen.getByText('🦀')).toBeInTheDocument()
  })

  it('should show "Your Turn" indicator when it is current turn', () => {
    render(
      <PlayerPanel
        player={createMockPlayer()}
        isCurrentTurn={true}
        propertyOwners={{}}
      />
    )
    expect(screen.getByText('Your Turn')).toBeInTheDocument()
  })

  it('should not show "Your Turn" when it is not current turn', () => {
    render(
      <PlayerPanel
        player={createMockPlayer()}
        isCurrentTurn={false}
        propertyOwners={{}}
      />
    )
    expect(screen.queryByText('Your Turn')).not.toBeInTheDocument()
  })

  it('should show bankrupt status and hide turn indicator', () => {
    render(
      <PlayerPanel
        player={createMockPlayer({ isBankrupt: true })}
        isCurrentTurn={true}
        propertyOwners={{}}
      />
    )
    expect(screen.getByText('Bankrupt')).toBeInTheDocument()
    expect(screen.queryByText('Your Turn')).not.toBeInTheDocument()
  })

  it('should apply special styling when it is current turn', () => {
    const { container } = render(
      <PlayerPanel
        player={createMockPlayer()}
        isCurrentTurn={true}
        propertyOwners={{}}
      />
    )
    const panel = container.firstChild
    // Art Deco styled border with golden color
    expect(panel).toHaveClass('border-[#d4af37]')
    expect(panel).toHaveClass('ring-2')
    expect(panel).toHaveClass('golden-glow')
  })

  it('should show jail status when player is in jail', () => {
    render(
      <PlayerPanel
        player={createMockPlayer({ inJail: true, jailTurns: 1 })}
        isCurrentTurn={false}
        propertyOwners={{}}
      />
    )
    expect(screen.getByText(/in alcatraz/i)).toBeInTheDocument()
    expect(screen.getByText(/2 turns left/i)).toBeInTheDocument()
  })

  it('should show correct turns remaining in jail', () => {
    render(
      <PlayerPanel
        player={createMockPlayer({ inJail: true, jailTurns: 2 })}
        isCurrentTurn={false}
        propertyOwners={{}}
      />
    )
    expect(screen.getByText(/1 turns left/i)).toBeInTheDocument()
  })

  it('should not show jail status when player is not in jail', () => {
    render(
      <PlayerPanel
        player={createMockPlayer({ inJail: false })}
        isCurrentTurn={false}
        propertyOwners={{}}
      />
    )
    expect(screen.queryByText(/in alcatraz/i)).not.toBeInTheDocument()
  })

  it('should display owned properties count', () => {
    const player = createMockPlayer({ id: 0 })
    const propertyOwners = { 1: 0, 3: 0 } // Player 0 owns spaces 1 and 3

    render(
      <PlayerPanel
        player={player}
        isCurrentTurn={false}
        propertyOwners={propertyOwners}
      />
    )
    expect(screen.getByText('Properties (2)')).toBeInTheDocument()
  })

  it('should not show properties section when player owns none', () => {
    render(
      <PlayerPanel
        player={createMockPlayer()}
        isCurrentTurn={false}
        propertyOwners={{}}
      />
    )
    expect(screen.queryByText(/properties/i)).not.toBeInTheDocument()
  })

  it('should display property color indicators', () => {
    const player = createMockPlayer({ id: 0 })
    // Tenderloin (id: 1) is brown
    const propertyOwners = { 1: 0 }

    const { container } = render(
      <PlayerPanel
        player={player}
        isCurrentTurn={false}
        propertyOwners={propertyOwners}
      />
    )

    // Check for property color indicator
    const propertyIndicators = container.querySelectorAll('.h-3.w-3.rounded-sm')
    expect(propertyIndicators).toHaveLength(1)
  })

  it('should render player token with correct title (name)', () => {
    render(
      <PlayerPanel
        player={createMockPlayer({ name: 'TestPlayer', color: '#2563EB' })}
        isCurrentTurn={false}
        propertyOwners={{}}
      />
    )
    
    // The 3D token component sets the title attribute to the player name
    expect(screen.getByTitle('TestPlayer')).toBeInTheDocument()
  })
})
