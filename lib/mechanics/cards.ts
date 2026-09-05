// Card effect mechanics - pure functions for applying card effects

import { Player, GameCard, BOARD_SPACES } from "@/lib/game-data"
import { GAME_CONSTANTS } from "@/lib/constants"

const { BOARD_SIZE, JAIL_POSITION, GO_POSITION, GO_BONUS, MAX_HOUSES } = GAME_CONSTANTS

export interface RepairsSummary {
  total: number
  houseCount: number
  hotelCount: number
}

export interface CardEffectResult {
  updatedPlayers: Player[]
  repairsSummary: RepairsSummary | null
}

/**
 * Calculate the cost of repairs based on houses and hotels owned
 */
export function calculateRepairsCost(
  playerId: number,
  propertyOwners: Record<number, number>,
  propertyHouses: Record<number, number>,
  houseAmount: number,
  hotelAmount: number
): RepairsSummary {
  let houseCount = 0
  let hotelCount = 0

  Object.entries(propertyOwners).forEach(([spaceId, ownerId]) => {
    if (ownerId !== playerId) return
    const space = BOARD_SPACES[Number(spaceId)]
    if (space?.type !== "property") return
    const buildings = propertyHouses[Number(spaceId)] ?? 0
    if (buildings >= MAX_HOUSES) {
      hotelCount += 1
    } else {
      houseCount += buildings
    }
  })

  return {
    houseCount,
    hotelCount,
    total: houseCount * houseAmount + hotelCount * hotelAmount,
  }
}

/**
 * Apply a card effect to the players array and return the updated state
 */
export function applyCardEffect(
  card: GameCard,
  players: Player[],
  playerIndex: number,
  propertyOwners: Record<number, number>,
  propertyHouses: Record<number, number>
): CardEffectResult {
  const updatedPlayers = players.map((p) => ({ ...p }))
  let repairsSummary: RepairsSummary | null = null

  switch (card.effect.type) {
    case "collect":
      updatedPlayers[playerIndex].money += card.effect.amount
      break
    case "pay":
      updatedPlayers[playerIndex].money -= card.effect.amount
      break
    case "advance-to-go":
      updatedPlayers[playerIndex].position = GO_POSITION
      updatedPlayers[playerIndex].money += GO_BONUS
      break
    case "advance":
      if (card.effect.position < updatedPlayers[playerIndex].position) {
        updatedPlayers[playerIndex].money += GO_BONUS
      }
      updatedPlayers[playerIndex].position = card.effect.position
      break
    case "go-to-jail":
      updatedPlayers[playerIndex].position = JAIL_POSITION
      updatedPlayers[playerIndex].inJail = true
      updatedPlayers[playerIndex].jailTurns = 0
      break
    case "go-back":
      updatedPlayers[playerIndex].position =
        (updatedPlayers[playerIndex].position - card.effect.spaces + BOARD_SIZE) % BOARD_SIZE
      break
    case "get-out-of-jail-free":
      updatedPlayers[playerIndex].getOutOfJailFreeCards =
        (updatedPlayers[playerIndex].getOutOfJailFreeCards ?? 0) + 1
      break
    case "collect-from-players": {
      const collectAmount = card.effect.amount * (players.length - 1)
      updatedPlayers[playerIndex].money += collectAmount
      for (let i = 0; i < updatedPlayers.length; i++) {
        if (i !== playerIndex) {
          updatedPlayers[i].money -= card.effect.amount
        }
      }
      break
    }
    case "pay-to-players": {
      const payAmount = card.effect.amount * (players.length - 1)
      updatedPlayers[playerIndex].money -= payAmount
      for (let i = 0; i < updatedPlayers.length; i++) {
        if (i !== playerIndex) {
          updatedPlayers[i].money += card.effect.amount
        }
      }
      break
    }
    case "repairs":
      repairsSummary = calculateRepairsCost(
        updatedPlayers[playerIndex].id,
        propertyOwners,
        propertyHouses,
        card.effect.houseAmount,
        card.effect.hotelAmount
      )
      updatedPlayers[playerIndex].money -= repairsSummary.total
      break
  }

  return { updatedPlayers, repairsSummary }
}

/**
 * Format a repairs summary for display in the game log
 */
export function formatRepairsSummary(
  summary: RepairsSummary
): string {
  const houseLabel = summary.houseCount === 1 ? "house" : "houses"
  const hotelLabel = summary.hotelCount === 1 ? "hotel" : "hotels"
  return summary.houseCount || summary.hotelCount
    ? ` (${summary.houseCount} ${houseLabel}, ${summary.hotelCount} ${hotelLabel})`
    : ""
}
