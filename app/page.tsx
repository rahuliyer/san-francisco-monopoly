"use client"

import { useState, useCallback, useRef } from "react"
import { GameSetup } from "@/components/game-setup"
import { GameBoard } from "@/components/game-board"
import { PlayerPanel } from "@/components/player-panel"
import { GameControls } from "@/components/game-controls"
import { PropertyCard } from "@/components/property-card"
import { SpecialSpaceCard } from "@/components/special-space-card"
import {
  Player,
  Space,
  BOARD_SPACES,
  createPlayer,
  rollDice,
} from "@/lib/game-data"

// Generate random initial dice values (for display only)
function getRandomInitialDice(): [number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ]
}

interface GameState {
  players: Player[]
  currentPlayerIndex: number
  propertyOwners: Record<number, number>
  diceValues: [number, number]
  hasRolled: boolean
  rolling: boolean
  selectedSpace: Space | null
  specialSpace: Space | null
  gameLog: string[]
  awaitingPropertyDecision: boolean
  awaitingSpecialSpace: boolean
}

export default function MonopolyGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    propertyOwners: {},
    diceValues: getRandomInitialDice(),
    hasRolled: false,
    rolling: false,
    selectedSpace: null,
    specialSpace: null,
    gameLog: [],
    awaitingPropertyDecision: false,
    awaitingSpecialSpace: false,
  })
  const endTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  const handleEndTurn = useCallback(() => {
    setGameState((prev) => {
      const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length
      const nextPlayerName = prev.players[nextPlayerIndex].name
      // Schedule the log message after state update
      setTimeout(() => addLog(`${nextPlayerName}'s turn`), 0)
      return {
        ...prev,
        currentPlayerIndex: nextPlayerIndex,
        hasRolled: false,
        diceValues: getRandomInitialDice(),
        awaitingPropertyDecision: false,
        awaitingSpecialSpace: false,
        specialSpace: null,
      }
    })
  }, [addLog])

  const handleRoll = useCallback(() => {
    // Clear any pending end turn timeout
    if (endTurnTimeoutRef.current) {
      clearTimeout(endTurnTimeoutRef.current)
      endTurnTimeoutRef.current = null
    }

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

      // Check if this is a purchasable space that is unowned
      const isPurchasable = landedSpace.type === "property" || landedSpace.type === "railroad" || landedSpace.type === "utility"
      
      // Check if this is a special space that shows a modal
      const isSpecialSpace = landedSpace.type === "chance" || 
        landedSpace.type === "community-chest" || 
        landedSpace.type === "go" || 
        landedSpace.type === "jail" || 
        landedSpace.type === "free-parking" || 
        landedSpace.type === "go-to-jail" || 
        landedSpace.type === "tax"

      setGameState((prev) => {
        const isUnowned = prev.propertyOwners[landedSpace.id] === undefined
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
          // Auto-show buy modal if it's a purchasable unowned space
          selectedSpace: (isPurchasable && isUnowned) ? landedSpace : null,
          awaitingPropertyDecision: isPurchasable && isUnowned,
          // Show special space modal for non-purchasable special spaces
          specialSpace: isSpecialSpace ? landedSpace : null,
          awaitingSpecialSpace: isSpecialSpace,
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

      // Check if we need to wait for modal interaction or auto-end turn
      setGameState((prev) => {
        const isUnowned = prev.propertyOwners[landedSpace.id] === undefined
        if ((isPurchasable && isUnowned) || isSpecialSpace) {
          // Player needs to interact with a modal - turn will end when modal closes
          return prev
        } else {
          // Auto-end turn after a short delay (for owned properties)
          endTurnTimeoutRef.current = setTimeout(() => {
            handleEndTurn()
          }, 1500)
          return prev
        }
      })
    }, 800)
  }, [gameState.players, gameState.currentPlayerIndex, addLog, handleEndTurn])

  const handleSpaceClick = useCallback((space: Space) => {
    if (space.type === "property" || space.type === "railroad" || space.type === "utility") {
      setGameState((prev) => ({ ...prev, selectedSpace: space }))
    }
  }, [])

  const handleCloseCard = useCallback(() => {
    setGameState((prev) => {
      // If we were awaiting a property decision, end the turn after closing
      if (prev.awaitingPropertyDecision) {
        endTurnTimeoutRef.current = setTimeout(() => {
          handleEndTurn()
        }, 500)
      }
      return { ...prev, selectedSpace: null, awaitingPropertyDecision: false }
    })
  }, [handleEndTurn])

  const handleCloseSpecialCard = useCallback(() => {
    setGameState((prev) => {
      // End the turn after closing the special space modal
      if (prev.awaitingSpecialSpace) {
        endTurnTimeoutRef.current = setTimeout(() => {
          handleEndTurn()
        }, 500)
      }
      return { ...prev, specialSpace: null, awaitingSpecialSpace: false }
    })
  }, [handleEndTurn])

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
        awaitingPropertyDecision: false,
      }
    })
    addLog(`${currentPlayer.name} bought ${space.name} for $${space.price}`)
    
    // Auto-end turn after buying
    endTurnTimeoutRef.current = setTimeout(() => {
      handleEndTurn()
    }, 500)
  }, [gameState.selectedSpace, gameState.players, gameState.currentPlayerIndex, addLog, handleEndTurn])

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

      {/* Special Space Modal */}
      {gameState.specialSpace && (
        <SpecialSpaceCard
          space={gameState.specialSpace}
          onClose={handleCloseSpecialCard}
        />
      )}
    </main>
  )
}
