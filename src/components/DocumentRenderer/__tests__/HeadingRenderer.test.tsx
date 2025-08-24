import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HeadingRenderer from '../HeadingRenderer'
import type { Heading } from '../../../types'

describe('HeadingRenderer', () => {
  const mockHeadingLarge: Heading = {
    type: 'heading',
    level: 'large',
    text: '第一章 始まり',
    id: 'chapter-1',
    range: {
      start: { line: 0, column: 0, index: 0 },
      end: { line: 0, column: 15, index: 15 }
    }
  }

  const mockHeadingMedium: Heading = {
    type: 'heading',
    level: 'medium',
    text: '一 出会い',
    id: 'section-1',
    range: {
      start: { line: 1, column: 0, index: 16 },
      end: { line: 1, column: 8, index: 24 }
    }
  }

  const mockHeadingSmall: Heading = {
    type: 'heading',
    level: 'small',
    text: 'その後',
    id: 'subsection-1',
    range: {
      start: { line: 2, column: 0, index: 25 },
      end: { line: 2, column: 3, index: 28 }
    }
  }

  describe('基本機能', () => {
    it('should render large heading as h1', () => {
      render(<HeadingRenderer element={mockHeadingLarge} />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('第一章 始まり')
      expect(heading).toHaveAttribute('id', 'chapter-1')
    })

    it('should render medium heading as h2', () => {
      render(<HeadingRenderer element={mockHeadingMedium} />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('一 出会い')
      expect(heading).toHaveAttribute('id', 'section-1')
    })

    it('should render small heading as h3', () => {
      render(<HeadingRenderer element={mockHeadingSmall} />)
      
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('その後')
      expect(heading).toHaveAttribute('id', 'subsection-1')
    })

    it('should apply custom className', () => {
      render(<HeadingRenderer element={mockHeadingLarge} className="custom-heading" />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading.className).toMatch(/custom-heading/)
    })
  })

  describe('クリックハンドリング', () => {
    it('should call onClick when heading is clicked', () => {
      const mockOnClick = vi.fn()
      render(<HeadingRenderer element={mockHeadingLarge} onClick={mockOnClick} />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      fireEvent.click(heading)
      
      expect(mockOnClick).toHaveBeenCalledWith(mockHeadingLarge)
    })

    it('should not throw error when no onClick provided', () => {
      render(<HeadingRenderer element={mockHeadingLarge} />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(() => fireEvent.click(heading)).not.toThrow()
    })

    it('should have clickable cursor when onClick is provided', () => {
      const mockOnClick = vi.fn()
      render(<HeadingRenderer element={mockHeadingLarge} onClick={mockOnClick} />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading.style.cursor).toBe('pointer')
    })
  })

  describe('スタイリング', () => {
    it('should have appropriate styling classes for each level', () => {
      const { rerender } = render(<HeadingRenderer element={mockHeadingLarge} />)
      const largeHeading = screen.getByRole('heading', { level: 1 })
      expect(largeHeading.className).toMatch(/large/)
      
      rerender(<HeadingRenderer element={mockHeadingMedium} />)
      const mediumHeading = screen.getByRole('heading', { level: 2 })
      expect(mediumHeading.className).toMatch(/medium/)
      
      rerender(<HeadingRenderer element={mockHeadingSmall} />)
      const smallHeading = screen.getByRole('heading', { level: 3 })
      expect(smallHeading.className).toMatch(/small/)
    })
  })

  describe('アクセシビリティ', () => {
    it('should support keyboard navigation', () => {
      const mockOnClick = vi.fn()
      render(<HeadingRenderer element={mockHeadingLarge} onClick={mockOnClick} />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveAttribute('tabIndex', '0')
      
      // Test Enter key
      fireEvent.keyDown(heading, { key: 'Enter' })
      expect(mockOnClick).toHaveBeenCalledWith(mockHeadingLarge)
      
      // Test Space key
      fireEvent.keyDown(heading, { key: ' ' })
      expect(mockOnClick).toHaveBeenCalledTimes(2)
    })

    it('should have proper ARIA attributes', () => {
      render(<HeadingRenderer element={mockHeadingLarge} />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveAttribute('aria-label', '第一章 始まり')
    })
  })
})