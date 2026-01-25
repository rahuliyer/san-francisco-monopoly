import { render, screen } from '@testing-library/react'
import { Dice } from '@/components/dice'

describe('Dice component', () => {
  it('should render two dice', () => {
    render(<Dice values={[3, 4]} />)
    // Check that there are elements rendered (dice don't have explicit roles)
    const container = document.querySelector('.flex.gap-3')
    expect(container).toBeInTheDocument()
    expect(container?.children).toHaveLength(2)
  })

  it('should render correct number of dots for value 1', () => {
    render(<Dice values={[1, 1]} />)
    // Each die with value 1 should have 1 dot (center)
    const dots = document.querySelectorAll('.rounded-full.bg-stone-800')
    expect(dots).toHaveLength(2) // 1 dot per die
  })

  it('should render correct number of dots for value 6', () => {
    render(<Dice values={[6, 6]} />)
    // Each die with value 6 should have 6 dots
    const dots = document.querySelectorAll('.rounded-full.bg-stone-800')
    expect(dots).toHaveLength(12) // 6 dots per die
  })

  it('should render mixed values correctly', () => {
    render(<Dice values={[2, 5]} />)
    // Die 1: 2 dots, Die 2: 5 dots = 7 total
    const dots = document.querySelectorAll('.rounded-full.bg-stone-800')
    expect(dots).toHaveLength(7)
  })

  it('should apply rolling animation when rolling is true', () => {
    render(<Dice values={[3, 4]} rolling={true} />)
    const animatedDice = document.querySelectorAll('.dice-rolling')
    expect(animatedDice).toHaveLength(2)
  })

  it('should not apply rolling animation when rolling is false', () => {
    render(<Dice values={[3, 4]} rolling={false} />)
    const animatedDice = document.querySelectorAll('.dice-rolling')
    expect(animatedDice).toHaveLength(0)
  })

  it('should handle edge case values', () => {
    // Test all possible die values
    const testValues: [number, number][] = [
      [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]
    ]
    const expectedDots = [2, 4, 6, 8, 10, 12] // dots per pair

    testValues.forEach(([v1, v2], index) => {
      const { unmount } = render(<Dice values={[v1, v2]} />)
      const dots = document.querySelectorAll('.rounded-full.bg-stone-800')
      expect(dots).toHaveLength(expectedDots[index])
      unmount()
    })
  })

  it('should render dice with proper styling', () => {
    render(<Dice values={[4, 3]} />)
    const diceElements = document.querySelectorAll('.h-14.w-14.rounded-lg.bg-white.shadow-lg')
    expect(diceElements).toHaveLength(2)
  })
})
