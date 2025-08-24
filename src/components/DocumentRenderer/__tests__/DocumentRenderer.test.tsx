import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DocumentRenderer from '../DocumentRenderer'
import type { ParsedDocument } from '../../../types'

describe('DocumentRenderer', () => {
  const mockDocument: ParsedDocument = {
    title: '吾輩は猫である',
    elements: [
      {
        type: 'heading',
        level: 'large',
        text: '第一章 始まり',
        id: 'chapter-1',
        range: {
          start: { line: 0, column: 0, index: 0 },
          end: { line: 0, column: 15, index: 15 }
        }
      },
      {
        type: 'text',
        content: '吾輩',
        range: {
          start: { line: 1, column: 0, index: 16 },
          end: { line: 1, column: 2, index: 18 }
        }
      },
      {
        type: 'ruby',
        text: '我輩',
        ruby: 'わがはい',
        range: {
          start: { line: 1, column: 2, index: 18 },
          end: { line: 1, column: 10, index: 26 }
        }
      },
      {
        type: 'text',
        content: 'は猫である。',
        range: {
          start: { line: 1, column: 10, index: 26 },
          end: { line: 1, column: 16, index: 32 }
        }
      },
      {
        type: 'image',
        description: '猫の写真',
        filename: 'neko.png',
        range: {
          start: { line: 2, column: 0, index: 33 },
          end: { line: 2, column: 20, index: 53 }
        }
      },
      {
        type: 'caption',
        text: '図1 猫',
        range: {
          start: { line: 3, column: 0, index: 54 },
          end: { line: 3, column: 6, index: 60 }
        }
      }
    ],
    headings: [
      {
        type: 'heading',
        level: 'large',
        text: '第一章 始まり',
        id: 'chapter-1',
        range: {
          start: { line: 0, column: 0, index: 0 },
          end: { line: 0, column: 15, index: 15 }
        }
      }
    ],
    images: [
      {
        type: 'image',
        description: '猫の写真',
        filename: 'neko.png',
        range: {
          start: { line: 2, column: 0, index: 33 },
          end: { line: 2, column: 20, index: 53 }
        }
      }
    ],
    metadata: {
      filename: 'test.txt',
      fileSize: 1024,
      encoding: 'UTF-8',
      parseTime: 10,
      elementCount: 6,
      characterCount: 60
    }
  }

  describe('基本機能', () => {
    it('should render document with all elements', () => {
      render(<DocumentRenderer document={mockDocument} />)
      
      // Check heading
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('第一章 始まり')
      
      // Check ruby text
      const ruby = screen.getByRole('ruby')
      expect(ruby).toBeInTheDocument()
      
      // Check plain text
      expect(screen.getByText('吾輩')).toBeInTheDocument()
      expect(screen.getByText('は猫である。')).toBeInTheDocument()
      
      // Check image
      const img = screen.getByAltText('猫の写真')
      expect(img).toHaveAttribute('alt', '猫の写真')
      
      // Check caption
      expect(screen.getByText('図1 猫')).toBeInTheDocument()
    })

    it('should handle null document', () => {
      render(<DocumentRenderer document={null} />)
      
      expect(screen.getByText(/文書が選択されていません/)).toBeInTheDocument()
    })

    it('should handle empty document', () => {
      const emptyDocument: ParsedDocument = {
        elements: [],
        headings: [],
        images: [],
        metadata: {
          filename: 'empty.txt',
          fileSize: 0,
          encoding: 'UTF-8',
          parseTime: 1,
          elementCount: 0,
          characterCount: 0
        }
      }
      
      render(<DocumentRenderer document={emptyDocument} />)
      
      expect(screen.getByText(/文書に内容がありません/)).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<DocumentRenderer document={mockDocument} className="custom-document" />)
      
      const container = screen.getByRole('document')
      expect(container.className).toMatch(/custom-document/)
    })
  })

  describe('イベントハンドリング', () => {
    it('should handle heading clicks', () => {
      const mockOnHeadingClick = vi.fn()
      render(<DocumentRenderer document={mockDocument} onHeadingClick={mockOnHeadingClick} />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      fireEvent.click(heading)
      
      expect(mockOnHeadingClick).toHaveBeenCalledWith(mockDocument.headings[0])
    })

    it('should handle image load events', () => {
      const mockOnImageLoad = vi.fn()
      render(<DocumentRenderer document={mockDocument} onImageLoad={mockOnImageLoad} />)
      
      const img = screen.getByAltText('猫の写真')
      fireEvent.load(img)
      
      expect(mockOnImageLoad).toHaveBeenCalledWith('neko.png', mockDocument.images[0])
    })

    it('should handle image error events', () => {
      const mockOnImageError = vi.fn()
      render(<DocumentRenderer document={mockDocument} onImageError={mockOnImageError} />)
      
      const img = screen.getByAltText('猫の写真')
      fireEvent.error(img)
      
      expect(mockOnImageError).toHaveBeenCalledWith('neko.png', mockDocument.images[0], expect.any(Error))
    })
  })

  describe('パフォーマンス', () => {
    it('should handle large documents efficiently', () => {
      // Create a large document with many elements
      const largeDocument: ParsedDocument = {
        elements: Array.from({ length: 1000 }, (_, i) => ({
          type: 'text' as const,
          content: `テキスト${i}`,
          range: {
            start: { line: i, column: 0, index: i * 10 },
            end: { line: i, column: 5, index: i * 10 + 5 }
          }
        })),
        headings: [],
        images: [],
        metadata: {
          filename: 'large.txt',
          fileSize: 10000,
          encoding: 'UTF-8',
          parseTime: 100,
          elementCount: 1000,
          characterCount: 5000
        }
      }
      
      const startTime = performance.now()
      render(<DocumentRenderer document={largeDocument} />)
      const endTime = performance.now()
      
      // Rendering should complete within reasonable time (200ms)
      expect(endTime - startTime).toBeLessThan(200)
      
      // Check that elements are rendered
      expect(screen.getByText('テキスト0')).toBeInTheDocument()
      expect(screen.getByText('テキスト999')).toBeInTheDocument()
    })

    it('should implement virtual scrolling for very large documents', () => {
      // Create document with 200+ headings to trigger virtual scrolling
      const manyHeadingsDocument: ParsedDocument = {
        elements: Array.from({ length: 200 }, (_, i) => ({
          type: 'heading' as const,
          level: 'small' as const,
          text: `見出し${i}`,
          id: `heading-${i}`,
          range: {
            start: { line: i, column: 0, index: i * 10 },
            end: { line: i, column: 5, index: i * 10 + 5 }
          }
        })),
        headings: Array.from({ length: 200 }, (_, i) => ({
          type: 'heading' as const,
          level: 'small' as const,
          text: `見出し${i}`,
          id: `heading-${i}`,
          range: {
            start: { line: i, column: 0, index: i * 10 },
            end: { line: i, column: 5, index: i * 10 + 5 }
          }
        })),
        images: [],
        metadata: {
          filename: 'many-headings.txt',
          fileSize: 2000,
          encoding: 'UTF-8',
          parseTime: 50,
          elementCount: 200,
          characterCount: 1000
        }
      }
      
      render(<DocumentRenderer document={manyHeadingsDocument} />)
      
      // Virtual scrolling should be enabled
      const container = screen.getByRole('document')
      expect(container.className).toMatch(/virtualScroll/)
    })
  })

  describe('アクセシビリティ', () => {
    it('should have proper ARIA attributes', () => {
      render(<DocumentRenderer document={mockDocument} />)
      
      const container = screen.getByRole('document')
      expect(container).toHaveAttribute('aria-label', '文書コンテンツ')
    })

    it('should have proper semantic structure', () => {
      render(<DocumentRenderer document={mockDocument} />)
      
      const container = screen.getByRole('document')
      expect(container.tagName).toBe('ARTICLE')
    })

    it('should support keyboard navigation', () => {
      render(<DocumentRenderer document={mockDocument} />)
      
      const container = screen.getByRole('document')
      expect(container).toHaveAttribute('tabIndex', '0')
    })
  })
})