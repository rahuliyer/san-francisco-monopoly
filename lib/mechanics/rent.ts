// Rent mechanics - rent calculation functions
// This module provides pure functions for calculating rent based on property type and ownership.

import type { Space, ColorGroup } from "@/lib/models/types"
import type { Property } from "@/lib/models/property"
import { BOARD_SPACES, getSpacesByColorGroup } from "@/lib/models/board"

/**
 * Calculates rent for a property based on houses and monopoly status.
 *
 * @param property The property definition
 * @param houseCount Number of houses (0-4 for houses, 5 for hotel)
 * @param ownsMonopoly Whether the owner owns all properties in the color group
 * @returns The rent amount
 */
export function calculatePropertyRent(
  property: Space | Property,
  houseCount: number,
  ownsMonopoly: boolean
): number {
  if (!property.rent || property.rent.length === 0) return 0

  // Base rent for no houses
  if (houseCount === 0) {
    // Double rent if owner has monopoly but no houses
    return ownsMonopoly ? property.rent[0] * 2 : property.rent[0]
  }

  // Rent with houses/hotel
  return property.rent[houseCount] ?? property.rent[0]
}

/**
 * Calculates rent for a railroad based on how many railroads the owner has.
 *
 * @param railroad The railroad property
 * @param railroadsOwned Number of railroads owned by the owner (1-4)
 * @returns The rent amount
 */
export function calculateRailroadRent(
  railroad: Space | Property,
  railroadsOwned: number
): number {
  if (!railroad.rent || railroad.rent.length === 0) return 25
  const index = Math.max(0, Math.min(railroadsOwned - 1, railroad.rent.length - 1))
  return railroad.rent[index] ?? 25
}

/**
 * Calculates rent for a utility based on dice roll and utility count.
 *
 * @param utilitiesOwned Number of utilities owned by the owner (1 or 2)
 * @param diceTotal The total of the dice roll that landed on this utility
 * @returns The rent amount
 */
export function calculateUtilityRent(
  utilitiesOwned: number,
  diceTotal: number
): number {
  // 4x dice for 1 utility, 10x dice for both utilities
  const multiplier = utilitiesOwned >= 2 ? 10 : 4
  return diceTotal * multiplier
}

/**
 * Calculates rent for any purchasable space based on its type.
 * This is a convenience function that delegates to the appropriate calculator.
 *
 * @param space The space definition
 * @param propertyOwners Map of property IDs to owner IDs
 * @param propertyHouses Map of property IDs to house counts
 * @param mortgagedProperties Map of property IDs to mortgage status
 * @param ownerId The ID of the space's owner
 * @param diceTotal The total of the dice roll (needed for utilities)
 * @returns The rent amount, or 0 if the property is mortgaged
 */
export function calculateRent(
  space: Space,
  propertyOwners: Record<number, number>,
  propertyHouses: Record<number, number>,
  mortgagedProperties: Record<number, boolean>,
  ownerId: number,
  diceTotal: number = 0
): number {
  // No rent for mortgaged properties
  if (mortgagedProperties[space.id] === true) {
    return 0
  }

  if (space.type === "property" && space.rent) {
    // Check if owner has all properties in the color group (non-mortgaged)
    const colorGroupSpaces = getSpacesByColorGroup(space.colorGroup)
    const ownsMonopoly = colorGroupSpaces.every(
      (s) =>
        propertyOwners[s.id] === ownerId &&
        mortgagedProperties[s.id] !== true
    )
    const houseCount = propertyHouses[space.id] ?? 0
    return calculatePropertyRent(space, houseCount, ownsMonopoly)
  }

  if (space.type === "railroad" && space.rent) {
    // Count how many railroads the owner has (non-mortgaged)
    const railroads = BOARD_SPACES.filter((s) => s.type === "railroad")
    const ownedRailroads = railroads.filter(
      (r) =>
        propertyOwners[r.id] === ownerId &&
        mortgagedProperties[r.id] !== true
    )
    return calculateRailroadRent(space, ownedRailroads.length)
  }

  if (space.type === "utility") {
    // Count how many utilities the owner has (non-mortgaged)
    const utilities = BOARD_SPACES.filter((s) => s.type === "utility")
    const ownedUtilities = utilities.filter(
      (u) =>
        propertyOwners[u.id] === ownerId &&
        mortgagedProperties[u.id] !== true
    )
    return calculateUtilityRent(ownedUtilities.length, diceTotal)
  }

  return 0
}

/**
 * Checks if a player owns all properties in a color group (monopoly).
 * Only counts non-mortgaged properties.
 */
export function ownsColorGroupMonopoly(
  colorGroup: ColorGroup,
  ownerId: number,
  propertyOwners: Record<number, number>,
  mortgagedProperties: Record<number, boolean>
): boolean {
  if (!colorGroup || colorGroup === "railroad" || colorGroup === "utility") {
    return false
  }

  const groupSpaces = getSpacesByColorGroup(colorGroup)
  return groupSpaces.every(
    (s) =>
      propertyOwners[s.id] === ownerId &&
      mortgagedProperties[s.id] !== true
  )
}

/**
 * Counts the number of railroads owned by a player (non-mortgaged).
 */
export function countOwnedRailroads(
  ownerId: number,
  propertyOwners: Record<number, number>,
  mortgagedProperties: Record<number, boolean>
): number {
  return BOARD_SPACES.filter(
    (s) =>
      s.type === "railroad" &&
      propertyOwners[s.id] === ownerId &&
      mortgagedProperties[s.id] !== true
  ).length
}

/**
 * Counts the number of utilities owned by a player (non-mortgaged).
 */
export function countOwnedUtilities(
  ownerId: number,
  propertyOwners: Record<number, number>,
  mortgagedProperties: Record<number, boolean>
): number {
  return BOARD_SPACES.filter(
    (s) =>
      s.type === "utility" &&
      propertyOwners[s.id] === ownerId &&
      mortgagedProperties[s.id] !== true
  ).length
}
