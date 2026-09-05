// Game loop - orchestrates game state changes through actions
// This module provides the GameLoop class that manages state and dispatches actions.

import type { GameState } from "@/lib/game-store"
import type { GameAction, ActionResult, TradePayload } from "./actions"
import { gameReducer, type ReducerDependencies } from "./reducers"
import type { DiceRoller } from "@/lib/mechanics/dice"
import { RandomDiceRoller, createLegacyCompatibleRoller } from "@/lib/mechanics/dice"
import { canRoll, shouldRollAgain } from "@/lib/mechanics/turn"
import { canPayJailFee } from "@/lib/mechanics/jail"
import { canBuyProperty, canBuildHouse, canMortgage, canUnmortgage, canSellHouse } from "@/lib/mechanics/property-actions"
import { BOARD_SPACES } from "@/lib/models/board"
import type { PlayerSetup } from "@/lib/models/player"

/** Dependencies for the GameLoop */
export interface GameLoopDependencies {
  diceRoller?: DiceRoller
}

/**
 * GameLoop class - manages game state and action dispatch.
 *
 * Usage:
 *   const loop = new GameLoop(initialState, { diceRoller: new RandomDiceRoller() })
 *   loop.dispatch({ type: 'ROLL_DICE' })
 *   const state = loop.getState()
 */
export class GameLoop {
  private state: GameState
  private deps: ReducerDependencies
  private listeners: Set<(state: GameState) => void>

  constructor(initialState: GameState, deps: GameLoopDependencies = {}) {
    this.state = initialState
    this.deps = {
      diceRoller: deps.diceRoller ?? createLegacyCompatibleRoller(),
    }
    this.listeners = new Set()
  }

  /**
   * Gets the current game state.
   */
  getState(): GameState {
    return this.state
  }

  /**
   * Dispatches an action to update the game state.
   *
   * @param action The action to dispatch
   * @returns Result indicating success or failure
   */
  dispatch(action: GameAction): ActionResult {
    // Validate action can be performed
    if (!this.canDispatch(action)) {
      return {
        success: false,
        message: `Action ${action.type} cannot be performed in current state`,
      }
    }

    // Apply reducer
    const newState = gameReducer(this.state, action, this.deps)

    // Only update if state actually changed
    if (newState !== this.state) {
      this.state = newState
      this.notifyListeners()
    }

    return { success: true }
  }

  /**
   * Checks if an action can be dispatched in the current state.
   */
  canDispatch(action: GameAction): boolean {
    const { state } = this
    const currentPlayer = state.players[state.currentPlayerIndex]

    switch (action.type) {
      case "START_GAME":
        return state.players.length === 0

      case "RESET_GAME":
        return true

      case "ROLL_DICE":
        return canRoll({
          players: state.players,
          currentPlayerIndex: state.currentPlayerIndex,
          hasRolled: state.hasRolled,
          consecutiveDoubles: state.consecutiveDoubles,
          awaitingPropertyDecision: state.awaitingPropertyDecision,
          awaitingSpecialSpace: state.awaitingSpecialSpace,
          gameOver: state.gameOver,
        })

      case "END_TURN":
        return (
          !state.gameOver &&
          state.hasRolled &&
          !state.awaitingPropertyDecision &&
          !state.awaitingSpecialSpace &&
          state.consecutiveDoubles === 0
        )

      case "BUY_PROPERTY": {
        const space = BOARD_SPACES[action.propertyId]
        if (!space) return false
        const check = canBuyProperty(
          currentPlayer,
          space,
          state.propertyOwners[action.propertyId]
        )
        return check.allowed
      }

      case "PASS_PROPERTY":
        return state.awaitingPropertyDecision && state.selectedSpace !== null

      case "BUILD_HOUSE": {
        const space = BOARD_SPACES[action.propertyId]
        if (!space) return false
        const check = canBuildHouse(
          currentPlayer,
          space,
          state.propertyOwners[action.propertyId],
          state.propertyOwners,
          state.propertyHouses,
          state.mortgagedProperties
        )
        return check.allowed
      }

      case "SELL_HOUSE": {
        const space = BOARD_SPACES[action.propertyId]
        if (!space) return false
        const check = canSellHouse(
          currentPlayer,
          space,
          state.propertyOwners[action.propertyId],
          state.propertyOwners,
          state.propertyHouses
        )
        return check.allowed
      }

      case "MORTGAGE": {
        const space = BOARD_SPACES[action.propertyId]
        if (!space) return false
        const check = canMortgage(
          currentPlayer,
          space,
          state.propertyOwners[action.propertyId],
          state.propertyHouses,
          state.mortgagedProperties
        )
        return check.allowed
      }

      case "UNMORTGAGE": {
        const space = BOARD_SPACES[action.propertyId]
        if (!space) return false
        const check = canUnmortgage(
          currentPlayer,
          space,
          state.propertyOwners[action.propertyId],
          state.mortgagedProperties
        )
        return check.allowed
      }

      case "PAY_JAIL_FEE":
        return canPayJailFee(currentPlayer)

      case "PROPOSE_TRADE":
        return (
          !state.gameOver &&
          !currentPlayer.isBankrupt &&
          state.players.filter((p) => !p.isBankrupt).length >= 2
        )

      case "SELECT_SPACE":
      case "CLOSE_PROPERTY_MODAL":
      case "CLOSE_SPECIAL_SPACE_MODAL":
      case "VIEW_PLAYER_PROPERTIES":
      case "CLOSE_PLAYER_PROPERTIES":
      case "ADD_LOG":
        return true

      default:
        return true
    }
  }

  /**
   * Subscribes to state changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Gets the dice roller for this game loop.
   */
  getDiceRoller(): DiceRoller {
    return this.deps.diceRoller
  }

  /**
   * Sets a new dice roller (useful for testing).
   */
  setDiceRoller(roller: DiceRoller): void {
    this.deps.diceRoller = roller
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state))
  }
}

// Re-export types and helpers
export * from "./actions"
export type { ReducerDependencies } from "./reducers"
