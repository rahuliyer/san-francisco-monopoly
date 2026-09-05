import { Player, BOARD_SPACES } from "@/lib/game-data"
import type { CardDeckType } from "@/lib/models/card"

/**
 * Calculates the total liquidation value of a player's assets.
 * This includes:
 * - Houses/hotels sold back at half the build cost
 * - Unmortgaged properties that can be mortgaged for their mortgage value
 */
export function calculateLiquidationValue(
  playerId: number,
  propertyOwners: Record<number, number>,
  propertyHouses: Record<number, number>,
  mortgagedProperties: Record<number, boolean>
): number {
  let total = 0

  Object.entries(propertyOwners).forEach(([spaceId, ownerId]) => {
    if (ownerId !== playerId) return
    const numericId = Number(spaceId)
    const space = BOARD_SPACES[numericId]
    if (!space) return

    // Value from selling houses/hotels (half the build cost)
    const houses = propertyHouses[numericId] ?? 0
    if (houses > 0 && space.houseCost) {
      total += Math.floor(space.houseCost / 2) * houses
    }

    // Value from mortgaging (only if not already mortgaged)
    if (!mortgagedProperties[numericId] && space.mortgage) {
      total += space.mortgage
    }
  })

  return total
}

/**
 * Checks if a player has any assets they can liquidate (sell houses or mortgage properties).
 */
export function canPlayerLiquidate(
  playerId: number,
  propertyOwners: Record<number, number>,
  propertyHouses: Record<number, number>,
  mortgagedProperties: Record<number, boolean>
): boolean {
  return calculateLiquidationValue(playerId, propertyOwners, propertyHouses, mortgagedProperties) > 0
}

/**
 * Determines the creditor for a player who went negative.
 * Returns the player ID who caused the debt (rent), or null if it was the bank (tax, card, etc.).
 * This looks at property owners on the player's current position.
 */
export function findCreditorForPlayer(
  player: Player,
  players: Player[],
  propertyOwners: Record<number, number>,
  mortgagedProperties: Record<number, boolean>
): number | null {
  const space = BOARD_SPACES[player.position]
  if (!space) return null

  const isPurchasable = space.type === "property" || space.type === "railroad" || space.type === "utility"
  if (!isPurchasable) return null

  const ownerId = propertyOwners[space.id]
  if (ownerId === undefined || ownerId === player.id) return null
  if (mortgagedProperties[space.id]) return null

  // Verify the owner is an active player
  const owner = players.find((p) => p.id === ownerId)
  if (!owner || owner.isBankrupt) return null

  return ownerId
}

interface BankruptcyResolution {
  players: Player[]
  propertyOwners: Record<number, number>
  mortgagedProperties: Record<number, boolean>
  propertyHouses: Record<number, number>
  newlyBankruptIds: number[]
  returnedJailCards: CardDeckType[]
  hasChanges: boolean
}

/**
 * Resolves bankruptcy for a single specific player.
 * Unlike resolveBankruptcies, this only affects the targeted player,
 * leaving other negative-money players untouched so they can get
 * their own liquidation turn.
 */
export function resolveSingleBankruptcy(
  playerId: number,
  players: Player[],
  propertyOwners: Record<number, number>,
  mortgagedProperties: Record<number, boolean>,
  propertyHouses: Record<number, number>
): BankruptcyResolution {
  const player = players.find((p) => p.id === playerId)
  if (!player || player.isBankrupt || player.money >= 0) {
    return {
      players,
      propertyOwners,
      mortgagedProperties,
      propertyHouses,
      newlyBankruptIds: [],
      returnedJailCards: [],
      hasChanges: false,
    }
  }

  const updatedPlayers = players.map((p) => {
    if (p.id !== playerId) return p
    return {
      ...p,
      isBankrupt: true,
      money: 0,
      inJail: false,
      jailTurns: 0,
      properties: [],
      getOutOfJailFreeCards: [],
    }
  })

  const updatedPropertyOwners = { ...propertyOwners }
  const updatedMortgagedProperties = { ...mortgagedProperties }
  const updatedPropertyHouses = { ...propertyHouses }

  Object.entries(propertyOwners).forEach(([spaceId, ownerId]) => {
    if (ownerId !== playerId) return
    const numericSpaceId = Number(spaceId)
    delete updatedPropertyOwners[numericSpaceId]
    delete updatedMortgagedProperties[numericSpaceId]
    delete updatedPropertyHouses[numericSpaceId]
  })

  return {
    players: updatedPlayers,
    propertyOwners: updatedPropertyOwners,
    mortgagedProperties: updatedMortgagedProperties,
    propertyHouses: updatedPropertyHouses,
    newlyBankruptIds: [playerId],
    returnedJailCards: [...player.getOutOfJailFreeCards],
    hasChanges: true,
  }
}

export function resolveBankruptcies(
  players: Player[],
  propertyOwners: Record<number, number>,
  mortgagedProperties: Record<number, boolean>,
  propertyHouses: Record<number, number>
): BankruptcyResolution {
  const newlyBankruptIds = players
    .filter((player) => !player.isBankrupt && player.money < 0)
    .map((player) => player.id)

  if (newlyBankruptIds.length === 0) {
    return {
      players,
      propertyOwners,
      mortgagedProperties,
      propertyHouses,
      newlyBankruptIds,
      returnedJailCards: [],
      hasChanges: false,
    }
  }

  const bankruptSet = new Set(newlyBankruptIds)
  const returnedJailCards = players
    .filter((player) => bankruptSet.has(player.id))
    .flatMap((player) => player.getOutOfJailFreeCards)
  const updatedPlayers = players.map((player) => {
    if (!bankruptSet.has(player.id)) {
      return player
    }
    return {
      ...player,
      isBankrupt: true,
      money: 0,
      inJail: false,
      jailTurns: 0,
      properties: [],
      getOutOfJailFreeCards: [],
    }
  })

  const updatedPropertyOwners = { ...propertyOwners }
  const updatedMortgagedProperties = { ...mortgagedProperties }
  const updatedPropertyHouses = { ...propertyHouses }

  Object.entries(propertyOwners).forEach(([spaceId, ownerId]) => {
    if (!bankruptSet.has(Number(ownerId))) {
      return
    }
    const numericSpaceId = Number(spaceId)
    delete updatedPropertyOwners[numericSpaceId]
    delete updatedMortgagedProperties[numericSpaceId]
    delete updatedPropertyHouses[numericSpaceId]
  })

  return {
    players: updatedPlayers,
    propertyOwners: updatedPropertyOwners,
    mortgagedProperties: updatedMortgagedProperties,
    propertyHouses: updatedPropertyHouses,
    newlyBankruptIds,
    returnedJailCards,
    hasChanges: true,
  }
}

export function getWinnerId(players: Player[]): number | null {
  if (players.length <= 1) {
    return null
  }
  const activePlayers = players.filter((player) => !player.isBankrupt)
  if (activePlayers.length === 1) {
    return activePlayers[0].id
  }
  return null
}

export function getNextActivePlayerIndex(players: Player[], currentIndex: number): number | null {
  if (players.length === 0) {
    return null
  }
  for (let offset = 1; offset <= players.length; offset += 1) {
    const nextIndex = (currentIndex + offset) % players.length
    if (!players[nextIndex].isBankrupt) {
      return nextIndex
    }
  }
  return null
}
