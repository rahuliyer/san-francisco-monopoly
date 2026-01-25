"use client"

import { useState, useCallback, useRef } from "react"
import { GameSetup } from "@/components/game-setup"
import { GameBoard } from "@/components/game-board"
import { PlayerPanel } from "@/components/player-panel"
import { GameControls } from "@/components/game-controls"
import { PropertyCard } from "@/components/property-card"
import { SpecialSpaceCard } from "@/components/special-space-card"
import { TradeModal, type TradePayload } from "@/components/trade-modal"
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

// Duration to wait for dice animation to complete after rolling stops (ms)
const DICE_ANIMATION_DURATION = 700
// Additional delay after dice animation before showing card dialog (ms)
const CARD_SHOW_DELAY = 400
const MORTGAGE_INTEREST_RATE = 0.1

// Generate random initial dice values (for display only)
function getRandomInitialDice(): [number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ]
}

function calculateUnmortgageCost(mortgageValue: number): number {
  return Math.ceil(mortgageValue * (1 + MORTGAGE_INTEREST_RATE))
}

interface GameState {
  players: Player[]
  currentPlayerIndex: number
  propertyOwners: Record<number, number>
  mortgagedProperties: Record<number, boolean>
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
  viewingPropertiesForPlayer: Player | null
}

export default function MonopolyGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    propertyOwners: {},
    mortgagedProperties: {},
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
    viewingPropertiesForPlayer: null,
  })
  const [isTradeOpen, setIsTradeOpen] = useState(false)
  const endTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleStartGame = (playerSetups: { name: string; tokenIndex: number }[]) => {
    const players = playerSetups.map((setup, i) =>
      createPlayer(i, setup.name, setup.tokenIndex)
    )
    setGameState((prev) => ({
      ...prev,
      players,
      propertyOwners: {},
      mortgagedProperties: {},
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
    setIsTradeOpen(false)
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

  const handleOpenTrade = useCallback(() => {
    setIsTradeOpen(true)
  }, [])

  const handleCloseTrade = useCallback(() => {
    setIsTradeOpen(false)
  }, [])

  const handleTrade = useCallback((trade: TradePayload) => {
    let logMessage = ""
    let tradeApplied = false

    setGameState((prev) => {
      const currentPlayer = prev.players[prev.currentPlayerIndex]
      const partnerIndex = prev.players.findIndex((player) => player.id === trade.partnerId)
      if (partnerIndex === -1 || currentPlayer.id === trade.partnerId) {
        return prev
      }

      const partner = prev.players[partnerIndex]
      const offeredCash = trade.offerCash
      const requestedCash = trade.requestCash

      if (offeredCash > currentPlayer.money || requestedCash > partner.money) {
        return prev
      }

      const validOfferPropertyIds = trade.offerPropertyIds.filter(
        (propertyId) => prev.propertyOwners[propertyId] === currentPlayer.id
      )
      const validRequestPropertyIds = trade.requestPropertyIds.filter(
        (propertyId) => prev.propertyOwners[propertyId] === partner.id
      )

      if (
        validOfferPropertyIds.length === 0 &&
        validRequestPropertyIds.length === 0 &&
        offeredCash === 0 &&
        requestedCash === 0
      ) {
        return prev
      }

      const updatedPropertyOwners = { ...prev.propertyOwners }
      validOfferPropertyIds.forEach((propertyId) => {
        updatedPropertyOwners[propertyId] = partner.id
      })
      validRequestPropertyIds.forEach((propertyId) => {
        updatedPropertyOwners[propertyId] = currentPlayer.id
      })

      const propertiesByPlayer: Record<number, number[]> = {}
      Object.entries(updatedPropertyOwners).forEach(([spaceId, ownerId]) => {
        const owner = Number(ownerId)
        if (!propertiesByPlayer[owner]) {
          propertiesByPlayer[owner] = []
        }
        propertiesByPlayer[owner].push(Number(spaceId))
      })

      const updatedPlayers = prev.players.map((player) => {
        let cashDelta = 0
        if (player.id === currentPlayer.id) {
          cashDelta = -offeredCash + requestedCash
        } else if (player.id === partner.id) {
          cashDelta = -requestedCash + offeredCash
        }
        return {
          ...player,
          money: player.money + cashDelta,
          properties: propertiesByPlayer[player.id] || [],
        }
      })

      const describeItems = (propertyIds: number[], cashAmount: number) => {
        const names = propertyIds
          .map((propertyId) => BOARD_SPACES.find((space) => space.id === propertyId)?.name)
          .filter(Boolean) as string[]
        const items: string[] = []
        if (names.length > 0) {
          items.push(names.join(", "))
        }
        if (cashAmount > 0) {
          items.push(`$${cashAmount}`)
        }
        return items.length > 0 ? items.join(" + ") : "no assets"
      }

      logMessage = `${currentPlayer.name} traded with ${partner.name}: gave ${describeItems(
        validOfferPropertyIds,
        offeredCash
      )} for ${describeItems(validRequestPropertyIds, requestedCash)}.`
      tradeApplied = true

      return {
        ...prev,
        players: updatedPlayers,
        propertyOwners: updatedPropertyOwners,
      }
    })

    if (tradeApplied) {
      if (logMessage) {
        addLog(logMessage)
      }
      setIsTradeOpen(false)
    }
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
            }
          })

          // Delay showing dialogs until after dice animation completes
          setTimeout(() => {
            setGameState((prev) => {
              const isUnowned = prev.propertyOwners[landedSpace.id] === undefined
              return {
                ...prev,
                selectedSpace: (isPurchasable && isUnowned) ? landedSpace : null,
                awaitingPropertyDecision: isPurchasable && isUnowned,
                specialSpace: isSpecialSpace ? landedSpace : null,
                awaitingSpecialSpace: isSpecialSpace,
              }
            })
          }, DICE_ANIMATION_DURATION + CARD_SHOW_DELAY)

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
          // We need to check after the dialog delay
          setTimeout(() => {
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
          }, DICE_ANIMATION_DURATION + CARD_SHOW_DELAY + 50) // Slightly after dialog appears
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

      // Calculate rent and update player state, but don't show dialog yet
      let calculatedRentAmount: number | undefined = undefined
      let calculatedIsOwnProperty = false

      setGameState((prev) => {
        const isUnowned = prev.propertyOwners[landedSpace.id] === undefined
        const ownerId = prev.propertyOwners[landedSpace.id]
        const isOwnProperty = ownerId === prev.currentPlayerIndex
        const isOtherPlayerProperty = ownerId !== undefined && !isOwnProperty
        const isMortgaged = prev.mortgagedProperties[landedSpace.id] === true
        
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
        if (isPurchasable && isOtherPlayerProperty && !isMortgaged) {
          const ownerPlayer = updatedPlayers[ownerId]
          
          if (landedSpace.type === "property" && landedSpace.rent) {
            // Check if owner has all properties in the color group
            const colorGroupSpaces = getSpacesByColorGroup(landedSpace.colorGroup)
            const ownsAllInGroup = colorGroupSpaces.every(
              (s) =>
                prev.propertyOwners[s.id] === ownerId &&
                prev.mortgagedProperties[s.id] !== true
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

        // Store calculated values for later use
        calculatedRentAmount = rentAmount
        calculatedIsOwnProperty = isPurchasable && isOwnProperty

        return {
          ...prev,
          players: updatedPlayers,
          diceValues: dice,
          hasRolled: true,
          rolling: false,
          // Don't show dialog yet - wait for dice animation to complete
          selectedSpace: null,
          awaitingPropertyDecision: false,
          specialSpace: null,
          awaitingSpecialSpace: false,
          isOwnProperty: calculatedIsOwnProperty,
          rentPaid: rentAmount,
        }
      })

      // Delay showing dialogs until after dice animation completes
      setTimeout(() => {
        setGameState((prev) => {
          const isUnowned = prev.propertyOwners[landedSpace.id] === undefined
          const ownerId = prev.propertyOwners[landedSpace.id]
          const isOwnProperty = ownerId === prev.currentPlayerIndex
          const isOtherPlayerProperty = ownerId !== undefined && !isOwnProperty

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
            selectedSpace,
            awaitingPropertyDecision,
            // Show special space modal for non-purchasable special spaces
            specialSpace: isSpecialSpace ? landedSpace : null,
            awaitingSpecialSpace: isSpecialSpace,
          }
        })
      }, DICE_ANIMATION_DURATION + CARD_SHOW_DELAY)

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
      // We need to check after the dialog delay
      setTimeout(() => {
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
      }, DICE_ANIMATION_DURATION + CARD_SHOW_DELAY + 50) // Slightly after dialog appears
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

  const handleMortgageProperty = useCallback(() => {
    const space = gameState.selectedSpace
    if (!space || space.mortgage === undefined) return

    const ownerId = gameState.propertyOwners[space.id]
    if (ownerId !== gameState.currentPlayerIndex) return
    if (gameState.mortgagedProperties[space.id]) return

    const currentPlayer = gameState.players[gameState.currentPlayerIndex]

    setGameState((prev) => {
      const updatedPlayers = [...prev.players]
      updatedPlayers[prev.currentPlayerIndex] = {
        ...updatedPlayers[prev.currentPlayerIndex],
        money: updatedPlayers[prev.currentPlayerIndex].money + space.mortgage!,
      }
      return {
        ...prev,
        players: updatedPlayers,
        mortgagedProperties: {
          ...prev.mortgagedProperties,
          [space.id]: true,
        },
      }
    })

    addLog(`${currentPlayer.name} mortgaged ${space.name} for $${space.mortgage}`)
  }, [
    gameState.selectedSpace,
    gameState.propertyOwners,
    gameState.mortgagedProperties,
    gameState.currentPlayerIndex,
    gameState.players,
    addLog,
  ])

  const handleUnmortgageProperty = useCallback(() => {
    const space = gameState.selectedSpace
    if (!space || space.mortgage === undefined) return

    const ownerId = gameState.propertyOwners[space.id]
    if (ownerId !== gameState.currentPlayerIndex) return
    if (!gameState.mortgagedProperties[space.id]) return

    const mortgageCost = calculateUnmortgageCost(space.mortgage)
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer.money < mortgageCost) {
      addLog(`${currentPlayer.name} cannot afford to lift the mortgage on ${space.name}`)
      return
    }

    setGameState((prev) => {
      const updatedPlayers = [...prev.players]
      updatedPlayers[prev.currentPlayerIndex] = {
        ...updatedPlayers[prev.currentPlayerIndex],
        money: updatedPlayers[prev.currentPlayerIndex].money - mortgageCost,
      }
      const updatedMortgaged = { ...prev.mortgagedProperties }
      delete updatedMortgaged[space.id]
      return {
        ...prev,
        players: updatedPlayers,
        mortgagedProperties: updatedMortgaged,
      }
    })

    addLog(`${currentPlayer.name} lifted the mortgage on ${space.name} for $${mortgageCost}`)
  }, [
    gameState.selectedSpace,
    gameState.propertyOwners,
    gameState.mortgagedProperties,
    gameState.currentPlayerIndex,
    gameState.players,
    addLog,
  ])

  const handleViewPlayerProperties = useCallback((player: Player) => {
    setGameState((prev) => ({ ...prev, viewingPropertiesForPlayer: player }))
  }, [])

  const handleClosePlayerProperties = useCallback(() => {
    setGameState((prev) => ({ ...prev, viewingPropertiesForPlayer: null }))
  }, [])

  if (!gameStarted) {
    return <GameSetup onStartGame={handleStartGame} />
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const selectedSpaceOwnerId =
    gameState.selectedSpace && gameState.propertyOwners[gameState.selectedSpace.id] !== undefined
      ? gameState.propertyOwners[gameState.selectedSpace.id]
      : undefined
  const selectedSpaceOwner =
    selectedSpaceOwnerId !== undefined ? gameState.players[selectedSpaceOwnerId] : undefined
  const selectedSpaceIsMortgaged = gameState.selectedSpace
    ? gameState.mortgagedProperties[gameState.selectedSpace.id] === true
    : false
  const selectedSpaceMortgageValue = gameState.selectedSpace?.mortgage
  const selectedSpaceUnmortgageCost =
    selectedSpaceMortgageValue !== undefined
      ? calculateUnmortgageCost(selectedSpaceMortgageValue)
      : undefined
  const isSelectedSpaceOwnedByCurrentPlayer =
    selectedSpaceOwnerId === gameState.currentPlayerIndex

  const canBuySelectedSpace =
    gameState.selectedSpace &&
    gameState.selectedSpace.price &&
    gameState.propertyOwners[gameState.selectedSpace.id] === undefined &&
    currentPlayer.position === gameState.selectedSpace.id &&
    gameState.hasRolled &&
    currentPlayer.money >= gameState.selectedSpace.price

  const tradeDisabled =
    isTradeOpen ||
    gameState.rolling ||
    gameState.awaitingPropertyDecision ||
    gameState.awaitingSpecialSpace ||
    gameState.selectedSpace !== null ||
    gameState.specialSpace !== null ||
    gameState.viewingPropertiesForPlayer !== null ||
    gameState.players.length < 2

  const canMortgageSelectedSpace =
    gameState.selectedSpace &&
    selectedSpaceMortgageValue !== undefined &&
    isSelectedSpaceOwnedByCurrentPlayer &&
    !selectedSpaceIsMortgaged

  const canUnmortgageSelectedSpace =
    gameState.selectedSpace &&
    selectedSpaceMortgageValue !== undefined &&
    isSelectedSpaceOwnedByCurrentPlayer &&
    selectedSpaceIsMortgaged

  const canAffordUnmortgage =
    selectedSpaceUnmortgageCost !== undefined &&
    currentPlayer.money >= selectedSpaceUnmortgageCost
  const playerPanelColumnsClass =
    gameState.players.length === 2
      ? "md:grid-cols-2"
      : gameState.players.length === 3
        ? "md:grid-cols-3"
        : "md:grid-cols-4"

  return (
    <main className="min-h-screen bg-emerald-100 p-4">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6">
        {/* Center - Game Board */}
        <div className="overflow-auto">
          <GameBoard
            players={gameState.players}
            onSpaceClick={handleSpaceClick}
            propertyOwners={gameState.propertyOwners}
          />
        </div>

        {/* Player Panels - Below the board */}
        <div className={`grid w-full max-w-4xl grid-cols-2 gap-3 ${playerPanelColumnsClass}`}>
          {gameState.players.map((player) => (
            <PlayerPanel
              key={player.id}
              player={player}
              isCurrentTurn={player.id === currentPlayer.id}
              propertyOwners={gameState.propertyOwners}
              onPropertiesClick={() => handleViewPlayerProperties(player)}
            />
          ))}
        </div>

        {/* Game Controls - Below the player panels */}
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
          onTrade={handleOpenTrade}
          tradeDisabled={tradeDisabled}
        />
      </div>

      {/* Player Properties Modal */}
      {gameState.viewingPropertiesForPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-stone-800">
                {gameState.viewingPropertiesForPlayer.name}&apos;s Properties
              </h2>
              <button
                onClick={handleClosePlayerProperties}
                className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {(() => {
              const ownedProperties = BOARD_SPACES.filter(
                (space) => gameState.propertyOwners[space.id] === gameState.viewingPropertiesForPlayer!.id
              )
              if (ownedProperties.length === 0) {
                return (
                  <p className="text-center text-stone-500">No properties owned yet.</p>
                )
              }
              // Group properties by color
              const groupedProperties: Record<string, typeof ownedProperties> = {}
              ownedProperties.forEach((prop) => {
                const group = prop.colorGroup || prop.type
                if (!groupedProperties[group]) {
                  groupedProperties[group] = []
                }
                groupedProperties[group].push(prop)
              })
              return (
                <div className="space-y-4">
                  {Object.entries(groupedProperties).map(([group, properties]) => (
                    <div key={group}>
                      <h3 className="mb-2 text-sm font-semibold capitalize text-stone-600">
                        {group.replace("-", " ")}
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {properties.map((prop) => (
                          <button
                            key={prop.id}
                            onClick={() => {
                              handleClosePlayerProperties()
                              handleSpaceClick(prop)
                            }}
                            className="flex items-center gap-3 rounded-lg border border-stone-200 p-3 text-left transition-colors hover:bg-stone-50"
                          >
                            <div
                              className="h-8 w-4 rounded"
                              style={{
                                backgroundColor:
                                  prop.colorGroup === "railroad"
                                    ? "#4A4A4A"
                                    : prop.colorGroup === "utility"
                                      ? "#D3D3D3"
                                      : prop.colorGroup
                                        ? {
                                            brown: "#8B4513",
                                            "light-blue": "#87CEEB",
                                            pink: "#FF69B4",
                                            orange: "#FFA500",
                                            red: "#FF0000",
                                            yellow: "#FFD700",
                                            green: "#228B22",
                                            "dark-blue": "#00008B",
                                          }[prop.colorGroup]
                                        : "#ccc",
                              }}
                            />
                            <div>
                              <p className="font-medium text-stone-800">{prop.name}</p>
                              {prop.price && (
                                <p className="text-sm text-stone-500">${prop.price}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Property Card Modal */}
      {gameState.selectedSpace && (
        <PropertyCard
          space={gameState.selectedSpace}
          owner={selectedSpaceOwner}
          onClose={handleCloseCard}
          onBuy={handleBuyProperty}
          onPass={handlePassProperty}
          canBuy={canBuySelectedSpace}
          onMortgage={handleMortgageProperty}
          onUnmortgage={handleUnmortgageProperty}
          canMortgage={canMortgageSelectedSpace}
          canUnmortgage={canUnmortgageSelectedSpace}
          canAffordUnmortgage={canAffordUnmortgage}
          isMortgaged={selectedSpaceIsMortgaged}
          unmortgageCost={selectedSpaceUnmortgageCost}
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

      {isTradeOpen && (
        <TradeModal
          currentPlayer={currentPlayer}
          players={gameState.players}
          propertyOwners={gameState.propertyOwners}
          onClose={handleCloseTrade}
          onSubmit={handleTrade}
        />
      )}
    </main>
  )
}
