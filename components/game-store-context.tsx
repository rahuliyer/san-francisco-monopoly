"use client"

import React, { createContext, useCallback, useContext, useRef, useState } from "react"
import {
  createGameStore,
  createInitialGameState,
  type IGameStore,
} from "@/lib/game-store"

interface GameStoreContextValue {
  store: IGameStore
  tick: number
}

const GameStoreContext = createContext<GameStoreContextValue | null>(null)

/**
 * Provides the game store to the tree. Uses window.__GAME_STORE__ if set (e2e injection),
 * otherwise creates a default store that drives React re-renders via subscribe.
 */
export function GameStoreProvider({ children }: { children: React.ReactNode }) {
  const [tick, setTick] = useState(0)
  const storeRef = useRef<IGameStore | null>(null)

  const scheduleUpdate = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  if (typeof window !== "undefined" && window.__GAME_STORE__ && !storeRef.current) {
    storeRef.current = window.__GAME_STORE__
  }

  if (!storeRef.current) {
    storeRef.current = createGameStore(createInitialGameState(), {
      onUpdate: scheduleUpdate,
    })
  }

  const store = storeRef.current

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.__GAME_STORE__) {
      return store.subscribe(scheduleUpdate)
    }
    return undefined
  }, [store, scheduleUpdate])

  // Include tick so context value changes when store updates and consumers re-render
  return (
    <GameStoreContext.Provider value={{ store, tick }}>
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
