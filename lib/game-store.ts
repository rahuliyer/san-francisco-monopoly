/**
 * Game store: holds game state and supports injection for e2e tests.
 * Use IGameStore in the app; inject a GameStore with custom diceRoller in e2e.
 */

import type { Player, Space, GameCard } from "@/lib/game-data"
import { rollDice as defaultRollDice } from "@/lib/game-data"
import { GAME_CONSTANTS } from "@/lib/constants"

const { LOG_HISTORY_SIZE } = GAME_CONSTANTS

/** Full game state shape used by the UI and store. */
export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  propertyOwners: Record<number, number>
  mortgagedProperties: Record<number, boolean>
  propertyHouses: Record<number, number>
  diceValues: [number, number]
  hasRolled: boolean
  rolling: boolean
  consecutiveDoubles: number
  selectedSpace: Space | null
  specialSpace: Space | null
  drawnCard: GameCard | null
  gameLog: string[]
  awaitingPropertyDecision: boolean
  awaitingSpecialSpace: boolean
  isOwnProperty: boolean
  rentPaid: number | undefined
  viewingPropertiesForPlayer: Player | null
  gameOver: boolean
  winnerId: number | null
}

/** Returns random initial dice values (display only). */
export function getRandomInitialDice(): [number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ]
}

/** Builds the initial empty game state. */
export function createInitialGameState(): GameState {
  return {
    players: [],
    currentPlayerIndex: 0,
    propertyOwners: {},
    mortgagedProperties: {},
    propertyHouses: {},
    diceValues: getRandomInitialDice(),
    hasRolled: false,
    rolling: false,
    consecutiveDoubles: 0,
    selectedSpace: null,
    specialSpace: null,
    drawnCard: null,
    gameLog: [],
    awaitingPropertyDecision: false,
    awaitingSpecialSpace: false,
    isOwnProperty: false,
    rentPaid: undefined,
    viewingPropertiesForPlayer: null,
    gameOver: false,
    winnerId: null,
  }
}

/** Options for creating a game store (e.g. inject dice for e2e). */
export interface GameStoreOptions {
  /** Override dice roll; default uses rollDice from game-data (respects __TEST_DICE_ROLLS__). */
  diceRoller?: () => [number, number]
  /** Called after each setState (e.g. to sync React state). */
  onUpdate?: (state: GameState) => void
}

/** Interface for the game store so the app and e2e can use/inject implementations. */
export interface IGameStore {
  getState(): GameState
  setState(updater: (prev: GameState) => GameState): void
  subscribe(listener: (state: GameState) => void): () => void
  /** Dice roll function used when the player rolls (injectable for e2e). */
  getDiceRoller(): () => [number, number]
}

/**
 * Default game store implementation. Holds state, notifies subscribers and optional onUpdate.
 * Use createGameStore() for e2e with custom diceRoller; the app uses the same class with onUpdate for React.
 */
export class GameStore implements IGameStore {
  private state: GameState
  private readonly listeners = new Set<(state: GameState) => void>()
  private readonly diceRoller: () => [number, number]
  private readonly onUpdate?: (state: GameState) => void

  constructor(
    initialState: GameState,
    options: GameStoreOptions = {}
  ) {
    this.state = initialState
    this.diceRoller = options.diceRoller ?? defaultRollDice
    this.onUpdate = options.onUpdate
  }

  getState(): GameState {
    return this.state
  }

  setState(updater: (prev: GameState) => GameState): void {
    const next = updater(this.state)
    this.state = next
    this.onUpdate?.(next)
    this.listeners.forEach((listener) => listener(next))
  }

  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getDiceRoller(): () => [number, number] {
    return this.diceRoller
  }
}

/**
 * Creates a game store for production or e2e.
 * - Production: pass onUpdate from React so the UI re-renders.
 * - E2E: pass diceRoller (and optionally initial state) and assign to window.__GAME_STORE__.
 */
export function createGameStore(
  initialState: GameState = createInitialGameState(),
  options: GameStoreOptions = {}
): IGameStore {
  return new GameStore(initialState, options)
}

/**
 * Global key for e2e store injection. E2E can set window.__GAME_STORE__ before the app loads
 * to inject a store (e.g. with deterministic diceRoller or seeded state).
 */
declare global {
  interface Window {
    __GAME_STORE__?: IGameStore
  }
}
