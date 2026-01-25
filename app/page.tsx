"use client"

import { useState, useCallback } from "react"
import { GameSetup } from "@/components/game-setup"
import { GameBoard } from "@/components/game-board"
import { PlayerPanel } from "@/components/player-panel"
import { GameControls } from "@/components/game-controls"
import { PropertyCard } from "@/components/property-card"
import {
  Player,
  Space,
  BOARD_SPACES,
  createPlayer,
  rollDice,
} from "@/lib/game-data"

interface GameState {
  players: Player[]
  currentPlayerIndex: number
  propertyOwners: Record<number, number>
  diceValues: [number, number]
  hasRolled: boolean
  rolling: boolean
  selectedSpace: Space | null
  gameLog: string[]
}

export default function MonopolyGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    propertyOwners: {},
    diceValues: [0, 0] as [number, number],
    hasRolled: false,
    rolling: false,
    selectedSpace: null,
    gameLog: [],
  })

  const handleStartGame = (playerSetups: { name: string; tokenIndex: number }[]) => {
    const players = playerSetups.map((setup, i) =>
      createPlayer(i, setup.name, setup.tokenIndex)
    )
    setGameState((prev) => ({
      ...prev,
      players,
      gameLog: ["Game started! " + players[0].name + " goes first."],
    }))
    setGameStarted(true)
  }

  const addLog = useCallback((message: string) => {
    setGameState((prev) => ({
      ...prev,
      gameLog: [...prev.gameLog.slice(-9), message],
    }))
  }, [])

  const handleRoll = useCallback(() => {
    setGameState((prev) => ({ ...prev, rolling: true }))

    // Simulate rolling animation
    setTimeout(() => {
      const dice = rollDice()
      const total = dice[0] + dice[1]
      const currentPlayer = gameState.players[gameState.currentPlayerIndex]

      // Calculate new position
      let newPosition = currentPlayer.position + total
      let passedGo = false

      if (newPosition >= 40) {
        newPosition = newPosition - 40
        passedGo = true
      }

      const landedSpace = BOARD_SPACES[newPosition]

      setGameState((prev) => {
        const updatedPlayers = [...prev.players]
        updatedPlayers[prev.currentPlayerIndex] = {
          ...updatedPlayers[prev.currentPlayerIndex],
          position: newPosition,
          money: passedGo
            ? updatedPlayers[prev.currentPlayerIndex].money + 200
            : updatedPlayers[prev.currentPlayerIndex].money,
        }

        // Handle Go To Jail
        if (landedSpace.type === "go-to-jail") {
          updatedPlayers[prev.currentPlayerIndex] = {
            ...updatedPlayers[prev.currentPlayerIndex],
            position: 10,
            inJail: true,
            jailTurns: 0,
          }
        }

        return {
          ...prev,
          players: updatedPlayers,
          diceValues: dice,
          hasRolled: true,
          rolling: false,
        }
      })

      // Log the roll
      let logMessage = `${currentPlayer.name} rolled ${dice[0]} + ${dice[1]} = ${total}`
      if (passedGo) logMessage += " and passed GO (+$200)"
      addLog(logMessage)
      addLog(`Landed on ${landedSpace.name}`)

      // Handle landing effects
      if (landedSpace.type === "go-to-jail") {
        addLog(`${currentPlayer.name} was sent to Alcatraz!`)
      } else if (landedSpace.type === "tax") {
        const taxAmount = landedSpace.name === "Income Tax" ? 200 : 100
        setGameState((prev) => {
          const updatedPlayers = [...prev.players]
          updatedPlayers[prev.currentPlayerIndex].money -= taxAmount
          return { ...prev, players: updatedPlayers }
        })
        addLog(`${currentPlayer.name} paid $${taxAmount} in taxes`)
      }
    }, 800)
  }, [gameState.players, gameState.currentPlayerIndex, addLog])

  const handleEndTurn = useCallback(() => {
    setGameState((prev) => {
      const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length
      return {
        ...prev,
        currentPlayerIndex: nextPlayerIndex,
        hasRolled: false,
        diceValues: [0, 0] as [number, number],
      }
    })
    addLog(`${gameState.players[(gameState.currentPlayerIndex + 1) % gameState.players.length].name}'s turn`)
  }, [gameState.players, gameState.currentPlayerIndex, addLog])

  const handleSpaceClick = useCallback((space: Space) => {
    if (space.type === "property" || space.type === "railroad" || space.type === "utility") {
      setGameState((prev) => ({ ...prev, selectedSpace: space }))
    }
  }, [])

  const handleCloseCard = useCallback(() => {
    setGameState((prev) => ({ ...prev, selectedSpace: null }))
  }, [])

  const handleBuyProperty = useCallback(() => {
    const space = gameState.selectedSpace
    if (!space || !space.price) return

    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer.money < space.price) {
      addLog(`${currentPlayer.name} cannot afford ${space.name}`)
      return
    }

    setGameState((prev) => {
      const updatedPlayers = [...prev.players]
      updatedPlayers[prev.currentPlayerIndex] = {
        ...updatedPlayers[prev.currentPlayerIndex],
        money: updatedPlayers[prev.currentPlayerIndex].money - space.price!,
        properties: [...updatedPlayers[prev.currentPlayerIndex].properties, space.id],
      }
      return {
        ...prev,
        players: updatedPlayers,
        propertyOwners: {
          ...prev.propertyOwners,
          [space.id]: prev.currentPlayerIndex,
        },
        selectedSpace: null,
      }
    })
    addLog(`${currentPlayer.name} bought ${space.name} for $${space.price}`)
  }, [gameState.selectedSpace, gameState.players, gameState.currentPlayerIndex, addLog])

  if (!gameStarted) {
    return <GameSetup onStartGame={handleStartGame} />
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const selectedSpaceOwner =
    gameState.selectedSpace &&
    gameState.propertyOwners[gameState.selectedSpace.id] !== undefined
      ? gameState.players[gameState.propertyOwners[gameState.selectedSpace.id]]
      : undefined

  const canBuySelectedSpace =
    gameState.selectedSpace &&
    gameState.selectedSpace.price &&
    gameState.propertyOwners[gameState.selectedSpace.id] === undefined &&
    currentPlayer.position === gameState.selectedSpace.id &&
    gameState.hasRolled &&
    currentPlayer.money >= gameState.selectedSpace.price

  return (
    <main className="min-h-screen bg-emerald-100 p-4">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
        {/* Left sidebar - Players */}
        <div className="flex w-full max-w-xs flex-col gap-3 lg:order-1">
          {gameState.players.slice(0, 2).map((player) => (
            <PlayerPanel
              key={player.id}
              player={player}
              isCurrentTurn={player.id === currentPlayer.id}
              propertyOwners={gameState.propertyOwners}
            />
          ))}
        </div>

        {/* Center - Game Board */}
        <div className="overflow-auto lg:order-2">
          <GameBoard
            players={gameState.players}
            onSpaceClick={handleSpaceClick}
            propertyOwners={gameState.propertyOwners}
          />
        </div>

        {/* Right sidebar - Controls and more players */}
        <div className="flex w-full max-w-xs flex-col gap-3 lg:order-3">
          <GameControls
            diceValues={gameState.diceValues}
            rolling={gameState.rolling}
            hasRolled={gameState.hasRolled}
            onRoll={handleRoll}
            onEndTurn={handleEndTurn}
            currentPlayerName={currentPlayer.name}
          />

          {gameState.players.slice(2).map((player) => (
            <PlayerPanel
              key={player.id}
              player={player}
              isCurrentTurn={player.id === currentPlayer.id}
              propertyOwners={gameState.propertyOwners}
            />
          ))}

          {/* Game Log */}
          <div className="rounded-lg bg-white p-3 shadow-md">
            <h3 className="mb-2 text-sm font-semibold text-stone-700">Game Log</h3>
            <div className="max-h-32 space-y-1 overflow-y-auto text-xs text-stone-600">
              {gameState.gameLog.map((log, i) => (
                <p key={i}>{log}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Property Card Modal */}
      {gameState.selectedSpace && (
        <PropertyCard
          space={gameState.selectedSpace}
          owner={selectedSpaceOwner}
          onClose={handleCloseCard}
          onBuy={handleBuyProperty}
          canBuy={canBuySelectedSpace}
        />
      )}
    </main>
  )
}
