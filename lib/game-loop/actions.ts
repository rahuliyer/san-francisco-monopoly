// Game loop actions - type definitions for all game actions
// This module defines the action types used by the game loop reducers.

import type { PlayerSetup } from "@/lib/models/player"
import type { Space } from "@/lib/models/types"
import type { GameCard } from "@/lib/models/card"

/** Trade payload for proposing trades between players */
export interface TradePayload {
  partnerId: number
  offerPropertyIds: number[]
  offerCash: number
  requestPropertyIds: number[]
  requestCash: number
}

/** All possible game actions */
export type GameAction =
  // Game lifecycle
  | { type: "START_GAME"; players: PlayerSetup[] }
  | { type: "RESET_GAME" }

  // Turn actions
  | { type: "ROLL_DICE" }
  | { type: "END_TURN" }

  // Property actions
  | { type: "BUY_PROPERTY"; propertyId: number }
  | { type: "PASS_PROPERTY" }
  | { type: "BUILD_HOUSE"; propertyId: number }
  | { type: "SELL_HOUSE"; propertyId: number }
  | { type: "MORTGAGE"; propertyId: number }
  | { type: "UNMORTGAGE"; propertyId: number }

  // Jail actions
  | { type: "PAY_JAIL_FEE" }
  | { type: "USE_JAIL_CARD" }

  // Trading actions
  | { type: "PROPOSE_TRADE"; trade: TradePayload }
  | { type: "ACCEPT_TRADE" }
  | { type: "REJECT_TRADE" }

  // Card actions
  | { type: "DRAW_CARD"; cardType: "chance" | "community-chest" }
  | { type: "APPLY_CARD_EFFECT"; card: GameCard }

  // UI actions (for managing modals and selections)
  | { type: "SELECT_SPACE"; space: Space | null }
  | { type: "CLOSE_PROPERTY_MODAL" }
  | { type: "CLOSE_SPECIAL_SPACE_MODAL" }
  | { type: "VIEW_PLAYER_PROPERTIES"; playerId: number }
  | { type: "CLOSE_PLAYER_PROPERTIES" }

  // Internal actions (used by reducers, not typically dispatched directly)
  | { type: "MOVE_PLAYER"; playerId: number; position: number; passedGo: boolean }
  | { type: "SEND_TO_JAIL"; playerId: number }
  | { type: "RELEASE_FROM_JAIL"; playerId: number }
  | { type: "UPDATE_MONEY"; playerId: number; delta: number }
  | { type: "MARK_BANKRUPT"; playerId: number }
  | { type: "SET_DICE"; dice: [number, number] }
  | { type: "ADD_LOG"; message: string }

/** Result of dispatching an action */
export interface ActionResult {
  success: boolean
  message?: string
}

/** Helper to create action creators */
export const actions = {
  // Game lifecycle
  startGame: (players: PlayerSetup[]): GameAction => ({
    type: "START_GAME",
    players,
  }),
  resetGame: (): GameAction => ({ type: "RESET_GAME" }),

  // Turn actions
  rollDice: (): GameAction => ({ type: "ROLL_DICE" }),
  endTurn: (): GameAction => ({ type: "END_TURN" }),

  // Property actions
  buyProperty: (propertyId: number): GameAction => ({
    type: "BUY_PROPERTY",
    propertyId,
  }),
  passProperty: (): GameAction => ({ type: "PASS_PROPERTY" }),
  buildHouse: (propertyId: number): GameAction => ({
    type: "BUILD_HOUSE",
    propertyId,
  }),
  sellHouse: (propertyId: number): GameAction => ({
    type: "SELL_HOUSE",
    propertyId,
  }),
  mortgage: (propertyId: number): GameAction => ({
    type: "MORTGAGE",
    propertyId,
  }),
  unmortgage: (propertyId: number): GameAction => ({
    type: "UNMORTGAGE",
    propertyId,
  }),

  // Jail actions
  payJailFee: (): GameAction => ({ type: "PAY_JAIL_FEE" }),
  useJailCard: (): GameAction => ({ type: "USE_JAIL_CARD" }),

  // Trading actions
  proposeTrade: (trade: TradePayload): GameAction => ({
    type: "PROPOSE_TRADE",
    trade,
  }),
  acceptTrade: (): GameAction => ({ type: "ACCEPT_TRADE" }),
  rejectTrade: (): GameAction => ({ type: "REJECT_TRADE" }),

  // Card actions
  drawCard: (cardType: "chance" | "community-chest"): GameAction => ({
    type: "DRAW_CARD",
    cardType,
  }),
  applyCardEffect: (card: GameCard): GameAction => ({
    type: "APPLY_CARD_EFFECT",
    card,
  }),

  // UI actions
  selectSpace: (space: Space | null): GameAction => ({
    type: "SELECT_SPACE",
    space,
  }),
  closePropertyModal: (): GameAction => ({ type: "CLOSE_PROPERTY_MODAL" }),
  closeSpecialSpaceModal: (): GameAction => ({ type: "CLOSE_SPECIAL_SPACE_MODAL" }),
  viewPlayerProperties: (playerId: number): GameAction => ({
    type: "VIEW_PLAYER_PROPERTIES",
    playerId,
  }),
  closePlayerProperties: (): GameAction => ({ type: "CLOSE_PLAYER_PROPERTIES" }),

  // Internal actions
  movePlayer: (
    playerId: number,
    position: number,
    passedGo: boolean
  ): GameAction => ({
    type: "MOVE_PLAYER",
    playerId,
    position,
    passedGo,
  }),
  sendToJail: (playerId: number): GameAction => ({
    type: "SEND_TO_JAIL",
    playerId,
  }),
  releaseFromJail: (playerId: number): GameAction => ({
    type: "RELEASE_FROM_JAIL",
    playerId,
  }),
  updateMoney: (playerId: number, delta: number): GameAction => ({
    type: "UPDATE_MONEY",
    playerId,
    delta,
  }),
  markBankrupt: (playerId: number): GameAction => ({
    type: "MARK_BANKRUPT",
    playerId,
  }),
  setDice: (dice: [number, number]): GameAction => ({
    type: "SET_DICE",
    dice,
  }),
  addLog: (message: string): GameAction => ({
    type: "ADD_LOG",
    message,
  }),
} as const
