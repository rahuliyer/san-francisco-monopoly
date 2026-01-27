import { render, screen, fireEvent } from '@testing-library/react'
import { TradeModal } from '@/components/trade-modal'
import { BOARD_SPACES, Player } from '@/lib/game-data'

describe('TradeModal component', () => {
  const tenderloin = BOARD_SPACES.find((space) => space.name === 'Tenderloin')!
  const caltrain = BOARD_SPACES.find((space) => space.name === 'Caltrain')!

  const playerA: Player = {
    id: 0,
    name: 'Alice',
    color: '#C4451A',
    token: '🚃',
    money: 1200,
    position: 0,
    properties: [tenderloin.id],
    inJail: false,
    jailTurns: 0,
  }

  const playerB: Player = {
    id: 1,
    name: 'Bob',
    color: '#2563EB',
    token: '🦀',
    money: 900,
    position: 0,
    properties: [caltrain.id],
    inJail: false,
    jailTurns: 0,
  }

  const propertyOwners = {
    [tenderloin.id]: playerA.id,
    [caltrain.id]: playerB.id,
  }

  it('should render partner selector and available properties', () => {
    render(
      <TradeModal
        currentPlayer={playerA}
        players={[playerA, playerB]}
        propertyOwners={propertyOwners}
        onSubmit={jest.fn()}
        onClose={jest.fn()}
      />
    )

    expect(screen.getByLabelText(/trade partner/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tenderloin/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/caltrain/i)).toBeInTheDocument()
  })

  it('should submit selected properties and cash amounts', () => {
    const onSubmit = jest.fn()

    render(
      <TradeModal
        currentPlayer={playerA}
        players={[playerA, playerB]}
        propertyOwners={propertyOwners}
        onSubmit={onSubmit}
        onClose={jest.fn()}
      />
    )

    fireEvent.click(screen.getByLabelText(/tenderloin/i))
    fireEvent.click(screen.getByLabelText(/caltrain/i))
    fireEvent.change(screen.getByLabelText(/cash you give/i), { target: { value: '200' } })
    fireEvent.change(screen.getByLabelText(/cash you receive/i), { target: { value: '50' } })

    fireEvent.click(screen.getByRole('button', { name: /complete trade/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      partnerId: playerB.id,
      offerPropertyIds: [tenderloin.id],
      requestPropertyIds: [caltrain.id],
      offerCash: 200,
      requestCash: 50,
    })
  })
})
