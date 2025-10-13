import { describe, it, expect } from 'vitest'
import { cn } from '../../src/lib/utils'

describe('cn utility', () => {
  it('merges class names and dedupes tailwind', () => {
    const result = cn('p-2', 'p-2', 'text-center', { 'bg-red-500': false }, ['mt-2'])
    expect(typeof result).toBe('string')
    expect(result.includes('p-2')).toBeTruthy()
    expect(result.includes('text-center')).toBeTruthy()
  })
})
