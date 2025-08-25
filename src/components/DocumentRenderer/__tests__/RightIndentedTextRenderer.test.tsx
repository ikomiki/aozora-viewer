import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { RightIndentedTextRenderer } from '../RightIndentedTextRenderer'
import type { RightIndentedText } from '../../../types'

describe('RightIndentedTextRenderer', () => {
  const createMockRange = (start: number, end: number) => ({
    start: { line: 0, column: start, index: start },
    end: { line: 0, column: end, index: end }
  })

  const createRightIndentedText = (content: string, indentCount: number): RightIndentedText => ({
    type: 'right-indented-text',
    content,
    indentCount,
    range: createMockRange(0, content.length)
  })

  describe('基本的なレンダリング', () => {
    it('should render right indented text with correct styling', () => {
      const element = createRightIndentedText('右寄せテキスト', 2)
      const { container } = render(<RightIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span).toBeInTheDocument()
      expect(span?.className).toContain('right-indented-text')
      
      // 右寄せスタイルとマージンが適用される
      expect(span?.style.textAlign).toBe('right')
      expect(span?.style.display).toBe('block')
      expect(span?.style.marginRight).toBe('2em')
      
      expect(span?.textContent).toBe('右寄せテキスト')
    })

    it('should render text without margin when count is 0', () => {
      const element = createRightIndentedText('マージンなしテキスト', 0)
      const { container } = render(<RightIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.style.marginRight).toBe('0em')
      expect(span?.style.textAlign).toBe('right')
      expect(span?.textContent).toBe('マージンなしテキスト')
    })

    it('should handle large indentation counts', () => {
      const element = createRightIndentedText('大きなマージン', 10)
      const { container } = render(<RightIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.style.marginRight).toBe('10em')
    })
  })

  describe('エッジケース', () => {
    it('should handle negative indentation (treat as zero)', () => {
      const element = createRightIndentedText('負のインデント', -5)
      const { container } = render(<RightIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.style.marginRight).toBe('0em') // 負の値は0として扱われる
      expect(span?.textContent).toBe('負のインデント')
    })

    it('should handle empty content', () => {
      const element = createRightIndentedText('', 3)
      const { container } = render(<RightIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.style.marginRight).toBe('3em')
      expect(span?.textContent).toBe('')
    })

    it('should handle content with special characters', () => {
      const element = createRightIndentedText('特殊文字！@#$%^&*()', 1)
      const { container } = render(<RightIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('特殊文字！@#$%^&*()')
      expect(span?.style.marginRight).toBe('1em')
    })
  })

  describe('レイアウトと表示', () => {
    it('should use block display for proper right alignment', () => {
      const element = createRightIndentedText('ブロック表示', 2)
      const { container } = render(<RightIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.style.display).toBe('block')
      expect(span?.style.textAlign).toBe('right')
    })

    it('should handle very long text content', () => {
      const longText = 'この文章は非常に長いテキストで、右寄せ表示の動作を確認するためのものです。'.repeat(5)
      const element = createRightIndentedText(longText, 1)
      const { container } = render(<RightIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe(longText)
      expect(span?.style.textAlign).toBe('right')
    })
  })

  describe('複数行対応', () => {
    it('should handle text with line breaks', () => {
      const element = createRightIndentedText('1行目\\n2行目\\n3行目', 2)
      const { container } = render(<RightIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('1行目\\n2行目\\n3行目')
      expect(span?.style.textAlign).toBe('right')
    })
  })

  describe('アクセシビリティとHTML構造', () => {
    it('should use semantic span element with proper class', () => {
      const element = createRightIndentedText('アクセシビリティテスト', 1)
      const { container } = render(<RightIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.tagName).toBe('SPAN')
      expect(span?.className).toContain('right-indented-text')
    })

    it('should preserve text content for screen readers', () => {
      const element = createRightIndentedText('スクリーンリーダー対応テキスト', 2)
      const { container } = render(<RightIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('スクリーンリーダー対応テキスト')
    })

    it('should maintain semantic meaning with styling', () => {
      const element = createRightIndentedText('意味を保持したスタイリング', 4)
      const { container } = render(<RightIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      // スタイルが適用されていてもテキスト内容は保持
      expect(span?.textContent).toBe('意味を保持したスタイリング')
      expect(span?.style.marginRight).toBe('4em')
    })
  })
})