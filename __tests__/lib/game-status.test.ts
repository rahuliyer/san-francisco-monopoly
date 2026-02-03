import { getNextActivePlayerIndex, getWinnerId, resolveBankruptcies } from '@/lib/game-status'
import { Player } from '@/lib/game-data'

const createPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 0,
  name: 'Player',
  color: '#C4451A',
  token: '/images/tokens/crab.png',
  money: 1500,
  position: 0,
  properties: [],
  inJail: false,
  jailTurns: 0,
  isBankrupt: false,
  ...overrides,
})

describe('resolveBankruptcies', () => {
  it('marks players with negative money as bankrupt and releases their assets', () => {
    const players: Player[] = [
      createPlayer({ id: 0, name: 'Alice', money: -50, properties: [1] }),
      createPlayer({ id: 1, name: 'Bob', money: 200, properties: [3] }),
    ]
    const propertyOwners = { 1: 0, 3: 1 }
    const mortgagedProperties = { 1: true, 3: true }
    const propertyHouses = { 1: 2, 3: 1 }

    const result = resolveBankruptcies(players, propertyOwners, mortgagedProperties, propertyHouses)

    expect(result.hasChanges).toBe(true)
    expect(result.newlyBankruptIds).toEqual([0])
    expect(result.players[0].isBankrupt).toBe(true)
    expect(result.players[0].money).toBe(0)
    expect(result.players[0].properties).toEqual([])
    expect(result.propertyOwners[1]).toBeUndefined()
    expect(result.mortgagedProperties[1]).toBeUndefined()
    expect(result.propertyHouses[1]).toBeUndefined()
    expect(result.propertyOwners[3]).toBe(1)
  })

  it('returns no changes when no players are bankrupt', () => {
    const players: Player[] = [
      createPlayer({ id: 0, money: 100 }),
      createPlayer({ id: 1, money: 200 }),
    ]
    const propertyOwners = { 1: 0 }
    const mortgagedProperties = {}
    const propertyHouses = {}

    const result = resolveBankruptcies(players, propertyOwners, mortgagedProperties, propertyHouses)

    expect(result.hasChanges).toBe(false)
    expect(result.newlyBankruptIds).toEqual([])
  })
})

describe('getWinnerId', () => {
  it('returns the remaining active player when only one is not bankrupt', () => {
    const players = [
      createPlayer({ id: 0, isBankrupt: true }),
      createPlayer({ id: 1, isBankrupt: false }),
    ]
    expect(getWinnerId(players)).toBe(1)
  })

  it('returns null when more than one active player remains', () => {
    const players = [
      createPlayer({ id: 0, isBankrupt: false }),
      createPlayer({ id: 1, isBankrupt: false }),
    ]
    expect(getWinnerId(players)).toBeNull()
  })
})

describe('getNextActivePlayerIndex', () => {
  it('skips bankrupt players when selecting the next turn', () => {
    const players = [
      createPlayer({ id: 0, isBankrupt: false }),
      createPlayer({ id: 1, isBankrupt: true }),
      createPlayer({ id: 2, isBankrupt: false }),
    ]

    expect(getNextActivePlayerIndex(players, 0)).toBe(2)
  })

  it('returns current index when only one player is active', () => {
    const players = [
      createPlayer({ id: 0, isBankrupt: false }),
      createPlayer({ id: 1, isBankrupt: true }),
    ]

    expect(getNextActivePlayerIndex(players, 0)).toBe(0)
  })
})
