// Test utilities - helpers for deterministic testing
// This module provides utilities for creating controlled game scenarios in tests.

import type { GameState } from "@/lib/game-store"
import { createInitialGameState } from "@/lib/game-store"
import { createPlayer, type PlayerSetup } from "@/lib/models/player"
import {
  createDeck,
  createDeckFromIds,
  CHANCE_CARDS,
  COMMUNITY_CHEST_CARDS,
  type CardDeck,
  type CardDeckType,
} from "@/lib/models/card"
import { QueuedDiceRoller, type DiceValues } from "@/lib/mechanics/dice"
import { GameLoop, type GameLoopDependencies } from "@/lib/game-loop"
import { GAME_CONSTANTS } from "@/lib/constants"

const { STARTING_MONEY } = GAME_CONSTANTS

/** Configuration for creating a deterministic game */
export interface DeterministicGameConfig {
  /** Player configurations */
  players: Array<{
    name: string
    tokenIndex: number
    /** Override starting money (defaults to STARTING_MONEY) */
    initialMoney?: number
    /** Override starting position (defaults to 0) */
    initialPosition?: number
    /** Start in jail */
    inJail?: boolean
    /** Number of turns already spent in jail */
    jailTurns?: number
    /** Held cards and the decks they must return to when used. */
    getOutOfJailFreeCards?: CardDeckType[]
  }>

  /** Sequence of dice rolls (consumed in order) */
  diceSequence?: DiceValues[]

  /** Card IDs in draw order for Chance deck */
  chanceOrder?: number[]

  /** Card IDs in draw order for Community Chest deck */
  communityChestOrder?: number[]

  /** Initial property ownership */
  initialProperties?: Array<{
    propertyId: number
    ownerId: number
    houseCount?: number
    isMortgaged?: boolean
  }>

  /** Initial game log messages */
  initialLog?: string[]
}

/** Result of creating a deterministic game */
export interface DeterministicGameResult {
  state: GameState
  gameLoop: GameLoop
  diceRoller: QueuedDiceRoller
  chanceDeck: CardDeck
  communityChestDeck: CardDeck
}

/**
 * Creates a deterministic game for unit testing.
 * All random elements (dice, cards) can be controlled.
 */
export function createDeterministicGame(
  config: DeterministicGameConfig
): DeterministicGameResult {
  // Create dice roller with queued values
  const diceRoller = new QueuedDiceRoller(config.diceSequence ?? [])

  // Create card decks
  let chanceDeck = config.chanceOrder
    ? createDeckFromIds(CHANCE_CARDS, config.chanceOrder)
    : createDeck(CHANCE_CARDS)

  let communityChestDeck = config.communityChestOrder
    ? createDeckFromIds(COMMUNITY_CHEST_CARDS, config.communityChestOrder)
    : createDeck(COMMUNITY_CHEST_CARDS)

  // Create players with optional overrides
  const players = config.players.map((setup, i) => {
    const player = createPlayer(
      i,
      setup.name,
      setup.tokenIndex,
      setup.initialMoney ?? STARTING_MONEY
    )

    return {
      ...player,
      position: setup.initialPosition ?? 0,
      inJail: setup.inJail ?? false,
      jailTurns: setup.jailTurns ?? 0,
      getOutOfJailFreeCards: setup.getOutOfJailFreeCards ?? [],
    }
  })

  const heldCardSources = players.flatMap(
    (player) => player.getOutOfJailFreeCards
  )
  if (heldCardSources.includes("chance")) {
    chanceDeck = {
      cards: chanceDeck.cards.filter(
        (card) => card.effect.type !== "get-out-of-jail-free"
      ),
      drawIndex: 0,
    }
  }
  if (heldCardSources.includes("community-chest")) {
    communityChestDeck = {
      cards: communityChestDeck.cards.filter(
        (card) => card.effect.type !== "get-out-of-jail-free"
      ),
      drawIndex: 0,
    }
  }

  // Build property maps
  const propertyOwners: Record<number, number> = {}
  const propertyHouses: Record<number, number> = {}
  const mortgagedProperties: Record<number, boolean> = {}

  config.initialProperties?.forEach((prop) => {
    propertyOwners[prop.propertyId] = prop.ownerId
    if (prop.houseCount && prop.houseCount > 0) {
      propertyHouses[prop.propertyId] = prop.houseCount
    }
    if (prop.isMortgaged) {
      mortgagedProperties[prop.propertyId] = true
    }

    // Add to player's property list
    const playerIndex = players.findIndex((p) => p.id === prop.ownerId)
    if (playerIndex >= 0) {
      players[playerIndex] = {
        ...players[playerIndex],
        properties: [...players[playerIndex].properties, prop.propertyId],
      }
    }
  })

  // Create initial state
  const state: GameState = {
    ...createInitialGameState(),
    players,
    propertyOwners,
    propertyHouses,
    mortgagedProperties,
    // Use the configured (deterministic) deck order so card draws are reproducible.
    chanceDeck,
    communityChestDeck,
    gameLog: config.initialLog ?? [`Game started! ${players[0]?.name ?? "Player 1"} goes first.`],
  }

  // Create game loop
  const gameLoop = new GameLoop(state, { diceRoller })

  return {
    state: gameLoop.getState(),
    gameLoop,
    diceRoller,
    chanceDeck,
    communityChestDeck,
  }
}

/**
 * Creates a simple 2-player game for quick tests.
 */
export function createSimpleGame(
  diceSequence?: DiceValues[]
): DeterministicGameResult {
  return createDeterministicGame({
    players: [
      { name: "Player 1", tokenIndex: 0 },
      { name: "Player 2", tokenIndex: 1 },
    ],
    diceSequence,
  })
}

/**
 * Sets up the global __TEST_DICE_ROLLS__ for legacy e2e compatibility.
 */
export function setupLegacyDiceRolls(rolls: DiceValues[]): void {
  ;(globalThis as { __TEST_DICE_ROLLS__?: DiceValues[] }).__TEST_DICE_ROLLS__ = [...rolls]
}

/**
 * Clears the global __TEST_DICE_ROLLS__.
 */
export function clearLegacyDiceRolls(): void {
  ;(globalThis as { __TEST_DICE_ROLLS__?: DiceValues[] }).__TEST_DICE_ROLLS__ = undefined
}

/**
 * Helper to inject a deterministic game into Playwright e2e tests.
 * Use this with page.evaluate() to set up the game state before the app loads.
 *
 * @example
 * await page.evaluate((config) => {
 *   window.__DETERMINISTIC_GAME_CONFIG__ = config
 * }, config)
 */
export function getE2EInjectionScript(config: DeterministicGameConfig): string {
  return `
    window.__TEST_DICE_ROLLS__ = ${JSON.stringify(config.diceSequence ?? [])};
    window.__DETERMINISTIC_GAME_CONFIG__ = ${JSON.stringify(config)};
  `
}

/** Common dice roll patterns for testing */
export const testDice = {
  /** Non-doubles roll that moves 7 spaces */
  move7: [3, 4] as DiceValues,
  /** Non-doubles roll that moves 12 spaces */
  move12: [6, 6] as DiceValues, // Note: this IS doubles
  /** Non-doubles roll that moves 5 spaces */
  move5: [2, 3] as DiceValues,
  /** Doubles roll (3+3) */
  doubles3: [3, 3] as DiceValues,
  /** Doubles roll (4+4) */
  doubles4: [4, 4] as DiceValues,
  /** Doubles roll (5+5) */
  doubles5: [5, 5] as DiceValues,
  /** Doubles roll (6+6) */
  doubles6: [6, 6] as DiceValues,
  /** Roll that lands on Go To Jail from GO (30 spaces) */
  landOnGoToJail: [6, 6] as DiceValues, // Need multiple rolls to get there
  /** Minimum roll (snake eyes) */
  snakeEyes: [1, 1] as DiceValues,
  /** Roll to land on Chance (position 7 from GO) */
  landOnChance7: [3, 4] as DiceValues,
}

/** Common property setups for testing */
export const testProperties = {
  /** Brown monopoly (Tenderloin + Bayview) */
  brownMonopoly: (ownerId: number) => [
    { propertyId: 1, ownerId },
    { propertyId: 3, ownerId },
  ],
  /** Light blue monopoly */
  lightBlueMonopoly: (ownerId: number) => [
    { propertyId: 6, ownerId },
    { propertyId: 8, ownerId },
    { propertyId: 9, ownerId },
  ],
  /** All railroads */
  allRailroads: (ownerId: number) => [
    { propertyId: 5, ownerId },
    { propertyId: 15, ownerId },
    { propertyId: 25, ownerId },
    { propertyId: 35, ownerId },
  ],
  /** Both utilities */
  bothUtilities: (ownerId: number) => [
    { propertyId: 12, ownerId },
    { propertyId: 28, ownerId },
  ],
}
