import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TableOfContents from '../TableOfContents'
import type { Heading } from '../../../types'

describe('TableOfContents', () => {
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
    },
    {
      type: 'heading',
      level: 'medium',
      text: '二 別れ',
      id: 'section-2',
      range: {
        start: { line: 3, column: 0, index: 24 },
        end: { line: 3, column: 6, index: 30 }
      }
    },
    {
      type: 'heading',
      level: 'large',
      text: '第二章 発展',
      id: 'chapter-2',
      range: {
        start: { line: 4, column: 0, index: 31 },
        end: { line: 4, column: 10, index: 41 }
      }
    }
  ]

  const mockOnHeadingClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本機能', () => {
    it('should render table of contents with headings', () => {
      render(<TableOfContents headings={mockHeadings} onHeadingClick={mockOnHeadingClick} />)
      
      // Check if all headings are rendered
      expect(screen.getByText('第一章 始まり')).toBeInTheDocument()
      expect(screen.getByText('一 出会い')).toBeInTheDocument()
      expect(screen.getByText('その後')).toBeInTheDocument()
      expect(screen.getByText('二 別れ')).toBeInTheDocument()
      expect(screen.getByText('第二章 発展')).toBeInTheDocument()
    })

    it('should handle empty headings list', () => {
      render(<TableOfContents headings={[]} onHeadingClick={mockOnHeadingClick} />)
      
      expect(screen.getByText(/目次がありません/)).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(
        <TableOfContents 
          headings={mockHeadings} 
          onHeadingClick={mockOnHeadingClick}
          className="custom-toc"
        />
      )
      
      const container = screen.getByRole('navigation')
      expect(container.className).toMatch(/custom-toc/)
    })
  })

  describe('階層構造', () => {
    it('should display headings in hierarchical structure', () => {
      render(<TableOfContents headings={mockHeadings} onHeadingClick={mockOnHeadingClick} />)
      
      // Check hierarchical indentation through CSS classes
      const largeHeadings = screen.getAllByText(/第.*章/)
      const mediumHeadings = screen.getAllByText(/[一二].*[出別]/)
      const smallHeadings = screen.getAllByText('その後')
      
      expect(largeHeadings).toHaveLength(2)
      expect(mediumHeadings).toHaveLength(2)
      expect(smallHeadings).toHaveLength(1)
      
      // Check if hierarchy is maintained (level 1 = large, level 2 = medium, level 3 = small)
      largeHeadings.forEach(heading => {
        expect(heading.closest('[data-level="1"]')).toBeInTheDocument()
      })
      
      mediumHeadings.forEach(heading => {
        expect(heading.closest('[data-level="2"]')).toBeInTheDocument()
      })
      
      smallHeadings.forEach(heading => {
        expect(heading.closest('[data-level="3"]')).toBeInTheDocument()
      })
    })

    it('should properly nest headings under their parent', () => {
      render(<TableOfContents headings={mockHeadings} onHeadingClick={mockOnHeadingClick} />)
      
      // Get the container structure
      const toc = screen.getByRole('navigation')
      const tocItems = toc.querySelectorAll('[role="treeitem"]')
      
      expect(tocItems.length).toBeGreaterThan(0)
    })
  })

  describe('ナビゲーション機能', () => {
    it('should call onHeadingClick when heading is clicked', () => {
      render(<TableOfContents headings={mockHeadings} onHeadingClick={mockOnHeadingClick} />)
      
      const firstHeading = screen.getByText('第一章 始まり')
      fireEvent.click(firstHeading)
      
      expect(mockOnHeadingClick).toHaveBeenCalledWith(mockHeadings[0])
    })

    it('should support keyboard navigation', () => {
      render(<TableOfContents headings={mockHeadings} onHeadingClick={mockOnHeadingClick} />)
      
      const firstHeading = screen.getByText('第一章 始まり')
      
      // Test Enter key
      fireEvent.keyDown(firstHeading, { key: 'Enter' })
      expect(mockOnHeadingClick).toHaveBeenCalledWith(mockHeadings[0])
      
      // Test Space key
      fireEvent.keyDown(firstHeading, { key: ' ' })
      expect(mockOnHeadingClick).toHaveBeenCalledTimes(2)
    })

    it('should support arrow key navigation', async () => {
      render(<TableOfContents headings={mockHeadings} onHeadingClick={mockOnHeadingClick} />)
      
      const toc = screen.getByRole('navigation')
      toc.focus()
      
      // Test ArrowDown
      fireEvent.keyDown(toc, { key: 'ArrowDown' })
      await waitFor(() => {
        expect(document.activeElement).toHaveAttribute('data-heading-id')
      })
      
      // Test ArrowUp
      fireEvent.keyDown(toc, { key: 'ArrowUp' })
      await waitFor(() => {
        expect(document.activeElement).toHaveAttribute('data-heading-id')
      })
    })
  })

  describe('アクティブ状態管理', () => {
    it('should highlight active heading', () => {
      render(
        <TableOfContents 
          headings={mockHeadings} 
          activeHeadingId="section-1"
          onHeadingClick={mockOnHeadingClick} 
        />
      )
      
      const activeHeading = screen.getByText('一 出会い')
      expect(activeHeading.closest('[data-active="true"]')).toBeInTheDocument()
    })

    it('should update active heading when activeHeadingId changes', () => {
      const { rerender } = render(
        <TableOfContents 
          headings={mockHeadings} 
          activeHeadingId="section-1"
          onHeadingClick={mockOnHeadingClick} 
        />
      )
      
      let activeHeading = screen.getByText('一 出会い')
      expect(activeHeading.closest('[data-active="true"]')).toBeInTheDocument()
      
      rerender(
        <TableOfContents 
          headings={mockHeadings} 
          activeHeadingId="chapter-2"
          onHeadingClick={mockOnHeadingClick} 
        />
      )
      
      activeHeading = screen.getByText('第二章 発展')
      expect(activeHeading.closest('[data-active="true"]')).toBeInTheDocument()
    })

    it('should handle no active heading', () => {
      render(<TableOfContents headings={mockHeadings} onHeadingClick={mockOnHeadingClick} />)
      
      const activeElements = screen.getByRole('navigation').querySelectorAll('[data-active="true"]')
      expect(activeElements).toHaveLength(0)
    })
  })

  describe('仮想スクロール', () => {
    it('should enable virtual scrolling for large lists', () => {
      // Create a large list of headings
      const largeHeadingList: Heading[] = Array.from({ length: 150 }, (_, i) => ({
        type: 'heading',
        level: 'medium',
        text: `見出し ${i + 1}`,
        id: `heading-${i + 1}`,
        range: {
          start: { line: i, column: 0, index: i * 10 },
          end: { line: i, column: 8, index: i * 10 + 8 }
        }
      }))
      
      render(
        <TableOfContents 
          headings={largeHeadingList} 
          onHeadingClick={mockOnHeadingClick}
          virtualScroll={true}
        />
      )
      
      // Virtual scrolling should be enabled
      const container = screen.getByRole('navigation')
      expect(container).toHaveAttribute('data-virtual-scroll', 'true')
    })

    it('should handle virtual scrolling performance', () => {
      const largeHeadingList: Heading[] = Array.from({ length: 200 }, (_, i) => ({
        type: 'heading',
        level: 'small',
        text: `項目 ${i + 1}`,
        id: `item-${i + 1}`,
        range: {
          start: { line: i, column: 0, index: i * 10 },
          end: { line: i, column: 6, index: i * 10 + 6 }
        }
      }))
      
      const startTime = performance.now()
      render(
        <TableOfContents 
          headings={largeHeadingList} 
          onHeadingClick={mockOnHeadingClick}
          virtualScroll={true}
        />
      )
      const endTime = performance.now()
      
      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  describe('アクセシビリティ', () => {
    it('should have proper ARIA attributes', () => {
      render(<TableOfContents headings={mockHeadings} onHeadingClick={mockOnHeadingClick} />)
      
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', '目次')
      
      const tree = screen.getByRole('tree')
      expect(tree).toBeInTheDocument()
    })

    it('should support screen reader navigation', () => {
      render(<TableOfContents headings={mockHeadings} onHeadingClick={mockOnHeadingClick} />)
      
      const treeItems = screen.getAllByRole('treeitem')
      expect(treeItems.length).toBe(mockHeadings.length)
      
      treeItems.forEach((item, index) => {
        expect(item).toHaveAttribute('aria-level', (index === 0 || index === 4) ? '1' : index === 2 ? '3' : '2')
      })
    })

    it('should indicate expanded/collapsed state for nested items', () => {
      render(<TableOfContents headings={mockHeadings} onHeadingClick={mockOnHeadingClick} />)
      
      // Find items that should have children
      const parentItems = screen.getAllByRole('treeitem').filter(item => 
        item.querySelector('[aria-expanded]')
      )
      
      parentItems.forEach(item => {
        expect(item).toHaveAttribute('aria-expanded')
      })
    })
  })

  describe('レスポンシブ対応', () => {
    it('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      render(<TableOfContents headings={mockHeadings} onHeadingClick={mockOnHeadingClick} />)
      
      const container = screen.getByRole('navigation')
      expect(container.className).toMatch(/mobile/)
    })

    it('should support touch gestures on mobile', () => {
      render(<TableOfContents headings={mockHeadings} onHeadingClick={mockOnHeadingClick} />)
      
      const firstHeading = screen.getByText('第一章 始まり')
      
      // Simulate touch events
      fireEvent.touchStart(firstHeading)
      fireEvent.touchEnd(firstHeading)
      
      expect(mockOnHeadingClick).toHaveBeenCalledWith(mockHeadings[0])
    })
  })
})