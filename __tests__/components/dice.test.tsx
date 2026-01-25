import { render, screen } from '@testing-library/react'
import { Dice } from '@/components/dice'

describe('Dice component', () => {
  it('should render two 3D dice', () => {
    render(<Dice values={[3, 4]} />)
    // Check that there are two dice containers rendered (style element may not be counted)
    const container = document.querySelector('.flex.gap-4')
    expect(container).toBeInTheDocument()
    // Each die has perspective style and h-14 w-14 container
    const diceContainers = container?.querySelectorAll(':scope > div[style*="perspective"]')
    expect(diceContainers).toHaveLength(2)
  })

  it('should render all six faces on each die', () => {
    render(<Dice values={[1, 1]} />)
    // Each 3D die has 6 faces, so 2 dice = 12 faces
    const faces = document.querySelectorAll('.rounded-lg.bg-white')
    expect(faces).toHaveLength(12)
  })

  it('should render dots on all faces', () => {
    render(<Dice values={[1, 1]} />)
    // Each die has all 6 faces visible (1+2+3+4+5+6 = 21 dots per die)
    const dots = document.querySelectorAll('.rounded-full.bg-stone-800')
    expect(dots).toHaveLength(42) // 21 dots per die * 2 dice
  })

  it('should render dice faces with proper 3D container', () => {
    render(<Dice values={[3, 4]} />)
    // Check for transform-style: preserve-3d containers
    const containers = document.querySelectorAll('.transform-gpu')
    expect(containers.length).toBeGreaterThan(0)
  })

  it('should handle all die values (1-6)', () => {
    // Test that component renders without error for all values
    const testValues: [number, number][] = [
      [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]
    ]

    testValues.forEach(([v1, v2]) => {
      const { unmount } = render(<Dice values={[v1, v2]} />)
      // Each 3D die has all faces, so dots are always present
      const dots = document.querySelectorAll('.rounded-full.bg-stone-800')
      expect(dots.length).toBeGreaterThan(0)
      unmount()
    })
  })

  it('should render dice with proper face styling', () => {
    render(<Dice values={[4, 3]} />)
    const diceElements = document.querySelectorAll('.h-14.w-14.rounded-lg.bg-white')
    expect(diceElements).toHaveLength(12) // 6 faces per die
  })

  it('should have perspective on dice containers', () => {
    render(<Dice values={[1, 2]} />)
    // The outer die containers should have perspective style
    const container = document.querySelector('.flex.gap-4')
    const dieContainers = container?.querySelectorAll(':scope > div:not(style)')
    expect(dieContainers?.length).toBe(2)
  })

  it('should render when rolling is true', () => {
    render(<Dice values={[3, 4]} rolling={true} />)
    // Should render without errors when rolling
    const container = document.querySelector('.flex.gap-4')
    expect(container).toBeInTheDocument()
  })

  it('should render when rolling is false', () => {
    render(<Dice values={[3, 4]} rolling={false} />)
    // Should render without errors when not rolling
    const container = document.querySelector('.flex.gap-4')
    expect(container).toBeInTheDocument()
  })
})
