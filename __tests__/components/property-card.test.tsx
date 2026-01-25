import { render, screen, fireEvent } from '@testing-library/react'
import { PropertyCard } from '@/components/property-card'
import { BOARD_SPACES, Player, Space } from '@/lib/game-data'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, ...props }: { alt: string; src: string; fill?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} data-fill={fill ? 'true' : undefined} />
  },
}))

describe('PropertyCard component', () => {
  const mockOnClose = jest.fn()
  const mockOnBuy = jest.fn()

  // Get sample spaces
  const propertySpace = BOARD_SPACES.find(s => s.name === 'Tenderloin')!
  const railroadSpace = BOARD_SPACES.find(s => s.name === 'Caltrain')!
  const utilitySpace = BOARD_SPACES.find(s => s.name === 'PG&E')!

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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Property cards', () => {
    it('should display property name', () => {
      render(
        <PropertyCard
          space={propertySpace}
          onClose={mockOnClose}
        />
      )
      expect(screen.getByText('Tenderloin')).toBeInTheDocument()
    })

    it('should display "Title Deed" label', () => {
      render(
        <PropertyCard
          space={propertySpace}
          onClose={mockOnClose}
        />
      )
      expect(screen.getByText('Title Deed')).toBeInTheDocument()
    })

    it('should display property price', () => {
      render(
        <PropertyCard
          space={propertySpace}
          onClose={mockOnClose}
        />
      )
      expect(screen.getByText(`Price: $${propertySpace.price}`)).toBeInTheDocument()
    })

    it('should display rent values for properties', () => {
      render(
        <PropertyCard
          space={propertySpace}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByText('Rent')).toBeInTheDocument()
      expect(screen.getByText(`$${propertySpace.rent![0]}`)).toBeInTheDocument()
      expect(screen.getByText('With 1 House')).toBeInTheDocument()
      expect(screen.getByText('With 2 Houses')).toBeInTheDocument()
      expect(screen.getByText('With 3 Houses')).toBeInTheDocument()
      expect(screen.getByText('With 4 Houses')).toBeInTheDocument()
      expect(screen.getByText('With Hotel')).toBeInTheDocument()
    })

    it('should display house cost', () => {
      render(
        <PropertyCard
          space={propertySpace}
          onClose={mockOnClose}
        />
      )
      expect(screen.getByText('House Cost')).toBeInTheDocument()
      expect(screen.getByText(`$${propertySpace.houseCost}`)).toBeInTheDocument()
    })

    it('should display mortgage value', () => {
      render(
        <PropertyCard
          space={propertySpace}
          onClose={mockOnClose}
        />
      )
      expect(screen.getByText('Mortgage Value')).toBeInTheDocument()
      // Mortgage value for Tenderloin is $30, which may also appear as rent with 2 houses
      // So we check that the label exists and that there are matching values
      const mortgageValues = screen.getAllByText(`$${propertySpace.mortgage}`)
      expect(mortgageValues.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Railroad cards', () => {
    it('should display railroad rent structure', () => {
      render(
        <PropertyCard
          space={railroadSpace}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByText('Rent with 1 Railroad')).toBeInTheDocument()
      expect(screen.getByText('Rent with 2 Railroads')).toBeInTheDocument()
      expect(screen.getByText('Rent with 3 Railroads')).toBeInTheDocument()
      expect(screen.getByText('Rent with 4 Railroads')).toBeInTheDocument()
    })

    it('should display correct railroad rent values', () => {
      render(
        <PropertyCard
          space={railroadSpace}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByText('$25')).toBeInTheDocument()
      expect(screen.getByText('$50')).toBeInTheDocument()
      expect(screen.getByText('$100')).toBeInTheDocument()
      expect(screen.getByText('$200')).toBeInTheDocument()
    })

    it('should display mortgage value for railroads', () => {
      render(
        <PropertyCard
          space={railroadSpace}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Mortgage Value')).toBeInTheDocument()
      const mortgageValues = screen.getAllByText(`$${railroadSpace.mortgage}`)
      expect(mortgageValues.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Utility cards', () => {
    it('should display utility rent explanation', () => {
      render(
        <PropertyCard
          space={utilitySpace}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByText(/4x the dice roll/i)).toBeInTheDocument()
      expect(screen.getByText(/10x the dice roll/i)).toBeInTheDocument()
    })

    it('should display mortgage value for utilities', () => {
      render(
        <PropertyCard
          space={utilitySpace}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Mortgage Value')).toBeInTheDocument()
      expect(screen.getByText(`$${utilitySpace.mortgage}`)).toBeInTheDocument()
    })
  })

  describe('Close button', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <PropertyCard
          space={propertySpace}
          onClose={mockOnClose}
        />
      )
      
      const closeButton = screen.getByRole('button', { name: '' }) // X icon button
      fireEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Buy button', () => {
    it('should show buy button when canBuy is true', () => {
      render(
        <PropertyCard
          space={propertySpace}
          onClose={mockOnClose}
          onBuy={mockOnBuy}
          canBuy={true}
        />
      )
      
      expect(screen.getByRole('button', { name: /buy for \$60/i })).toBeInTheDocument()
    })

    it('should not show buy button when canBuy is false', () => {
      render(
        <PropertyCard
          space={propertySpace}
          onClose={mockOnClose}
          onBuy={mockOnBuy}
          canBuy={false}
        />
      )
      
      expect(screen.queryByRole('button', { name: /buy/i })).not.toBeInTheDocument()
    })

    it('should not show buy button when onBuy is not provided', () => {
      render(
        <PropertyCard
          space={propertySpace}
          onClose={mockOnClose}
          canBuy={true}
        />
      )
      
      expect(screen.queryByRole('button', { name: /buy/i })).not.toBeInTheDocument()
    })

    it('should call onBuy when buy button is clicked', () => {
      render(
        <PropertyCard
          space={propertySpace}
          onClose={mockOnClose}
          onBuy={mockOnBuy}
          canBuy={true}
        />
      )
      
      fireEvent.click(screen.getByRole('button', { name: /buy/i }))
      expect(mockOnBuy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Mortgage actions', () => {
    const mockOnMortgage = jest.fn()
    const mockOnUnmortgage = jest.fn()

    it('should show mortgage button when canMortgage is true', () => {
      render(
        <PropertyCard
          space={propertySpace}
          owner={mockPlayer}
          onClose={mockOnClose}
          onMortgage={mockOnMortgage}
          canMortgage={true}
        />
      )

      expect(screen.getByRole('button', { name: /mortgage for \$30/i })).toBeInTheDocument()
    })

    it('should call onMortgage when mortgage button is clicked', () => {
      render(
        <PropertyCard
          space={propertySpace}
          owner={mockPlayer}
          onClose={mockOnClose}
          onMortgage={mockOnMortgage}
          canMortgage={true}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /mortgage for/i }))
      expect(mockOnMortgage).toHaveBeenCalledTimes(1)
    })

    it('should show disabled unmortgage button when player cannot afford', () => {
      render(
        <PropertyCard
          space={propertySpace}
          owner={mockPlayer}
          onClose={mockOnClose}
          onUnmortgage={mockOnUnmortgage}
          canUnmortgage={true}
          canAffordUnmortgage={false}
          unmortgageCost={33}
          isMortgaged={true}
        />
      )

      const button = screen.getByRole('button', { name: /lift mortgage for \$33/i })
      expect(button).toBeDisabled()
    })

    it('should show mortgaged status message', () => {
      render(
        <PropertyCard
          space={propertySpace}
          owner={mockPlayer}
          onClose={mockOnClose}
          isMortgaged={true}
        />
      )

      expect(screen.getByText(/mortgaged to the bank/i)).toBeInTheDocument()
    })

    it('should default unmortgage cost to 10% interest', () => {
      render(
        <PropertyCard
          space={propertySpace}
          owner={mockPlayer}
          onClose={mockOnClose}
          onUnmortgage={mockOnUnmortgage}
          canUnmortgage={true}
          isMortgaged={true}
        />
      )

      expect(screen.getByRole('button', { name: /lift mortgage for \$33/i })).toBeInTheDocument()
    })
  })

  describe('Owner display', () => {
    it('should show owner info when property is owned', () => {
      render(
        <PropertyCard
          space={propertySpace}
          owner={mockPlayer}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.getByText('Owned by Alice')).toBeInTheDocument()
      expect(screen.getByText('🚃')).toBeInTheDocument()
    })

    it('should not show owner info when property is not owned', () => {
      render(
        <PropertyCard
          space={propertySpace}
          onClose={mockOnClose}
        />
      )
      
      expect(screen.queryByText(/owned by/i)).not.toBeInTheDocument()
    })
  })

  describe('Image display', () => {
    it('should display property image when available', () => {
      render(
        <PropertyCard
          space={propertySpace}
          onClose={mockOnClose}
        />
      )
      
      const image = screen.getByAltText(`${propertySpace.name} neighborhood`)
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', propertySpace.image)
    })
  })

  describe('Modal overlay', () => {
    it('should render as a modal with overlay', () => {
      const { container } = render(
        <PropertyCard
          space={propertySpace}
          onClose={mockOnClose}
        />
      )
      
      const overlay = container.querySelector('.fixed.inset-0.z-50')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass('bg-black/50')
    })
  })
})
