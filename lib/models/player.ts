// Player model - immutable player state management
// This module provides the Player interface and pure helper functions for player state manipulation.

import { GAME_CONSTANTS } from "@/lib/constants"

const { STARTING_MONEY, JAIL_POSITION } = GAME_CONSTANTS

/** Player token configuration */
export interface PlayerToken {
  name: string
  icon: string
  color: string
}

/** Available player tokens */
export const PLAYER_TOKENS: readonly PlayerToken[] = [
  { name: "Cable Car", icon: "🚃", color: "#C4451A" },
  { name: "Crab", icon: "🦀", color: "#2563EB" },
  { name: "Victorian House", icon: "🏠", color: "#16A34A" },
  { name: "Golden Gate", icon: "🌉", color: "#9333EA" },
] as const

/** Immutable player state */
export interface Player {
  readonly id: number
  readonly name: string
  readonly color: string
  readonly token: string
  readonly money: number
  readonly position: number
  readonly properties: readonly number[]
  readonly inJail: boolean
  readonly jailTurns: number
  readonly isBankrupt: boolean
}

/** Configuration for creating a new player */
export interface PlayerSetup {
  name: string
  tokenIndex: number
}

/**
 * Creates a new player with the given id, name, and token.
 * Players start at position 0 with starting money and no properties.
 */
export function createPlayer(
  id: number,
  name: string,
  tokenIndex: number,
  initialMoney: number = STARTING_MONEY
): Player {
  const token = PLAYER_TOKENS[tokenIndex]
  return {
    id,
    name,
    color: token.color,
    token: token.icon,
    money: initialMoney,
    position: 0,
    properties: [],
    inJail: false,
    jailTurns: 0,
    isBankrupt: false,
  }
}

/**
 * Returns a new player with updated money (added delta).
 * Positive delta = add money, negative delta = subtract money.
 */
export function updatePlayerMoney(player: Player, delta: number): Player {
  return {
    ...player,
    money: player.money + delta,
  }
}

/**
 * Returns a new player at the given position.
 */
export function updatePlayerPosition(player: Player, position: number): Player {
  return {
    ...player,
    position,
  }
}

/**
 * Returns a new player sent to jail.
 * Position is set to jail, inJail is true, jailTurns reset to 0.
 */
export function sendPlayerToJail(player: Player): Player {
  return {
    ...player,
    position: JAIL_POSITION,
    inJail: true,
    jailTurns: 0,
  }
}

/**
 * Returns a new player released from jail.
 * inJail is set to false, jailTurns reset to 0.
 */
export function releasePlayerFromJail(player: Player): Player {
  return {
    ...player,
    inJail: false,
    jailTurns: 0,
  }
}

/**
 * Increments the player's jail turn counter.
 */
export function incrementJailTurns(player: Player): Player {
  return {
    ...player,
    jailTurns: player.jailTurns + 1,
  }
}

/**
 * Checks if a player can afford a given amount.
 */
export function canAfford(player: Player, amount: number): boolean {
  return player.money >= amount
}

/**
 * Returns a new player with the given property added to their portfolio.
 */
export function addProperty(player: Player, propertyId: number): Player {
  return {
    ...player,
    properties: [...player.properties, propertyId],
  }
}

/**
 * Returns a new player with the given property removed from their portfolio.
 */
export function removeProperty(player: Player, propertyId: number): Player {
  return {
    ...player,
    properties: player.properties.filter((id) => id !== propertyId),
  }
}

/**
 * Returns a new player marked as bankrupt.
 * All properties are cleared, money set to 0, jail status cleared.
 */
export function markBankrupt(player: Player): Player {
  return {
    ...player,
    isBankrupt: true,
    money: 0,
    properties: [],
    inJail: false,
    jailTurns: 0,
  }
}

/**
 * Checks if the player is active (not bankrupt).
 */
export function isActivePlayer(player: Player): boolean {
  return !player.isBankrupt
}
