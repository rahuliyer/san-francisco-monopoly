import { gameReducer, type ReducerDependencies } from "@/lib/game-loop/reducers"
import { createInitialGameState, type GameState } from "@/lib/game-store"
import { createPlayer } from "@/lib/models/player"
import { QueuedDiceRoller, type DiceValues } from "@/lib/mechanics/dice"
import { createDeterministicGame } from "@/lib/state/test-utils"
import {
  CHANCE_CARDS,
  COMMUNITY_CHEST_CARDS,
  createDeckFromIds,
} from "@/lib/models/card"
import { actions } from "@/lib/game-loop/actions"

function deps(rolls: DiceValues[] = []): ReducerDependencies {
  return { diceRoller: new QueuedDiceRoller(rolls) }
}

function baseState(overrides: Partial<GameState>): GameState {
  return { ...createInitialGameState(), ...overrides }
}

describe("game engine (reducer)", () => {
  describe("id-based property ownership", () => {
    it("records the buyer's stable id as owner, not the turn index", () => {
      // Player ids intentionally differ from their array indices.
      const pA = createPlayer(5, "A", 0)
      const pB = createPlayer(2, "B", 1)
      let state = baseState({ players: [pA, pB], currentPlayerIndex: 0 })

      // pA (index 0) starts at 0, rolls 3 -> lands on Bayview (id 3), unowned.
      state = gameReducer(state, { type: "ROLL_DICE" }, deps([[1, 2]]))
      expect(state.awaitingPropertyDecision).toBe(true)

      state = gameReducer(state, { type: "BUY_PROPERTY", propertyId: 3 }, deps())
      // Owner must be the player's id (5), not the current index (0).
      expect(state.propertyOwners[3]).toBe(5)
      expect(state.players.find((p) => p.id === 5)!.money).toBe(1500 - 60)
    })

    it("charges rent to the current player and pays the owner looked up by id", () => {
      const pA = createPlayer(5, "A", 0) // owner
      const pB = createPlayer(2, "B", 1) // lands and pays
      let state = baseState({
        players: [pA, pB],
        currentPlayerIndex: 1,
        propertyOwners: { 3: 5 },
      })

      // pB rolls 3 from GO -> Bayview (id 3), owned by pA. Base rent = 4.
      state = gameReducer(state, { type: "ROLL_DICE" }, deps([[1, 2]]))

      expect(state.players.find((p) => p.id === 2)!.money).toBe(1500 - 4)
      expect(state.players.find((p) => p.id === 5)!.money).toBe(1500 + 4)
      expect(state.rentPaid).toBe(4)
    })
  })

  describe("SELL_HOUSE", () => {
    it("sells a house evenly and refunds half the build cost", () => {
      const p0 = createPlayer(0, "P0", 0)
      // Full light-blue monopoly (6, 8, 9) each with one house.
      const state = baseState({
        players: [p0],
        currentPlayerIndex: 0,
        propertyOwners: { 6: 0, 8: 0, 9: 0 },
        propertyHouses: { 6: 1, 8: 1, 9: 1 },
      })

      const next = gameReducer(state, { type: "SELL_HOUSE", propertyId: 6 }, deps())

      expect(next.propertyHouses[6]).toBeUndefined()
      // houseCost for light-blue is 50 -> refund 25.
      expect(next.players[0].money).toBe(1500 + 25)
    })

    it("rejects uneven selling", () => {
      const p0 = createPlayer(0, "P0", 0)
      const state = baseState({
        players: [p0],
        currentPlayerIndex: 0,
        propertyOwners: { 6: 0, 8: 0, 9: 0 },
        propertyHouses: { 6: 1, 8: 2, 9: 2 },
      })

      // Selling from 6 (which has fewer houses than the group max) is not allowed.
      const next = gameReducer(state, { type: "SELL_HOUSE", propertyId: 6 }, deps())
      expect(next).toBe(state)
    })
  })

  describe("deterministic card draws", () => {
    it("uses the stable player id when charging for repairs", () => {
      const pA = { ...createPlayer(5, "A", 0), position: 5 }
      const pB = createPlayer(2, "B", 1)
      const state = baseState({
        players: [pA, pB],
        currentPlayerIndex: 0,
        propertyOwners: { 6: 5, 39: 5 },
        propertyHouses: { 6: 2, 39: 5 },
        chanceDeck: createDeckFromIds(CHANCE_CARDS, [10]),
      })

      const next = gameReducer(state, { type: "ROLL_DICE" }, deps([[1, 1]]))

      expect(next.players[0].money).toBe(1350)
      expect(next.gameLog).toContain("A paid $150 for repairs (2 houses, 1 hotel)")
    })

    it("draws Chance cards in the configured order and advances the deck", () => {
      const { gameLoop } = createDeterministicGame({
        players: [{ name: "P0", tokenIndex: 0, initialPosition: 5 }],
        diceSequence: [[1, 1]],
        chanceOrder: [7, 13],
      })

      gameLoop.dispatch({ type: "ROLL_DICE" }) // 5 + 2 = 7 -> Chance
      const state = gameLoop.getState()

      expect(state.drawnCard?.id).toBe(7)
      expect(state.chanceDeck.drawIndex).toBe(1)
    })

    it("draws Community Chest cards in the configured order", () => {
      const { gameLoop } = createDeterministicGame({
        players: [{ name: "P0", tokenIndex: 0, initialPosition: 0 }],
        diceSequence: [[1, 1]],
        communityChestOrder: [2, 6],
      })

      gameLoop.dispatch({ type: "ROLL_DICE" }) // 0 + 2 = 2 -> Community Chest
      const state = gameLoop.getState()

      expect(state.drawnCard?.id).toBe(2)
      expect(state.communityChestDeck.drawIndex).toBe(1)
    })

    it("replays lifecycle actions with their supplied deck orders", () => {
      const initial = baseState({})
      const chanceDeck = createDeckFromIds(CHANCE_CARDS, [7, 13])
      const communityChestDeck = createDeckFromIds(COMMUNITY_CHEST_CARDS, [2, 6])
      const startAction = actions.startGame(
        [{ name: "P0", tokenIndex: 0 }],
        chanceDeck,
        communityChestDeck
      )

      const firstStart = gameReducer(initial, startAction, deps())
      const replayedStart = gameReducer(initial, startAction, deps())

      expect(replayedStart).toEqual(firstStart)
      expect(firstStart.chanceDeck).toBe(chanceDeck)
      expect(firstStart.communityChestDeck).toBe(communityChestDeck)

      const resetChanceDeck = createDeckFromIds(CHANCE_CARDS, [13, 7])
      const resetCommunityChestDeck = createDeckFromIds(COMMUNITY_CHEST_CARDS, [6, 2])
      const resetAction = actions.resetGame(resetChanceDeck, resetCommunityChestDeck)

      expect(gameReducer(firstStart, resetAction, deps())).toEqual(
        gameReducer(firstStart, resetAction, deps())
      )
    })
  })
})
