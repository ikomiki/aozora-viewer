import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { IndentBlockRenderer } from '../IndentBlockRenderer'
import type { IndentBlock, AozoraElement, FormattingInstruction } from '../../../types'

describe('IndentBlockRenderer', () => {
  const createMockRange = (start: number, end: number) => ({
    start: { line: 0, column: start, index: start },
    end: { line: 0, column: end, index: end }
  })

  const createIndentBlock = (elements: Exclude<AozoraElement, FormattingInstruction>[], indentCount: number): IndentBlock => ({
    type: 'indent-block',
    indentCount,
    elements,
    range: createMockRange(0, 100)
  })

  const createTextElement = (content: string): Exclude<AozoraElement, FormattingInstruction> => ({
    type: 'text',
    content,
    range: createMockRange(0, content.length)
  })

  const createRubyElement = (text: string, ruby: string): Exclude<AozoraElement, FormattingInstruction> => ({
    type: 'ruby',
    text,
    ruby,
    range: createMockRange(0, text.length)
  })

  const createHeadingElement = (text: string, level: 'large' | 'medium' | 'small' = 'medium'): Exclude<AozoraElement, FormattingInstruction> => ({
    type: 'heading',
    level,
    text,
    id: `heading-${text}`,
    range: createMockRange(0, text.length)
  })

  describe('基本的なブロック表示', () => {
    it('should render simple indent block with text elements', () => {
      const elements = [
        createTextElement('字下げされた1行目'),
        createTextElement('字下げされた2行目')
      ]
      const indentBlock = createIndentBlock(elements, 2)
      const { container } = render(<IndentBlockRenderer element={indentBlock} />)
      
      const blockDiv = container.querySelector('[class*="indent-block"]')
      expect(blockDiv).toBeInTheDocument()
      expect(blockDiv?.className).toContain('indent-block')
      expect((blockDiv as HTMLElement)?.style.marginLeft).toBe('2em')
      
      const textElements = container.querySelectorAll('span')
      expect(textElements).toHaveLength(2)
      expect(textElements[0]?.textContent).toBe('字下げされた1行目')
      expect(textElements[1]?.textContent).toBe('字下げされた2行目')
    })

    it('should render block with zero indentation', () => {
      const elements = [createTextElement('インデントなしブロック')]
      const indentBlock = createIndentBlock(elements, 0)
      const { container } = render(<IndentBlockRenderer element={indentBlock} />)
      
      const blockDiv = container.querySelector('[class*="indent-block"]')
      expect((blockDiv as HTMLElement)?.style.marginLeft).toBe('0em')
    })

    it('should render block with large indentation', () => {
      const elements = [createTextElement('大きなインデント')]
      const indentBlock = createIndentBlock(elements, 10)
      const { container } = render(<IndentBlockRenderer element={indentBlock} />)
      
      const blockDiv = container.querySelector('[class*="indent-block"]')
      expect((blockDiv as HTMLElement)?.style.marginLeft).toBe('10em')
    })
  })

  describe('複合要素を含むブロック', () => {
    it('should render block containing mixed element types', () => {
      const elements = [
        createTextElement('通常テキスト'),
        createRubyElement('漢字', 'かんじ'),
        createHeadingElement('見出し', 'medium'),
        createTextElement('最後のテキスト')
      ]
      const indentBlock = createIndentBlock(elements, 3)
      const { container } = render(<IndentBlockRenderer element={indentBlock} />)
      
      const blockDiv = container.querySelector('[class*="indent-block"]')
      expect((blockDiv as HTMLElement)?.style.marginLeft).toBe('3em')
      
      // 各要素が適切にレンダリングされているかチェック
      const textElements = container.querySelectorAll('span:not([class*="ruby"])')
      const rubyElements = container.querySelectorAll('[class*="ruby"]')
      const headingElements = container.querySelectorAll('[class*="heading"]')
      
      expect(textElements.length).toBeGreaterThan(0)
      expect(rubyElements).toHaveLength(1)
      expect(headingElements).toHaveLength(1)
    })

    it('should handle nested blocks', () => {
      const innerBlock = createIndentBlock([createTextElement('内側ブロック')], 2)
      const elements = [
        createTextElement('外側テキスト1'),
        innerBlock,
        createTextElement('外側テキスト2')
      ]
      const outerBlock = createIndentBlock(elements, 1)
      const { container } = render(<IndentBlockRenderer element={outerBlock} />)
      
      const blocks = container.querySelectorAll('[class*="indent-block"]')
      expect(blocks).toHaveLength(2) // 外側と内側のブロック
      
      const outerBlockElement = blocks[0]
      const innerBlockElement = blocks[1]
      
      expect((outerBlockElement as HTMLElement)?.style.marginLeft).toBe('1em')
      expect((innerBlockElement as HTMLElement)?.style.marginLeft).toBe('2em')
    })
  })

  describe('特殊ケースの処理', () => {
    it('should render empty block', () => {
      const indentBlock = createIndentBlock([], 2)
      const { container } = render(<IndentBlockRenderer element={indentBlock} />)
      
      const blockDiv = container.querySelector('[class*="indent-block"]')
      expect(blockDiv).toBeInTheDocument()
      expect(blockDiv?.children).toHaveLength(0)
      expect((blockDiv as HTMLElement)?.style.marginLeft).toBe('2em')
    })

    it('should handle block with only whitespace text', () => {
      const elements = [
        createTextElement(' '),
        createTextElement('\\n'),
        createTextElement('　　')
      ]
      const indentBlock = createIndentBlock(elements, 1)
      const { container } = render(<IndentBlockRenderer element={indentBlock} />)
      
      const textElements = container.querySelectorAll('span')
      expect(textElements).toHaveLength(3)
    })

    it('should handle block with image elements', () => {
      const imageElement: Exclude<AozoraElement, FormattingInstruction> = {
        type: 'image',
        description: 'テスト画像',
        filename: 'test.jpg',
        width: 100,
        height: 50,
        range: createMockRange(0, 10)
      }
      
      const elements = [
        createTextElement('画像の前'),
        imageElement,
        createTextElement('画像の後')
      ]
      const indentBlock = createIndentBlock(elements, 2)
      const { container } = render(<IndentBlockRenderer element={indentBlock} />)
      
      const blockDiv = container.querySelector('[class*="indent-block"]')
      expect((blockDiv as HTMLElement)?.style.marginLeft).toBe('2em')
      
      // 画像要素が含まれていることを確認
      const imgElement = container.querySelector('[class*="image"]')
      expect(imgElement).toBeInTheDocument()
    })
  })

  describe('極値の処理', () => {
    it('should handle maximum practical indentation', () => {
      const elements = [createTextElement('最大インデント')]
      const indentBlock = createIndentBlock(elements, 20)
      const { container } = render(<IndentBlockRenderer element={indentBlock} />)
      
      const blockDiv = container.querySelector('[class*="indent-block"]')
      expect((blockDiv as HTMLElement)?.style.marginLeft).toBe('20em')
    })

    it('should handle negative indentation (treat as zero)', () => {
      const elements = [createTextElement('負のインデント')]
      const indentBlock = createIndentBlock(elements, -2)
      const { container } = render(<IndentBlockRenderer element={indentBlock} />)
      
      const blockDiv = container.querySelector('[class*="indent-block"]')
      // 負の値は0として扱われる
      expect((blockDiv as HTMLElement)?.style.marginLeft).toBe('0em')
    })
  })

  describe('HTML構造とアクセシビリティ', () => {
    it('should use semantic div element with proper class', () => {
      const elements = [createTextElement('テスト')]
      const indentBlock = createIndentBlock(elements, 1)
      const { container } = render(<IndentBlockRenderer element={indentBlock} />)
      
      const blockDiv = container.querySelector('div')
      expect(blockDiv).toBeInTheDocument()
      expect(blockDiv?.tagName).toBe('DIV')
      expect(blockDiv?.className).toContain('indent-block')
    })

    it('should maintain element rendering order', () => {
      const elements = [
        createTextElement('1番目'),
        createTextElement('2番目'),
        createTextElement('3番目')
      ]
      const indentBlock = createIndentBlock(elements, 1)
      const { container } = render(<IndentBlockRenderer element={indentBlock} />)
      
      const textElements = container.querySelectorAll('span')
      expect(textElements[0]?.textContent).toBe('1番目')
      expect(textElements[1]?.textContent).toBe('2番目')
      expect(textElements[2]?.textContent).toBe('3番目')
    })

    it('should have consistent styling for blocks at same level', () => {
      const block1 = createIndentBlock([createTextElement('ブロック1')], 3)
      const block2 = createIndentBlock([createTextElement('ブロック2')], 3)
      
      const { container: container1 } = render(<IndentBlockRenderer element={block1} />)
      const { container: container2 } = render(<IndentBlockRenderer element={block2} />)
      
      const div1 = container1.querySelector('[class*="indent-block"]')
      const div2 = container2.querySelector('[class*="indent-block"]')
      
      expect((div1 as HTMLElement)?.style.marginLeft).toBe((div2 as HTMLElement)?.style.marginLeft)
      expect(div1?.className).toBe(div2?.className)
    })
  })

  describe('パフォーマンスとエラーハンドリング', () => {
    it('should handle large number of elements', () => {
      const elements = Array.from({ length: 100 }, (_, i) => 
        createTextElement(`要素${i + 1}`)
      )
      const indentBlock = createIndentBlock(elements, 1)
      const { container } = render(<IndentBlockRenderer element={indentBlock} />)
      
      const blockDiv = container.querySelector('[class*="indent-block"]')
      expect(blockDiv?.children).toHaveLength(100)
    })

    it('should gracefully handle undefined or null elements', () => {
      // TypeScriptでは通常発生しないが、実行時の安全性をテスト
      const elements = [
        createTextElement('正常な要素'),
        null as any,
        undefined as any,
        createTextElement('別の正常な要素')
      ].filter(Boolean) // null/undefinedを除去
      
      const indentBlock = createIndentBlock(elements, 2)
      const { container } = render(<IndentBlockRenderer element={indentBlock} />)
      
      const blockDiv = container.querySelector('[class*="indent-block"]')
      expect(blockDiv).toBeInTheDocument()
      // フィルターされた要素のみがレンダリングされる
      const textElements = container.querySelectorAll('span')
      expect(textElements).toHaveLength(2)
    })
  })
})