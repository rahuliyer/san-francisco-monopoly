"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { SplashScreen } from "@/components/splash-screen"
import { GameSetup } from "@/components/game-setup"
import { GameBoard } from "@/components/game-board"
import { PlayerPanel } from "@/components/player-panel"
import { GameControls } from "@/components/game-controls"
import { PropertyCard } from "@/components/property-card"
import { SpecialSpaceCard } from "@/components/special-space-card"
import { TradeModal, type TradePayload } from "@/components/trade-modal"
import { VictoryModal } from "@/components/victory-modal"
import {
  Player,
  Space,
  BOARD_SPACES,
  createPlayer,
  drawChanceCard,
  drawCommunityChestCard,
  calculateRent,
  getSpacesByColorGroup,
} from "@/lib/game-data"
import { useGameStore } from "@/components/game-store-context"
import { type GameState, getRandomInitialDice } from "@/lib/game-store"
import { gameReducer } from "@/lib/game-loop/reducers"
import { actions as gameActions, type GameAction } from "@/lib/game-loop"
import { getNextActivePlayerIndex, getWinnerId, resolveBankruptcies, resolveSingleBankruptcy, canPlayerLiquidate, findCreditorForPlayer } from "@/lib/game-status"
import { GAME_CONSTANTS } from "@/lib/constants"
import { applyCardEffect, formatRepairsSummary, calculateRepairsCost } from "@/lib/mechanics/cards"
import {
  canBuildHouse as checkCanBuildHouse,
  canMortgage as checkCanMortgage,
} from "@/lib/mechanics/property-actions"
import { LiquidationModal } from "@/components/liquidation-modal"

const {
  DICE_ANIMATION_DURATION,
  CARD_SHOW_DELAY,
  MORTGAGE_INTEREST_RATE,
  MAX_HOUSES,
  BOARD_SIZE,
  JAIL_POSITION,
  GO_BONUS,
  INCOME_TAX,
  LUXURY_TAX,
  JAIL_FEE,
  MAX_JAIL_TURNS,
  LOG_HISTORY_SIZE,
} = GAME_CONSTANTS

function calculateUnmortgageCost(mortgageValue: number): number {
  return Math.ceil(mortgageValue * (1 + MORTGAGE_INTEREST_RATE))
}

export default function MonopolyGame() {
  const store = useGameStore()
  const gameState = store.getState()
  const setGameState = useCallback(
    (updater: (prev: GameState) => GameState) => {
      store.setState(updater)
    },
    [store]
  )

  // Dispatch a game action through the pure reducer, which is the single source
  // of truth for these state transitions. The reducer only consumes the dice
  // roller for ROLL_DICE, so a lightweight adapter is sufficient here.
  const dispatch = useCallback(
    (action: GameAction) => {
      store.setState((prev) =>
        gameReducer(prev, action, {
          diceRoller: { roll: () => store.getDiceRoller()() },
        })
      )
    },
    [store]
  )

  const [showSplash, setShowSplash] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [isTradeOpen, setIsTradeOpen] = useState(false)
  const endTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleStartGame = (playerSetups: { name: string; tokenIndex: number }[]) => {
    if (typeof window !== "undefined" && window.__DETERMINISTIC_GAME_CONFIG__) {
      setGameStarted(true)
      return
    }

    const players = playerSetups.map((setup, i) =>
      createPlayer(i, setup.name, setup.tokenIndex)
    )
    setGameState((prev) => ({
      ...prev,
      players,
      currentPlayerIndex: 0,
      propertyOwners: {},
      mortgagedProperties: {},
      propertyHouses: {},
      gameLog: ["Game started! " + players[0].name + " goes first."],
      gameOver: false,
      winnerId: null,
    }))
    setGameStarted(true)
  }

  const addLog = useCallback((message: string) => {
    setGameState((prev) => ({
      ...prev,
      gameLog: [...prev.gameLog.slice(-LOG_HISTORY_SIZE), message],
    }))
  }, [])

  const handleEndTurn = useCallback(() => {
    setIsTradeOpen(false)
    setGameState((prev) => {
      if (prev.gameOver) {
        return prev
      }
      const nextPlayerIndex = getNextActivePlayerIndex(prev.players, prev.currentPlayerIndex)
      if (nextPlayerIndex === null || nextPlayerIndex === prev.currentPlayerIndex) {
        return prev
      }
      const nextPlayerName = prev.players[nextPlayerIndex].name
      // Schedule the log message after state update
      setTimeout(() => addLog(`${nextPlayerName}'s turn`), 0)
      return {
        ...prev,
        currentPlayerIndex: nextPlayerIndex,
        hasRolled: false,
        consecutiveDoubles: 0,
        diceValues: prev.diceValues,
        awaitingPropertyDecision: false,
        awaitingSpecialSpace: false,
        specialSpace: null,
        drawnCard: null,
        isOwnProperty: false,
        rentPaid: undefined,
      }
    })
  }, [addLog])

  // Called after a player completes their action (closes modal, etc.)
  // If they rolled doubles, they get another roll; otherwise, end turn
  const handleActionComplete = useCallback(() => {
    setGameState((prev) => {
      // If player rolled doubles (and didn't go to jail for 3rd double), they can roll again
      if (prev.consecutiveDoubles > 0) {
        // Check if the current player is in jail (sent by landing on Go To Jail or card)
        const currentPlayer = prev.players[prev.currentPlayerIndex]
        if (currentPlayer.inJail) {
          // Player was sent to jail, end turn
          setTimeout(() => handleEndTurn(), 0)
          return prev
        }
        // Player rolled doubles, let them roll again
        setTimeout(() => addLog(`${currentPlayer.name} rolled doubles - roll again!`), 0)
        return {
          ...prev,
          hasRolled: false,
        }
      }
      // No doubles, end turn
      setTimeout(() => handleEndTurn(), 0)
      return prev
    })
  }, [handleEndTurn, addLog])

  const handlePayJailFee = useCallback(() => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer.isBankrupt) {
      return
    }

    if (currentPlayer.money < JAIL_FEE) {
      addLog(`${currentPlayer.name} cannot afford the $${JAIL_FEE} jail fee`)
      return
    }

    setGameState((prev) => {
      const updatedPlayers = [...prev.players]
      updatedPlayers[prev.currentPlayerIndex] = {
        ...updatedPlayers[prev.currentPlayerIndex],
        money: updatedPlayers[prev.currentPlayerIndex].money - JAIL_FEE,
        inJail: false,
        jailTurns: 0,
      }
      return { ...prev, players: updatedPlayers }
    })

    addLog(`${currentPlayer.name} paid $${JAIL_FEE} to leave Alcatraz`)
  }, [gameState.players, gameState.currentPlayerIndex, addLog])

  const handleOpenTrade = useCallback(() => {
    setIsTradeOpen(true)
  }, [])

  const handleCloseTrade = useCallback(() => {
    setIsTradeOpen(false)
  }, [])

  const handleTrade = useCallback((trade: TradePayload) => {
    // The trade reducer validates ownership/affordability and returns the same
    // state reference when the trade is rejected; only close the modal if it applied.
    const before = store.getState()
    dispatch(gameActions.proposeTrade(trade))
    if (store.getState() !== before) {
      setIsTradeOpen(false)
    }
  }, [store, dispatch])

  const handleRoll = useCallback(() => {
    if (gameState.gameOver) {
      return
    }
    // Clear any pending end turn timeout
    if (endTurnTimeoutRef.current) {
      clearTimeout(endTurnTimeoutRef.current)
      endTurnTimeoutRef.current = null
    }

    setGameState((prev) => ({ ...prev, rolling: true }))

    // Simulate rolling animation
    setTimeout(() => {
      const dice = store.getDiceRoller()()
      const total = dice[0] + dice[1]
      const isDoubles = dice[0] === dice[1]
      const currentPlayer = gameState.players[gameState.currentPlayerIndex]
      if (currentPlayer.isBankrupt) {
        setGameState((prev) => ({ ...prev, rolling: false }))
        return
      }

      // Handle jail logic
      if (currentPlayer.inJail) {
        if (isDoubles) {
          // Player rolled doubles - they're free and can move!
          let newPosition = currentPlayer.position + total
          let passedGo = false

          if (newPosition >= BOARD_SIZE) {
            newPosition = newPosition - BOARD_SIZE
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
                ? updatedPlayers[prev.currentPlayerIndex].money + GO_BONUS
                : updatedPlayers[prev.currentPlayerIndex].money,
              inJail: false,
              jailTurns: 0,
            }

            // Handle Go To Jail
            if (landedSpace.type === "go-to-jail") {
              updatedPlayers[prev.currentPlayerIndex] = {
                ...updatedPlayers[prev.currentPlayerIndex],
                position: JAIL_POSITION,
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
            const taxAmount = landedSpace.name === "Income Tax" ? INCOME_TAX : LUXURY_TAX
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
              const { updatedPlayers, repairsSummary } = applyCardEffect(
                card,
                prev.players,
                prev.currentPlayerIndex,
                prev.propertyOwners,
                prev.propertyHouses
              )

              if (repairsSummary) {
                const details = formatRepairsSummary(repairsSummary)
                setTimeout(() => addLog(`${currentPlayer.name} paid $${repairsSummary.total} for repairs${details}`), 0)
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

            if (newJailTurns >= MAX_JAIL_TURNS) {
              // Third turn without doubles - must pay and move
              updatedPlayers[prev.currentPlayerIndex] = {
                ...updatedPlayers[prev.currentPlayerIndex],
                money: updatedPlayers[prev.currentPlayerIndex].money - JAIL_FEE,
                inJail: false,
                jailTurns: 0,
              }
              addLog(`${currentPlayer.name} rolled ${dice[0]} + ${dice[1]} (no doubles)`)
              addLog(`${currentPlayer.name} paid $${JAIL_FEE} after ${MAX_JAIL_TURNS} turns in Alcatraz`)
            } else {
              // Stay in jail, increment turn counter
              updatedPlayers[prev.currentPlayerIndex] = {
                ...updatedPlayers[prev.currentPlayerIndex],
                jailTurns: newJailTurns,
              }
              addLog(`${currentPlayer.name} rolled ${dice[0]} + ${dice[1]} (no doubles)`)
              addLog(`${currentPlayer.name} remains in Alcatraz (${MAX_JAIL_TURNS - newJailTurns} turns left)`)
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
      // Check for 3rd consecutive doubles - go to jail immediately without moving
      const newConsecutiveDoubles = isDoubles ? gameState.consecutiveDoubles + 1 : 0

      if (isDoubles && newConsecutiveDoubles >= MAX_JAIL_TURNS) {
        // Third consecutive doubles - go directly to jail!
        setGameState((prev) => {
          const updatedPlayers = [...prev.players]
          updatedPlayers[prev.currentPlayerIndex] = {
            ...updatedPlayers[prev.currentPlayerIndex],
            position: JAIL_POSITION,
            inJail: true,
            jailTurns: 0,
          }
          return {
            ...prev,
            players: updatedPlayers,
            diceValues: dice,
            hasRolled: true,
            rolling: false,
            consecutiveDoubles: 0,
          }
        })

        addLog(`${currentPlayer.name} rolled doubles (${dice[0]} + ${dice[1]}) for the third time in a row!`)
        addLog(`${currentPlayer.name} was sent to Alcatraz for speeding!`)

        // End turn after a short delay
        endTurnTimeoutRef.current = setTimeout(() => {
          handleEndTurn()
        }, 2000)
        return
      }

      // Calculate new position
      let newPosition = currentPlayer.position + total
      let passedGo = false

      if (newPosition >= BOARD_SIZE) {
        newPosition = newPosition - BOARD_SIZE
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
            ? updatedPlayers[prev.currentPlayerIndex].money + GO_BONUS
            : updatedPlayers[prev.currentPlayerIndex].money,
        }

        // Handle Go To Jail
        if (landedSpace.type === "go-to-jail") {
          updatedPlayers[prev.currentPlayerIndex] = {
            ...updatedPlayers[prev.currentPlayerIndex],
            position: JAIL_POSITION,
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
            const houseCount = prev.propertyHouses[landedSpace.id] ?? 0
            rentAmount = calculateRent(landedSpace, houseCount, ownsAllInGroup)
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
          consecutiveDoubles: newConsecutiveDoubles,
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
      if (isDoubles) logMessage += " (doubles!)"
      if (passedGo) logMessage += ` and passed GO (+$${GO_BONUS})`
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
        const taxAmount = landedSpace.name === "Income Tax" ? INCOME_TAX : LUXURY_TAX
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
          const { updatedPlayers, repairsSummary } = applyCardEffect(
            card,
            prev.players,
            prev.currentPlayerIndex,
            prev.propertyOwners,
            prev.propertyHouses
          )

          if (repairsSummary) {
            const details = formatRepairsSummary(repairsSummary)
            setTimeout(() => addLog(`${currentPlayer.name} paid $${repairsSummary.total} for repairs${details}`), 0)
          }

          return { ...prev, players: updatedPlayers, drawnCard: card }
        })
      }

      // Check if we need to wait for modal interaction or auto-complete action
      // We need to check after the dialog delay
      setTimeout(() => {
        setGameState((prev) => {
          if (prev.awaitingPropertyDecision || prev.awaitingSpecialSpace) {
            // Player needs to interact with a modal - action completes when modal closes
            return prev
          } else {
            // Auto-complete action after a short delay (for non-interactive spaces)
            endTurnTimeoutRef.current = setTimeout(() => {
              handleActionComplete()
            }, 1500)
            return prev
          }
        })
      }, DICE_ANIMATION_DURATION + CARD_SHOW_DELAY + 50) // Slightly after dialog appears
    }, 800)
  }, [gameState.players, gameState.currentPlayerIndex, gameState.consecutiveDoubles, gameState.gameOver, addLog, handleEndTurn, handleActionComplete])

  const handleSpaceClick = useCallback((space: Space) => {
    if (gameState.gameOver) return
    if (space.type === "property" || space.type === "railroad" || space.type === "utility") {
      setGameState((prev) => ({ ...prev, selectedSpace: space }))
    }
  }, [gameState.gameOver])

  const handleCloseCard = useCallback(() => {
    setGameState((prev) => {
      // If we were awaiting a property decision, complete the action after closing
      if (prev.awaitingPropertyDecision) {
        endTurnTimeoutRef.current = setTimeout(() => {
          handleActionComplete()
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
  }, [handleActionComplete])

  const handlePassProperty = useCallback(() => {
    const space = gameState.selectedSpace
    if (!space) return

    dispatch(gameActions.passProperty())

    // Complete action after passing (may roll again if doubles)
    endTurnTimeoutRef.current = setTimeout(() => {
      handleActionComplete()
    }, 500)
  }, [gameState.selectedSpace, handleActionComplete, dispatch])

  const handleCloseSpecialCard = useCallback(() => {
    setGameState((prev) => {
      // Check if the card moved the player to a new position (advance or go-back effects)
      const drawnCard = prev.drawnCard
      const currentPlayer = prev.players[prev.currentPlayerIndex]

      // If player is in jail (sent there by a card), just complete the action
      if (currentPlayer.inJail) {
        if (prev.awaitingSpecialSpace) {
          endTurnTimeoutRef.current = setTimeout(() => {
            handleActionComplete()
          }, 500)
        }
        return { ...prev, specialSpace: null, awaitingSpecialSpace: false, drawnCard: null }
      }

      // Check if this was a movement card that could land on a property
      const isMovementCard = drawnCard && (
        drawnCard.effect.type === "advance" ||
        drawnCard.effect.type === "go-back"
      )

      if (isMovementCard) {
        // Get the space the player landed on after the card effect
        const landedSpace = BOARD_SPACES[currentPlayer.position]
        const isPurchasable = landedSpace.type === "property" ||
          landedSpace.type === "railroad" ||
          landedSpace.type === "utility"

        if (isPurchasable) {
          const isUnowned = prev.propertyOwners[landedSpace.id] === undefined
          const ownerId = prev.propertyOwners[landedSpace.id]
          const isOwnProperty = ownerId === prev.currentPlayerIndex
          const isOtherPlayerProperty = ownerId !== undefined && !isOwnProperty
          const isMortgaged = prev.mortgagedProperties[landedSpace.id] === true

          if (isUnowned) {
            // Show property purchase modal
            setTimeout(() => addLog(`${currentPlayer.name} landed on ${landedSpace.name}`), 0)
            return {
              ...prev,
              specialSpace: null,
              awaitingSpecialSpace: false,
              drawnCard: null,
              selectedSpace: landedSpace,
              awaitingPropertyDecision: true,
              isOwnProperty: false,
              rentPaid: undefined,
            }
          } else if (isOtherPlayerProperty && !isMortgaged) {
            // Calculate and charge rent
            const updatedPlayers = [...prev.players]
            let rentAmount: number | undefined = undefined

            if (landedSpace.type === "property" && landedSpace.rent) {
              const colorGroupSpaces = getSpacesByColorGroup(landedSpace.colorGroup)
              const ownsAllInGroup = colorGroupSpaces.every(
                (s) =>
                  prev.propertyOwners[s.id] === ownerId &&
                  prev.mortgagedProperties[s.id] !== true
              )
              const houseCount = prev.propertyHouses[landedSpace.id] ?? 0
              rentAmount = calculateRent(landedSpace, houseCount, ownsAllInGroup)
            } else if (landedSpace.type === "railroad" && landedSpace.rent) {
              const railroads = BOARD_SPACES.filter(s => s.type === "railroad")
              const ownedRailroads = railroads.filter(r => prev.propertyOwners[r.id] === ownerId)
              rentAmount = landedSpace.rent[ownedRailroads.length - 1] || 25
            } else if (landedSpace.type === "utility") {
              const utilities = BOARD_SPACES.filter(s => s.type === "utility")
              const ownedUtilities = utilities.filter(u => prev.propertyOwners[u.id] === ownerId)
              const multiplier = ownedUtilities.length === 2 ? 10 : 4
              // Use the last dice roll for utility rent
              rentAmount = (prev.diceValues[0] + prev.diceValues[1]) * multiplier
            }

            if (rentAmount !== undefined) {
              updatedPlayers[prev.currentPlayerIndex].money -= rentAmount
              updatedPlayers[ownerId!].money += rentAmount
              const ownerName = prev.players[ownerId!].name
              setTimeout(() => {
                addLog(`${currentPlayer.name} landed on ${landedSpace.name}`)
                addLog(`${currentPlayer.name} paid $${rentAmount} rent to ${ownerName}`)
              }, 0)
            }

            // Show property card - handleCloseCard will call handleActionComplete when closed
            return {
              ...prev,
              players: updatedPlayers,
              specialSpace: null,
              awaitingSpecialSpace: false,
              drawnCard: null,
              selectedSpace: landedSpace,
              awaitingPropertyDecision: true,
              isOwnProperty: false,
              rentPaid: rentAmount,
            }
          } else if (isOwnProperty) {
            // Landing on own property - show card, handleCloseCard will complete action
            setTimeout(() => addLog(`${currentPlayer.name} landed on ${landedSpace.name} (own property)`), 0)

            return {
              ...prev,
              specialSpace: null,
              awaitingSpecialSpace: false,
              drawnCard: null,
              selectedSpace: landedSpace,
              awaitingPropertyDecision: true,
              isOwnProperty: true,
              rentPaid: undefined,
            }
          } else if (isMortgaged && isOtherPlayerProperty) {
            // Mortgaged property owned by another player - no rent, but show card
            setTimeout(() => addLog(`${currentPlayer.name} landed on ${landedSpace.name} (mortgaged - no rent)`), 0)

            return {
              ...prev,
              specialSpace: null,
              awaitingSpecialSpace: false,
              drawnCard: null,
              selectedSpace: landedSpace,
              awaitingPropertyDecision: true,
              isOwnProperty: false,
              rentPaid: undefined,
            }
          }
        }
      }

      // Default behavior: complete action after closing the special space modal
      if (prev.awaitingSpecialSpace) {
        endTurnTimeoutRef.current = setTimeout(() => {
          handleActionComplete()
        }, 500)
      }
      return { ...prev, specialSpace: null, awaitingSpecialSpace: false, drawnCard: null }
    })
  }, [handleActionComplete, addLog])

  const handleBuyProperty = useCallback(() => {
    const space = gameState.selectedSpace
    if (!space || !space.price) return

    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer.isBankrupt) return
    if (currentPlayer.money < space.price) {
      addLog(`${currentPlayer.name} cannot afford ${space.name}`)
      return
    }

    dispatch(gameActions.buyProperty(space.id))

    // Complete action after buying (may roll again if doubles)
    endTurnTimeoutRef.current = setTimeout(() => {
      handleActionComplete()
    }, 500)
  }, [gameState.selectedSpace, gameState.players, gameState.currentPlayerIndex, addLog, handleActionComplete, dispatch])

  const handleMortgageProperty = useCallback(() => {
    const space = gameState.selectedSpace
    if (!space || space.mortgage === undefined) return

    dispatch(gameActions.mortgage(space.id))
  }, [gameState.selectedSpace, dispatch])

  const handleUnmortgageProperty = useCallback(() => {
    const space = gameState.selectedSpace
    if (!space || space.mortgage === undefined) return

    const mortgageCost = calculateUnmortgageCost(space.mortgage)
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (currentPlayer.money < mortgageCost) {
      addLog(`${currentPlayer.name} cannot afford to lift the mortgage on ${space.name}`)
      return
    }

    dispatch(gameActions.unmortgage(space.id))
  }, [
    gameState.selectedSpace,
    gameState.players,
    gameState.currentPlayerIndex,
    addLog,
    dispatch,
  ])

  const handleBuildHouse = useCallback(() => {
    const space = gameState.selectedSpace
    if (!space || space.type !== "property" || !space.houseCost) return

    dispatch(gameActions.buildHouse(space.id))
  }, [gameState.selectedSpace, dispatch])

  const handleViewPlayerProperties = useCallback((player: Player) => {
    setGameState((prev) => ({ ...prev, viewingPropertiesForPlayer: player }))
  }, [])

  const handleClosePlayerProperties = useCallback(() => {
    setGameState((prev) => ({ ...prev, viewingPropertiesForPlayer: null }))
  }, [])

  const handlePlayAgain = useCallback(() => {
    // Reset to splash screen
    setGameStarted(false)
    setShowSplash(true)
    setIsTradeOpen(false)
    // Reset game state
    setGameState((prev) => ({
      ...prev,
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
      liquidatingPlayerId: null,
      liquidationCreditorId: null,
      gameOver: false,
      winnerId: null,
    }))
  }, [])

  // === Liquidation handlers ===

  const handleLiquidationSellHouse = useCallback((spaceId: number) => {
    setGameState((prev) => {
      if (prev.liquidatingPlayerId === null) return prev
      const playerId = prev.liquidatingPlayerId
      const space = BOARD_SPACES[spaceId]
      if (!space || space.type !== "property" || !space.houseCost) return prev

      const ownerId = prev.propertyOwners[spaceId]
      if (ownerId !== playerId) return prev

      const currentHouses = prev.propertyHouses[spaceId] ?? 0
      if (currentHouses <= 0) return prev

      // Enforce even selling: can only sell from properties with the max houses in the group
      const groupSpaces = BOARD_SPACES.filter(
        (s) => s.colorGroup === space.colorGroup && s.type === "property"
      )
      const maxInGroup = Math.max(
        ...groupSpaces
          .filter((s) => prev.propertyOwners[s.id] === playerId)
          .map((s) => prev.propertyHouses[s.id] ?? 0)
      )
      if (currentHouses < maxInGroup) return prev

      const sellValue = Math.floor(space.houseCost / 2)
      const updatedPlayers = prev.players.map((p) =>
        p.id === playerId ? { ...p, money: p.money + sellValue } : p
      )

      const updatedHouses = { ...prev.propertyHouses }
      const newHouseCount = currentHouses - 1
      if (newHouseCount === 0) {
        delete updatedHouses[spaceId]
      } else {
        updatedHouses[spaceId] = newHouseCount
      }

      const buildingLabel = currentHouses >= MAX_HOUSES ? "hotel" : "house"
      setTimeout(() => addLog(`${prev.players.find((p) => p.id === playerId)?.name} sold a ${buildingLabel} on ${space.name} for $${sellValue}`), 0)

      // Check if player is now solvent
      const newMoney = updatedPlayers.find((p) => p.id === playerId)?.money ?? 0
      if (newMoney >= 0) {
        setTimeout(() => addLog(`${prev.players.find((p) => p.id === playerId)?.name} raised enough funds!`), 0)
        return {
          ...prev,
          players: updatedPlayers,
          propertyHouses: updatedHouses,
          liquidatingPlayerId: null,
          liquidationCreditorId: null,
        }
      }

      return {
        ...prev,
        players: updatedPlayers,
        propertyHouses: updatedHouses,
      }
    })
  }, [addLog])

  const handleLiquidationMortgage = useCallback((spaceId: number) => {
    setGameState((prev) => {
      if (prev.liquidatingPlayerId === null) return prev
      const playerId = prev.liquidatingPlayerId
      const space = BOARD_SPACES[spaceId]
      if (!space || space.mortgage === undefined) return prev

      const ownerId = prev.propertyOwners[spaceId]
      if (ownerId !== playerId) return prev
      if (prev.mortgagedProperties[spaceId]) return prev

      // Cannot mortgage a property that has houses - must sell houses first
      const houses = prev.propertyHouses[spaceId] ?? 0
      if (houses > 0) return prev

      const updatedPlayers = prev.players.map((p) =>
        p.id === playerId ? { ...p, money: p.money + space.mortgage! } : p
      )

      setTimeout(() => addLog(`${prev.players.find((p) => p.id === playerId)?.name} mortgaged ${space.name} for $${space.mortgage}`), 0)

      // Check if player is now solvent
      const newMoney = updatedPlayers.find((p) => p.id === playerId)?.money ?? 0
      if (newMoney >= 0) {
        setTimeout(() => addLog(`${prev.players.find((p) => p.id === playerId)?.name} raised enough funds!`), 0)
        return {
          ...prev,
          players: updatedPlayers,
          mortgagedProperties: { ...prev.mortgagedProperties, [spaceId]: true },
          liquidatingPlayerId: null,
          liquidationCreditorId: null,
        }
      }

      return {
        ...prev,
        players: updatedPlayers,
        mortgagedProperties: { ...prev.mortgagedProperties, [spaceId]: true },
      }
    })
  }, [addLog])

  const handleDeclareBankruptcy = useCallback(() => {
    setGameState((prev) => {
      if (prev.liquidatingPlayerId === null) return prev
      const playerId = prev.liquidatingPlayerId

      // Resolve bankruptcy for ONLY the liquidating player
      const resolution = resolveSingleBankruptcy(
        playerId,
        prev.players,
        prev.propertyOwners,
        prev.mortgagedProperties,
        prev.propertyHouses
      )

      const nextPlayers = resolution.hasChanges ? resolution.players : prev.players
      const winnerId = getWinnerId(nextPlayers)

      const playerName = prev.players.find((p) => p.id === playerId)?.name
      if (playerName) {
        setTimeout(() => addLog(`${playerName} declared bankruptcy and is out of the game.`), 0)
      }

      if (winnerId !== null) {
        const winnerName = nextPlayers.find((p) => p.id === winnerId)?.name
        if (winnerName) {
          setTimeout(() => addLog(`${winnerName} wins the game!`), 0)
        }
      }

      return {
        ...prev,
        players: resolution.players,
        propertyOwners: resolution.propertyOwners,
        mortgagedProperties: resolution.mortgagedProperties,
        propertyHouses: resolution.propertyHouses,
        liquidatingPlayerId: null,
        liquidationCreditorId: null,
        gameOver: winnerId !== null,
        winnerId,
      }
    })
  }, [addLog])

  // Handle Escape key to close any open dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isTradeOpen) {
          handleCloseTrade()
        } else if (gameState.viewingPropertiesForPlayer) {
          handleClosePlayerProperties()
        } else if (gameState.selectedSpace) {
          handleCloseCard()
        } else if (gameState.specialSpace) {
          handleCloseSpecialCard()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [
    isTradeOpen,
    gameState.viewingPropertiesForPlayer,
    gameState.selectedSpace,
    gameState.specialSpace,
    handleCloseTrade,
    handleClosePlayerProperties,
    handleCloseCard,
    handleCloseSpecialCard,
  ])

  useEffect(() => {
    if (!gameStarted || gameState.gameOver) {
      return
    }

    // Find players with negative money who are not already bankrupt or in liquidation
    const playersNeedingResolution = gameState.players.filter(
      (player) => !player.isBankrupt && player.money < 0
    )

    if (playersNeedingResolution.length === 0) {
      // Check for winner among current players
      const winnerId = getWinnerId(gameState.players)
      if (winnerId !== null && winnerId !== gameState.winnerId) {
        setGameState((prev) => ({
          ...prev,
          gameOver: true,
          winnerId,
        }))
        const winnerName = gameState.players.find((player) => player.id === winnerId)?.name
        if (winnerName) {
          addLog(`${winnerName} wins the game!`)
        }
      }
      return
    }

    // If already in liquidation mode, don't re-trigger
    if (gameState.liquidatingPlayerId !== null) {
      return
    }

    // Check each player needing resolution
    for (const player of playersNeedingResolution) {
      const hasAssets = canPlayerLiquidate(
        player.id,
        gameState.propertyOwners,
        gameState.propertyHouses,
        gameState.mortgagedProperties
      )

      if (hasAssets) {
        // Enter liquidation mode - player can sell houses/mortgage properties
        const creditorId = findCreditorForPlayer(
          player,
          gameState.players,
          gameState.propertyOwners,
          gameState.mortgagedProperties
        )
        setGameState((prev) => ({
          ...prev,
          liquidatingPlayerId: player.id,
          liquidationCreditorId: creditorId,
          // Close any open modals during liquidation
          selectedSpace: null,
          awaitingPropertyDecision: false,
          specialSpace: null,
          awaitingSpecialSpace: false,
        }))
        addLog(`${player.name} is in debt and must liquidate assets!`)
        return // Handle one player at a time
      } else {
        // No assets to liquidate - go bankrupt immediately (only this player)
        const resolution = resolveSingleBankruptcy(
          player.id,
          gameState.players,
          gameState.propertyOwners,
          gameState.mortgagedProperties,
          gameState.propertyHouses
        )

        if (resolution.hasChanges) {
          const nextPlayers = resolution.players
          const winnerId = getWinnerId(nextPlayers)

          setGameState((prev) => ({
            ...prev,
            players: resolution.players,
            propertyOwners: resolution.propertyOwners,
            mortgagedProperties: resolution.mortgagedProperties,
            propertyHouses: resolution.propertyHouses,
            gameOver: winnerId !== null,
            winnerId,
          }))

          const playerName = gameState.players.find((p) => p.id === player.id)?.name
          if (playerName) {
            addLog(`${playerName} went bankrupt and is out of the game.`)
          }

          if (winnerId !== null) {
            const winnerName = nextPlayers.find((p) => p.id === winnerId)?.name
            if (winnerName) {
              addLog(`${winnerName} wins the game!`)
            }
          }
        }
        return
      }
    }
  }, [
    gameStarted,
    gameState.gameOver,
    gameState.players,
    gameState.propertyOwners,
    gameState.mortgagedProperties,
    gameState.propertyHouses,
    gameState.winnerId,
    gameState.liquidatingPlayerId,
    addLog,
  ])

  useEffect(() => {
    if (gameState.gameOver && endTurnTimeoutRef.current) {
      clearTimeout(endTurnTimeoutRef.current)
      endTurnTimeoutRef.current = null
    }
  }, [gameState.gameOver])

  useEffect(() => {
    if (gameState.gameOver) {
      return
    }
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (!currentPlayer?.isBankrupt) {
      return
    }
    handleEndTurn()
  }, [gameState.players, gameState.currentPlayerIndex, gameState.gameOver, handleEndTurn])

  if (showSplash) {
    return <SplashScreen onPlay={() => setShowSplash(false)} />
  }

  if (!gameStarted) {
    return <GameSetup onStartGame={handleStartGame} />
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const winner = gameState.winnerId !== null ? gameState.players.find((player) => player.id === gameState.winnerId) : null
  const selectedSpaceOwnerId =
    gameState.selectedSpace && gameState.propertyOwners[gameState.selectedSpace.id] !== undefined
      ? gameState.propertyOwners[gameState.selectedSpace.id]
      : undefined
  const selectedSpaceOwner =
    selectedSpaceOwnerId !== undefined
      ? gameState.players.find((player) => player.id === selectedSpaceOwnerId)
      : undefined
  const selectedSpaceIsMortgaged = gameState.selectedSpace
    ? gameState.mortgagedProperties[gameState.selectedSpace.id] === true
    : false
  const selectedSpaceMortgageValue = gameState.selectedSpace?.mortgage
  const selectedSpaceUnmortgageCost =
    selectedSpaceMortgageValue !== undefined
      ? calculateUnmortgageCost(selectedSpaceMortgageValue)
      : undefined
  const isSelectedSpaceOwnedByCurrentPlayer =
    selectedSpaceOwnerId === currentPlayer.id

  const selectedSpaceHouseCount = gameState.selectedSpace
    ? gameState.propertyHouses[gameState.selectedSpace.id] ?? 0
    : 0
  const canManageHouses =
    gameState.selectedSpace?.type === "property" &&
    isSelectedSpaceOwnedByCurrentPlayer
  let canBuildHouse = false
  let canBuildHotel = false
  let buildMessage: string | undefined

  if (canManageHouses && gameState.selectedSpace?.houseCost) {
    const buildCheck = checkCanBuildHouse(
      currentPlayer,
      gameState.selectedSpace,
      selectedSpaceOwnerId,
      gameState.propertyOwners,
      gameState.propertyHouses,
      gameState.mortgagedProperties
    )

    if (!buildCheck.allowed) {
      buildMessage = buildCheck.reason
        ? `${buildCheck.reason}.`
        : "Building is not available."
    } else {
      canBuildHouse = selectedSpaceHouseCount < 4
      canBuildHotel = selectedSpaceHouseCount === 4
    }
  }

  const canBuySelectedSpace =
    gameState.selectedSpace &&
    gameState.selectedSpace.price &&
    gameState.propertyOwners[gameState.selectedSpace.id] === undefined &&
    currentPlayer.position === gameState.selectedSpace.id &&
    gameState.hasRolled &&
    currentPlayer.money >= gameState.selectedSpace.price

  const activePlayersCount = gameState.players.filter((player) => !player.isBankrupt).length
  const tradeDisabled =
    isTradeOpen ||
    gameState.rolling ||
    gameState.awaitingPropertyDecision ||
    gameState.awaitingSpecialSpace ||
    gameState.selectedSpace !== null ||
    gameState.specialSpace !== null ||
    gameState.viewingPropertiesForPlayer !== null ||
    gameState.liquidatingPlayerId !== null ||
    gameState.gameOver ||
    currentPlayer.isBankrupt ||
    activePlayersCount < 2

  const mortgageCheck = gameState.selectedSpace
    ? checkCanMortgage(
        currentPlayer,
        gameState.selectedSpace,
        selectedSpaceOwnerId,
        gameState.propertyHouses,
        gameState.mortgagedProperties
      )
    : { allowed: false, reason: undefined }
  const canMortgageSelectedSpace = mortgageCheck.allowed
  const mortgageMessage =
    isSelectedSpaceOwnedByCurrentPlayer && !selectedSpaceIsMortgaged
      ? mortgageCheck.reason
      : undefined

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
    <main className="vintage-paper min-h-screen p-4">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6">
        {/* Center - Game Board */}
        <div className="overflow-auto rounded-lg golden-glow">
          <GameBoard
            players={gameState.players}
            onSpaceClick={handleSpaceClick}
            propertyOwners={gameState.propertyOwners}
            propertyHouses={gameState.propertyHouses}
          />
        </div>

        {/* Player Panels - Below the board */}
        <div className={`grid w-full max-w-4xl grid-cols-2 gap-3 ${playerPanelColumnsClass}`}>
          {gameState.players.map((player) => (
            <PlayerPanel
              key={player.id}
              player={player}
              isCurrentTurn={player.id === currentPlayer.id && !player.isBankrupt && !gameState.gameOver}
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
          canAffordJailFee={currentPlayer.money >= JAIL_FEE}
          onTrade={handleOpenTrade}
          tradeDisabled={tradeDisabled}
          gameOver={gameState.gameOver}
          winnerName={winner?.name ?? undefined}
        />
      </div>

      {/* Player Properties Modal */}
      {gameState.viewingPropertiesForPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-gradient-to-br from-[#faf6ee] to-[#f5efe3] p-6 shadow-xl border-2 border-[#8B6914]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-[#2c3e50]">
                {gameState.viewingPropertiesForPlayer.name}&apos;s Properties
              </h2>
              <button
                onClick={handleClosePlayerProperties}
                className="rounded-full p-2 text-[#5c4a1f] hover:bg-[#d4af37]/10 hover:text-[#2c3e50]"
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
                  <p className="text-center text-[#5c4a1f] font-serif italic">No properties owned yet.</p>
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
                      <h3 className="mb-2 text-sm font-serif font-semibold capitalize text-[#8B6914]">
                        {group.replace("-", " ")}
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {properties.map((prop) => {
                          const houseCount = gameState.propertyHouses[prop.id] ?? 0
                          const houseLabel =
                            houseCount >= MAX_HOUSES
                              ? "Hotel"
                              : houseCount > 0
                                ? `${houseCount} House${houseCount === 1 ? "" : "s"}`
                                : null
                          return (
                            <button
                              key={prop.id}
                              onClick={() => {
                                handleClosePlayerProperties()
                                handleSpaceClick(prop)
                              }}
                              className="flex items-center gap-3 rounded-lg border border-[#d4af37]/30 p-3 text-left transition-colors hover:bg-[#d4af37]/10 bg-[#faf6ee]"
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
                                <p className="font-serif font-medium text-[#2c3e50]">{prop.name}</p>
                                {prop.price && (
                                  <p className="text-sm text-[#5c4a1f]">${prop.price}</p>
                                )}
                                {prop.type === "property" && houseLabel && (
                                  <p className="text-xs text-[#8B6914]">{houseLabel}</p>
                                )}
                              </div>
                            </button>
                          )
                        })}
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
          canBuy={!!canBuySelectedSpace}
          onMortgage={handleMortgageProperty}
          onUnmortgage={handleUnmortgageProperty}
          canMortgage={!!canMortgageSelectedSpace}
          mortgageMessage={mortgageMessage}
          canUnmortgage={!!canUnmortgageSelectedSpace}
          canAffordUnmortgage={!!canAffordUnmortgage}
          isMortgaged={selectedSpaceIsMortgaged}
          unmortgageCost={selectedSpaceUnmortgageCost}
          isOwnProperty={gameState.isOwnProperty}
          rentPaid={gameState.rentPaid}
          currentPlayerName={currentPlayer.name}
          houseCount={selectedSpaceHouseCount}
          canManageHouses={canManageHouses}
          canBuildHouse={canBuildHouse}
          canBuildHotel={canBuildHotel}
          buildMessage={buildMessage}
          onBuildHouse={handleBuildHouse}
          onBuildHotel={handleBuildHouse}
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

      {/* Liquidation Modal */}
      {gameState.liquidatingPlayerId !== null && (() => {
        const liquidatingPlayer = gameState.players.find((p) => p.id === gameState.liquidatingPlayerId)
        const creditorPlayer = gameState.liquidationCreditorId !== null
          ? gameState.players.find((p) => p.id === gameState.liquidationCreditorId)
          : null
        return liquidatingPlayer ? (
          <LiquidationModal
            player={liquidatingPlayer}
            propertyOwners={gameState.propertyOwners}
            propertyHouses={gameState.propertyHouses}
            mortgagedProperties={gameState.mortgagedProperties}
            creditorName={creditorPlayer?.name ?? null}
            onSellHouse={handleLiquidationSellHouse}
            onMortgageProperty={handleLiquidationMortgage}
            onDeclareBankruptcy={handleDeclareBankruptcy}
          />
        ) : null
      })()}

      {/* Victory Modal */}
      {gameState.gameOver && winner && (
        <VictoryModal
          winner={winner}
          players={gameState.players}
          propertyOwners={gameState.propertyOwners}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </main>
  )
}
