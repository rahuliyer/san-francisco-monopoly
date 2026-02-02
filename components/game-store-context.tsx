"use client"

import React, { createContext, useCallback, useContext, useRef, useState } from "react"
import {
  createGameStore,
  createInitialGameState,
  type IGameStore,
} from "@/lib/game-store"
import { GameLoop } from "@/lib/game-loop"
import { createDeterministicGame, type DeterministicGameConfig } from "@/lib/state/test-utils"

interface GameStoreContextValue {
  store: IGameStore
  tick: number
  gameLoop?: GameLoop
}

const GameStoreContext = createContext<GameStoreContextValue | null>(null)

// Extend window for e2e injection support
declare global {
  interface Window {
    __GAME_LOOP__?: GameLoop
    __DETERMINISTIC_GAME_CONFIG__?: DeterministicGameConfig
  }
}

/**
 * Provides the game store to the tree. Uses window.__GAME_STORE__ if set (e2e injection),
 * otherwise creates a default store that drives React re-renders via subscribe.
 *
 * Also exposes window.__GAME_LOOP__ for e2e testing with the new GameLoop infrastructure.
 */
export function GameStoreProvider({ children }: { children: React.ReactNode }) {
  const [tick, setTick] = useState(0)
  const storeRef = useRef<IGameStore | null>(null)
  const gameLoopRef = useRef<GameLoop | null>(null)

  const scheduleUpdate = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  if (typeof window !== "undefined" && !storeRef.current) {
    if (window.__GAME_STORE__) {
      storeRef.current = window.__GAME_STORE__
    } else if (window.__DETERMINISTIC_GAME_CONFIG__) {
      const { state, diceRoller } = createDeterministicGame(window.__DETERMINISTIC_GAME_CONFIG__)
      storeRef.current = createGameStore(state, {
        onUpdate: scheduleUpdate,
        diceRoller: () => diceRoller.roll(),
      })
    }
  }

  if (!storeRef.current) {
    storeRef.current = createGameStore(createInitialGameState(), {
      onUpdate: scheduleUpdate,
    })
  }

  const store = storeRef.current

  // Create GameLoop wrapper around the store for e2e injection
  if (!gameLoopRef.current) {
    const initialState = store.getState()
    gameLoopRef.current = new GameLoop(initialState, {
      diceRoller: store.getDiceRoller(),
    })

    // Sync GameLoop state changes to the store
    gameLoopRef.current.subscribe((state) => {
      store.setState(() => state)
    })

    // Expose for e2e testing
    if (typeof window !== "undefined") {
      window.__GAME_LOOP__ = gameLoopRef.current
    }
  }

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.__GAME_STORE__) {
      return store.subscribe(scheduleUpdate)
    }
    return undefined
  }, [store, scheduleUpdate])

  // Include tick so context value changes when store updates and consumers re-render
  return (
    <GameStoreContext.Provider value={{ store, tick, gameLoop: gameLoopRef.current ?? undefined }}>
      {children}
    </GameStoreContext.Provider>
  )
}

export function useGameStore(): IGameStore {
  const value = useContext(GameStoreContext)
  if (value == null) {
    throw new Error("useGameStore must be used within GameStoreProvider")
  }
  return value.store
}

/**
 * Hook to access the GameLoop for dispatching actions.
 * Returns undefined if no GameLoop is available.
 */
export function useGameLoop(): GameLoop | undefined {
  const value = useContext(GameStoreContext)
  return value?.gameLoop
}
