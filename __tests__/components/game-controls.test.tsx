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
})
