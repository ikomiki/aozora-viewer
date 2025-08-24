import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScrollSpy } from '../useScrollSpy'
import type { Heading } from '../../../types'

describe('useScrollSpy', () => {
  const mockHeadings: Heading[] = [
    {
      type: 'heading',
      level: 'large',
      text: '第一章 始まり',
      id: 'chapter-1',
      range: {
        start: { line: 0, column: 0, index: 0 },
        end: { line: 0, column: 10, index: 10 }
      }
    },
    {
      type: 'heading',
      level: 'medium',
      text: '一 出会い',
      id: 'section-1',
      range: {
        start: { line: 1, column: 0, index: 11 },
        end: { line: 1, column: 8, index: 19 }
      }
    },
    {
      type: 'heading',
      level: 'small',
      text: 'その後',
      id: 'subsection-1',
      range: {
        start: { line: 2, column: 0, index: 20 },
        end: { line: 2, column: 3, index: 23 }
      }
    }
  ]

  // Mock IntersectionObserver
  const mockIntersectionObserver = vi.fn()
  const mockObserve = vi.fn()
  const mockUnobserve = vi.fn()
  const mockDisconnect = vi.fn()

  beforeEach(() => {
    mockIntersectionObserver.mockImplementation((callback) => ({
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: mockDisconnect,
      callback
    }))
    
    global.IntersectionObserver = mockIntersectionObserver
    
    // Mock DOM elements
    global.document.getElementById = vi.fn((id) => ({
      id,
      getBoundingClientRect: () => ({
        top: 0,
        bottom: 100,
        left: 0,
        right: 100,
        width: 100,
        height: 100
      })
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基本機能', () => {
    it('should return null initially when no headings are active', () => {
      const { result } = renderHook(() => useScrollSpy({ headings: mockHeadings }))
      
      expect(result.current.activeHeadingId).toBeNull()
    })

    it('should observe all heading elements', () => {
      renderHook(() => useScrollSpy({ headings: mockHeadings }))
      
      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          rootMargin: '-20% 0px -80% 0px',
          threshold: 0.1
        })
      )
      
      expect(mockObserve).toHaveBeenCalledTimes(mockHeadings.length)
    })

    it('should handle custom rootMargin and threshold', () => {
      const options = {
        headings: mockHeadings,
        rootMargin: '-10% 0px -90% 0px',
        threshold: 0.5
      }
      
      renderHook(() => useScrollSpy(options))
      
      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          rootMargin: '-10% 0px -90% 0px',
          threshold: 0.5
        })
      )
    })
  })

  describe('交差検出', () => {
    it('should update active heading when intersection changes', () => {
      const { result } = renderHook(() => useScrollSpy({ headings: mockHeadings }))
      
      // Get the callback function passed to IntersectionObserver
      const intersectionCallback = mockIntersectionObserver.mock.calls[0][0]
      
      // Simulate intersection entry
      const mockEntry = {
        target: { id: 'section-1' },
        isIntersecting: true,
        intersectionRatio: 0.5,
        boundingClientRect: { top: 100, bottom: 200 }
      }
      
      act(() => {
        intersectionCallback([mockEntry])
      })
      
      expect(result.current.activeHeadingId).toBe('section-1')
    })

    it('should handle multiple intersecting headings', () => {
      const { result } = renderHook(() => useScrollSpy({ headings: mockHeadings }))
      
      const intersectionCallback = mockIntersectionObserver.mock.calls[0][0]
      
      // Simulate multiple headings intersecting
      const mockEntries = [
        {
          target: { id: 'chapter-1' },
          isIntersecting: true,
          intersectionRatio: 0.3,
          boundingClientRect: { top: 50, bottom: 150 }
        },
        {
          target: { id: 'section-1' },
          isIntersecting: true,
          intersectionRatio: 0.8,
          boundingClientRect: { top: 100, bottom: 200 }
        }
      ]
      
      act(() => {
        intersectionCallback(mockEntries)
      })
      
      // Should select the one with highest intersection ratio
      expect(result.current.activeHeadingId).toBe('section-1')
    })

    it('should handle heading leaving viewport', () => {
      const { result } = renderHook(() => useScrollSpy({ headings: mockHeadings }))
      
      const intersectionCallback = mockIntersectionObserver.mock.calls[0][0]
      
      // First, make a heading active
      act(() => {
        intersectionCallback([{
          target: { id: 'chapter-1' },
          isIntersecting: true,
          intersectionRatio: 0.5,
          boundingClientRect: { top: 100, bottom: 200 }
        }])
      })
      
      expect(result.current.activeHeadingId).toBe('chapter-1')
      
      // Then make it leave viewport
      act(() => {
        intersectionCallback([{
          target: { id: 'chapter-1' },
          isIntersecting: false,
          intersectionRatio: 0,
          boundingClientRect: { top: -100, bottom: 0 }
        }])
      })
      
      expect(result.current.activeHeadingId).toBeNull()
    })
  })

  describe('エラーハンドリング', () => {
    it('should handle missing DOM elements gracefully', () => {
      global.document.getElementById = vi.fn(() => null)
      
      const { result } = renderHook(() => useScrollSpy({ headings: mockHeadings }))
      
      expect(result.current.activeHeadingId).toBeNull()
      expect(mockObserve).not.toHaveBeenCalled()
    })

    it('should handle empty headings array', () => {
      const { result } = renderHook(() => useScrollSpy({ headings: [] }))
      
      expect(result.current.activeHeadingId).toBeNull()
      expect(mockObserve).not.toHaveBeenCalled()
    })

    it('should clean up observer on unmount', () => {
      const { unmount } = renderHook(() => useScrollSpy({ headings: mockHeadings }))
      
      unmount()
      
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  describe('パフォーマンス', () => {
    it('should handle large number of headings efficiently', () => {
      const largeHeadingList = Array.from({ length: 100 }, (_, i) => ({
        type: 'heading' as const,
        level: 'medium' as const,
        text: `見出し ${i + 1}`,
        id: `heading-${i + 1}`,
        range: {
          start: { line: i, column: 0, index: i * 10 },
          end: { line: i, column: 8, index: i * 10 + 8 }
        }
      }))
      
      const startTime = performance.now()
      const { result } = renderHook(() => useScrollSpy({ headings: largeHeadingList }))
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(50) // Should initialize quickly
      expect(result.current.activeHeadingId).toBeNull()
      expect(mockObserve).toHaveBeenCalledTimes(100)
    })

    it('should debounce rapid intersection changes', async () => {
      const { result } = renderHook(() => useScrollSpy({ headings: mockHeadings }))
      
      const intersectionCallback = mockIntersectionObserver.mock.calls[0][0]
      
      // Simulate rapid changes
      const rapidEntries = [
        { target: { id: 'chapter-1' }, isIntersecting: true, intersectionRatio: 0.5, boundingClientRect: { top: 100 } },
        { target: { id: 'section-1' }, isIntersecting: true, intersectionRatio: 0.7, boundingClientRect: { top: 120 } },
        { target: { id: 'subsection-1' }, isIntersecting: true, intersectionRatio: 0.9, boundingClientRect: { top: 140 } }
      ]
      
      act(() => {
        rapidEntries.forEach(entry => intersectionCallback([entry]))
      })
      
      // Should stabilize on the highest ratio
      expect(result.current.activeHeadingId).toBe('subsection-1')
    })
  })
})