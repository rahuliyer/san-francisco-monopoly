import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LiquidationModal } from '@/components/liquidation-modal'
import { Player } from '@/lib/game-data'

const createPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 0,
  name: 'Alice',
  color: '#C4451A',
  token: '/images/tokens/crab.png',
  money: -100,
  position: 0,
  properties: [1],
  inJail: false,
  jailTurns: 0,
  isBankrupt: false,
  getOutOfJailFreeCards: [],
  ...overrides,
})

describe('LiquidationModal', () => {
  const mockOnSellHouse = jest.fn()
  const mockOnMortgageProperty = jest.fn()
  const mockOnDeclareBankruptcy = jest.fn()

  beforeEach(() => {
    mockOnSellHouse.mockClear()
    mockOnMortgageProperty.mockClear()
    mockOnDeclareBankruptcy.mockClear()
  })

  it('displays the debt amount', () => {
    const player = createPlayer({ money: -150 })

    render(
      <LiquidationModal
        player={player}
        propertyOwners={{ 1: 0 }}
        propertyHouses={{}}
        mortgagedProperties={{}}
        creditorName={null}
        onSellHouse={mockOnSellHouse}
        onMortgageProperty={mockOnMortgageProperty}
        onDeclareBankruptcy={mockOnDeclareBankruptcy}
      />
    )

    expect(screen.getByText('-$150')).toBeInTheDocument()
  })

  it('shows creditor name when debt is to a player', () => {
    const player = createPlayer({ money: -100 })

    render(
      <LiquidationModal
        player={player}
        propertyOwners={{ 1: 0 }}
        propertyHouses={{}}
        mortgagedProperties={{}}
        creditorName="Bob"
        onSellHouse={mockOnSellHouse}
        onMortgageProperty={mockOnMortgageProperty}
        onDeclareBankruptcy={mockOnDeclareBankruptcy}
      />
    )

    expect(screen.getByText(/to Bob/)).toBeInTheDocument()
  })

  it('shows "to the bank" when debt is to the bank', () => {
    const player = createPlayer({ money: -100 })

    render(
      <LiquidationModal
        player={player}
        propertyOwners={{ 1: 0 }}
        propertyHouses={{}}
        mortgagedProperties={{}}
        creditorName={null}
        onSellHouse={mockOnSellHouse}
        onMortgageProperty={mockOnMortgageProperty}
        onDeclareBankruptcy={mockOnDeclareBankruptcy}
      />
    )

    expect(screen.getByText(/to the bank/)).toBeInTheDocument()
  })

  it('shows mortgage button for unmortgaged properties without houses', () => {
    const player = createPlayer({ money: -100 })

    render(
      <LiquidationModal
        player={player}
        propertyOwners={{ 1: 0 }}
        propertyHouses={{}}
        mortgagedProperties={{}}
        creditorName={null}
        onSellHouse={mockOnSellHouse}
        onMortgageProperty={mockOnMortgageProperty}
        onDeclareBankruptcy={mockOnDeclareBankruptcy}
      />
    )

    // Space 1 (Tenderloin) has mortgage value 30
    const mortgageButton = screen.getByRole('button', { name: /Mortgage \+\$30/ })
    expect(mortgageButton).toBeInTheDocument()

    fireEvent.click(mortgageButton)
    expect(mockOnMortgageProperty).toHaveBeenCalledWith(1)
  })

  it('shows sell house button when property has houses', () => {
    const player = createPlayer({ money: -100 })

    render(
      <LiquidationModal
        player={player}
        propertyOwners={{ 1: 0 }}
        propertyHouses={{ 1: 2 }}
        mortgagedProperties={{}}
        creditorName={null}
        onSellHouse={mockOnSellHouse}
        onMortgageProperty={mockOnMortgageProperty}
        onDeclareBankruptcy={mockOnDeclareBankruptcy}
      />
    )

    // Space 1 (Tenderloin) has houseCost 50, sell value = 25
    const sellButton = screen.getByRole('button', { name: /Sell House \+\$25/ })
    expect(sellButton).toBeInTheDocument()

    fireEvent.click(sellButton)
    expect(mockOnSellHouse).toHaveBeenCalledWith(1)
  })

  it('shows Declare Bankruptcy button', () => {
    const player = createPlayer({ money: -100 })

    render(
      <LiquidationModal
        player={player}
        propertyOwners={{ 1: 0 }}
        propertyHouses={{}}
        mortgagedProperties={{}}
        creditorName={null}
        onSellHouse={mockOnSellHouse}
        onMortgageProperty={mockOnMortgageProperty}
        onDeclareBankruptcy={mockOnDeclareBankruptcy}
      />
    )

    const bankruptcyButton = screen.getByRole('button', { name: /Declare Bankruptcy/ })
    expect(bankruptcyButton).toBeInTheDocument()

    fireEvent.click(bankruptcyButton)
    expect(mockOnDeclareBankruptcy).toHaveBeenCalledTimes(1)
  })

  it('shows no mortgage button for already-mortgaged properties', () => {
    const player = createPlayer({ money: -100 })

    render(
      <LiquidationModal
        player={player}
        propertyOwners={{ 1: 0 }}
        propertyHouses={{}}
        mortgagedProperties={{ 1: true }}
        creditorName={null}
        onSellHouse={mockOnSellHouse}
        onMortgageProperty={mockOnMortgageProperty}
        onDeclareBankruptcy={mockOnDeclareBankruptcy}
      />
    )

    expect(screen.queryByRole('button', { name: /Mortgage/ })).not.toBeInTheDocument()
    expect(screen.getByText('No value')).toBeInTheDocument()
  })

  it('displays the player name in the header', () => {
    const player = createPlayer({ name: 'Alice', money: -200 })

    render(
      <LiquidationModal
        player={player}
        propertyOwners={{}}
        propertyHouses={{}}
        mortgagedProperties={{}}
        creditorName={null}
        onSellHouse={mockOnSellHouse}
        onMortgageProperty={mockOnMortgageProperty}
        onDeclareBankruptcy={mockOnDeclareBankruptcy}
      />
    )

    expect(screen.getByText(/Alice owes/)).toBeInTheDocument()
  })
})
