// Game constants centralized for maintainability

export const GAME_CONSTANTS = {
  // Board
  BOARD_SIZE: 40,
  JAIL_POSITION: 10,
  GO_POSITION: 0,

  // Money
  STARTING_MONEY: 1500,
  GO_BONUS: 200,
  INCOME_TAX: 200,
  LUXURY_TAX: 100,
  JAIL_FEE: 50,
  MORTGAGE_INTEREST_RATE: 0.1,

  // Housing
  MAX_HOUSES: 5,

  // Jail
  MAX_JAIL_TURNS: 3,

  // UI/Animation
  DICE_ANIMATION_DURATION: 700,
  CARD_SHOW_DELAY: 400,
  LOG_HISTORY_SIZE: 9,
} as const

export type GameConstants = typeof GAME_CONSTANTS
