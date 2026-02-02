// Property model - immutable property state management
// This module provides Property-related types and pure helper functions.

import type { ColorGroup, Space, SpaceType, PropertyType as BasePropertyType } from "./types"

// Re-export PropertyType for backwards compatibility
export type PropertyType = BasePropertyType

/** Purchasable space type: property, railroad, or utility. */
export type PropertyType = "property" | "railroad" | "utility"

/**
 * Immutable definition of a purchasable board space (property, railroad, or utility).
 * All fields are readonly; use this for static definition data (name, color, rent, etc.).
 */
export interface Property {
  readonly id: number
  readonly name: string
  readonly type: PropertyType
  readonly colorGroup: NonNullable<ColorGroup>
  readonly price: number
  readonly rent: readonly number[]
  readonly houseCost?: number
  readonly mortgage: number
  readonly image?: string
}

/**
 * Immutable game state for an owned property.
 * Combines the static Property definition with runtime state (owner, houses, mortgage).
 */
export interface OwnedProperty {
  readonly property: Property
  readonly ownerId: number
  readonly houseCount: number
  readonly isMortgaged: boolean
}

/**
 * Consolidated property ownership state - single source of truth for a property's ownership.
 * This replaces the scattered state across propertyOwners, propertyHouses, mortgagedProperties maps.
 */
export interface PropertyOwnership {
  readonly propertyId: number
  readonly ownerId: number
  readonly houseCount: number
  readonly isMortgaged: boolean
}

/**
 * Legacy property state maps used in the current GameState.
 * Used for migration between old and new property state representations.
 */
export interface LegacyPropertyMaps {
  propertyOwners: Record<number, number>
  propertyHouses: Record<number, number>
  mortgagedProperties: Record<number, boolean>
}

/**
 * Converts the legacy scattered property maps to a consolidated PropertyOwnership array.
 * Use this when migrating from the old state structure.
 */
export function fromLegacyMaps(legacy: LegacyPropertyMaps): PropertyOwnership[] {
  const ownerships: PropertyOwnership[] = []

  for (const [propertyIdStr, ownerId] of Object.entries(legacy.propertyOwners)) {
    const propertyId = Number(propertyIdStr)
    ownerships.push({
      propertyId,
      ownerId,
      houseCount: legacy.propertyHouses[propertyId] ?? 0,
      isMortgaged: legacy.mortgagedProperties[propertyId] === true,
    })
  }

  return ownerships
}

/**
 * Converts a consolidated PropertyOwnership array back to legacy maps.
 * Use this for backward compatibility with existing code.
 */
export function toLegacyMaps(ownerships: readonly PropertyOwnership[]): LegacyPropertyMaps {
  const propertyOwners: Record<number, number> = {}
  const propertyHouses: Record<number, number> = {}
  const mortgagedProperties: Record<number, boolean> = {}

  for (const ownership of ownerships) {
    propertyOwners[ownership.propertyId] = ownership.ownerId
    if (ownership.houseCount > 0) {
      propertyHouses[ownership.propertyId] = ownership.houseCount
    }
    if (ownership.isMortgaged) {
      mortgagedProperties[ownership.propertyId] = true
    }
  }

  return { propertyOwners, propertyHouses, mortgagedProperties }
}

/**
 * Gets ownership info for a specific property from the array.
 */
export function getOwnership(
  ownerships: readonly PropertyOwnership[],
  propertyId: number
): PropertyOwnership | undefined {
  return ownerships.find((o) => o.propertyId === propertyId)
}

/**
 * Gets all properties owned by a specific player.
 */
export function getPlayerOwnerships(
  ownerships: readonly PropertyOwnership[],
  playerId: number
): PropertyOwnership[] {
  return ownerships.filter((o) => o.ownerId === playerId)
}

/**
 * Updates a property's ownership state immutably.
 */
export function updateOwnership(
  ownerships: readonly PropertyOwnership[],
  propertyId: number,
  updates: Partial<Omit<PropertyOwnership, "propertyId">>
): PropertyOwnership[] {
  return ownerships.map((o) =>
    o.propertyId === propertyId ? { ...o, ...updates } : o
  )
}

/**
 * Adds a new property ownership record.
 */
export function addOwnership(
  ownerships: readonly PropertyOwnership[],
  ownership: PropertyOwnership
): PropertyOwnership[] {
  return [...ownerships, ownership]
}

/**
 * Creates a new ownership record for a property purchase.
 */
export function createOwnership(
  propertyId: number,
  ownerId: number
): PropertyOwnership {
  return {
    propertyId,
    ownerId,
    houseCount: 0,
    isMortgaged: false,
  }
}

/**
 * Removes ownership for a property (e.g., during bankruptcy).
 */
export function removeOwnership(
  ownerships: readonly PropertyOwnership[],
  propertyId: number
): PropertyOwnership[] {
  return ownerships.filter((o) => o.propertyId !== propertyId)
}

/**
 * Removes all ownerships for a specific player (e.g., during bankruptcy).
 */
export function removePlayerOwnerships(
  ownerships: readonly PropertyOwnership[],
  playerId: number
): PropertyOwnership[] {
  return ownerships.filter((o) => o.ownerId !== playerId)
}

/**
 * Type guard to check if a space is purchasable.
 */
export function isPurchasableSpace(
  space: Space
): space is Space & {
  type: PropertyType
  colorGroup: NonNullable<ColorGroup>
  price: number
  mortgage: number
} {
  const purchasableTypes: SpaceType[] = ["property", "railroad", "utility"]
  return (
    purchasableTypes.includes(space.type) &&
    space.colorGroup != null &&
    space.price != null &&
    space.mortgage != null
  )
}

/**
 * Converts a purchasable Space to a Property.
 */
export function spaceToProperty(
  space: Space & {
    type: PropertyType
    colorGroup: NonNullable<ColorGroup>
    price: number
    mortgage: number
  }
): Property {
  return {
    id: space.id,
    name: space.name,
    type: space.type,
    colorGroup: space.colorGroup,
    price: space.price,
    rent: (space.rent ?? []) as readonly number[],
    houseCost: space.houseCost,
    mortgage: space.mortgage,
    image: space.image,
  }
}
