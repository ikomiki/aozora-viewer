import { useState, useEffect, useRef, useCallback } from 'react'
import type { UseScrollSpyOptions, UseScrollSpyResult } from './types'

// Define ScrollIntoViewOptions type for compatibility
interface ScrollIntoViewOptions {
  behavior?: 'auto' | 'smooth'
  block?: 'start' | 'center' | 'end' | 'nearest'
  inline?: 'start' | 'center' | 'end' | 'nearest'
}

/**
 * Custom hook for tracking which heading is currently visible
 */
export const useScrollSpy = (options: UseScrollSpyOptions): UseScrollSpyResult => {
  const {
    headings,
    rootMargin = '-20% 0px -80% 0px',
    threshold = 0.1
  } = options
  
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const intersectingHeadings = useRef<Map<string, IntersectionObserverEntry>>(new Map())
  
  const updateActiveHeading = useCallback(() => {
    const entries = Array.from(intersectingHeadings.current.values())
    
    if (entries.length === 0) {
      setActiveHeadingId(null)
      return
    }
    
    // Find the entry with the highest intersection ratio
    // If ratios are equal, prefer the one that's higher on the page (smaller boundingClientRect.top)
    let bestEntry = entries[0]
    
    for (const entry of entries) {
      if (entry.intersectionRatio > bestEntry.intersectionRatio) {
        bestEntry = entry
      } else if (
        entry.intersectionRatio === bestEntry.intersectionRatio &&
        entry.boundingClientRect.top < bestEntry.boundingClientRect.top
      ) {
        bestEntry = entry
      }
    }
    
    const targetElement = bestEntry.target as HTMLElement
    setActiveHeadingId(targetElement.id)
  }, [])
  
  useEffect(() => {
    if (headings.length === 0) {
      setActiveHeadingId(null)
      return
    }
    
    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        let hasChanges = false
        
        for (const entry of entries) {
          const targetElement = entry.target as HTMLElement
          const headingId = targetElement.id
          
          if (entry.isIntersecting) {
            intersectingHeadings.current.set(headingId, entry)
            hasChanges = true
          } else {
            if (intersectingHeadings.current.has(headingId)) {
              intersectingHeadings.current.delete(headingId)
              hasChanges = true
            }
          }
        }
        
        if (hasChanges) {
          updateActiveHeading()
        }
      },
      {
        rootMargin,
        threshold
      }
    )
    
    // Observe all heading elements
    const elementsToObserve: HTMLElement[] = []
    
    for (const heading of headings) {
      const element = document.getElementById(heading.id)
      if (element) {
        elementsToObserve.push(element)
        observerRef.current.observe(element)
      }
    }
    
    // Cleanup function
    return () => {
      if (observerRef.current) {
        for (const element of elementsToObserve) {
          observerRef.current.unobserve(element)
        }
        observerRef.current.disconnect()
        observerRef.current = null
      }
      intersectingHeadings.current.clear()
    }
  }, [headings, rootMargin, threshold, updateActiveHeading])
  
  return { activeHeadingId }
}

/**
 * Hook for smooth scrolling to heading elements
 */
export const useScrollToHeading = () => {
  const scrollToHeading = useCallback((headingId: string, options?: ScrollIntoViewOptions) => {
    const element = document.getElementById(headingId)
    if (!element) {
      console.warn(`Element with id "${headingId}" not found`)
      return
    }
    
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
      ...options
    })
  }, [])
  
  return { scrollToHeading }
}