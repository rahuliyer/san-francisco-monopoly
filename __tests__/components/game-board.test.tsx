import { render, screen, fireEvent } from '@testing-library/react'
import { GameBoard } from '@/components/game-board'
import { Player, BOARD_SPACES } from '@/lib/game-data'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, ...props }: { alt: string; src: string; fill?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} data-fill={fill ? 'true' : undefined} />
  },
}))

describe('GameBoard component', () => {
  const mockOnSpaceClick = jest.fn()

  const createMockPlayers = (count: number): Player[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      name: `Player ${i + 1}`,
      color: ['#C4451A', '#2563EB', '#16A34A', '#9333EA'][i],
      token: ['🚃', '🦀', '🏠', '🌉'][i],
      money: 1500,
      position: i * 10, // Place players at different positions
      properties: [],
      inJail: false,
      jailTurns: 0,
      isBankrupt: false,
    }))
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the game board with title', () => {
    render(
      <GameBoard
        players={[]}
        propertyOwners={{}}
      />
    )

    // Art Deco styled title
    expect(screen.getByText('SAN FRANCISCO')).toBeInTheDocument()
    expect(screen.getByText('MONOPOLY')).toBeInTheDocument()
    expect(screen.getByText('The City by the Bay Edition')).toBeInTheDocument()
  })

  it('should render all 40 board spaces', () => {
    const { container } = render(
      <GameBoard
        players={[]}
        propertyOwners={{}}
      />
    )
    
    // Check for corner spaces
    expect(screen.getByText("Fisherman's Wharf")).toBeInTheDocument() // GO
    expect(screen.getByText('Alcatraz')).toBeInTheDocument() // Jail
    expect(screen.getByText('Golden Gate Park')).toBeInTheDocument() // Free Parking
    expect(screen.getByText('Go To Alcatraz')).toBeInTheDocument() // Go to Jail
  })

  it('should display player tokens on the board', () => {
    const players = createMockPlayers(2)
    
    render(
      <GameBoard
        players={players}
        propertyOwners={{}}
      />
    )
    
    expect(screen.getByText('🚃')).toBeInTheDocument()
    expect(screen.getByText('🦀')).toBeInTheDocument()
  })

  it('should call onSpaceClick when a space is clicked', () => {
    render(
      <GameBoard
        players={[]}
        onSpaceClick={mockOnSpaceClick}
        propertyOwners={{}}
      />
    )
    
    fireEvent.click(screen.getByText('Tenderloin'))
    
    expect(mockOnSpaceClick).toHaveBeenCalledTimes(1)
    expect(mockOnSpaceClick).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Tenderloin' })
    )
  })

  it('should show property ownership', () => {
    const players = createMockPlayers(2)
    const propertyOwners = { 1: 0 } // Player 0 owns Tenderloin (id: 1)
    
    const { container } = render(
      <GameBoard
        players={players}
        propertyOwners={propertyOwners}
      />
    )
    
    // The owned property should have an owner color indicator
    const tenderloinSpace = container.querySelector('[style*="box-shadow"]')
    expect(tenderloinSpace).toBeInTheDocument()
  })

  it('should render property names', () => {
    render(
      <GameBoard
        players={[]}
        propertyOwners={{}}
      />
    )
    
    // Check for various properties
    expect(screen.getByText('Tenderloin')).toBeInTheDocument()
    expect(screen.getByText('Bayview')).toBeInTheDocument()
    expect(screen.getByText('Sea Cliff')).toBeInTheDocument()
    expect(screen.getByText('Presidio Heights')).toBeInTheDocument()
  })

  it('should render railroad names', () => {
    render(
      <GameBoard
        players={[]}
        propertyOwners={{}}
      />
    )
    
    expect(screen.getByText('Caltrain')).toBeInTheDocument()
    expect(screen.getByText('BART')).toBeInTheDocument()
    expect(screen.getByText('Muni')).toBeInTheDocument()
    expect(screen.getByText('Cable Car')).toBeInTheDocument()
  })

  it('should render utility names', () => {
    render(
      <GameBoard
        players={[]}
        propertyOwners={{}}
      />
    )
    
    expect(screen.getByText('PG&E')).toBeInTheDocument()
    expect(screen.getByText('SF Water')).toBeInTheDocument()
  })

  it('should render tax spaces', () => {
    render(
      <GameBoard
        players={[]}
        propertyOwners={{}}
      />
    )
    
    expect(screen.getByText('Income Tax')).toBeInTheDocument()
    expect(screen.getByText('Luxury Tax')).toBeInTheDocument()
  })

  it('should use grid layout', () => {
    const { container } = render(
      <GameBoard
        players={[]}
        propertyOwners={{}}
      />
    )
    
    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toBeInTheDocument()
  })

  it('should handle multiple players at the same position', () => {
    const players = [
      createMockPlayers(2)[0],
      { ...createMockPlayers(2)[1], position: 0 }, // Both at GO
    ]
    
    render(
      <GameBoard
        players={players}
        propertyOwners={{}}
      />
    )
    
    // Both tokens should be visible
    expect(screen.getByText('🚃')).toBeInTheDocument()
    expect(screen.getByText('🦀')).toBeInTheDocument()
  })
})
