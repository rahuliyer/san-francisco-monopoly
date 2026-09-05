// Property actions - validation and calculation functions for property operations
// This module provides pure functions for checking if property actions are valid.

import type { Space, ColorGroup } from "@/lib/models/types"
import type { Player } from "@/lib/models/player"
import { getSpacesByColorGroup } from "@/lib/models/board"
import { GAME_CONSTANTS } from "@/lib/constants"

const { MORTGAGE_INTEREST_RATE, MAX_HOUSES } = GAME_CONSTANTS

/** Result of checking if an action is allowed */
export interface ActionCheck {
  allowed: boolean
  reason?: string
}

/**
 * Checks if a player can buy a property.
 */
export function canBuyProperty(
  player: Player,
  property: Space,
  currentOwner: number | undefined
): ActionCheck {
  if (player.isBankrupt) {
    return { allowed: false, reason: "Player is bankrupt" }
  }

  if (currentOwner !== undefined) {
    return { allowed: false, reason: "Property is already owned" }
  }

  if (property.price === undefined) {
    return { allowed: false, reason: "Property is not for sale" }
  }

  if (player.money < property.price) {
    return { allowed: false, reason: `Need $${property.price} to buy` }
  }

  return { allowed: true }
}

/**
 * Checks if a player can build a house on a property.
 */
export function canBuildHouse(
  player: Player,
  property: Space,
  ownerId: number | undefined,
  propertyOwners: Record<number, number>,
  propertyHouses: Record<number, number>,
  mortgagedProperties: Record<number, boolean>
): ActionCheck {
  if (player.isBankrupt) {
    return { allowed: false, reason: "Player is bankrupt" }
  }

  // Must own the property
  if (ownerId !== player.id) {
    return { allowed: false, reason: "You don't own this property" }
  }

  // Only regular properties can have houses
  if (property.type !== "property") {
    return { allowed: false, reason: "Can only build on regular properties" }
  }

  if (!property.houseCost) {
    return { allowed: false, reason: "This property cannot have houses" }
  }

  // Property must not be mortgaged
  if (mortgagedProperties[property.id] === true) {
    return { allowed: false, reason: "Cannot build on mortgaged property" }
  }

  // Must own all properties in the color group (monopoly).
  const groupSpaces = getSpacesByColorGroup(property.colorGroup)
  const ownsMonopoly = groupSpaces.every(
    (s) => propertyOwners[s.id] === player.id
  )

  if (!ownsMonopoly) {
    return { allowed: false, reason: "Own all properties in this neighborhood to build" }
  }

  const hasMortgagedProperty = groupSpaces.some(
    (s) => mortgagedProperties[s.id] === true
  )
  if (hasMortgagedProperty) {
    return { allowed: false, reason: "Unmortgage all properties in this neighborhood to build" }
  }

  // Check current house count
  const currentHouseCount = propertyHouses[property.id] ?? 0
  if (currentHouseCount >= MAX_HOUSES) {
    return { allowed: false, reason: "This property already has a hotel" }
  }

  // Must build evenly across the color group
  const groupHouseCounts = groupSpaces.map((s) => propertyHouses[s.id] ?? 0)
  const minHouseCount = Math.min(...groupHouseCounts)
  if (currentHouseCount !== minHouseCount) {
    return { allowed: false, reason: "Build evenly across the neighborhood" }
  }

  // Must have enough money
  if (player.money < property.houseCost) {
    return { allowed: false, reason: `Need $${property.houseCost} to build` }
  }

  return { allowed: true }
}

/**
 * Checks if a player can mortgage a property.
 */
export function canMortgage(
  player: Player,
  property: Space,
  ownerId: number | undefined,
  propertyHouses: Record<number, number>,
  mortgagedProperties: Record<number, boolean>
): ActionCheck {
  if (player.isBankrupt) {
    return { allowed: false, reason: "Player is bankrupt" }
  }

  if (ownerId !== player.id) {
    return { allowed: false, reason: "You don't own this property" }
  }

  if (property.mortgage === undefined) {
    return { allowed: false, reason: "This property cannot be mortgaged" }
  }

  if (mortgagedProperties[property.id] === true) {
    return { allowed: false, reason: "Property is already mortgaged" }
  }

  // Cannot mortgage if there are houses on this property or any in the color group
  if (property.type === "property" && property.colorGroup) {
    const groupSpaces = getSpacesByColorGroup(property.colorGroup)
    const hasHousesInGroup = groupSpaces.some(
      (s) => (propertyHouses[s.id] ?? 0) > 0
    )
    if (hasHousesInGroup) {
      return { allowed: false, reason: "Sell all houses in this neighborhood first" }
    }
  }

  return { allowed: true }
}

/**
 * Checks if a player can unmortgage a property.
 */
export function canUnmortgage(
  player: Player,
  property: Space,
  ownerId: number | undefined,
  mortgagedProperties: Record<number, boolean>
): ActionCheck {
  if (player.isBankrupt) {
    return { allowed: false, reason: "Player is bankrupt" }
  }

  if (ownerId !== player.id) {
    return { allowed: false, reason: "You don't own this property" }
  }

  if (property.mortgage === undefined) {
    return { allowed: false, reason: "This property cannot be unmortgaged" }
  }

  if (mortgagedProperties[property.id] !== true) {
    return { allowed: false, reason: "Property is not mortgaged" }
  }

  const unmortgageCost = calculateUnmortgageCost(property.mortgage)
  if (player.money < unmortgageCost) {
    return { allowed: false, reason: `Need $${unmortgageCost} to unmortgage` }
  }

  return { allowed: true }
}

/**
 * Calculates the cost to unmortgage a property (mortgage value + 10% interest).
 */
export function calculateUnmortgageCost(mortgageValue: number): number {
  return Math.ceil(mortgageValue * (1 + MORTGAGE_INTEREST_RATE))
}

/**
 * Checks if a player can sell a house from a property.
 */
export function canSellHouse(
  player: Player,
  property: Space,
  ownerId: number | undefined,
  propertyOwners: Record<number, number>,
  propertyHouses: Record<number, number>
): ActionCheck {
  if (player.isBankrupt) {
    return { allowed: false, reason: "Player is bankrupt" }
  }

  if (ownerId !== player.id) {
    return { allowed: false, reason: "You don't own this property" }
  }

  if (property.type !== "property") {
    return { allowed: false, reason: "This property cannot have houses" }
  }

  const currentHouseCount = propertyHouses[property.id] ?? 0
  if (currentHouseCount === 0) {
    return { allowed: false, reason: "No houses to sell" }
  }

  // Must sell evenly across the color group (highest first)
  const groupSpaces = getSpacesByColorGroup(property.colorGroup)
  const groupHouseCounts = groupSpaces.map((s) => propertyHouses[s.id] ?? 0)
  const maxHouseCount = Math.max(...groupHouseCounts)
  if (currentHouseCount !== maxHouseCount) {
    return { allowed: false, reason: "Sell evenly across the neighborhood" }
  }

  return { allowed: true }
}

/**
 * Calculates the sell price for a house (half of purchase price).
 */
export function calculateHouseSellPrice(houseCost: number): number {
  return Math.floor(houseCost / 2)
}

/**
 * Gets a summary of what the player can do with a property.
 */
export function getPropertyActions(
  player: Player,
  property: Space,
  ownerId: number | undefined,
  propertyOwners: Record<number, number>,
  propertyHouses: Record<number, number>,
  mortgagedProperties: Record<number, boolean>
): {
  canBuy: ActionCheck
  canBuildHouse: ActionCheck
  canSellHouse: ActionCheck
  canMortgage: ActionCheck
  canUnmortgage: ActionCheck
} {
  return {
    canBuy: canBuyProperty(player, property, ownerId),
    canBuildHouse: canBuildHouse(player, property, ownerId, propertyOwners, propertyHouses, mortgagedProperties),
    canSellHouse: canSellHouse(player, property, ownerId, propertyOwners, propertyHouses),
    canMortgage: canMortgage(player, property, ownerId, propertyHouses, mortgagedProperties),
    canUnmortgage: canUnmortgage(player, property, ownerId, mortgagedProperties),
  }
}
