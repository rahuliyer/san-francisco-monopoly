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
  GameCard,
  BOARD_SPACES,
  createPlayer,
  rollDice,
  drawChanceCard,
  drawCommunityChestCard,
  calculateRent,
  getSpacesByColorGroup,
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
  drawnCard: GameCard | null
  gameLog: string[]
  awaitingPropertyDecision: boolean
  awaitingSpecialSpace: boolean
  isOwnProperty: boolean
  rentPaid: number | undefined
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
    drawnCard: null,
    gameLog: [],
    awaitingPropertyDecision: false,
    awaitingSpecialSpace: false,
    isOwnProperty: false,
    rentPaid: undefined,
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
        drawnCard: null,
        isOwnProperty: false,
        rentPaid: undefined,
      }
    })
  }, [addLog])

  const handlePayJailFee = useCallback(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    
    if (currentPlayer.money < 50) {
      addLog(`${currentPlayer.name} cannot afford the $50 jail fee`)
      return
    }

    setGameState((prev) => {
      const updatedPlayers = [...prev.players]
      updatedPlayers[prev.currentPlayerIndex] = {
        ...updatedPlayers[prev.currentPlayerIndex],
        money: updatedPlayers[prev.currentPlayerIndex].money - 50,
        inJail: false,
        jailTurns: 0,
      }
      return { ...prev, players: updatedPlayers }
    })
    
    addLog(`${currentPlayer.name} paid $50 to leave Alcatraz`)
  }, [gameState.players, gameState.currentPlayerIndex, addLog])

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
      const isDoubles = dice[0] === dice[1]
      const currentPlayer = gameState.players[gameState.currentPlayerIndex]

      // Handle jail logic
      if (currentPlayer.inJail) {
        if (isDoubles) {
          // Player rolled doubles - they're free and can move!
          let newPosition = currentPlayer.position + total
          let passedGo = false

          if (newPosition >= 40) {
            newPosition = newPosition - 40
            passedGo = true
          }

          const landedSpace = BOARD_SPACES[newPosition]
          const isPurchasable = landedSpace.type === "property" || landedSpace.type === "railroad" || landedSpace.type === "utility"
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
              inJail: false,
              jailTurns: 0,
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
              selectedSpace: (isPurchasable && isUnowned) ? landedSpace : null,
              awaitingPropertyDecision: isPurchasable && isUnowned,
              specialSpace: isSpecialSpace ? landedSpace : null,
              awaitingSpecialSpace: isSpecialSpace,
            }
          })

          addLog(`${currentPlayer.name} rolled doubles (${dice[0]} + ${dice[1]}) and escaped Alcatraz!`)
          addLog(`Landed on ${landedSpace.name}`)

          // Handle landing effects
          if (landedSpace.type === "go-to-jail") {
            addLog(`${currentPlayer.name} was sent back to Alcatraz!`)
          } else if (landedSpace.type === "tax") {
            const taxAmount = landedSpace.name === "Income Tax" ? 200 : 100
            setGameState((prev) => {
              const updatedPlayers = [...prev.players]
              updatedPlayers[prev.currentPlayerIndex].money -= taxAmount
              return { ...prev, players: updatedPlayers }
            })
            addLog(`${currentPlayer.name} paid $${taxAmount} in taxes`)
          } else if (landedSpace.type === "chance" || landedSpace.type === "community-chest") {
            const card = landedSpace.type === "chance" ? drawChanceCard() : drawCommunityChestCard()
            addLog(`Drew: ${card.text}`)
            
            setGameState((prev) => {
              const updatedPlayers = [...prev.players]
              const playerIndex = prev.currentPlayerIndex
              
              switch (card.effect.type) {
                case 'collect':
                  updatedPlayers[playerIndex].money += card.effect.amount
                  break
                case 'pay':
                  updatedPlayers[playerIndex].money -= card.effect.amount
                  break
                case 'advance-to-go':
                  updatedPlayers[playerIndex].position = 0
                  updatedPlayers[playerIndex].money += 200
                  break
                case 'advance':
                  if (card.effect.position < updatedPlayers[playerIndex].position) {
                    updatedPlayers[playerIndex].money += 200
                  }
                  updatedPlayers[playerIndex].position = card.effect.position
                  break
                case 'go-to-jail':
                  updatedPlayers[playerIndex].position = 10
                  updatedPlayers[playerIndex].inJail = true
                  updatedPlayers[playerIndex].jailTurns = 0
                  break
                case 'go-back':
                  updatedPlayers[playerIndex].position = (updatedPlayers[playerIndex].position - card.effect.spaces + 40) % 40
                  break
                case 'collect-from-players':
                  const collectAmount = card.effect.amount * (prev.players.length - 1)
                  updatedPlayers[playerIndex].money += collectAmount
                  for (let i = 0; i < updatedPlayers.length; i++) {
                    if (i !== playerIndex) {
                      updatedPlayers[i].money -= card.effect.amount
                    }
                  }
                  break
                case 'pay-to-players':
                  const payAmount = card.effect.amount * (prev.players.length - 1)
                  updatedPlayers[playerIndex].money -= payAmount
                  for (let i = 0; i < updatedPlayers.length; i++) {
                    if (i !== playerIndex) {
                      updatedPlayers[i].money += card.effect.amount
                    }
                  }
                  break
              }
              
              return { ...prev, players: updatedPlayers, drawnCard: card }
            })
          }

          // Check if we need to wait for modal interaction or auto-end turn
          setGameState((prev) => {
            const isUnowned = prev.propertyOwners[landedSpace.id] === undefined
            if ((isPurchasable && isUnowned) || isSpecialSpace) {
              return prev
            } else {
              endTurnTimeoutRef.current = setTimeout(() => {
                handleEndTurn()
              }, 1500)
              return prev
            }
          })
        } else {
          // Player didn't roll doubles - still in jail
          const newJailTurns = currentPlayer.jailTurns + 1
          
          setGameState((prev) => {
            const updatedPlayers = [...prev.players]
            
            if (newJailTurns >= 3) {
              // Third turn without doubles - must pay $50 and move
              updatedPlayers[prev.currentPlayerIndex] = {
                ...updatedPlayers[prev.currentPlayerIndex],
                money: updatedPlayers[prev.currentPlayerIndex].money - 50,
                inJail: false,
                jailTurns: 0,
              }
              addLog(`${currentPlayer.name} rolled ${dice[0]} + ${dice[1]} (no doubles)`)
              addLog(`${currentPlayer.name} paid $50 after 3 turns in Alcatraz`)
            } else {
              // Stay in jail, increment turn counter
              updatedPlayers[prev.currentPlayerIndex] = {
                ...updatedPlayers[prev.currentPlayerIndex],
                jailTurns: newJailTurns,
              }
              addLog(`${currentPlayer.name} rolled ${dice[0]} + ${dice[1]} (no doubles)`)
              addLog(`${currentPlayer.name} remains in Alcatraz (${3 - newJailTurns} turns left)`)
            }

            return {
              ...prev,
              players: updatedPlayers,
              diceValues: dice,
              hasRolled: true,
              rolling: false,
            }
          })

          // End turn after showing the result
          endTurnTimeoutRef.current = setTimeout(() => {
            handleEndTurn()
          }, 2000)
        }
        return
      }

      // Normal roll logic (not in jail)
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
        const ownerId = prev.propertyOwners[landedSpace.id]
        const isOwnProperty = ownerId === prev.currentPlayerIndex
        const isOtherPlayerProperty = ownerId !== undefined && !isOwnProperty
        
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

        // Calculate and charge rent if landing on another player's property
        let rentAmount: number | undefined = undefined
        if (isPurchasable && isOtherPlayerProperty) {
          const ownerPlayer = updatedPlayers[ownerId]
          
          if (landedSpace.type === "property" && landedSpace.rent) {
            // Check if owner has all properties in the color group
            const colorGroupSpaces = getSpacesByColorGroup(landedSpace.colorGroup)
            const ownsAllInGroup = colorGroupSpaces.every(
              (s) => prev.propertyOwners[s.id] === ownerId
            )
            // For now, use base rent (houses = 0)
            rentAmount = calculateRent(landedSpace, 0, ownsAllInGroup)
          } else if (landedSpace.type === "railroad" && landedSpace.rent) {
            // Count how many railroads the owner has
            const railroads = BOARD_SPACES.filter(s => s.type === "railroad")
            const ownedRailroads = railroads.filter(r => prev.propertyOwners[r.id] === ownerId)
            rentAmount = landedSpace.rent[ownedRailroads.length - 1] || 25
          } else if (landedSpace.type === "utility") {
            // Check how many utilities the owner has
            const utilities = BOARD_SPACES.filter(s => s.type === "utility")
            const ownedUtilities = utilities.filter(u => prev.propertyOwners[u.id] === ownerId)
            const multiplier = ownedUtilities.length === 2 ? 10 : 4
            rentAmount = (dice[0] + dice[1]) * multiplier
          }

          // Transfer rent from current player to owner
          if (rentAmount !== undefined) {
            updatedPlayers[prev.currentPlayerIndex].money -= rentAmount
            updatedPlayers[ownerId].money += rentAmount
          }
        }

        // Determine what modal to show
        let selectedSpace: Space | null = null
        let awaitingPropertyDecision = false
        
        if (isPurchasable) {
          if (isUnowned) {
            selectedSpace = landedSpace
            awaitingPropertyDecision = true
          } else if (isOwnProperty || isOtherPlayerProperty) {
            selectedSpace = landedSpace
            awaitingPropertyDecision = true
          }
        }

        return {
          ...prev,
          players: updatedPlayers,
          diceValues: dice,
          hasRolled: true,
          rolling: false,
          selectedSpace,
          awaitingPropertyDecision,
          // Show special space modal for non-purchasable special spaces
          specialSpace: isSpecialSpace ? landedSpace : null,
          awaitingSpecialSpace: isSpecialSpace,
          isOwnProperty: isPurchasable && isOwnProperty,
          rentPaid: rentAmount,
        }
      })

      // Log the roll
      let logMessage = `${currentPlayer.name} rolled ${dice[0]} + ${dice[1]} = ${total}`
      if (passedGo) logMessage += " and passed GO (+$200)"
      addLog(logMessage)
      addLog(`Landed on ${landedSpace.name}`)

      // Log rent payment for landing on another player's property
      setGameState((prev) => {
        if (prev.rentPaid !== undefined && prev.selectedSpace) {
          const ownerId = prev.propertyOwners[prev.selectedSpace.id]
          if (ownerId !== undefined) {
            const ownerName = prev.players[ownerId].name
            setTimeout(() => addLog(`${currentPlayer.name} paid $${prev.rentPaid} rent to ${ownerName}`), 0)
          }
        }
        return prev
      })

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
      } else if (landedSpace.type === "chance" || landedSpace.type === "community-chest") {
        // Draw a card
        const card = landedSpace.type === "chance" ? drawChanceCard() : drawCommunityChestCard()
        addLog(`Drew: ${card.text}`)
        
        // Apply card effect
        setGameState((prev) => {
          const updatedPlayers = [...prev.players]
          const playerIndex = prev.currentPlayerIndex
          
          switch (card.effect.type) {
            case 'collect':
              updatedPlayers[playerIndex].money += card.effect.amount
              break
            case 'pay':
              updatedPlayers[playerIndex].money -= card.effect.amount
              break
            case 'advance-to-go':
              updatedPlayers[playerIndex].position = 0
              updatedPlayers[playerIndex].money += 200
              break
            case 'advance':
              // Check if we pass GO
              if (card.effect.position < updatedPlayers[playerIndex].position) {
                updatedPlayers[playerIndex].money += 200
              }
              updatedPlayers[playerIndex].position = card.effect.position
              break
            case 'go-to-jail':
              updatedPlayers[playerIndex].position = 10
              updatedPlayers[playerIndex].inJail = true
              updatedPlayers[playerIndex].jailTurns = 0
              break
            case 'go-back':
              updatedPlayers[playerIndex].position = (updatedPlayers[playerIndex].position - card.effect.spaces + 40) % 40
              break
            case 'collect-from-players':
              // Collect from each other player
              const collectAmount = card.effect.amount * (prev.players.length - 1)
              updatedPlayers[playerIndex].money += collectAmount
              for (let i = 0; i < updatedPlayers.length; i++) {
                if (i !== playerIndex) {
                  updatedPlayers[i].money -= card.effect.amount
                }
              }
              break
            case 'pay-to-players':
              // Pay each other player
              const payAmount = card.effect.amount * (prev.players.length - 1)
              updatedPlayers[playerIndex].money -= payAmount
              for (let i = 0; i < updatedPlayers.length; i++) {
                if (i !== playerIndex) {
                  updatedPlayers[i].money += card.effect.amount
                }
              }
              break
            // Note: 'repairs' effect would need house/hotel tracking to implement fully
          }
          
          return { ...prev, players: updatedPlayers, drawnCard: card }
        })
      }

      // Check if we need to wait for modal interaction or auto-end turn
      setGameState((prev) => {
        if (prev.awaitingPropertyDecision || prev.awaitingSpecialSpace) {
          // Player needs to interact with a modal - turn will end when modal closes
          return prev
        } else {
          // Auto-end turn after a short delay (for non-interactive spaces)
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
      return { 
        ...prev, 
        selectedSpace: null, 
        awaitingPropertyDecision: false,
        isOwnProperty: false,
        rentPaid: undefined,
      }
    })
  }, [handleEndTurn])

  const handlePassProperty = useCallback(() => {
    const space = gameState.selectedSpace
    if (!space) return

    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    addLog(`${currentPlayer.name} passed on buying ${space.name}`)

    setGameState((prev) => ({
      ...prev,
      selectedSpace: null,
      awaitingPropertyDecision: false,
    }))
    
    // End turn after passing
    endTurnTimeoutRef.current = setTimeout(() => {
      handleEndTurn()
    }, 500)
  }, [gameState.selectedSpace, gameState.players, gameState.currentPlayerIndex, addLog, handleEndTurn])

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
            isInJail={currentPlayer.inJail}
            jailTurns={currentPlayer.jailTurns}
            onPayJailFee={handlePayJailFee}
            canAffordJailFee={currentPlayer.money >= 50}
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
          onPass={handlePassProperty}
          canBuy={canBuySelectedSpace}
          isOwnProperty={gameState.isOwnProperty}
          rentPaid={gameState.rentPaid}
          currentPlayerName={currentPlayer.name}
        />
      )}

      {/* Special Space Modal */}
      {gameState.specialSpace && (
        <SpecialSpaceCard
          space={gameState.specialSpace}
          onClose={handleCloseSpecialCard}
          drawnCard={gameState.drawnCard}
        />
      )}
    </main>
  )
}
