import { render, screen } from '@testing-library/react'
import { Dice } from '@/components/dice'

describe('Dice component', () => {
  it('should render two 3D dice', () => {
    render(<Dice values={[3, 4]} />)
    // Check that there are two dice containers rendered with perspective
    const container = document.querySelector('.flex.gap-4')
    expect(container).toBeInTheDocument()
    const diceContainers = container?.querySelectorAll(':scope > div[style*="perspective"]')
    expect(diceContainers).toHaveLength(2)
  })

  it('should render all six faces on each die', () => {
    render(<Dice values={[1, 1]} />)
    // Each 3D die has 6 faces with rounded-lg class, plus 2 shadow divs = 14 total
    const faces = document.querySelectorAll('.rounded-lg')
    expect(faces).toHaveLength(14) // 6 faces per die * 2 dice + 2 shadows
  })

  it('should render dots on all faces', () => {
    render(<Dice values={[1, 1]} />)
    // Each die has all 6 faces visible (1+2+3+4+5+6 = 21 dots per die)
    const dots = document.querySelectorAll('.rounded-full.bg-stone-800')
    expect(dots).toHaveLength(42) // 21 dots per die * 2 dice
  })

  it('should render dice faces with proper 3D container', () => {
    render(<Dice values={[3, 4]} />)
    // Check for transform-style: preserve-3d in inline styles
    const containers = document.querySelectorAll('[style*="preserve-3d"]')
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
    // Each face has border-2 and border-stone-300
    const diceElements = document.querySelectorAll('.border-2.border-stone-300')
    expect(diceElements).toHaveLength(12) // 6 faces per die * 2 dice
  })

  it('should have perspective on dice containers', () => {
    render(<Dice values={[1, 2]} />)
    // The outer die containers should have perspective style
    const diceContainers = document.querySelectorAll('[style*="perspective"]')
    expect(diceContainers?.length).toBe(2)
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
