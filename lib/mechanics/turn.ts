// Turn mechanics - functions for managing turn flow
// This module provides pure functions for determining turn order and state.

import type { Player } from "@/lib/models/player"
import { GAME_CONSTANTS } from "@/lib/constants"

const { MAX_JAIL_TURNS } = GAME_CONSTANTS

/** Context for turn-related decisions */
export interface TurnContext {
  players: readonly Player[]
  currentPlayerIndex: number
  hasRolled: boolean
  consecutiveDoubles: number
  awaitingPropertyDecision: boolean
  awaitingSpecialSpace: boolean
  gameOver: boolean
}

/**
 * Gets the index of the next active (non-bankrupt) player.
 * Returns null if no active players remain.
 */
export function getNextPlayerIndex(
  players: readonly Player[],
  currentIndex: number
): number | null {
  if (players.length === 0) {
    return null
  }

  for (let offset = 1; offset <= players.length; offset++) {
    const nextIndex = (currentIndex + offset) % players.length
    if (!players[nextIndex].isBankrupt) {
      return nextIndex
    }
  }

  return null
}

/**
 * Checks if the current turn should end.
 * A turn ends when:
 * - The player has rolled (no doubles) and completed any required actions
 * - The player is in jail
 * - The game is over
 */
export function shouldEndTurn(context: TurnContext): boolean {
  const {
    hasRolled,
    consecutiveDoubles,
    awaitingPropertyDecision,
    awaitingSpecialSpace,
    gameOver,
  } = context

  // Don't end turn if game is over (we stop at game over state)
  if (gameOver) {
    return false
  }

  // Don't end turn if player is waiting to make a decision
  if (awaitingPropertyDecision || awaitingSpecialSpace) {
    return false
  }

  // Don't end turn if player hasn't rolled yet
  if (!hasRolled) {
    return false
  }

  // If player rolled doubles (and didn't go to jail), they get another roll
  if (consecutiveDoubles > 0) {
    return false
  }

  return true
}

/**
 * Checks if the current player can roll again (doubles rule).
 */
export function shouldRollAgain(context: TurnContext): boolean {
  const {
    players,
    currentPlayerIndex,
    hasRolled,
    consecutiveDoubles,
    awaitingPropertyDecision,
    awaitingSpecialSpace,
    gameOver,
  } = context

  if (gameOver) {
    return false
  }

  // Can't roll if waiting for a decision
  if (awaitingPropertyDecision || awaitingSpecialSpace) {
    return false
  }

  // Must have rolled first
  if (!hasRolled) {
    return false
  }

  // Must have rolled doubles
  if (consecutiveDoubles === 0) {
    return false
  }

  // Player must not be in jail (they would have been sent there for 3rd double)
  const currentPlayer = players[currentPlayerIndex]
  if (currentPlayer.inJail) {
    return false
  }

  return true
}

/**
 * Checks if the current player can roll.
 */
export function canRoll(context: TurnContext): boolean {
  const {
    players,
    currentPlayerIndex,
    hasRolled,
    awaitingPropertyDecision,
    awaitingSpecialSpace,
    gameOver,
  } = context

  if (gameOver) {
    return false
  }

  const currentPlayer = players[currentPlayerIndex]
  if (currentPlayer.isBankrupt) {
    return false
  }

  // Can't roll if waiting for a decision
  if (awaitingPropertyDecision || awaitingSpecialSpace) {
    return false
  }

  // Can roll if haven't rolled yet
  if (!hasRolled) {
    return true
  }

  // Can roll again if doubles (handled by shouldRollAgain)
  return shouldRollAgain(context)
}

/**
 * Checks if the current player is forced to pay the jail fee (3rd turn in jail).
 */
export function mustPayJailFee(player: Player): boolean {
  return player.inJail && player.jailTurns >= MAX_JAIL_TURNS - 1
}

/**
 * Gets the number of active (non-bankrupt) players.
 */
export function getActivePlayerCount(players: readonly Player[]): number {
  return players.filter((p) => !p.isBankrupt).length
}

/**
 * Checks if the game should end (only one active player remains).
 */
export function shouldGameEnd(players: readonly Player[]): boolean {
  return players.length > 1 && getActivePlayerCount(players) <= 1
}

/**
 * Gets the winner (the only non-bankrupt player) if the game is over.
 */
export function getWinner(players: readonly Player[]): Player | null {
  if (!shouldGameEnd(players)) {
    return null
  }
  return players.find((p) => !p.isBankrupt) ?? null
}

/**
 * Creates the initial turn state for starting a new game.
 */
export function createInitialTurnState(): Omit<TurnContext, "players"> {
  return {
    currentPlayerIndex: 0,
    hasRolled: false,
    consecutiveDoubles: 0,
    awaitingPropertyDecision: false,
    awaitingSpecialSpace: false,
    gameOver: false,
  }
}

/**
 * Resets the turn state for a new turn (same player rolling again after doubles).
 */
export function resetForDoubles(context: TurnContext): Partial<TurnContext> {
  return {
    hasRolled: false,
    awaitingPropertyDecision: false,
    awaitingSpecialSpace: false,
  }
}

/**
 * Resets the turn state for the next player's turn.
 */
export function resetForNextTurn(
  context: TurnContext,
  nextPlayerIndex: number
): Partial<TurnContext> {
  return {
    currentPlayerIndex: nextPlayerIndex,
    hasRolled: false,
    consecutiveDoubles: 0,
    awaitingPropertyDecision: false,
    awaitingSpecialSpace: false,
  }
}
