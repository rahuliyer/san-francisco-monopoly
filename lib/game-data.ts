// SF Monopoly Game Data

import { GAME_CONSTANTS } from "@/lib/constants"

// Re-export Player model for backward compatibility
export {
  Player,
  PlayerToken,
  PlayerSetup,
  PLAYER_TOKENS,
  createPlayer,
  updatePlayerMoney,
  updatePlayerPosition,
  sendPlayerToJail,
  releasePlayerFromJail,
  incrementJailTurns,
  canAfford,
  addProperty,
  removeProperty,
  markBankrupt,
  isActivePlayer,
} from "@/lib/models/player"

// Re-export shared types from models
export type { SpaceType, ColorGroup, Space, PropertyType } from "@/lib/models/types"

// Re-export Property model for backward compatibility
export {
  Property,
  OwnedProperty,
  PropertyOwnership,
  LegacyPropertyMaps,
  fromLegacyMaps,
  toLegacyMaps,
  getOwnership,
  getPlayerOwnerships,
  updateOwnership,
  addOwnership,
  createOwnership,
  removeOwnership,
  removePlayerOwnerships,
  isPurchasableSpace,
  spaceToProperty,
} from "@/lib/models/property"

// Re-export Board model for backward compatibility
export {
  BOARD_SPACES,
  COLOR_MAP,
  MovementResult,
  calculateNewPosition,
  moveToPosition,
  getSpaceAt,
  getSpacesByType,
  getSpacesByColorGroup,
  isPurchasableType,
  isSpecialSpaceType,
  getJailPosition,
  getGoPosition,
  getRailroads,
  getUtilities,
} from "@/lib/models/board"

import { BOARD_SPACES } from "@/lib/models/board"
import type { Property } from "@/lib/models/property"
import { isPurchasableSpace, spaceToProperty } from "@/lib/models/property"

/** Immutable list of all purchasable properties (property, railroad, utility). Derived from board. */
export const PROPERTIES: readonly Property[] = BOARD_SPACES.filter(isPurchasableSpace).map(spaceToProperty)

// Re-export for backwards compatibility
export const STARTING_MONEY = GAME_CONSTANTS.STARTING_MONEY

// Re-export dice mechanics for backward compatibility
export {
  DiceValues,
  DiceRoller,
  RandomDiceRoller,
  QueuedDiceRoller,
  FixedDiceRoller,
  createLegacyCompatibleRoller,
  isDoubles,
  diceTotal,
  isValidDice,
  getRandomInitialDice,
  rollDice,
} from "@/lib/mechanics/dice"

/** Returns the immutable Property for a purchasable space id, or null if not purchasable. */
export function getPropertyById(spaceId: number): Property | null {
  return PROPERTIES.find((p) => p.id === spaceId) ?? null
}

/** Returns properties in the same color group (for Property type only; railroads/utilities use their own grouping). */
export function getPropertiesByColorGroup(colorGroup: NonNullable<ColorGroup>): readonly Property[] {
  return PROPERTIES.filter((p) => p.colorGroup === colorGroup)
}

/**
 * Builds an immutable OwnedProperty view for a space from the game's ownership maps.
 * Returns null if the space is not owned.
 */
export function getOwnedProperty(
  spaceId: number,
  propertyOwners: Record<number, number>,
  propertyHouses: Record<number, number>,
  mortgagedProperties: Record<number, boolean>
): OwnedProperty | null {
  const ownerId = propertyOwners[spaceId]
  if (ownerId === undefined) return null
  const property = getPropertyById(spaceId)
  if (!property) return null
  return {
    property,
    ownerId,
    houseCount: propertyHouses[spaceId] ?? 0,
    isMortgaged: mortgagedProperties[spaceId] === true,
  }
}

/**
 * Returns all owned properties as immutable OwnedProperty views.
 */
export function getOwnedProperties(
  propertyOwners: Record<number, number>,
  propertyHouses: Record<number, number>,
  mortgagedProperties: Record<number, boolean>
): readonly OwnedProperty[] {
  return Object.keys(propertyOwners)
    .map((id) =>
      getOwnedProperty(
        Number(id),
        propertyOwners,
        propertyHouses,
        mortgagedProperties
      )
    )
    .filter((op): op is OwnedProperty => op != null)
}

export function calculateRent(
  spaceOrProperty: Space | Property,
  houses: number,
  ownsAllInGroup: boolean
): number {
  if (!spaceOrProperty.rent || spaceOrProperty.rent.length === 0) return 0
  if (spaceOrProperty.type === "railroad") {
    return spaceOrProperty.rent[houses] ?? 25
  }
  if (houses === 0 && ownsAllInGroup) {
    return spaceOrProperty.rent[0] * 2
  }
  return spaceOrProperty.rent[houses] ?? spaceOrProperty.rent[0]
}

// Re-export Card model for backward compatibility
export {
  CardEffect,
  GameCard,
  CardDeck,
  CardDrawResult,
  CHANCE_CARDS,
  COMMUNITY_CHEST_CARDS,
  createDeck,
  createShuffledDeck,
  createDeckFromIds,
  drawCard,
  peekCard,
  resetDeck,
  cardsRemaining,
  drawChanceCard,
  drawCommunityChestCard,
} from "@/lib/models/card"
