import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveSubmission, countSubmissions, resetStore } from '@/lib/mock-store'

// Minimal localStorage polyfill for the node test environment.
beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => void store.clear(),
  })
  resetStore()
})

describe('mock-store submissions', () => {
  it('starts at zero submissions', () => {
    expect(countSubmissions('camp-1')).toBe(0)
  })

  it('counts saved submissions per campaign', () => {
    saveSubmission('camp-1', { departmentId: 'd1', answers: [] })
    saveSubmission('camp-1', { departmentId: 'd2', answers: [] })
    saveSubmission('camp-2', { departmentId: 'd1', answers: [] })
    expect(countSubmissions('camp-1')).toBe(2)
    expect(countSubmissions('camp-2')).toBe(1)
  })
})
