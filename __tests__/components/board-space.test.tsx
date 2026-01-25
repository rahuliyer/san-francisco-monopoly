import { render, screen, fireEvent } from '@testing-library/react'
import { BoardSpace } from '@/components/board-space'
import { BOARD_SPACES, Player, Space } from '@/lib/game-data'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, ...props }: { alt: string; src: string; fill?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} data-fill={fill ? 'true' : undefined} />
  },
}))

describe('BoardSpace component', () => {
  const mockOnClick = jest.fn()

  const mockPlayer: Player = {
    id: 0,
    name: 'Alice',
    color: '#C4451A',
    token: '🚃',
    money: 1500,
    position: 0,
    properties: [],
    inJail: false,
    jailTurns: 0,
  }

  const propertySpace = BOARD_SPACES.find(s => s.name === 'Tenderloin')!
  const goSpace = BOARD_SPACES.find(s => s.type === 'go')!
  const railroadSpace = BOARD_SPACES.find(s => s.name === 'Caltrain')!
  const chanceSpace = BOARD_SPACES.find(s => s.type === 'chance')!

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Property spaces', () => {
    it('should display property name', () => {
      render(
        <BoardSpace
          space={propertySpace}
          players={[]}
          position="bottom"
        />
      )
      expect(screen.getByText('Tenderloin')).toBeInTheDocument()
    })

    it('should display property price', () => {
      render(
        <BoardSpace
          space={propertySpace}
          players={[]}
          position="bottom"
        />
      )
      expect(screen.getByText('$60')).toBeInTheDocument()
    })

    it('should display color bar for property', () => {
      const { container } = render(
        <BoardSpace
          space={propertySpace}
          players={[]}
          position="bottom"
        />
      )
      
      const colorBar = container.querySelector('[style*="background-color"]')
      expect(colorBar).toBeInTheDocument()
    })
  })

  describe('Special spaces', () => {
    it('should display GO space with image', () => {
      render(
        <BoardSpace
          space={goSpace}
          players={[]}
          position="bottom"
          isCorner={true}
        />
      )
      
      const image = screen.getByAltText(goSpace.name)
      expect(image).toBeInTheDocument()
    })

    it('should display Chance space with image', () => {
      render(
        <BoardSpace
          space={chanceSpace}
          players={[]}
          position="bottom"
        />
      )
      
      const image = screen.getByAltText('Chance')
      expect(image).toBeInTheDocument()
    })
  })

  describe('Player tokens', () => {
    it('should display player token when player is on space', () => {
      const playerOnSpace = { ...mockPlayer, position: propertySpace.id }
      
      render(
        <BoardSpace
          space={propertySpace}
          players={[playerOnSpace]}
          position="bottom"
        />
      )
      
      expect(screen.getByText('🚃')).toBeInTheDocument()
    })

    it('should not display player token when player is not on space', () => {
      const playerNotOnSpace = { ...mockPlayer, position: 5 }
      
      render(
        <BoardSpace
          space={propertySpace}
          players={[playerNotOnSpace]}
          position="bottom"
        />
      )
      
      expect(screen.queryByText('🚃')).not.toBeInTheDocument()
    })

    it('should display multiple player tokens', () => {
      const player1 = { ...mockPlayer, id: 0, position: propertySpace.id, token: '🚃' }
      const player2 = { ...mockPlayer, id: 1, position: propertySpace.id, token: '🦀' }
      
      render(
        <BoardSpace
          space={propertySpace}
          players={[player1, player2]}
          position="bottom"
        />
      )
      
      expect(screen.getByText('🚃')).toBeInTheDocument()
      expect(screen.getByText('🦀')).toBeInTheDocument()
    })
  })

  describe('Owner indicator', () => {
    it('should show owner color ring when property is owned', () => {
      const { container } = render(
        <BoardSpace
          space={propertySpace}
          players={[]}
          position="bottom"
          ownerColor="#C4451A"
        />
      )
      
      const spaceElement = container.firstChild
      expect(spaceElement).toHaveStyle({ boxShadow: 'inset 0 0 0 2px #C4451A' })
    })

    it('should not show owner ring when property is not owned', () => {
      const { container } = render(
        <BoardSpace
          space={propertySpace}
          players={[]}
          position="bottom"
        />
      )
      
      const spaceElement = container.firstChild
      expect(spaceElement).not.toHaveStyle({ boxShadow: expect.stringContaining('inset') })
    })
  })

  describe('Click handling', () => {
    it('should call onClick when space is clicked', () => {
      render(
        <BoardSpace
          space={propertySpace}
          players={[]}
          position="bottom"
          onClick={mockOnClick}
        />
      )
      
      fireEvent.click(screen.getByText('Tenderloin'))
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should not error when onClick is not provided', () => {
      render(
        <BoardSpace
          space={propertySpace}
          players={[]}
          position="bottom"
        />
      )
      
      // Should not throw
      expect(() => fireEvent.click(screen.getByText('Tenderloin'))).not.toThrow()
    })
  })

  describe('Position styling', () => {
    it('should apply correct styling for bottom position', () => {
      const { container } = render(
        <BoardSpace
          space={propertySpace}
          players={[]}
          position="bottom"
        />
      )
      
      // Non-corner bottom spaces should be h-20 w-12
      expect(container.firstChild).toHaveClass('h-20')
      expect(container.firstChild).toHaveClass('w-12')
    })

    it('should apply correct styling for corner spaces', () => {
      const { container } = render(
        <BoardSpace
          space={goSpace}
          players={[]}
          position="bottom"
          isCorner={true}
        />
      )
      
      // Corner spaces should be h-20 w-20
      expect(container.firstChild).toHaveClass('h-20')
      expect(container.firstChild).toHaveClass('w-20')
    })

    it('should apply correct styling for left position', () => {
      const { container } = render(
        <BoardSpace
          space={propertySpace}
          players={[]}
          position="left"
        />
      )
      
      // Left/right spaces should be h-12 w-20
      expect(container.firstChild).toHaveClass('h-12')
      expect(container.firstChild).toHaveClass('w-20')
    })
  })

  describe('Railroad and Utility spaces', () => {
    it('should display railroad name and price', () => {
      render(
        <BoardSpace
          space={railroadSpace}
          players={[]}
          position="bottom"
        />
      )
      
      expect(screen.getByText('Caltrain')).toBeInTheDocument()
      expect(screen.getByText('$200')).toBeInTheDocument()
    })
  })
})
