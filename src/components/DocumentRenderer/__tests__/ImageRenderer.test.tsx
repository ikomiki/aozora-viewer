import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImageRenderer from '../ImageRenderer'
import type { Image } from '../../../types'

describe('ImageRenderer', () => {
  const mockImageWithSize: Image = {
    type: 'image',
    description: '石鏃二つの図',
    filename: 'fig42154_01.png',
    width: 321,
    height: 123,
    range: {
      start: { line: 0, column: 0, index: 0 },
      end: { line: 0, column: 30, index: 30 }
    }
  }

  const mockImageWithoutSize: Image = {
    type: 'image',
    description: '挿絵',
    filename: 'image001.png',
    range: {
      start: { line: 1, column: 0, index: 31 },
      end: { line: 1, column: 20, index: 51 }
    }
  }

  const mockImageWithBase64: Image = {
    type: 'image',
    description: 'テスト画像',
    base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    range: {
      start: { line: 2, column: 0, index: 52 },
      end: { line: 2, column: 15, index: 67 }
    }
  }

  describe('基本機能', () => {
    it('should render image with proper attributes when filename is provided', () => {
      render(<ImageRenderer element={mockImageWithSize} />)
      
      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('alt', '石鏃二つの図')
      expect(img).toHaveAttribute('src', 'fig42154_01.png')
      expect(img).toHaveAttribute('width', '321')
      expect(img).toHaveAttribute('height', '123')
    })

    it('should render image without size attributes when size is not provided', () => {
      render(<ImageRenderer element={mockImageWithoutSize} />)
      
      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('alt', '挿絵')
      expect(img).toHaveAttribute('src', 'image001.png')
      expect(img).not.toHaveAttribute('width')
      expect(img).not.toHaveAttribute('height')
    })

    it('should render image with base64 data', () => {
      render(<ImageRenderer element={mockImageWithBase64} />)
      
      const img = screen.getByRole('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('alt', 'テスト画像')
      expect(img).toHaveAttribute('src', mockImageWithBase64.base64)
    })

    it('should apply custom className', () => {
      render(<ImageRenderer element={mockImageWithSize} className="custom-image" />)
      
      const container = screen.getByRole('img').closest('figure')
      expect(container?.className).toMatch(/custom-image/)
    })
  })

  describe('遅延読み込み', () => {
    it('should support lazy loading', () => {
      render(<ImageRenderer element={mockImageWithSize} lazy />)
      
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('loading', 'lazy')
    })

    it('should not have lazy loading by default', () => {
      render(<ImageRenderer element={mockImageWithSize} />)
      
      const img = screen.getByRole('img')
      expect(img).not.toHaveAttribute('loading', 'lazy')
    })
  })

  describe('イベントハンドリング', () => {
    it('should call onLoad when image loads successfully', async () => {
      const mockOnLoad = vi.fn()
      render(<ImageRenderer element={mockImageWithSize} onLoad={mockOnLoad} />)
      
      const img = screen.getByRole('img')
      fireEvent.load(img)
      
      await waitFor(() => {
        expect(mockOnLoad).toHaveBeenCalledWith('fig42154_01.png', mockImageWithSize)
      })
    })

    it('should call onError when image fails to load', async () => {
      const mockOnError = vi.fn()
      render(<ImageRenderer element={mockImageWithSize} onError={mockOnError} />)
      
      const img = screen.getByRole('img')
      const errorEvent = new Event('error')
      fireEvent(img, errorEvent)
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('fig42154_01.png', mockImageWithSize, expect.any(Error))
      })
    })

    it('should show fallback when image fails to load', async () => {
      render(<ImageRenderer element={mockImageWithSize} />)
      
      const img = screen.getByRole('img')
      fireEvent.error(img)
      
      await waitFor(() => {
        const fallback = screen.getByText(/画像を読み込めませんでした/)
        expect(fallback).toBeInTheDocument()
      })
    })
  })

  describe('スタイリング', () => {
    it('should have proper CSS classes', () => {
      render(<ImageRenderer element={mockImageWithSize} />)
      
      const container = screen.getByRole('img').closest('figure')
      const img = screen.getByRole('img')
      
      expect(container?.className).toMatch(/imageContainer/)
      expect(img.className).toMatch(/image/)
    })

    it('should handle responsive images', () => {
      render(<ImageRenderer element={mockImageWithSize} />)
      
      const img = screen.getByRole('img')
      expect(img.className).toMatch(/responsive/)
    })
  })

  describe('アクセシビリティ', () => {
    it('should have proper ARIA attributes', () => {
      render(<ImageRenderer element={mockImageWithSize} />)
      
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('alt', '石鏃二つの図')
    })

    it('should handle empty alt text appropriately', () => {
      const imageWithoutDescription: Image = {
        ...mockImageWithSize,
        description: ''
      }
      
      render(<ImageRenderer element={imageWithoutDescription} />)
      
      const img = screen.getByRole('presentation') // Images with empty alt are treated as presentation
      expect(img).toHaveAttribute('alt', '')
    })
  })
})