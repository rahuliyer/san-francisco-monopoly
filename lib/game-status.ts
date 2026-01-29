import { Player } from "@/lib/game-data"

interface BankruptcyResolution {
  players: Player[]
  propertyOwners: Record<number, number>
  mortgagedProperties: Record<number, boolean>
  propertyHouses: Record<number, number>
  newlyBankruptIds: number[]
  hasChanges: boolean
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
      hasChanges: false,
    }
  }

  const bankruptSet = new Set(newlyBankruptIds)
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
