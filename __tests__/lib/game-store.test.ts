import {
  GameStore,
  createGameStore,
  createInitialGameState,
  getRandomInitialDice,
  type GameState,
} from "@/lib/game-store"

describe("game-store", () => {
  describe("createInitialGameState", () => {
    it("returns empty game state", () => {
      const state = createInitialGameState()
      expect(state.players).toEqual([])
      expect(state.currentPlayerIndex).toBe(0)
      expect(state.propertyOwners).toEqual({})
      expect(state.gameOver).toBe(false)
      expect(state.winnerId).toBeNull()
    })
  })

  describe("getRandomInitialDice", () => {
    it("returns a pair of numbers 1–6", () => {
      const [a, b] = getRandomInitialDice()
      expect(a).toBeGreaterThanOrEqual(1)
      expect(a).toBeLessThanOrEqual(6)
      expect(b).toBeGreaterThanOrEqual(1)
      expect(b).toBeLessThanOrEqual(6)
    })
  })

  describe("GameStore", () => {
    it("getState returns initial state", () => {
      const initial = createInitialGameState()
      const store = createGameStore(initial)
      expect(store.getState()).toBe(initial)
    })

    it("setState updates state and notifies subscribers", () => {
      const initial = createInitialGameState()
      const store = createGameStore(initial)
      const listener = jest.fn()
      store.subscribe(listener)

      store.setState((prev) => ({ ...prev, currentPlayerIndex: 1 }))

      expect(store.getState().currentPlayerIndex).toBe(1)
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener.mock.calls[0][0].currentPlayerIndex).toBe(1)
    })

    it("subscribe returns unsubscribe", () => {
      const store = createGameStore(createInitialGameState())
      const listener = jest.fn()
      const unsubscribe = store.subscribe(listener)

      store.setState((prev) => prev)
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()
      store.setState((prev) => prev)
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it("getDiceRoller uses default rollDice when no override", () => {
      const store = createGameStore(createInitialGameState())
      const roll = store.getDiceRoller()()
      expect(roll).toHaveLength(2)
      expect(roll[0]).toBeGreaterThanOrEqual(1)
      expect(roll[0]).toBeLessThanOrEqual(6)
      expect(roll[1]).toBeGreaterThanOrEqual(1)
      expect(roll[1]).toBeLessThanOrEqual(6)
    })

    it("getDiceRoller uses custom diceRoller when provided", () => {
      const fixed: [number, number] = [3, 4]
      const store = createGameStore(createInitialGameState(), {
        diceRoller: () => fixed,
      })
      expect(store.getDiceRoller()()).toEqual([3, 4])
      expect(store.getDiceRoller()()).toEqual([3, 4])
    })

    it("calls onUpdate when provided", () => {
      const initial = createInitialGameState()
      const onUpdate = jest.fn()
      const store = createGameStore(initial, { onUpdate })

      const next: GameState = { ...initial, currentPlayerIndex: 1 }
      store.setState(() => next)

      expect(onUpdate).toHaveBeenCalledTimes(1)
      expect(onUpdate.mock.calls[0][0]).toEqual(next)
    })
  })
})
