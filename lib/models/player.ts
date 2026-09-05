// Player model - immutable player state management
// This module provides the Player interface and pure helper functions for player state manipulation.

import { GAME_CONSTANTS } from "@/lib/constants"
import type { CardDeckType } from "@/lib/models/card"

const { STARTING_MONEY, JAIL_POSITION } = GAME_CONSTANTS

/** Player token configuration */
export interface PlayerToken {
  name: string
  sprite: string
  color: string
}

/** Available player tokens */
export const PLAYER_TOKENS: readonly PlayerToken[] = [
  { name: "Crab", sprite: "/images/tokens/crab.png", color: "#B8860B" },
  { name: "Golden Gate", sprite: "/images/tokens/golden-gate.png", color: "#E07020" },
  { name: "Cable Car", sprite: "/images/tokens/cable-car.png", color: "#C4451A" },
  { name: "Sea Lion", sprite: "/images/tokens/sea-lion.png", color: "#C9A227" },
] as const

/** Immutable player state */
export interface Player {
  readonly id: number
  readonly name: string
  readonly color: string
  readonly token: string // sprite path
  readonly money: number
  readonly position: number
  readonly properties: readonly number[]
  readonly inJail: boolean
  readonly jailTurns: number
  readonly isBankrupt: boolean
  /** Held cards record their source so each one can return to the correct deck. */
  readonly getOutOfJailFreeCards: readonly CardDeckType[]
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
    token: token.sprite,
    money: initialMoney,
    position: 0,
    properties: [],
    inJail: false,
    jailTurns: 0,
    isBankrupt: false,
    getOutOfJailFreeCards: [],
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
    getOutOfJailFreeCards: [],
  }
}

/**
 * Checks if the player is active (not bankrupt).
 */
export function isActivePlayer(player: Player): boolean {
  return !player.isBankrupt
}
