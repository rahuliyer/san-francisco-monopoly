import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const result = cn('base', isActive && 'active')
    expect(result).toBe('base active')
  })

  it('should filter out falsy values', () => {
    const result = cn('base', false, null, undefined, 'valid')
    expect(result).toBe('base valid')
  })

  it('should handle object syntax', () => {
    const result = cn({
      base: true,
      active: true,
      disabled: false,
    })
    expect(result).toBe('base active')
  })

  it('should handle arrays', () => {
    const result = cn(['foo', 'bar'])
    expect(result).toBe('foo bar')
  })

  it('should merge tailwind classes correctly', () => {
    // twMerge should handle conflicting utility classes
    const result = cn('px-4', 'px-6')
    expect(result).toBe('px-6')
  })

  it('should merge conflicting tailwind colors', () => {
    const result = cn('bg-red-500', 'bg-blue-500')
    expect(result).toBe('bg-blue-500')
  })

  it('should handle complex tailwind merging', () => {
    const result = cn(
      'text-sm text-gray-500',
      'text-lg',
      'hover:text-black'
    )
    expect(result).toBe('text-gray-500 text-lg hover:text-black')
  })

  it('should handle empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle mixed inputs', () => {
    const result = cn(
      'base-class',
      { 'conditional-class': true },
      ['array-class'],
      undefined,
      'final-class'
    )
    expect(result).toBe('base-class conditional-class array-class final-class')
  })

  it('should preserve non-conflicting classes', () => {
    const result = cn('flex', 'items-center', 'gap-4', 'p-2')
    expect(result).toBe('flex items-center gap-4 p-2')
  })
})
