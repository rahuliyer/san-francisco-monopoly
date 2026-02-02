// Dice mechanics - dice rolling and related helper functions
// This module provides injectable dice rolling for production and testing.

/** A pair of dice values */
export type DiceValues = [number, number]

/** Interface for dice rolling implementations */
export interface DiceRoller {
  roll(): DiceValues
}

/**
 * Random dice roller - used in production.
 * Generates random dice values between 1-6 for each die.
 */
export class RandomDiceRoller implements DiceRoller {
  roll(): DiceValues {
    return [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ]
  }
}

/**
 * Queued dice roller - used in tests.
 * Consumes dice values from a predefined queue.
 * When the queue is empty, falls back to random rolls.
 */
export class QueuedDiceRoller implements DiceRoller {
  private queue: DiceValues[]
  private fallback: DiceRoller

  constructor(queue: DiceValues[] = [], fallback: DiceRoller = new RandomDiceRoller()) {
    this.queue = [...queue]
    this.fallback = fallback
  }

  roll(): DiceValues {
    const next = this.queue.shift()
    if (next) {
      // Clamp values to valid die range
      return [
        Math.min(Math.max(next[0], 1), 6),
        Math.min(Math.max(next[1], 1), 6),
      ]
    }
    return this.fallback.roll()
  }

  /**
   * Adds more dice values to the queue.
   */
  enqueue(...values: DiceValues[]): void {
    this.queue.push(...values)
  }

  /**
   * Returns the number of queued rolls remaining.
   */
  remaining(): number {
    return this.queue.length
  }

  /**
   * Clears the queue.
   */
  clear(): void {
    this.queue = []
  }
}

/**
 * Fixed dice roller - used in tests.
 * Always returns the same dice values.
 */
export class FixedDiceRoller implements DiceRoller {
  private value: DiceValues

  constructor(value: DiceValues = [1, 1]) {
    this.value = [
      Math.min(Math.max(value[0], 1), 6),
      Math.min(Math.max(value[1], 1), 6),
    ]
  }

  roll(): DiceValues {
    return [...this.value] as DiceValues
  }

  /**
   * Changes the fixed value.
   */
  setValue(value: DiceValues): void {
    this.value = [
      Math.min(Math.max(value[0], 1), 6),
      Math.min(Math.max(value[1], 1), 6),
    ]
  }
}

/**
 * Creates a dice roller from the legacy global test injection.
 * Used for backward compatibility with existing e2e tests.
 */
export function createLegacyCompatibleRoller(): DiceRoller {
  return {
    roll(): DiceValues {
      const override = (globalThis as { __TEST_DICE_ROLLS__?: DiceValues[] })
        .__TEST_DICE_ROLLS__
      if (Array.isArray(override) && override.length > 0) {
        const [first, second] = override.shift() ?? []
        const safeFirst = typeof first === "number" ? Math.min(Math.max(first, 1), 6) : 1
        const safeSecond = typeof second === "number" ? Math.min(Math.max(second, 1), 6) : 1
        return [safeFirst, safeSecond]
      }
      return [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]
    },
  }
}

// Helper functions

/**
 * Checks if a dice roll is doubles.
 */
export function isDoubles(dice: DiceValues): boolean {
  return dice[0] === dice[1]
}

/**
 * Returns the total of a dice roll.
 */
export function diceTotal(dice: DiceValues): number {
  return dice[0] + dice[1]
}

/**
 * Validates that dice values are in the valid range (1-6).
 */
export function isValidDice(dice: DiceValues): boolean {
  return (
    dice[0] >= 1 &&
    dice[0] <= 6 &&
    dice[1] >= 1 &&
    dice[1] <= 6
  )
}

/**
 * Creates random initial dice for display purposes (before first roll).
 */
export function getRandomInitialDice(): DiceValues {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ]
}

// Legacy function for backward compatibility
export function rollDice(): DiceValues {
  return createLegacyCompatibleRoller().roll()
}
