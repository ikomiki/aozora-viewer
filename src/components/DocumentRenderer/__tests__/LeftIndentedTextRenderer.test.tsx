import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LeftIndentedTextRenderer } from '../LeftIndentedTextRenderer'
import type { LeftIndentedText } from '../../../types'

describe('LeftIndentedTextRenderer', () => {
  const createMockRange = (start: number, end: number) => ({
    start: { line: 0, column: start, index: start },
    end: { line: 0, column: end, index: end }
  })

  const createLeftIndentedText = (content: string, indentCount: number): LeftIndentedText => ({
    type: 'left-indented-text',
    content,
    indentCount,
    range: createMockRange(0, content.length)
  })

  describe('基本的なレンダリング', () => {
    it('should render left indented text with correct indentation', () => {
      const element = createLeftIndentedText('左インデントテキスト', 2)
      const { container } = render(<LeftIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span).toBeInTheDocument()
      expect(span?.className).toContain('left-indented-text')
      
      // 全角スペース2つ分のインデントが追加される
      expect(span?.textContent).toBe('　　左インデントテキスト')
    })

    it('should render text without indentation when count is 0', () => {
      const element = createLeftIndentedText('インデントなしテキスト', 0)
      const { container } = render(<LeftIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('インデントなしテキスト')
    })

    it('should handle large indentation counts', () => {
      const element = createLeftIndentedText('大きなインデント', 5)
      const { container } = render(<LeftIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('　　　　　大きなインデント') // 全角スペース5つ
    })
  })

  describe('エッジケース', () => {
    it('should handle negative indentation (treat as zero)', () => {
      const element = createLeftIndentedText('負のインデント', -3)
      const { container } = render(<LeftIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('負のインデント') // インデントなし
    })

    it('should handle empty content', () => {
      const element = createLeftIndentedText('', 2)
      const { container } = render(<LeftIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('　　') // 全角スペース2つのみ
    })

    it('should handle content with existing spaces', () => {
      const element = createLeftIndentedText('　既存のスペース付きテキスト', 1)
      const { container } = render(<LeftIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('　　既存のスペース付きテキスト') // インデント1つ + 既存のスペース
    })
  })

  describe('複数行対応', () => {
    it('should handle text with line breaks', () => {
      const element = createLeftIndentedText('1行目\\n2行目', 2)
      const { container } = render(<LeftIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('　　1行目\\n2行目')
    })
  })

  describe('アクセシビリティとHTML構造', () => {
    it('should use semantic span element', () => {
      const element = createLeftIndentedText('テスト', 1)
      const { container } = render(<LeftIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      expect(span?.tagName).toBe('SPAN')
      expect(span?.className).toContain('left-indented-text')
    })

    it('should preserve text content for screen readers', () => {
      const element = createLeftIndentedText('スクリーンリーダー用テキスト', 3)
      const { container } = render(<LeftIndentedTextRenderer element={element} />)
      
      const span = container.querySelector('span')
      // テキスト内容（インデント含む）がアクセシブル
      expect(span?.textContent).toContain('スクリーンリーダー用テキスト')
    })
  })
})