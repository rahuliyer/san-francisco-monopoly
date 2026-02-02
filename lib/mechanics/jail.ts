// Jail mechanics - functions for handling jail entry, exit, and related actions
// This module provides pure functions for jail-related game logic.

import type { Player } from "@/lib/models/player"
import {
  sendPlayerToJail,
  releasePlayerFromJail,
  updatePlayerMoney,
  incrementJailTurns,
} from "@/lib/models/player"
import { isDoubles, type DiceValues } from "./dice"
import { GAME_CONSTANTS } from "@/lib/constants"

const { JAIL_FEE, MAX_JAIL_TURNS } = GAME_CONSTANTS

/** Result of attempting to escape jail by rolling */
export interface JailEscapeResult {
  escaped: boolean
  player: Player
  paidFee: boolean
  message: string
}

/**
 * Handles a player attempting to escape jail by rolling dice.
 *
 * Rules:
 * - Rolling doubles: Player is released and can move
 * - Not rolling doubles:
 *   - If less than 3 turns: Player stays in jail, turn ends
 *   - If 3rd turn: Player must pay $50 and is released
 *
 * @param player The player in jail
 * @param dice The dice roll result
 * @returns Result indicating if the player escaped and the updated player state
 */
export function handleJailEscape(
  player: Player,
  dice: DiceValues
): JailEscapeResult {
  if (!player.inJail) {
    return {
      escaped: false,
      player,
      paidFee: false,
      message: `${player.name} is not in jail`,
    }
  }

  // Check for doubles
  if (isDoubles(dice)) {
    return {
      escaped: true,
      player: releasePlayerFromJail(player),
      paidFee: false,
      message: `${player.name} rolled doubles (${dice[0]} + ${dice[1]}) and escaped Alcatraz!`,
    }
  }

  // No doubles - increment jail turn counter
  const newJailTurns = player.jailTurns + 1

  if (newJailTurns >= MAX_JAIL_TURNS) {
    // Third turn without doubles - must pay and get released
    const updatedPlayer = releasePlayerFromJail(updatePlayerMoney(player, -JAIL_FEE))
    return {
      escaped: true,
      player: updatedPlayer,
      paidFee: true,
      message: `${player.name} paid $${JAIL_FEE} after ${MAX_JAIL_TURNS} turns in Alcatraz`,
    }
  }

  // Stay in jail
  return {
    escaped: false,
    player: incrementJailTurns(player),
    paidFee: false,
    message: `${player.name} rolled ${dice[0]} + ${dice[1]} (no doubles). Remains in Alcatraz (${MAX_JAIL_TURNS - newJailTurns} turns left)`,
  }
}

/** Result of paying the jail fee */
export interface JailFeeResult {
  success: boolean
  player: Player
  message: string
}

/**
 * Handles a player choosing to pay the jail fee to get out immediately.
 *
 * @param player The player in jail
 * @returns Result indicating if payment was successful and the updated player state
 */
export function handleJailFeePayment(player: Player): JailFeeResult {
  if (!player.inJail) {
    return {
      success: false,
      player,
      message: `${player.name} is not in jail`,
    }
  }

  if (player.isBankrupt) {
    return {
      success: false,
      player,
      message: `${player.name} is bankrupt and cannot pay the jail fee`,
    }
  }

  if (player.money < JAIL_FEE) {
    return {
      success: false,
      player,
      message: `${player.name} cannot afford the $${JAIL_FEE} jail fee`,
    }
  }

  const updatedPlayer = releasePlayerFromJail(updatePlayerMoney(player, -JAIL_FEE))
  return {
    success: true,
    player: updatedPlayer,
    message: `${player.name} paid $${JAIL_FEE} to leave Alcatraz`,
  }
}

/**
 * Checks if a player can pay the jail fee.
 */
export function canPayJailFee(player: Player): boolean {
  return player.inJail && !player.isBankrupt && player.money >= JAIL_FEE
}

/**
 * Checks if a player must pay the jail fee (3rd turn in jail without doubles).
 */
export function mustPayJailFee(player: Player): boolean {
  return player.inJail && player.jailTurns >= MAX_JAIL_TURNS - 1
}

/**
 * Gets the number of turns remaining before forced release from jail.
 */
export function turnsRemainingInJail(player: Player): number {
  if (!player.inJail) {
    return 0
  }
  return Math.max(0, MAX_JAIL_TURNS - player.jailTurns)
}

/**
 * Sends a player to jail (used when landing on "Go to Jail" or drawing a jail card).
 *
 * @param player The player to send to jail
 * @returns The updated player at the jail position
 */
export function goToJail(player: Player): Player {
  return sendPlayerToJail(player)
}

/**
 * Checks if a player should be sent to jail for rolling 3 consecutive doubles.
 *
 * @param consecutiveDoubles The number of consecutive doubles rolled
 * @param dice The current dice roll
 * @returns True if this roll is the 3rd consecutive double
 */
export function shouldGoToJailForDoubles(
  consecutiveDoubles: number,
  dice: DiceValues
): boolean {
  return isDoubles(dice) && consecutiveDoubles + 1 >= MAX_JAIL_TURNS
}
