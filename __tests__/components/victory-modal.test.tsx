import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { VictoryModal } from '@/components/victory-modal'
import { Player } from '@/lib/game-data'

describe('VictoryModal', () => {
  const mockOnPlayAgain = jest.fn()

  const createPlayer = (overrides: Partial<Player> = {}): Player => ({
    id: 0,
    name: 'Player 1',
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

  beforeEach(() => {
    mockOnPlayAgain.mockClear()
  })

  describe('Winner display', () => {
    it('should display winner name and title', () => {
      const winner = createPlayer({ id: 0, name: 'Alice', money: 2500 })
      const players = [winner, createPlayer({ id: 1, name: 'Bob', isBankrupt: true, money: 0 })]

      render(
        <VictoryModal
          winner={winner}
          players={players}
          propertyOwners={{}}
          onPlayAgain={mockOnPlayAgain}
        />
      )

      expect(screen.getByText('Victory!')).toBeInTheDocument()
      // Winner name appears twice (header and standings)
      expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('San Francisco Tycoon')).toBeInTheDocument()
    })

    it('should display winner cash amount', () => {
      const winner = createPlayer({ id: 0, name: 'Alice', money: 2500 })
      const players = [winner, createPlayer({ id: 1, name: 'Bob', isBankrupt: true, money: 0 })]

      render(
        <VictoryModal
          winner={winner}
          players={players}
          propertyOwners={{}}
          onPlayAgain={mockOnPlayAgain}
        />
      )

      // Cash appears in stats and in standings net worth
      expect(screen.getAllByText('$2,500').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Cash')).toBeInTheDocument()
    })

    it('should display winner property count', () => {
      const winner = createPlayer({ id: 0, name: 'Alice', money: 1000 })
      const players = [winner, createPlayer({ id: 1, name: 'Bob', isBankrupt: true, money: 0 })]
      const propertyOwners = { 1: 0, 3: 0, 6: 0 } // Winner owns 3 properties

      render(
        <VictoryModal
          winner={winner}
          players={players}
          propertyOwners={propertyOwners}
          onPlayAgain={mockOnPlayAgain}
        />
      )

      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Properties')).toBeInTheDocument()
    })

    it('should display winner net worth including property values', () => {
      const winner = createPlayer({ id: 0, name: 'Alice', money: 1000 })
      const players = [winner, createPlayer({ id: 1, name: 'Bob', isBankrupt: true, money: 0 })]
      // Property at position 1 (Tenderloin) costs $60
      const propertyOwners = { 1: 0 }

      render(
        <VictoryModal
          winner={winner}
          players={players}
          propertyOwners={propertyOwners}
          onPlayAgain={mockOnPlayAgain}
        />
      )

      // Net worth = $1000 cash + $60 property = $1060 (appears in stats and standings)
      expect(screen.getAllByText('$1,060').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Net Worth')).toBeInTheDocument()
    })
  })

  describe('Final standings', () => {
    it('should display final standings header', () => {
      const winner = createPlayer({ id: 0, name: 'Alice', money: 2000 })
      const players = [winner, createPlayer({ id: 1, name: 'Bob', isBankrupt: true, money: 0 })]

      render(
        <VictoryModal
          winner={winner}
          players={players}
          propertyOwners={{}}
          onPlayAgain={mockOnPlayAgain}
        />
      )

      expect(screen.getByText('Final Standings')).toBeInTheDocument()
    })

    it('should list all players in standings', () => {
      const winner = createPlayer({ id: 0, name: 'Alice', money: 2000 })
      const players = [
        winner,
        createPlayer({ id: 1, name: 'Bob', isBankrupt: true, money: 0 }),
        createPlayer({ id: 2, name: 'Charlie', isBankrupt: true, money: 0 }),
      ]

      render(
        <VictoryModal
          winner={winner}
          players={players}
          propertyOwners={{}}
          onPlayAgain={mockOnPlayAgain}
        />
      )

      // Names appear in both header (winner only) and standings (all players)
      expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Charlie').length).toBeGreaterThanOrEqual(1)
    })

    it('should show winner first in standings', () => {
      const winner = createPlayer({ id: 1, name: 'Bob', money: 3000 })
      const players = [
        createPlayer({ id: 0, name: 'Alice', isBankrupt: true, money: 0 }),
        winner,
      ]

      render(
        <VictoryModal
          winner={winner}
          players={players}
          propertyOwners={{}}
          onPlayAgain={mockOnPlayAgain}
        />
      )

      // Winner (Bob) should have position 1
      expect(screen.getByText('1.')).toBeInTheDocument()
      // The standings should show Bob with his net worth (appears in both stats and standings)
      expect(screen.getAllByText('$3,000').length).toBeGreaterThanOrEqual(1)
    })

    it('should show "Bankrupt" for bankrupt players', () => {
      const winner = createPlayer({ id: 0, name: 'Alice', money: 2000 })
      const players = [
        winner,
        createPlayer({ id: 1, name: 'Bob', isBankrupt: true, money: 0 }),
      ]

      render(
        <VictoryModal
          winner={winner}
          players={players}
          propertyOwners={{}}
          onPlayAgain={mockOnPlayAgain}
        />
      )

      expect(screen.getByText('Bankrupt')).toBeInTheDocument()
    })
  })

  describe('Play Again button', () => {
    it('should render Play Again button', () => {
      const winner = createPlayer({ id: 0, name: 'Alice', money: 2000 })
      const players = [winner, createPlayer({ id: 1, name: 'Bob', isBankrupt: true, money: 0 })]

      render(
        <VictoryModal
          winner={winner}
          players={players}
          propertyOwners={{}}
          onPlayAgain={mockOnPlayAgain}
        />
      )

      expect(screen.getByRole('button', { name: 'Play Again' })).toBeInTheDocument()
    })

    it('should call onPlayAgain when Play Again button is clicked', () => {
      const winner = createPlayer({ id: 0, name: 'Alice', money: 2000 })
      const players = [winner, createPlayer({ id: 1, name: 'Bob', isBankrupt: true, money: 0 })]

      render(
        <VictoryModal
          winner={winner}
          players={players}
          propertyOwners={{}}
          onPlayAgain={mockOnPlayAgain}
        />
      )

      const playAgainButton = screen.getByRole('button', { name: 'Play Again' })
      fireEvent.click(playAgainButton)

      expect(mockOnPlayAgain).toHaveBeenCalledTimes(1)
    })
  })

  describe('Multi-player game', () => {
    it('should correctly calculate standings for 4 players', () => {
      const winner = createPlayer({ id: 0, name: 'Alice', money: 3000 })
      const players = [
        winner,
        createPlayer({ id: 1, name: 'Bob', isBankrupt: true, money: 0 }),
        createPlayer({ id: 2, name: 'Charlie', isBankrupt: true, money: 0 }),
        createPlayer({ id: 3, name: 'Diana', isBankrupt: true, money: 0 }),
      ]

      render(
        <VictoryModal
          winner={winner}
          players={players}
          propertyOwners={{}}
          onPlayAgain={mockOnPlayAgain}
        />
      )

      // All 4 players should be visible (names appear in header and/or standings)
      expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Charlie').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Diana').length).toBeGreaterThanOrEqual(1)

      // Should have 4 position markers
      expect(screen.getByText('1.')).toBeInTheDocument()
      expect(screen.getByText('2.')).toBeInTheDocument()
      expect(screen.getByText('3.')).toBeInTheDocument()
      expect(screen.getByText('4.')).toBeInTheDocument()
    })
  })
})
