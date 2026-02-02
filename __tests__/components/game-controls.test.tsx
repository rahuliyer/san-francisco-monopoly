import { render, screen, fireEvent } from '@testing-library/react'
import { GameControls } from '@/components/game-controls'

describe('GameControls component', () => {
  const defaultProps = {
    diceValues: [3, 4] as [number, number],
    rolling: false,
    hasRolled: false,
    onRoll: jest.fn(),
    currentPlayerName: 'Alice',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display current player name', () => {
    render(<GameControls {...defaultProps} />)
    expect(screen.getByText("Alice's Turn")).toBeInTheDocument()
  })

  it('should render Roll Dice button', () => {
    render(<GameControls {...defaultProps} />)
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeInTheDocument()
  })

  it('should enable Roll Dice button when not rolled and not rolling', () => {
    render(<GameControls {...defaultProps} />)
    const rollButton = screen.getByRole('button', { name: /roll dice/i })
    expect(rollButton).not.toBeDisabled()
  })

  it('should disable Roll Dice button when already rolled', () => {
    render(<GameControls {...defaultProps} hasRolled={true} />)
    const rollButton = screen.getByRole('button', { name: /roll dice/i })
    expect(rollButton).toBeDisabled()
  })

  it('should disable Roll Dice button while rolling', () => {
    render(<GameControls {...defaultProps} rolling={true} />)
    const rollButton = screen.getByRole('button', { name: /rolling/i })
    expect(rollButton).toBeDisabled()
  })

  it('should show "Rolling..." text while rolling', () => {
    render(<GameControls {...defaultProps} rolling={true} />)
    expect(screen.getByRole('button', { name: /rolling/i })).toBeInTheDocument()
  })

  it('should call onRoll when Roll Dice button is clicked', () => {
    const onRoll = jest.fn()
    render(<GameControls {...defaultProps} onRoll={onRoll} />)

    fireEvent.click(screen.getByRole('button', { name: /roll dice/i }))
    expect(onRoll).toHaveBeenCalledTimes(1)
  })

  it('should display rolled total when hasRolled is true', () => {
    render(<GameControls {...defaultProps} diceValues={[3, 4]} hasRolled={true} />)
    expect(screen.getByText('Rolled: 7')).toBeInTheDocument()
  })

  it('should not display rolled total when hasRolled is false', () => {
    render(<GameControls {...defaultProps} diceValues={[3, 4]} hasRolled={false} />)
    expect(screen.queryByText(/rolled:/i)).not.toBeInTheDocument()
  })

  it('should not display rolled total while rolling', () => {
    render(<GameControls {...defaultProps} diceValues={[3, 4]} rolling={true} hasRolled={true} />)
    expect(screen.queryByText(/rolled:/i)).not.toBeInTheDocument()
  })

  it('should display different player names correctly', () => {
    const { rerender } = render(<GameControls {...defaultProps} currentPlayerName="Bob" />)
    expect(screen.getByText("Bob's Turn")).toBeInTheDocument()

    rerender(<GameControls {...defaultProps} currentPlayerName="Charlie" />)
    expect(screen.getByText("Charlie's Turn")).toBeInTheDocument()
  })

  it('should render dice component with values', () => {
    render(<GameControls {...defaultProps} diceValues={[3, 4]} />)
    // Check for dice container (3D dice uses gap-4)
    const diceContainer = document.querySelector('.flex.gap-4')
    expect(diceContainer).toBeInTheDocument()
  })

  describe('trade button', () => {
    it('should render Trade button when onTrade is provided', () => {
      render(<GameControls {...defaultProps} onTrade={jest.fn()} />)
      expect(screen.getByRole('button', { name: /trade/i })).toBeInTheDocument()
    })

    it('should call onTrade when Trade button is clicked', () => {
      const onTrade = jest.fn()
      render(<GameControls {...defaultProps} onTrade={onTrade} />)

      fireEvent.click(screen.getByRole('button', { name: /trade/i }))
      expect(onTrade).toHaveBeenCalledTimes(1)
    })

    it('should disable Trade button when tradeDisabled is true', () => {
      render(<GameControls {...defaultProps} onTrade={jest.fn()} tradeDisabled={true} />)
      expect(screen.getByRole('button', { name: /trade/i })).toBeDisabled()
    })
  })

  describe('manage properties button', () => {
    it('should render Manage Properties button when handler is provided', () => {
      render(<GameControls {...defaultProps} onManageProperties={jest.fn()} />)
      expect(screen.getByRole('button', { name: 'Manage Properties' })).toBeInTheDocument()
    })

    it('should call onManageProperties when Manage Properties button is clicked', () => {
      const onManageProperties = jest.fn()
      render(<GameControls {...defaultProps} onManageProperties={onManageProperties} />)

      fireEvent.click(screen.getByRole('button', { name: 'Manage Properties' }))
      expect(onManageProperties).toHaveBeenCalledTimes(1)
    })

    it('should disable Manage Properties button when managePropertiesDisabled is true', () => {
      render(
        <GameControls
          {...defaultProps}
          onManageProperties={jest.fn()}
          managePropertiesDisabled={true}
        />
      )

      expect(screen.getByRole('button', { name: 'Manage Properties' })).toBeDisabled()
    })
  })

  // Jail-related tests
  describe('when player is in jail', () => {
    const jailProps = {
      ...defaultProps,
      isInJail: true,
      jailTurns: 0,
      onPayJailFee: jest.fn(),
      canAffordJailFee: true,
    }

    it('should display jail status when player is in jail', () => {
      render(<GameControls {...jailProps} />)
      expect(screen.getByText(/In Alcatraz/)).toBeInTheDocument()
    })

    it('should show "Roll for Doubles" button when in jail', () => {
      render(<GameControls {...jailProps} />)
      expect(screen.getByRole('button', { name: /roll for doubles/i })).toBeInTheDocument()
    })

    it('should show "Pay $50 to Leave" button when in jail', () => {
      render(<GameControls {...jailProps} />)
      expect(screen.getByRole('button', { name: /pay \$50 to leave/i })).toBeInTheDocument()
    })

    it('should call onPayJailFee when Pay $50 button is clicked', () => {
      const onPayJailFee = jest.fn()
      render(<GameControls {...jailProps} onPayJailFee={onPayJailFee} />)

      fireEvent.click(screen.getByRole('button', { name: /pay \$50 to leave/i }))
      expect(onPayJailFee).toHaveBeenCalledTimes(1)
    })

    it('should disable Pay $50 button when player cannot afford it', () => {
      render(<GameControls {...jailProps} canAffordJailFee={false} />)
      const payButton = screen.getByRole('button', { name: /pay \$50 to leave/i })
      expect(payButton).toBeDisabled()
    })

    it('should show turn counter for jail turns', () => {
      render(<GameControls {...jailProps} jailTurns={1} />)
      expect(screen.getByText(/Turn 2 of 3/)).toBeInTheDocument()
    })

    it('should show final turn message on third jail turn', () => {
      render(<GameControls {...jailProps} jailTurns={2} />)
      expect(screen.getByText(/Final turn/)).toBeInTheDocument()
    })

    it('should call onRoll when Roll for Doubles button is clicked', () => {
      const onRoll = jest.fn()
      render(<GameControls {...jailProps} onRoll={onRoll} />)

      fireEvent.click(screen.getByRole('button', { name: /roll for doubles/i }))
      expect(onRoll).toHaveBeenCalledTimes(1)
    })

    it('should show doubles message when rolled doubles while in jail', () => {
      render(<GameControls {...jailProps} diceValues={[4, 4]} hasRolled={true} />)
      expect(screen.getByText(/Doubles! You're free!/)).toBeInTheDocument()
    })

    it('should show no doubles message when did not roll doubles while in jail', () => {
      render(<GameControls {...jailProps} diceValues={[3, 4]} hasRolled={true} jailTurns={0} />)
      expect(screen.getByText(/No doubles - still in Alcatraz/)).toBeInTheDocument()
    })

    it('should hide jail buttons and show standard Roll Dice button after rolling', () => {
      render(<GameControls {...jailProps} hasRolled={true} />)
      // After rolling, we should see the standard Roll Dice button, not the jail-specific buttons
      expect(screen.queryByRole('button', { name: /pay \$50 to leave/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /roll for doubles/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /roll dice/i })).toBeDisabled()
    })
  })
})
