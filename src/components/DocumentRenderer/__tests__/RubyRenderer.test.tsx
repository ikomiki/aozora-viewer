import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RubyRenderer from '../RubyRenderer'
import type { RubyText } from '../../../types'

describe('RubyRenderer', () => {
  const mockRubyElement: RubyText = {
    type: 'ruby',
    text: '学校',
    ruby: 'がっこう',
    range: {
      start: { line: 0, column: 0, index: 0 },
      end: { line: 0, column: 8, index: 8 }
    }
  }

  describe('基本機能', () => {
    it('should render ruby text with proper structure', () => {
      render(<RubyRenderer element={mockRubyElement} />)
      
      const ruby = screen.getByRole('ruby')
      expect(ruby).toBeInTheDocument()
      
      // Base text should be present
      expect(ruby).toHaveTextContent('学校')
      
      // Ruby text should be in rt element
      const rt = ruby.querySelector('rt')
      expect(rt).toBeInTheDocument()
      expect(rt).toHaveTextContent('がっこう')
    })

    it('should apply custom className', () => {
      render(<RubyRenderer element={mockRubyElement} className="custom-ruby" />)
      
      const ruby = screen.getByRole('ruby')
      expect(ruby.className).toMatch(/custom-ruby/)
    })

    it('should have proper semantic HTML structure', () => {
      render(<RubyRenderer element={mockRubyElement} />)
      
      const ruby = screen.getByRole('ruby')
      const rt = ruby.querySelector('rt')
      const span = ruby.querySelector('span')
      
      expect(ruby.tagName).toBe('RUBY')
      expect(rt?.tagName).toBe('RT')
      expect(span?.tagName).toBe('SPAN')
    })
  })

  describe('スタイリング', () => {
    it('should have default styling classes', () => {
      render(<RubyRenderer element={mockRubyElement} />)
      
      const ruby = screen.getByRole('ruby')
      expect(ruby.className).toMatch(/ruby/)
    })

    it('should handle long ruby text properly', () => {
      const longRubyElement: RubyText = {
        ...mockRubyElement,
        text: '憲法',
        ruby: 'けんぽう'
      }
      
      render(<RubyRenderer element={longRubyElement} />)
      
      const ruby = screen.getByRole('ruby')
      const rt = ruby.querySelector('rt')
      
      expect(ruby).toHaveTextContent('憲法')
      expect(rt).toHaveTextContent('けんぽう')
    })
  })

  describe('アクセシビリティ', () => {
    it('should have proper ARIA attributes', () => {
      render(<RubyRenderer element={mockRubyElement} />)
      
      const ruby = screen.getByRole('ruby')
      expect(ruby).toHaveAttribute('role', 'ruby')
    })

    it('should be readable by screen readers', () => {
      render(<RubyRenderer element={mockRubyElement} />)
      
      const ruby = screen.getByRole('ruby')
      // Screen readers should read both base text and ruby
      expect(ruby).toHaveTextContent('学校がっこう')
    })
  })
})