import { rollDice } from '@/lib/game-data'

describe('Doubles Rule', () => {
  beforeEach(() => {
    // Reset test dice rolls before each test
    (globalThis as { __TEST_DICE_ROLLS__?: [number, number][] }).__TEST_DICE_ROLLS__ = undefined
  })

  afterEach(() => {
    (globalThis as { __TEST_DICE_ROLLS__?: [number, number][] }).__TEST_DICE_ROLLS__ = undefined
  })

  it('should detect doubles when both dice show the same value', () => {
    (globalThis as { __TEST_DICE_ROLLS__?: [number, number][] }).__TEST_DICE_ROLLS__ = [[3, 3]]
    const dice = rollDice()
    expect(dice[0]).toBe(dice[1])
    expect(dice[0]).toBe(3)
  })

  it('should detect non-doubles when dice show different values', () => {
    (globalThis as { __TEST_DICE_ROLLS__?: [number, number][] }).__TEST_DICE_ROLLS__ = [[2, 5]]
    const dice = rollDice()
    expect(dice[0]).not.toBe(dice[1])
  })

  it('should correctly count consecutive doubles', () => {
    // Test tracking logic - 3 consecutive doubles should be detected
    (globalThis as { __TEST_DICE_ROLLS__?: [number, number][] }).__TEST_DICE_ROLLS__ = [
      [4, 4], // doubles 1
      [2, 2], // doubles 2
      [6, 6], // doubles 3 - should trigger jail
    ]

    let doublesCount = 0
    for (let i = 0; i < 3; i++) {
      const dice = rollDice()
      const isDoubles = dice[0] === dice[1]
      if (isDoubles) {
        doublesCount++
      } else {
        doublesCount = 0
      }
    }

    expect(doublesCount).toBe(3)
  })

  it('should reset doubles count on non-doubles roll', () => {
    (globalThis as { __TEST_DICE_ROLLS__?: [number, number][] }).__TEST_DICE_ROLLS__ = [
      [4, 4], // doubles 1
      [2, 5], // not doubles - reset
    ]

    let doublesCount = 0
    for (let i = 0; i < 2; i++) {
      const dice = rollDice()
      const isDoubles = dice[0] === dice[1]
      if (isDoubles) {
        doublesCount++
      } else {
        doublesCount = 0
      }
    }

    expect(doublesCount).toBe(0)
  })
})
