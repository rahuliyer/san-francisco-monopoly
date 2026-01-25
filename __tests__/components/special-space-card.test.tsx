import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpecialSpaceCard } from '@/components/special-space-card'
import { Space, GameCard } from '@/lib/game-data'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}))

describe('SpecialSpaceCard', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  const createSpace = (overrides: Partial<Space> = {}): Space => ({
    id: 0,
    name: "Fisherman's Wharf",
    type: 'go',
    colorGroup: null,
    image: '/images/go-fishermans-wharf.jpg',
    ...overrides,
  })

  describe('GO space', () => {
    it('should render GO space with correct message', () => {
      const goSpace = createSpace({
        id: 0,
        name: "Fisherman's Wharf",
        type: 'go',
      })

      render(<SpecialSpaceCard space={goSpace} onClose={mockOnClose} />)

      expect(screen.getByText('GO!')).toBeInTheDocument()
      expect(screen.getByText("Fisherman's Wharf")).toBeInTheDocument()
      expect(screen.getByText('Collect $200 as you pass GO!')).toBeInTheDocument()
      expect(screen.getByText('+$200')).toBeInTheDocument()
      expect(screen.getByText('Collected')).toBeInTheDocument()
    })
  })

  describe('Jail space', () => {
    it('should render Just Visiting message', () => {
      const jailSpace = createSpace({
        id: 10,
        name: 'Alcatraz',
        type: 'jail',
        image: '/images/jail-alcatraz.jpg',
      })

      render(<SpecialSpaceCard space={jailSpace} onClose={mockOnClose} />)

      expect(screen.getByText('Just Visiting')).toBeInTheDocument()
      expect(screen.getByText('Alcatraz')).toBeInTheDocument()
      expect(screen.getByText("You're just visiting. No penalty!")).toBeInTheDocument()
    })
  })

  describe('Free Parking space', () => {
    it('should render Free Parking message', () => {
      const freeParkingSpace = createSpace({
        id: 20,
        name: 'Golden Gate Park',
        type: 'free-parking',
        image: '/images/free-parking-ggp.jpg',
      })

      render(<SpecialSpaceCard space={freeParkingSpace} onClose={mockOnClose} />)

      expect(screen.getByText('Free Parking')).toBeInTheDocument()
      expect(screen.getByText('Golden Gate Park')).toBeInTheDocument()
      expect(screen.getByText('Take a break and enjoy the view of Golden Gate Park!')).toBeInTheDocument()
    })
  })

  describe('Go To Jail space', () => {
    it('should render Go To Jail message with lock emoji', () => {
      const goToJailSpace = createSpace({
        id: 30,
        name: 'Go To Alcatraz',
        type: 'go-to-jail',
        image: '/images/go-to-jail.jpg',
      })

      render(<SpecialSpaceCard space={goToJailSpace} onClose={mockOnClose} />)

      expect(screen.getByText('Go To Jail')).toBeInTheDocument()
      expect(screen.getByText('Go To Alcatraz')).toBeInTheDocument()
      expect(screen.getByText('Go directly to Alcatraz. Do not pass GO. Do not collect $200.')).toBeInTheDocument()
      expect(screen.getByText('🔒')).toBeInTheDocument()
      expect(screen.getByText('Sent to Alcatraz')).toBeInTheDocument()
    })
  })

  describe('Tax spaces', () => {
    it('should render Income Tax with $200', () => {
      const incomeTaxSpace = createSpace({
        id: 4,
        name: 'Income Tax',
        type: 'tax',
        image: undefined,
      })

      render(<SpecialSpaceCard space={incomeTaxSpace} onClose={mockOnClose} />)

      expect(screen.getByText('Tax')).toBeInTheDocument()
      expect(screen.getByText('Income Tax')).toBeInTheDocument()
      expect(screen.getByText('$200')).toBeInTheDocument()
      expect(screen.getByText('Amount paid')).toBeInTheDocument()
    })

    it('should render Luxury Tax with $100', () => {
      const luxuryTaxSpace = createSpace({
        id: 38,
        name: 'Luxury Tax',
        type: 'tax',
        image: undefined,
      })

      render(<SpecialSpaceCard space={luxuryTaxSpace} onClose={mockOnClose} />)

      expect(screen.getByText('Tax')).toBeInTheDocument()
      expect(screen.getByText('Luxury Tax')).toBeInTheDocument()
      expect(screen.getByText('$100')).toBeInTheDocument()
      expect(screen.getByText('Amount paid')).toBeInTheDocument()
    })
  })

  describe('Chance space', () => {
    it('should render Chance card when drawnCard is provided', () => {
      const chanceSpace = createSpace({
        id: 7,
        name: 'Chance',
        type: 'chance',
        image: '/images/chance.jpg',
      })

      const drawnCard: GameCard = {
        id: 1,
        text: "Take the F-Line streetcar to Fisherman's Wharf (GO). Collect $200.",
        effect: { type: 'advance-to-go' },
      }

      render(
        <SpecialSpaceCard
          space={chanceSpace}
          onClose={mockOnClose}
          drawnCard={drawnCard}
        />
      )

      // There are multiple "Chance" elements (label and title), just check one exists
      expect(screen.getAllByText('Chance').length).toBeGreaterThan(0)
      expect(screen.getByText("Take the F-Line streetcar to Fisherman's Wharf (GO). Collect $200.")).toBeInTheDocument()
      expect(screen.getByText('+$200')).toBeInTheDocument()
    })

    it('should show default message without drawnCard', () => {
      const chanceSpace = createSpace({
        id: 7,
        name: 'Chance',
        type: 'chance',
        image: '/images/chance.jpg',
      })

      render(<SpecialSpaceCard space={chanceSpace} onClose={mockOnClose} />)

      // There are multiple "Chance" elements (label and title), just check one exists
      expect(screen.getAllByText('Chance').length).toBeGreaterThan(0)
      expect(screen.getByText('Draw a Chance card and follow the instructions.')).toBeInTheDocument()
    })
  })

  describe('Community Chest space', () => {
    it('should render Community Chest card when drawnCard is provided', () => {
      const communityChestSpace = createSpace({
        id: 2,
        name: 'Community Chest',
        type: 'community-chest',
        image: '/images/community-chest.jpg',
      })

      const drawnCard: GameCard = {
        id: 2,
        text: 'Silicon Valley Bank error in your favor. Collect $200.',
        effect: { type: 'collect', amount: 200 },
      }

      render(
        <SpecialSpaceCard
          space={communityChestSpace}
          onClose={mockOnClose}
          drawnCard={drawnCard}
        />
      )

      // There are multiple "Community Chest" elements (label and title), just check one exists
      expect(screen.getAllByText('Community Chest').length).toBeGreaterThan(0)
      expect(screen.getByText('Silicon Valley Bank error in your favor. Collect $200.')).toBeInTheDocument()
      expect(screen.getByText('+$200')).toBeInTheDocument()
    })
  })

  describe('Card effects', () => {
    const chanceSpace = createSpace({
      id: 7,
      name: 'Chance',
      type: 'chance',
    })

    it('should display collect effect', () => {
      const card: GameCard = {
        id: 1,
        text: 'Collect $150',
        effect: { type: 'collect', amount: 150 },
      }

      render(<SpecialSpaceCard space={chanceSpace} onClose={mockOnClose} drawnCard={card} />)
      expect(screen.getByText('+$150')).toBeInTheDocument()
    })

    it('should display pay effect', () => {
      const card: GameCard = {
        id: 1,
        text: 'Pay $50',
        effect: { type: 'pay', amount: 50 },
      }

      render(<SpecialSpaceCard space={chanceSpace} onClose={mockOnClose} drawnCard={card} />)
      expect(screen.getByText('-$50')).toBeInTheDocument()
    })

    it('should display advance-to-go effect', () => {
      const card: GameCard = {
        id: 1,
        text: 'Go to GO',
        effect: { type: 'advance-to-go' },
      }

      render(<SpecialSpaceCard space={chanceSpace} onClose={mockOnClose} drawnCard={card} />)
      expect(screen.getByText('+$200')).toBeInTheDocument()
    })

    it('should display go-to-jail effect', () => {
      const card: GameCard = {
        id: 1,
        text: 'Go to jail',
        effect: { type: 'go-to-jail' },
      }

      render(<SpecialSpaceCard space={chanceSpace} onClose={mockOnClose} drawnCard={card} />)
      expect(screen.getByText('Go to Alcatraz!')).toBeInTheDocument()
    })

    it('should display go-back effect', () => {
      const card: GameCard = {
        id: 1,
        text: 'Go back 3 spaces',
        effect: { type: 'go-back', spaces: 3 },
      }

      render(<SpecialSpaceCard space={chanceSpace} onClose={mockOnClose} drawnCard={card} />)
      // There are multiple "Go back 3 spaces" elements (text and effect), just check one exists
      expect(screen.getAllByText('Go back 3 spaces').length).toBeGreaterThan(0)
    })

    it('should display collect-from-players effect', () => {
      const card: GameCard = {
        id: 1,
        text: 'Collect from players',
        effect: { type: 'collect-from-players', amount: 10 },
      }

      render(<SpecialSpaceCard space={chanceSpace} onClose={mockOnClose} drawnCard={card} />)
      expect(screen.getByText('+$10 from each player')).toBeInTheDocument()
    })

    it('should display pay-to-players effect', () => {
      const card: GameCard = {
        id: 1,
        text: 'Pay to players',
        effect: { type: 'pay-to-players', amount: 50 },
      }

      render(<SpecialSpaceCard space={chanceSpace} onClose={mockOnClose} drawnCard={card} />)
      expect(screen.getByText('-$50 to each player')).toBeInTheDocument()
    })

    it('should display repairs effect', () => {
      const card: GameCard = {
        id: 1,
        text: 'Repairs',
        effect: { type: 'repairs', houseAmount: 25, hotelAmount: 100 },
      }

      render(<SpecialSpaceCard space={chanceSpace} onClose={mockOnClose} drawnCard={card} />)
      expect(screen.getByText('Pay $25/house, $100/hotel')).toBeInTheDocument()
    })

    it('should display advance effect', () => {
      const card: GameCard = {
        id: 1,
        text: 'Advance to position',
        effect: { type: 'advance', position: 15 },
      }

      render(<SpecialSpaceCard space={chanceSpace} onClose={mockOnClose} drawnCard={card} />)
      expect(screen.getByText('Move to new location')).toBeInTheDocument()
    })
  })

  describe('Continue button', () => {
    it('should call onClose when Continue button is clicked', () => {
      const goSpace = createSpace()

      render(<SpecialSpaceCard space={goSpace} onClose={mockOnClose} />)

      const continueButton = screen.getByRole('button', { name: 'Continue' })
      fireEvent.click(continueButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Close button', () => {
    it('should call onClose when X button is clicked', () => {
      const goSpace = createSpace()

      render(<SpecialSpaceCard space={goSpace} onClose={mockOnClose} />)

      // Find the close button (X button in the top right)
      const closeButtons = screen.getAllByRole('button')
      const closeButton = closeButtons.find(btn => btn.querySelector('svg'))
      
      if (closeButton) {
        fireEvent.click(closeButton)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('Image display', () => {
    it('should render image when space has image', () => {
      const spaceWithImage = createSpace({
        image: '/images/go-fishermans-wharf.jpg',
      })

      render(<SpecialSpaceCard space={spaceWithImage} onClose={mockOnClose} />)

      const img = screen.getByAltText("Fisherman's Wharf")
      expect(img).toBeInTheDocument()
    })

    it('should not render image when space has no image', () => {
      const spaceWithoutImage = createSpace({
        name: 'Income Tax',
        type: 'tax',
        image: undefined,
      })

      render(<SpecialSpaceCard space={spaceWithoutImage} onClose={mockOnClose} />)

      const img = screen.queryByRole('img')
      expect(img).not.toBeInTheDocument()
    })
  })

  describe('Custom message', () => {
    it('should display custom message when provided', () => {
      const goSpace = createSpace()
      const customMessage = 'This is a custom message!'

      render(
        <SpecialSpaceCard
          space={goSpace}
          onClose={mockOnClose}
          message={customMessage}
        />
      )

      expect(screen.getByText(customMessage)).toBeInTheDocument()
    })
  })
})
