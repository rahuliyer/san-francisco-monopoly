// State selectors - derived state computations
// These selectors compute derived values from the game state to simplify components.

import type { GameState } from "@/lib/game-store"
import type { Player } from "@/lib/models/player"
import type { Space, ColorGroup } from "@/lib/models/types"
import { BOARD_SPACES, getSpacesByColorGroup } from "@/lib/models/board"
import { canRoll as canRollCheck } from "@/lib/mechanics/turn"
import { calculateUnmortgageCost as calcUnmortgageCost } from "@/lib/mechanics/property-actions"
import { GAME_CONSTANTS } from "@/lib/constants"

const { MAX_HOUSES, JAIL_FEE } = GAME_CONSTANTS

// Player selectors

/**
 * Gets the current player.
 */
export function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex]
}

/**
 * Gets a player by ID.
 */
export function getPlayerById(state: GameState, playerId: number): Player | undefined {
  return state.players.find((p) => p.id === playerId)
}

/**
 * Gets all active (non-bankrupt) players.
 */
export function getActivePlayers(state: GameState): Player[] {
  return state.players.filter((p) => !p.isBankrupt)
}

/**
 * Gets the count of active players.
 */
export function getActivePlayerCount(state: GameState): number {
  return state.players.filter((p) => !p.isBankrupt).length
}

/**
 * Gets the winner if the game is over.
 */
export function getWinner(state: GameState): Player | undefined {
  if (!state.gameOver || state.winnerId === null) return undefined
  return state.players.find((p) => p.id === state.winnerId)
}

// Property selectors

/**
 * Gets the owner of a property.
 */
export function getPropertyOwner(
  state: GameState,
  propertyId: number
): Player | undefined {
  const ownerId = state.propertyOwners[propertyId]
  if (ownerId === undefined) return undefined
  return state.players.find((p) => p.id === ownerId)
}

/**
 * Gets the owner ID of a property.
 */
export function getPropertyOwnerId(
  state: GameState,
  propertyId: number
): number | undefined {
  return state.propertyOwners[propertyId]
}

/**
 * Checks if a player owns all properties in a color group (monopoly).
 * Only counts non-mortgaged properties.
 */
export function ownsColorGroup(
  state: GameState,
  playerId: number,
  colorGroup: ColorGroup
): boolean {
  if (!colorGroup || colorGroup === "railroad" || colorGroup === "utility") {
    return false
  }

  const groupSpaces = getSpacesByColorGroup(colorGroup)
  return groupSpaces.every(
    (s) =>
      state.propertyOwners[s.id] === playerId &&
      state.mortgagedProperties[s.id] !== true
  )
}

/**
 * Gets all properties owned by a player.
 */
export function getPlayerProperties(
  state: GameState,
  playerId: number
): Space[] {
  return BOARD_SPACES.filter((space) => state.propertyOwners[space.id] === playerId)
}

/**
 * Gets the house count for a property.
 */
export function getHouseCount(state: GameState, propertyId: number): number {
  return state.propertyHouses[propertyId] ?? 0
}

/**
 * Checks if a property is mortgaged.
 */
export function isMortgaged(state: GameState, propertyId: number): boolean {
  return state.mortgagedProperties[propertyId] === true
}

/**
 * Gets the unmortgage cost for a property.
 */
export function getUnmortgageCost(
  state: GameState,
  propertyId: number
): number | undefined {
  const space = BOARD_SPACES[propertyId]
  if (!space || space.mortgage === undefined) return undefined
  return calcUnmortgageCost(space.mortgage)
}

/**
 * Checks if a property is owned by the current player.
 */
export function isOwnedByCurrentPlayer(
  state: GameState,
  propertyId: number
): boolean {
  return state.propertyOwners[propertyId] === state.currentPlayerIndex
}

// Turn/action selectors

/**
 * Checks if the current player can roll.
 */
export function canCurrentPlayerRoll(state: GameState): boolean {
  return canRollCheck({
    players: state.players,
    currentPlayerIndex: state.currentPlayerIndex,
    hasRolled: state.hasRolled,
    consecutiveDoubles: state.consecutiveDoubles,
    awaitingPropertyDecision: state.awaitingPropertyDecision,
    awaitingSpecialSpace: state.awaitingSpecialSpace,
    gameOver: state.gameOver,
  })
}

/**
 * Checks if the current player is in jail.
 */
export function isCurrentPlayerInJail(state: GameState): boolean {
  const currentPlayer = getCurrentPlayer(state)
  return currentPlayer?.inJail ?? false
}

/**
 * Checks if the current player can pay the jail fee.
 */
export function canPayJailFee(state: GameState): boolean {
  const currentPlayer = getCurrentPlayer(state)
  return currentPlayer?.inJail && currentPlayer.money >= JAIL_FEE
}

/**
 * Checks if trading is currently allowed.
 */
export function canTrade(state: GameState): boolean {
  const currentPlayer = getCurrentPlayer(state)
  return (
    !state.gameOver &&
    !currentPlayer?.isBankrupt &&
    !state.rolling &&
    !state.awaitingPropertyDecision &&
    !state.awaitingSpecialSpace &&
    state.selectedSpace === null &&
    state.specialSpace === null &&
    state.viewingPropertiesForPlayer === null &&
    getActivePlayerCount(state) >= 2
  )
}

/**
 * Gets house/hotel display info for a property.
 */
export function getHouseDisplayInfo(
  state: GameState,
  propertyId: number
): { hasHotel: boolean; houseCount: number; displayLabel: string | null } {
  const houseCount = getHouseCount(state, propertyId)
  const hasHotel = houseCount >= MAX_HOUSES

  let displayLabel: string | null = null
  if (hasHotel) {
    displayLabel = "Hotel"
  } else if (houseCount > 0) {
    displayLabel = `${houseCount} House${houseCount === 1 ? "" : "s"}`
  }

  return { hasHotel, houseCount, displayLabel }
}

// Building selectors

/**
 * Checks if the current player can build on a property.
 */
export function canBuildOnProperty(
  state: GameState,
  propertyId: number
): { allowed: boolean; reason?: string } {
  const space = BOARD_SPACES[propertyId]
  if (!space || space.type !== "property" || !space.houseCost) {
    return { allowed: false, reason: "Cannot build on this property type" }
  }

  const currentPlayer = getCurrentPlayer(state)
  const ownerId = state.propertyOwners[propertyId]

  if (ownerId !== currentPlayer?.id) {
    return { allowed: false, reason: "You don't own this property" }
  }

  if (state.mortgagedProperties[propertyId]) {
    return { allowed: false, reason: "Property is mortgaged" }
  }

  // Check monopoly
  const groupSpaces = getSpacesByColorGroup(space.colorGroup)
  const ownsAll = groupSpaces.every(
    (s) =>
      state.propertyOwners[s.id] === currentPlayer.id &&
      !state.mortgagedProperties[s.id]
  )

  if (!ownsAll) {
    return { allowed: false, reason: "Own all properties in this neighborhood to build" }
  }

  const currentHouseCount = state.propertyHouses[propertyId] ?? 0
  if (currentHouseCount >= MAX_HOUSES) {
    return { allowed: false, reason: "This property already has a hotel" }
  }

  // Even building rule
  const groupHouseCounts = groupSpaces.map((s) => state.propertyHouses[s.id] ?? 0)
  const minHouseCount = Math.min(...groupHouseCounts)
  if (currentHouseCount !== minHouseCount) {
    return { allowed: false, reason: "Build evenly across the neighborhood" }
  }

  if (currentPlayer.money < space.houseCost) {
    return { allowed: false, reason: `Need $${space.houseCost} to build` }
  }

  return { allowed: true }
}

/**
 * Gets the space the current player landed on.
 */
export function getCurrentLandedSpace(state: GameState): Space | null {
  const currentPlayer = getCurrentPlayer(state)
  if (!currentPlayer) return null
  return BOARD_SPACES[currentPlayer.position]
}

/**
 * Checks if the selected space is unowned and the current player just landed on it.
 */
export function canBuySelectedProperty(state: GameState): boolean {
  if (!state.selectedSpace || !state.selectedSpace.price) return false
  if (state.propertyOwners[state.selectedSpace.id] !== undefined) return false

  const currentPlayer = getCurrentPlayer(state)
  if (!currentPlayer) return false
  if (currentPlayer.position !== state.selectedSpace.id) return false
  if (!state.hasRolled) return false
  if (currentPlayer.money < state.selectedSpace.price) return false

  return true
}
