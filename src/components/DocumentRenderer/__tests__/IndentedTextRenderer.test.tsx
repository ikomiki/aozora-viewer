import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { IndentedTextRenderer } from '../IndentedTextRenderer'
import type { IndentedText } from '../../../types'

describe('IndentedTextRenderer', () => {
  const createMockRange = (start: number, end: number) => ({
    start: { line: 0, column: start, index: start },
    end: { line: 0, column: end, index: end }
  })

  const createIndentedText = (content: string, indentCount: number): IndentedText => ({
    type: 'indented-text',
    content,
    indentCount,
    range: createMockRange(0, content.length)
  })

  describe('基本的な字上げ表示', () => {
    it('should render text with positive indentation (normal case)', () => {
      const element = createIndentedText('通常の字上げテキスト', 2)
      const { container } = render(<IndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('　　通常の字上げテキスト')
      expect(span?.className).toContain('indented-text')
    })

    it('should render text with zero indentation', () => {
      const element = createIndentedText('字上げなしテキスト', 0)
      const { container } = render(<IndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('字上げなしテキスト')
      expect(span?.className).toContain('indented-text')
    })

    it('should render text with large indentation', () => {
      const element = createIndentedText('大きな字上げ', 5)
      const { container } = render(<IndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('　　　　　大きな字上げ')
    })
  })

  describe('負の字上げ（字下げ）の処理', () => {
    it('should render text with negative indentation (字上げ)', () => {
      const element = createIndentedText('地から上がったテキスト', -2)
      const { container } = render(<IndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('地から上がったテキスト')
      expect(span).toHaveStyle('margin-left: -2em')
      expect(span?.className).toContain('indented-text')
      expect(span?.className).toContain('negative-indent')
    })

    it('should render text with large negative indentation', () => {
      const element = createIndentedText('大幅に上がったテキスト', -4)
      const { container } = render(<IndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('大幅に上がったテキスト')
      expect(span).toHaveStyle('margin-left: -4em')
    })
  })

  describe('特殊な内容の処理', () => {
    it('should render empty content', () => {
      const element = createIndentedText('', 2)
      const { container } = render(<IndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('　　')
    })

    it('should render content with line breaks', () => {
      const element = createIndentedText('1行目\\n2行目', 1)
      const { container } = render(<IndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('　1行目\\n2行目')
    })

    it('should render content with existing fullwidth spaces', () => {
      const element = createIndentedText('　既存の全角スペース付き', 1)
      const { container } = render(<IndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('　　既存の全角スペース付き')
    })

    it('should render content with special characters', () => {
      const element = createIndentedText('特殊文字《》［］｜', 3)
      const { container } = render(<IndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('　　　特殊文字《》［］｜')
    })
  })

  describe('極値の処理', () => {
    it('should handle maximum practical indentation', () => {
      const element = createIndentedText('最大字上げ', 20)
      const { container } = render(<IndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      const expectedIndent = '　'.repeat(20)
      expect(span?.textContent).toBe(expectedIndent + '最大字上げ')
    })

    it('should handle maximum practical negative indentation', () => {
      const element = createIndentedText('最大字下げ', -10)
      const { container } = render(<IndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('最大字下げ')
      expect(span).toHaveStyle('margin-left: -10em')
    })
  })

  describe('HTML構造とアクセシビリティ', () => {
    it('should use semantic span element', () => {
      const element = createIndentedText('テスト', 1)
      const { container } = render(<IndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span).toBeInTheDocument()
      expect(span?.tagName).toBe('SPAN')
    })

    it('should have appropriate CSS classes', () => {
      const element = createIndentedText('テスト', 2)
      const { container } = render(<IndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.className).toContain('indented-text')
    })

    it('should have negative indent class for negative values', () => {
      const element = createIndentedText('テスト', -1)
      const { container } = render(<IndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.className).toContain('indented-text')
      expect(span?.className).toContain('negative-indent')
    })
  })
})