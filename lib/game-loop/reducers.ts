// Game loop reducers - pure functions that handle state transitions
// Each reducer takes state, action, and dependencies, returning new state.

import type { GameState } from "@/lib/game-store"
import type { GameAction, TradePayload } from "./actions"
import type { DiceRoller, DiceValues } from "@/lib/mechanics/dice"
import { createPlayer, type Player } from "@/lib/models/player"
import { BOARD_SPACES, getSpacesByColorGroup } from "@/lib/models/board"
import {
  drawCard,
  returnCardToDeck,
  CHANCE_CARDS,
  COMMUNITY_CHEST_CARDS,
  type GameCard,
} from "@/lib/models/card"
import { applyCardEffect, formatRepairsSummary } from "@/lib/mechanics/cards"
import { calculateRent } from "@/lib/mechanics/rent"
import {
  calculateUnmortgageCost,
  calculateHouseSellPrice,
  canBuildHouse,
  canMortgage,
  canUnmortgage,
  canSellHouse,
} from "@/lib/mechanics/property-actions"
import { handleJailEscape, handleJailFeePayment, shouldGoToJailForDoubles } from "@/lib/mechanics/jail"
import { getNextPlayerIndex, shouldEndTurn, shouldRollAgain } from "@/lib/mechanics/turn"
import { resolveBankruptcies, getWinnerId } from "@/lib/game-status"
import { isDoubles, diceTotal } from "@/lib/mechanics/dice"
import { GAME_CONSTANTS } from "@/lib/constants"

const {
  BOARD_SIZE,
  JAIL_POSITION,
  GO_BONUS,
  INCOME_TAX,
  LUXURY_TAX,
  MAX_HOUSES,
  LOG_HISTORY_SIZE,
} = GAME_CONSTANTS

/** Dependencies injected into reducers */
export interface ReducerDependencies {
  diceRoller: DiceRoller
}

/** Helper to add a log message */
function addLog(state: GameState, message: string): GameState {
  return {
    ...state,
    gameLog: [...state.gameLog.slice(-LOG_HISTORY_SIZE), message],
  }
}

/** Helper to update a specific player */
function updatePlayer(
  state: GameState,
  playerId: number,
  updater: (player: Player) => Player
): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? updater(p) : p
    ),
  }
}

/** Helper to update the current player */
function updateCurrentPlayer(
  state: GameState,
  updater: (player: Player) => Player
): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex]
  return updatePlayer(state, currentPlayer.id, updater)
}

/** Roll dice reducer */
function rollReducer(
  state: GameState,
  deps: ReducerDependencies
): GameState {
  if (state.gameOver || state.hasRolled || state.rolling) {
    return state
  }

  const currentPlayer = state.players[state.currentPlayerIndex]
  if (currentPlayer.isBankrupt) {
    return state
  }

  // Roll the dice
  const dice = deps.diceRoller.roll()
  const total = diceTotal(dice)
  const doubles = isDoubles(dice)

  // Start with dice rolled
  let newState: GameState = {
    ...state,
    diceValues: dice,
    hasRolled: true,
    rolling: false,
  }

  // Handle jail logic
  if (currentPlayer.inJail) {
    const escapeResult = handleJailEscape(currentPlayer, dice)
    newState = addLog(newState, escapeResult.message)

    if (escapeResult.escaped) {
      // Player escaped jail, can move
      newState = updatePlayer(newState, currentPlayer.id, () => escapeResult.player)

      if (escapeResult.paidFee) {
        // Forced to pay, end turn
        return newState
      }

      // Escaped with doubles, can move normally
      // Continue to movement logic below
    } else {
      // Stay in jail, end turn
      newState = updatePlayer(newState, currentPlayer.id, () => escapeResult.player)
      return newState
    }
  }

  // Check for 3rd consecutive doubles (speeding to jail)
  const newConsecutiveDoubles = doubles ? state.consecutiveDoubles + 1 : 0

  if (shouldGoToJailForDoubles(state.consecutiveDoubles, dice)) {
    newState = addLog(newState, `${currentPlayer.name} rolled doubles for the third time!`)
    newState = addLog(newState, `${currentPlayer.name} was sent to Alcatraz for speeding!`)
    newState = updateCurrentPlayer(newState, (p) => ({
      ...p,
      position: JAIL_POSITION,
      inJail: true,
      jailTurns: 0,
    }))
    newState = { ...newState, consecutiveDoubles: 0 }
    return newState
  }

  newState = { ...newState, consecutiveDoubles: newConsecutiveDoubles }

  // Calculate new position
  const oldPosition = currentPlayer.inJail ? currentPlayer.position : currentPlayer.position
  let newPosition = oldPosition + total
  let passedGo = false

  if (newPosition >= BOARD_SIZE) {
    newPosition = newPosition - BOARD_SIZE
    passedGo = true
  }

  const landedSpace = BOARD_SPACES[newPosition]

  // Log the roll
  let logMessage = `${currentPlayer.name} rolled ${dice[0]} + ${dice[1]} = ${total}`
  if (doubles) logMessage += " (doubles!)"
  if (passedGo) logMessage += ` and passed GO (+$${GO_BONUS})`
  newState = addLog(newState, logMessage)
  newState = addLog(newState, `Landed on ${landedSpace.name}`)

  // Update player position and money
  newState = updateCurrentPlayer(newState, (p) => ({
    ...p,
    position: newPosition,
    money: passedGo ? p.money + GO_BONUS : p.money,
    inJail: false,
    jailTurns: 0,
  }))

  // Handle special spaces
  if (landedSpace.type === "go-to-jail") {
    newState = addLog(newState, `${currentPlayer.name} was sent to Alcatraz!`)
    newState = updateCurrentPlayer(newState, (p) => ({
      ...p,
      position: JAIL_POSITION,
      inJail: true,
      jailTurns: 0,
    }))
    newState = { ...newState, consecutiveDoubles: 0 }
    return newState
  }

  if (landedSpace.type === "tax") {
    const taxAmount = landedSpace.name === "Income Tax" ? INCOME_TAX : LUXURY_TAX
    newState = addLog(newState, `${currentPlayer.name} paid $${taxAmount} in taxes`)
    newState = updateCurrentPlayer(newState, (p) => ({
      ...p,
      money: p.money - taxAmount,
    }))
  }

  // Handle Chance/Community Chest
  if (landedSpace.type === "chance" || landedSpace.type === "community-chest") {
    const isChance = landedSpace.type === "chance"
    const deck = isChance ? newState.chanceDeck : newState.communityChestDeck
    const { card, newDeck } = drawCard(deck)
    newState = isChance
      ? { ...newState, chanceDeck: newDeck }
      : { ...newState, communityChestDeck: newDeck }
    newState = addLog(newState, `Drew: ${card.text}`)
    newState = { ...newState, drawnCard: card }

    const result = applyCardEffect(
      card,
      newState.players,
      newState.currentPlayerIndex,
      newState.propertyOwners,
      newState.propertyHouses,
      landedSpace.type
    )

    if (result.repairsSummary) {
      const details = formatRepairsSummary(result.repairsSummary)
      newState = addLog(newState, `${currentPlayer.name} paid $${result.repairsSummary.total} for repairs${details}`)
    }

    newState = { ...newState, players: result.updatedPlayers }
  }

  // Handle landing on owned property (rent). Ownership is keyed by stable player id.
  const isPurchasable = ["property", "railroad", "utility"].includes(landedSpace.type)
  const ownerId = newState.propertyOwners[landedSpace.id]
  const isOwnProperty = ownerId === currentPlayer.id
  const isOtherPlayerProperty = ownerId !== undefined && !isOwnProperty
  const isMortgaged = newState.mortgagedProperties[landedSpace.id] === true

  if (isPurchasable && isOtherPlayerProperty && !isMortgaged) {
    const rentAmount = calculateRent(
      landedSpace,
      newState.propertyOwners,
      newState.propertyHouses,
      newState.mortgagedProperties,
      ownerId,
      total
    )

    if (rentAmount > 0) {
      const ownerName =
        newState.players.find((p) => p.id === ownerId)?.name ?? "the owner"
      newState = addLog(newState, `${currentPlayer.name} paid $${rentAmount} rent to ${ownerName}`)

      // Transfer money
      newState = updateCurrentPlayer(newState, (p) => ({
        ...p,
        money: p.money - rentAmount,
      }))
      newState = updatePlayer(newState, ownerId, (p) => ({
        ...p,
        money: p.money + rentAmount,
      }))
      newState = { ...newState, rentPaid: rentAmount, isOwnProperty: false }
    }
  } else if (isPurchasable && isOwnProperty) {
    newState = { ...newState, isOwnProperty: true }
  }

  // Set up modal state
  const isSpecialSpace = ["chance", "community-chest", "go", "jail", "free-parking", "go-to-jail", "tax"].includes(landedSpace.type)
  const isUnowned = newState.propertyOwners[landedSpace.id] === undefined

  if (isPurchasable && (isUnowned || isOwnProperty || isOtherPlayerProperty)) {
    newState = {
      ...newState,
      selectedSpace: landedSpace,
      awaitingPropertyDecision: isUnowned,
    }
  }

  if (isSpecialSpace) {
    newState = {
      ...newState,
      specialSpace: landedSpace,
      awaitingSpecialSpace: true,
    }
  }

  return newState
}

/** Buy property reducer */
function buyPropertyReducer(
  state: GameState,
  propertyId: number
): GameState {
  const space = BOARD_SPACES[propertyId]
  if (!space || !space.price) {
    return state
  }

  const currentPlayer = state.players[state.currentPlayerIndex]
  if (currentPlayer.isBankrupt || currentPlayer.money < space.price) {
    return state
  }

  if (state.propertyOwners[propertyId] !== undefined) {
    return state
  }

  let newState = addLog(state, `${currentPlayer.name} bought ${space.name} for $${space.price}`)

  newState = updateCurrentPlayer(newState, (p) => ({
    ...p,
    money: p.money - space.price!,
    properties: [...p.properties, propertyId],
  }))

  newState = {
    ...newState,
    propertyOwners: {
      ...newState.propertyOwners,
      [propertyId]: currentPlayer.id,
    },
    selectedSpace: null,
    awaitingPropertyDecision: false,
  }

  return newState
}

/** Pass on property reducer */
function passPropertyReducer(state: GameState): GameState {
  const space = state.selectedSpace
  if (!space) return state

  const currentPlayer = state.players[state.currentPlayerIndex]
  let newState = addLog(state, `${currentPlayer.name} passed on buying ${space.name}`)

  return {
    ...newState,
    selectedSpace: null,
    awaitingPropertyDecision: false,
  }
}

/** Build house reducer */
function buildHouseReducer(
  state: GameState,
  propertyId: number
): GameState {
  const space = BOARD_SPACES[propertyId]
  if (!space || space.type !== "property" || !space.houseCost) {
    return state
  }

  const currentPlayer = state.players[state.currentPlayerIndex]
  const ownerId = state.propertyOwners[propertyId]

  const canBuild = canBuildHouse(
    currentPlayer,
    space,
    ownerId,
    state.propertyOwners,
    state.propertyHouses,
    state.mortgagedProperties
  )

  if (!canBuild.allowed) {
    return state
  }

  const currentHouseCount = state.propertyHouses[propertyId] ?? 0
  const nextHouseCount = currentHouseCount + 1
  const buildingLabel = nextHouseCount >= MAX_HOUSES ? "hotel" : "house"

  let newState = addLog(state, `${currentPlayer.name} built a ${buildingLabel} on ${space.name} for $${space.houseCost}`)

  newState = updateCurrentPlayer(newState, (p) => ({
    ...p,
    money: p.money - space.houseCost!,
  }))

  return {
    ...newState,
    propertyHouses: {
      ...newState.propertyHouses,
      [propertyId]: nextHouseCount,
    },
  }
}

/** Sell house reducer */
function sellHouseReducer(
  state: GameState,
  propertyId: number
): GameState {
  const space = BOARD_SPACES[propertyId]
  if (!space || space.type !== "property" || !space.houseCost) {
    return state
  }

  const currentPlayer = state.players[state.currentPlayerIndex]
  const ownerId = state.propertyOwners[propertyId]

  const check = canSellHouse(
    currentPlayer,
    space,
    ownerId,
    state.propertyOwners,
    state.propertyHouses
  )

  if (!check.allowed) {
    return state
  }

  const currentHouseCount = state.propertyHouses[propertyId] ?? 0
  const sellPrice = calculateHouseSellPrice(space.houseCost)
  const buildingLabel = currentHouseCount >= MAX_HOUSES ? "hotel" : "house"

  let newState = addLog(
    state,
    `${currentPlayer.name} sold a ${buildingLabel} on ${space.name} for $${sellPrice}`
  )

  newState = updateCurrentPlayer(newState, (p) => ({
    ...p,
    money: p.money + sellPrice,
  }))

  const updatedHouses = { ...newState.propertyHouses }
  const nextHouseCount = currentHouseCount - 1
  if (nextHouseCount <= 0) {
    delete updatedHouses[propertyId]
  } else {
    updatedHouses[propertyId] = nextHouseCount
  }

  return {
    ...newState,
    propertyHouses: updatedHouses,
  }
}

/** Mortgage property reducer */
function mortgageReducer(
  state: GameState,
  propertyId: number
): GameState {
  const space = BOARD_SPACES[propertyId]
  if (!space || space.mortgage === undefined) {
    return state
  }

  const currentPlayer = state.players[state.currentPlayerIndex]
  const ownerId = state.propertyOwners[propertyId]

  const canMortgageResult = canMortgage(
    currentPlayer,
    space,
    ownerId,
    state.propertyHouses,
    state.mortgagedProperties
  )

  if (!canMortgageResult.allowed) {
    return state
  }

  let newState = addLog(state, `${currentPlayer.name} mortgaged ${space.name} for $${space.mortgage}`)

  newState = updateCurrentPlayer(newState, (p) => ({
    ...p,
    money: p.money + space.mortgage!,
  }))

  return {
    ...newState,
    mortgagedProperties: {
      ...newState.mortgagedProperties,
      [propertyId]: true,
    },
  }
}

/** Unmortgage property reducer */
function unmortgageReducer(
  state: GameState,
  propertyId: number
): GameState {
  const space = BOARD_SPACES[propertyId]
  if (!space || space.mortgage === undefined) {
    return state
  }

  const currentPlayer = state.players[state.currentPlayerIndex]
  const ownerId = state.propertyOwners[propertyId]

  const canUnmortgageResult = canUnmortgage(
    currentPlayer,
    space,
    ownerId,
    state.mortgagedProperties
  )

  if (!canUnmortgageResult.allowed) {
    return state
  }

  const unmortgageCost = calculateUnmortgageCost(space.mortgage)
  let newState = addLog(state, `${currentPlayer.name} lifted the mortgage on ${space.name} for $${unmortgageCost}`)

  newState = updateCurrentPlayer(newState, (p) => ({
    ...p,
    money: p.money - unmortgageCost,
  }))

  const updatedMortgaged = { ...newState.mortgagedProperties }
  delete updatedMortgaged[propertyId]

  return {
    ...newState,
    mortgagedProperties: updatedMortgaged,
  }
}

/** Pay jail fee reducer */
function payJailFeeReducer(state: GameState): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex]
  const result = handleJailFeePayment(currentPlayer)

  if (!result.success) {
    return addLog(state, result.message)
  }

  let newState = addLog(state, result.message)
  return updateCurrentPlayer(newState, () => result.player)
}

/** Use a "Get Out of Jail Free" card reducer */
function useJailCardReducer(state: GameState): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex]
  const [sourceDeck, ...remainingCards] = currentPlayer.getOutOfJailFreeCards
  if (!currentPlayer.inJail || !sourceDeck) {
    return state
  }

  const cardPool = sourceDeck === "chance" ? CHANCE_CARDS : COMMUNITY_CHEST_CARDS
  const jailCard = cardPool.find(
    (card) => card.effect.type === "get-out-of-jail-free"
  )
  if (!jailCard) {
    return state
  }

  let newState = addLog(
    state,
    `${currentPlayer.name} used a Get Out of Jail Free card`
  )

  newState = updateCurrentPlayer(newState, (p) => ({
    ...p,
    inJail: false,
    jailTurns: 0,
    getOutOfJailFreeCards: remainingCards,
  }))

  return sourceDeck === "chance"
    ? { ...newState, chanceDeck: returnCardToDeck(newState.chanceDeck, jailCard) }
    : {
        ...newState,
        communityChestDeck: returnCardToDeck(
          newState.communityChestDeck,
          jailCard
        ),
      }
}

/** End turn reducer */
function endTurnReducer(state: GameState): GameState {
  if (state.gameOver) {
    return state
  }

  const nextPlayerIndex = getNextPlayerIndex(state.players, state.currentPlayerIndex)
  if (nextPlayerIndex === null || nextPlayerIndex === state.currentPlayerIndex) {
    return state
  }

  const nextPlayerName = state.players[nextPlayerIndex].name
  let newState = addLog(state, `${nextPlayerName}'s turn`)

  return {
    ...newState,
    currentPlayerIndex: nextPlayerIndex,
    hasRolled: false,
    consecutiveDoubles: 0,
    diceValues: state.diceValues,
    awaitingPropertyDecision: false,
    awaitingSpecialSpace: false,
    specialSpace: null,
    drawnCard: null,
    isOwnProperty: false,
    rentPaid: undefined,
  }
}

/** Start game reducer */
function startGameReducer(
  state: GameState,
  players: { name: string; tokenIndex: number }[],
  chanceDeck: GameState["chanceDeck"],
  communityChestDeck: GameState["communityChestDeck"]
): GameState {
  const newPlayers = players.map((setup, i) =>
    createPlayer(i, setup.name, setup.tokenIndex)
  )

  return {
    ...state,
    players: newPlayers,
    currentPlayerIndex: 0,
    propertyOwners: {},
    mortgagedProperties: {},
    propertyHouses: {},
    gameLog: [`Game started! ${newPlayers[0].name} goes first.`],
    gameOver: false,
    winnerId: null,
    hasRolled: false,
    rolling: false,
    consecutiveDoubles: 0,
    chanceDeck,
    communityChestDeck,
    drawnCard: null,
  }
}

/** Trade reducer */
function tradeReducer(
  state: GameState,
  trade: TradePayload
): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex]
  const partnerIndex = state.players.findIndex((p) => p.id === trade.partnerId)

  if (partnerIndex === -1 || currentPlayer.id === trade.partnerId) {
    return state
  }

  const partner = state.players[partnerIndex]
  if (currentPlayer.isBankrupt || partner.isBankrupt) {
    return state
  }

  if (trade.offerCash > currentPlayer.money || trade.requestCash > partner.money) {
    return state
  }

  // Validate property ownership
  const validOfferPropertyIds = trade.offerPropertyIds.filter(
    (id) => state.propertyOwners[id] === currentPlayer.id
  )
  const validRequestPropertyIds = trade.requestPropertyIds.filter(
    (id) => state.propertyOwners[id] === partner.id
  )

  if (
    validOfferPropertyIds.length === 0 &&
    validRequestPropertyIds.length === 0 &&
    trade.offerCash === 0 &&
    trade.requestCash === 0
  ) {
    return state
  }

  // Transfer properties
  const updatedPropertyOwners = { ...state.propertyOwners }
  validOfferPropertyIds.forEach((id) => {
    updatedPropertyOwners[id] = partner.id
  })
  validRequestPropertyIds.forEach((id) => {
    updatedPropertyOwners[id] = currentPlayer.id
  })

  // Build new property arrays
  const propertiesByPlayer: Record<number, number[]> = {}
  Object.entries(updatedPropertyOwners).forEach(([spaceId, ownerId]) => {
    if (!propertiesByPlayer[ownerId]) {
      propertiesByPlayer[ownerId] = []
    }
    propertiesByPlayer[ownerId].push(Number(spaceId))
  })

  // Update players
  const updatedPlayers = state.players.map((player) => {
    let cashDelta = 0
    if (player.id === currentPlayer.id) {
      cashDelta = -trade.offerCash + trade.requestCash
    } else if (player.id === partner.id) {
      cashDelta = -trade.requestCash + trade.offerCash
    }
    return {
      ...player,
      money: player.money + cashDelta,
      properties: propertiesByPlayer[player.id] || [],
    }
  })

  // Log the trade
  const describeItems = (propertyIds: number[], cashAmount: number) => {
    const names = propertyIds
      .map((id) => BOARD_SPACES[id]?.name)
      .filter(Boolean)
    const items: string[] = []
    if (names.length > 0) items.push(names.join(", "))
    if (cashAmount > 0) items.push(`$${cashAmount}`)
    return items.length > 0 ? items.join(" + ") : "no assets"
  }

  const logMessage = `${currentPlayer.name} traded with ${partner.name}: gave ${describeItems(
    validOfferPropertyIds,
    trade.offerCash
  )} for ${describeItems(validRequestPropertyIds, trade.requestCash)}.`

  let newState = addLog(state, logMessage)

  return {
    ...newState,
    players: updatedPlayers,
    propertyOwners: updatedPropertyOwners,
  }
}

/** Main reducer - dispatches to sub-reducers based on action type */
export function gameReducer(
  state: GameState,
  action: GameAction,
  deps: ReducerDependencies
): GameState {
  // Check for bankruptcies before processing action
  let newState = state

  switch (action.type) {
    case "START_GAME":
      return startGameReducer(
        state,
        action.players,
        action.chanceDeck,
        action.communityChestDeck
      )

    case "RESET_GAME":
      return {
        ...state,
        players: [],
        currentPlayerIndex: 0,
        propertyOwners: {},
        mortgagedProperties: {},
        propertyHouses: {},
        gameLog: [],
        gameOver: false,
        winnerId: null,
        chanceDeck: action.chanceDeck,
        communityChestDeck: action.communityChestDeck,
        drawnCard: null,
      }

    case "ROLL_DICE":
      newState = rollReducer(state, deps)
      break

    case "END_TURN":
      newState = endTurnReducer(state)
      break

    case "BUY_PROPERTY":
      newState = buyPropertyReducer(state, action.propertyId)
      break

    case "PASS_PROPERTY":
      newState = passPropertyReducer(state)
      break

    case "BUILD_HOUSE":
      newState = buildHouseReducer(state, action.propertyId)
      break

    case "SELL_HOUSE":
      newState = sellHouseReducer(state, action.propertyId)
      break

    case "MORTGAGE":
      newState = mortgageReducer(state, action.propertyId)
      break

    case "UNMORTGAGE":
      newState = unmortgageReducer(state, action.propertyId)
      break

    case "PAY_JAIL_FEE":
      newState = payJailFeeReducer(state)
      break

    case "USE_JAIL_CARD":
      newState = useJailCardReducer(state)
      break

    case "PROPOSE_TRADE":
      newState = tradeReducer(state, action.trade)
      break

    case "SELECT_SPACE":
      return { ...state, selectedSpace: action.space }

    case "CLOSE_PROPERTY_MODAL":
      return {
        ...state,
        selectedSpace: null,
        awaitingPropertyDecision: false,
        isOwnProperty: false,
        rentPaid: undefined,
      }

    case "CLOSE_SPECIAL_SPACE_MODAL":
      return {
        ...state,
        specialSpace: null,
        awaitingSpecialSpace: false,
      }

    case "VIEW_PLAYER_PROPERTIES":
      const viewPlayer = state.players.find((p) => p.id === action.playerId)
      return {
        ...state,
        viewingPropertiesForPlayer: viewPlayer ?? null,
      }

    case "CLOSE_PLAYER_PROPERTIES":
      return {
        ...state,
        viewingPropertiesForPlayer: null,
      }

    case "ADD_LOG":
      return addLog(state, action.message)

    default:
      return state
  }

  // Check for bankruptcies after state-changing actions
  const resolution = resolveBankruptcies(
    newState.players,
    newState.propertyOwners,
    newState.mortgagedProperties,
    newState.propertyHouses
  )

  if (resolution.hasChanges) {
    newState = {
      ...newState,
      players: resolution.players,
      propertyOwners: resolution.propertyOwners,
      mortgagedProperties: resolution.mortgagedProperties,
      propertyHouses: resolution.propertyHouses,
    }

    // Log bankruptcies
    resolution.newlyBankruptIds.forEach((playerId) => {
      const playerName = state.players.find((p) => p.id === playerId)?.name
      if (playerName) {
        newState = addLog(newState, `${playerName} went bankrupt and is out of the game.`)
      }
    })
  }

  // Check for winner
  const winnerId = getWinnerId(newState.players)
  if (winnerId !== null && !newState.gameOver) {
    const winnerName = newState.players.find((p) => p.id === winnerId)?.name
    if (winnerName) {
      newState = addLog(newState, `${winnerName} wins the game!`)
    }
    newState = {
      ...newState,
      gameOver: true,
      winnerId,
    }
  }

  return newState
}
