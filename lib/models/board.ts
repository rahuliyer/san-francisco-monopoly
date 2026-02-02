// Board model - immutable board data and position helpers
// This module provides board-related types and position calculation functions.

import type { Space, SpaceType, ColorGroup } from "./types"
import { GAME_CONSTANTS } from "@/lib/constants"

const { BOARD_SIZE, GO_POSITION, JAIL_POSITION } = GAME_CONSTANTS

/** The 40-space Monopoly board for SF Monopoly */
export const BOARD_SPACES: readonly Space[] = [
  // Bottom row (right to left)
  { id: 0, name: "Fisherman's Wharf", type: "go", colorGroup: null, image: "/images/go-fishermans-wharf.jpg" },
  { id: 1, name: "Tenderloin", type: "property", colorGroup: "brown", price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgage: 30, image: "/images/tenderloin.jpg" },
  { id: 2, name: "Community Chest", type: "community-chest", colorGroup: null, image: "/images/community-chest.jpg" },
  { id: 3, name: "Bayview", type: "property", colorGroup: "brown", price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgage: 30, image: "/images/bayview.jpg" },
  { id: 4, name: "Income Tax", type: "tax", colorGroup: null },
  { id: 5, name: "Caltrain", type: "railroad", colorGroup: "railroad", price: 200, rent: [25, 50, 100, 200], mortgage: 100, image: "/images/caltrain.jpg" },
  { id: 6, name: "Sunset District", type: "property", colorGroup: "light-blue", price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgage: 50, image: "/images/sunset-district.jpg" },
  { id: 7, name: "Chance", type: "chance", colorGroup: null, image: "/images/chance.jpg" },
  { id: 8, name: "Richmond District", type: "property", colorGroup: "light-blue", price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgage: 50, image: "/images/richmond-district.jpg" },
  { id: 9, name: "Outer Mission", type: "property", colorGroup: "light-blue", price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgage: 60, image: "/images/outer-mission.jpg" },

  // Left column (bottom to top)
  { id: 10, name: "Alcatraz", type: "jail", colorGroup: null, image: "/images/jail-alcatraz.jpg" },
  { id: 11, name: "Dogpatch", type: "property", colorGroup: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgage: 70, image: "/images/dogpatch.jpg" },
  { id: 12, name: "PG&E", type: "utility", colorGroup: "utility", price: 150, mortgage: 75, image: "/images/pge.jpg" },
  { id: 13, name: "Potrero Hill", type: "property", colorGroup: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgage: 70, image: "/images/potrero-hill.jpg" },
  { id: 14, name: "Bernal Heights", type: "property", colorGroup: "pink", price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgage: 80, image: "/images/bernal-heights.jpg" },
  { id: 15, name: "BART", type: "railroad", colorGroup: "railroad", price: 200, rent: [25, 50, 100, 200], mortgage: 100, image: "/images/bart.jpg" },
  { id: 16, name: "Hayes Valley", type: "property", colorGroup: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgage: 90, image: "/images/hayes-valley.jpg" },
  { id: 17, name: "Community Chest", type: "community-chest", colorGroup: null, image: "/images/community-chest.jpg" },
  { id: 18, name: "Cole Valley", type: "property", colorGroup: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgage: 90, image: "/images/cole-valley.jpg" },
  { id: 19, name: "Noe Valley", type: "property", colorGroup: "orange", price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgage: 100, image: "/images/noe-valley.jpg" },

  // Top row (left to right)
  { id: 20, name: "Golden Gate Park", type: "free-parking", colorGroup: null, image: "/images/free-parking-ggp.jpg" },
  { id: 21, name: "Mission District", type: "property", colorGroup: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110, image: "/images/mission-district.jpg" },
  { id: 22, name: "Chance", type: "chance", colorGroup: null, image: "/images/chance.jpg" },
  { id: 23, name: "Castro", type: "property", colorGroup: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110, image: "/images/castro.jpg" },
  { id: 24, name: "SoMa", type: "property", colorGroup: "red", price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgage: 120, image: "/images/soma.jpg" },
  { id: 25, name: "Muni", type: "railroad", colorGroup: "railroad", price: 200, rent: [25, 50, 100, 200], mortgage: 100, image: "/images/muni.jpg" },
  { id: 26, name: "Marina", type: "property", colorGroup: "yellow", price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgage: 130, image: "/images/marina.jpg" },
  { id: 27, name: "Cow Hollow", type: "property", colorGroup: "yellow", price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgage: 130, image: "/images/cow-hollow.jpg" },
  { id: 28, name: "SF Water", type: "utility", colorGroup: "utility", price: 150, mortgage: 75, image: "/images/sf-water.jpg" },
  { id: 29, name: "Pacific Heights", type: "property", colorGroup: "yellow", price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgage: 140, image: "/images/pacific-heights.jpg" },

  // Right column (top to bottom)
  { id: 30, name: "Go To Alcatraz", type: "go-to-jail", colorGroup: null, image: "/images/go-to-jail.jpg" },
  { id: 31, name: "Russian Hill", type: "property", colorGroup: "green", price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgage: 150, image: "/images/russian-hill.jpg" },
  { id: 32, name: "Nob Hill", type: "property", colorGroup: "green", price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgage: 150, image: "/images/nob-hill.jpg" },
  { id: 33, name: "Community Chest", type: "community-chest", colorGroup: null, image: "/images/community-chest.jpg" },
  { id: 34, name: "Telegraph Hill", type: "property", colorGroup: "green", price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgage: 160, image: "/images/telegraph-hill.jpg" },
  { id: 35, name: "Cable Car", type: "railroad", colorGroup: "railroad", price: 200, rent: [25, 50, 100, 200], mortgage: 100, image: "/images/cable-car.jpg" },
  { id: 36, name: "Chance", type: "chance", colorGroup: null, image: "/images/chance.jpg" },
  { id: 37, name: "Presidio Heights", type: "property", colorGroup: "dark-blue", price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgage: 175, image: "/images/presidio-heights.jpg" },
  { id: 38, name: "Luxury Tax", type: "tax", colorGroup: null },
  { id: 39, name: "Sea Cliff", type: "property", colorGroup: "dark-blue", price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgage: 200, image: "/images/sea-cliff.jpg" },
] as const

/** Result of a position movement calculation */
export interface MovementResult {
  readonly newPosition: number
  readonly passedGo: boolean
}

/**
 * Calculates the new position after moving a number of spaces forward.
 * Handles wrapping around the board and detects passing GO.
 */
export function calculateNewPosition(
  currentPosition: number,
  spaces: number
): MovementResult {
  const newPosition = (currentPosition + spaces) % BOARD_SIZE
  const passedGo = currentPosition + spaces >= BOARD_SIZE && spaces > 0
  return { newPosition, passedGo }
}

/**
 * Calculates movement to a specific position.
 * Detects if GO was passed (only if moving forward).
 */
export function moveToPosition(
  currentPosition: number,
  targetPosition: number
): MovementResult {
  // Moving to a lower position means we passed GO
  const passedGo = targetPosition < currentPosition
  return { newPosition: targetPosition, passedGo }
}

/**
 * Gets the space at a given position.
 */
export function getSpaceAt(position: number): Space {
  return BOARD_SPACES[position % BOARD_SIZE]
}

/**
 * Gets all spaces of a given type.
 */
export function getSpacesByType(type: SpaceType): readonly Space[] {
  return BOARD_SPACES.filter((space) => space.type === type)
}

/**
 * Gets all spaces in a color group.
 */
export function getSpacesByColorGroup(colorGroup: ColorGroup): readonly Space[] {
  return BOARD_SPACES.filter((space) => space.colorGroup === colorGroup)
}

/**
 * Checks if a space type is purchasable (property, railroad, or utility).
 */
export function isPurchasableType(type: SpaceType): boolean {
  return type === "property" || type === "railroad" || type === "utility"
}

/**
 * Checks if a space type is special (non-purchasable action space).
 */
export function isSpecialSpaceType(type: SpaceType): boolean {
  return (
    type === "chance" ||
    type === "community-chest" ||
    type === "go" ||
    type === "jail" ||
    type === "free-parking" ||
    type === "go-to-jail" ||
    type === "tax"
  )
}

/**
 * Gets the jail position.
 */
export function getJailPosition(): number {
  return JAIL_POSITION
}

/**
 * Gets the GO position.
 */
export function getGoPosition(): number {
  return GO_POSITION
}

/**
 * Gets all railroad spaces.
 */
export function getRailroads(): readonly Space[] {
  return BOARD_SPACES.filter((space) => space.type === "railroad")
}

/**
 * Gets all utility spaces.
 */
export function getUtilities(): readonly Space[] {
  return BOARD_SPACES.filter((space) => space.type === "utility")
}

/** Color mapping for display */
export const COLOR_MAP: Record<string, string> = {
  brown: "#8B4513",
  "light-blue": "#87CEEB",
  pink: "#FF69B4",
  orange: "#FFA500",
  red: "#FF0000",
  yellow: "#FFD700",
  green: "#228B22",
  "dark-blue": "#00008B",
  railroad: "#4A4A4A",
  utility: "#D3D3D3",
}
