import { getNextActivePlayerIndex, getWinnerId, resolveBankruptcies, resolveSingleBankruptcy, calculateLiquidationValue, canPlayerLiquidate, findCreditorForPlayer } from '@/lib/game-status'
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

describe('calculateLiquidationValue', () => {
  it('returns 0 for a player with no properties', () => {
    const result = calculateLiquidationValue(0, {}, {}, {})
    expect(result).toBe(0)
  })

  it('includes mortgage value for unmortgaged properties', () => {
    // Space 1 (Tenderloin) has mortgage value 30
    const propertyOwners = { 1: 0 }
    const result = calculateLiquidationValue(0, propertyOwners, {}, {})
    expect(result).toBe(30)
  })

  it('does not include mortgage value for already-mortgaged properties', () => {
    const propertyOwners = { 1: 0 }
    const mortgagedProperties = { 1: true }
    const result = calculateLiquidationValue(0, propertyOwners, {}, mortgagedProperties)
    expect(result).toBe(0)
  })

  it('includes house sell value at half the build cost', () => {
    // Space 1 (Tenderloin) has houseCost 50, so sell value = 25 per house
    // 2 houses = $50 sell value + $30 mortgage value = $80
    const propertyOwners = { 1: 0 }
    const propertyHouses = { 1: 2 }
    const result = calculateLiquidationValue(0, propertyOwners, propertyHouses, {})
    expect(result).toBe(80)
  })

  it('includes hotel sell value (5 buildings at half build cost)', () => {
    // Space 1 (Tenderloin) has houseCost 50, 5 buildings = $125 sell + $30 mortgage = $155
    const propertyOwners = { 1: 0 }
    const propertyHouses = { 1: 5 }
    const result = calculateLiquidationValue(0, propertyOwners, propertyHouses, {})
    expect(result).toBe(155)
  })

  it('only counts properties owned by the specified player', () => {
    const propertyOwners = { 1: 0, 3: 1 }
    // Player 0 owns space 1 (mortgage 30), player 1 owns space 3
    const result = calculateLiquidationValue(0, propertyOwners, {}, {})
    expect(result).toBe(30)
  })

  it('sums multiple properties correctly', () => {
    // Space 1 (mortgage 30) + Space 3 (mortgage 30) both owned by player 0
    const propertyOwners = { 1: 0, 3: 0 }
    const result = calculateLiquidationValue(0, propertyOwners, {}, {})
    expect(result).toBe(60)
  })
})

describe('canPlayerLiquidate', () => {
  it('returns true when player has unmortgaged properties', () => {
    const propertyOwners = { 1: 0 }
    expect(canPlayerLiquidate(0, propertyOwners, {}, {})).toBe(true)
  })

  it('returns true when player has houses to sell', () => {
    const propertyOwners = { 1: 0 }
    const propertyHouses = { 1: 2 }
    const mortgagedProperties = { 1: true } // already mortgaged, but has houses
    // Actually you can't have houses on a mortgaged property, but testing the function
    expect(canPlayerLiquidate(0, propertyOwners, propertyHouses, mortgagedProperties)).toBe(true)
  })

  it('returns false when player has no properties', () => {
    expect(canPlayerLiquidate(0, {}, {}, {})).toBe(false)
  })

  it('returns false when all properties are already mortgaged and have no houses', () => {
    const propertyOwners = { 1: 0 }
    const mortgagedProperties = { 1: true }
    expect(canPlayerLiquidate(0, propertyOwners, {}, mortgagedProperties)).toBe(false)
  })
})

describe('findCreditorForPlayer', () => {
  it('returns owner id when player is on another player owned property', () => {
    const player = createPlayer({ id: 0, position: 1 })
    const players = [player, createPlayer({ id: 1 })]
    const propertyOwners = { 1: 1 }
    expect(findCreditorForPlayer(player, players, propertyOwners, {})).toBe(1)
  })

  it('returns null when player is on a tax space', () => {
    const player = createPlayer({ id: 0, position: 4 }) // Income Tax
    const players = [player, createPlayer({ id: 1 })]
    expect(findCreditorForPlayer(player, players, {}, {})).toBeNull()
  })

  it('returns null when player is on their own property', () => {
    const player = createPlayer({ id: 0, position: 1 })
    const players = [player, createPlayer({ id: 1 })]
    const propertyOwners = { 1: 0 }
    expect(findCreditorForPlayer(player, players, propertyOwners, {})).toBeNull()
  })

  it('returns null when property is mortgaged', () => {
    const player = createPlayer({ id: 0, position: 1 })
    const players = [player, createPlayer({ id: 1 })]
    const propertyOwners = { 1: 1 }
    const mortgagedProperties = { 1: true }
    expect(findCreditorForPlayer(player, players, propertyOwners, mortgagedProperties)).toBeNull()
  })

  it('returns null when player is on an unowned property', () => {
    const player = createPlayer({ id: 0, position: 1 })
    const players = [player, createPlayer({ id: 1 })]
    expect(findCreditorForPlayer(player, players, {}, {})).toBeNull()
  })
})

describe('resolveSingleBankruptcy', () => {
  it('only bankrupts the targeted player, not other negative-money players', () => {
    const players: Player[] = [
      createPlayer({ id: 0, name: 'Alice', money: -50, properties: [1] }),
      createPlayer({ id: 1, name: 'Bob', money: -30, properties: [3] }),
      createPlayer({ id: 2, name: 'Charlie', money: 500 }),
    ]
    const propertyOwners = { 1: 0, 3: 1 }

    const result = resolveSingleBankruptcy(0, players, propertyOwners, {}, {})

    expect(result.hasChanges).toBe(true)
    expect(result.newlyBankruptIds).toEqual([0])
    // Alice should be bankrupt
    expect(result.players[0].isBankrupt).toBe(true)
    expect(result.players[0].money).toBe(0)
    expect(result.players[0].properties).toEqual([])
    // Bob should NOT be affected - still negative but not bankrupt
    expect(result.players[1].isBankrupt).toBe(false)
    expect(result.players[1].money).toBe(-30)
    expect(result.players[1].properties).toEqual([3])
    // Alice's property removed, Bob's property remains
    expect(result.propertyOwners[1]).toBeUndefined()
    expect(result.propertyOwners[3]).toBe(1)
  })

  it('returns no changes for a player who is not negative', () => {
    const players: Player[] = [
      createPlayer({ id: 0, money: 100 }),
    ]
    const result = resolveSingleBankruptcy(0, players, {}, {}, {})
    expect(result.hasChanges).toBe(false)
  })

  it('returns no changes for an already bankrupt player', () => {
    const players: Player[] = [
      createPlayer({ id: 0, money: -50, isBankrupt: true }),
    ]
    const result = resolveSingleBankruptcy(0, players, {}, {}, {})
    expect(result.hasChanges).toBe(false)
  })

  it('clears mortgaged properties and houses for the bankrupt player only', () => {
    const players: Player[] = [
      createPlayer({ id: 0, money: -50, properties: [1] }),
      createPlayer({ id: 1, money: -20, properties: [3] }),
    ]
    const propertyOwners = { 1: 0, 3: 1 }
    const mortgagedProperties = { 1: true, 3: true }
    const propertyHouses = { 1: 2, 3: 3 }

    const result = resolveSingleBankruptcy(0, players, propertyOwners, mortgagedProperties, propertyHouses)

    // Alice's assets removed
    expect(result.propertyOwners[1]).toBeUndefined()
    expect(result.mortgagedProperties[1]).toBeUndefined()
    expect(result.propertyHouses[1]).toBeUndefined()
    // Bob's assets untouched
    expect(result.propertyOwners[3]).toBe(1)
    expect(result.mortgagedProperties[3]).toBe(true)
    expect(result.propertyHouses[3]).toBe(3)
  })
})
