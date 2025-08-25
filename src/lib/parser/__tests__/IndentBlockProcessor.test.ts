import { describe, it, expect } from 'vitest'
import { IndentBlockProcessor } from '../IndentBlockProcessor'
import type { AozoraElement, IndentBlock, FormattingInstruction, PlainText, Range } from '../../../types'

describe('IndentBlockProcessor', () => {
  const processor = new IndentBlockProcessor()

  // Helper function to create mock elements
  const createMockRange = (start: number, end: number): Range => ({
    start: { line: 0, column: start, index: start },
    end: { line: 0, column: end, index: end }
  })

  const createFormattingInstruction = (
    type: 'indent-start' | 'indent-end' | 'line-indent',
    indentCount?: number
  ): FormattingInstruction => ({
    type: 'formatting-instruction',
    instruction: type === 'indent-start' ? '［＃ここから１字下げ］' : 
                 type === 'indent-end' ? '［＃ここで字下げ終わり］' :
                 '［＃地から２字上げ］',
    instructionType: type,
    indentCount,
    range: createMockRange(0, 10)
  })

  const createPlainText = (content: string): PlainText => ({
    type: 'text',
    content,
    range: createMockRange(0, content.length)
  })

  describe('processIndentBlocks', () => {
    it('should group simple indent block', () => {
      const elements: AozoraElement[] = [
        createFormattingInstruction('indent-start', 2),
        createPlainText('字下げされたテキスト1'),
        createPlainText('字下げされたテキスト2'),
        createFormattingInstruction('indent-end')
      ]
      
      const result = processor.processIndentBlocks(elements)
      
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('indent-block')
      const indentBlock = result[0] as IndentBlock
      expect(indentBlock.indentCount).toBe(2)
      expect(indentBlock.elements).toHaveLength(2)
      expect(indentBlock.elements[0].type).toBe('text')
      expect(indentBlock.elements[1].type).toBe('text')
    })

    it('should handle nested indent blocks', () => {
      const elements: AozoraElement[] = [
        createFormattingInstruction('indent-start', 1),
        createPlainText('外側テキスト'),
        createFormattingInstruction('indent-start', 2),
        createPlainText('内側テキスト'),
        createFormattingInstruction('indent-end'),
        createPlainText('外側に戻る'),
        createFormattingInstruction('indent-end')
      ]
      
      const result = processor.processIndentBlocks(elements)
      
      expect(result).toHaveLength(1)
      const outerBlock = result[0] as IndentBlock
      expect(outerBlock.type).toBe('indent-block')
      expect(outerBlock.indentCount).toBe(1)
      expect(outerBlock.elements).toHaveLength(3) // 外側テキスト + 内側ブロック + 外側に戻る
      
      // ネストしたブロックが含まれているかチェック
      const nestedBlock = outerBlock.elements.find(e => e.type === 'indent-block') as IndentBlock
      expect(nestedBlock).toBeDefined()
      expect(nestedBlock.indentCount).toBe(2)
      expect(nestedBlock.elements).toHaveLength(1)
    })

    it('should handle unclosed blocks by auto-closing them', () => {
      const elements: AozoraElement[] = [
        createFormattingInstruction('indent-start', 1),
        createPlainText('終了指示なしのテキスト'),
        createPlainText('もう一行')
        // indent-end がない
      ]
      
      const result = processor.processIndentBlocks(elements)
      
      // 自動的にブロックが閉じられる
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('indent-block')
      const indentBlock = result[0] as IndentBlock
      expect(indentBlock.elements).toHaveLength(2)
    })

    it('should handle blocks with mixed content types', () => {
      const elements: AozoraElement[] = [
        createFormattingInstruction('indent-start', 3),
        createPlainText('テキスト'),
        {
          type: 'ruby',
          text: '漢字',
          ruby: 'かんじ',
          range: createMockRange(0, 2)
        },
        {
          type: 'heading',
          level: 'medium',
          text: '見出し',
          id: 'heading-1',
          range: createMockRange(0, 3)
        },
        createFormattingInstruction('indent-end')
      ]
      
      const result = processor.processIndentBlocks(elements)
      
      expect(result).toHaveLength(1)
      const indentBlock = result[0] as IndentBlock
      expect(indentBlock.elements).toHaveLength(3) // text + ruby + heading
      expect(indentBlock.elements.some(e => e.type === 'ruby')).toBe(true)
      expect(indentBlock.elements.some(e => e.type === 'heading')).toBe(true)
    })

    it('should preserve non-block elements outside indent blocks', () => {
      const elements: AozoraElement[] = [
        createPlainText('通常のテキスト1'),
        createFormattingInstruction('indent-start', 1),
        createPlainText('字下げテキスト'),
        createFormattingInstruction('indent-end'),
        createPlainText('通常のテキスト2')
      ]
      
      const result = processor.processIndentBlocks(elements)
      
      expect(result).toHaveLength(3) // 通常テキスト + ブロック + 通常テキスト
      expect(result[0].type).toBe('text')
      expect(result[1].type).toBe('indent-block')
      expect(result[2].type).toBe('text')
    })

    it('should handle multiple separate blocks', () => {
      const elements: AozoraElement[] = [
        createFormattingInstruction('indent-start', 1),
        createPlainText('最初のブロック'),
        createFormattingInstruction('indent-end'),
        createPlainText('間のテキスト'),
        createFormattingInstruction('indent-start', 2),
        createPlainText('二番目のブロック'),
        createFormattingInstruction('indent-end')
      ]
      
      const result = processor.processIndentBlocks(elements)
      
      expect(result).toHaveLength(3) // ブロック1 + 間テキスト + ブロック2
      expect(result[0].type).toBe('indent-block')
      expect(result[1].type).toBe('text')
      expect(result[2].type).toBe('indent-block')
      
      const block1 = result[0] as IndentBlock
      const block2 = result[2] as IndentBlock
      expect(block1.indentCount).toBe(1)
      expect(block2.indentCount).toBe(2)
    })

    it('should handle orphaned indent-end instructions', () => {
      const elements: AozoraElement[] = [
        createPlainText('通常テキスト'),
        createFormattingInstruction('indent-end'), // 対応する開始がない
        createPlainText('その後のテキスト')
      ]
      
      const result = processor.processIndentBlocks(elements)
      
      // 孤立した終了指示は無視され、テキストのみが残る
      expect(result).toHaveLength(2)
      expect(result[0].type).toBe('text')
      expect(result[1].type).toBe('text')
    })
  })

  describe('removeFormattingInstructions', () => {
    it('should remove all formatting instructions', () => {
      const elements: AozoraElement[] = [
        createPlainText('通常テキスト'),
        createFormattingInstruction('indent-start', 1),
        createPlainText('字下げテキスト'),
        createFormattingInstruction('indent-end'),
        createFormattingInstruction('line-indent', -2),
        createPlainText('最後のテキスト')
      ]
      
      const result = processor.removeFormattingInstructions(elements)
      
      expect(result).toHaveLength(3) // テキスト要素のみ残る
      expect(result.every(e => e.type !== 'formatting-instruction')).toBe(true)
      expect(result[0].type).toBe('text')
      expect(result[1].type).toBe('text')
      expect(result[2].type).toBe('text')
    })

    it('should preserve non-instruction elements', () => {
      const elements: AozoraElement[] = [
        createPlainText('テキスト'),
        {
          type: 'ruby',
          text: '漢字',
          ruby: 'かんじ',
          range: createMockRange(0, 2)
        },
        createFormattingInstruction('line-indent', -1),
        {
          type: 'heading',
          level: 'large',
          text: '見出し',
          id: 'heading-1',
          range: createMockRange(0, 3)
        }
      ]
      
      const result = processor.removeFormattingInstructions(elements)
      
      expect(result).toHaveLength(3) // text + ruby + heading
      expect(result.some(e => e.type === 'text')).toBe(true)
      expect(result.some(e => e.type === 'ruby')).toBe(true)
      expect(result.some(e => e.type === 'heading')).toBe(true)
      expect(result.some(e => e.type === 'formatting-instruction')).toBe(false)
    })

    it('should handle empty array', () => {
      const result = processor.removeFormattingInstructions([])
      expect(result).toEqual([])
    })

    it('should handle array with only formatting instructions', () => {
      const elements: AozoraElement[] = [
        createFormattingInstruction('indent-start', 1),
        createFormattingInstruction('indent-end'),
        createFormattingInstruction('line-indent', -2)
      ]
      
      const result = processor.removeFormattingInstructions(elements)
      expect(result).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle deeply nested blocks', () => {
      const elements: AozoraElement[] = [
        createFormattingInstruction('indent-start', 1),
        createPlainText('レベル1'),
        createFormattingInstruction('indent-start', 2),
        createPlainText('レベル2'),
        createFormattingInstruction('indent-start', 3),
        createPlainText('レベル3'),
        createFormattingInstruction('indent-end'),
        createFormattingInstruction('indent-end'),
        createFormattingInstruction('indent-end')
      ]
      
      const result = processor.processIndentBlocks(elements)
      
      expect(result).toHaveLength(1)
      const outerBlock = result[0] as IndentBlock
      expect(outerBlock.indentCount).toBe(1)
      
      // 深くネストしたブロック構造が正しく処理される
      const level2Block = outerBlock.elements.find(e => e.type === 'indent-block') as IndentBlock
      expect(level2Block).toBeDefined()
      expect(level2Block.indentCount).toBe(2)
      
      const level3Block = level2Block.elements.find(e => e.type === 'indent-block') as IndentBlock
      expect(level3Block).toBeDefined()
      expect(level3Block.indentCount).toBe(3)
    })

    it('should handle empty blocks', () => {
      const elements: AozoraElement[] = [
        createFormattingInstruction('indent-start', 1),
        createFormattingInstruction('indent-end')
      ]
      
      const result = processor.processIndentBlocks(elements)
      
      expect(result).toHaveLength(1)
      const indentBlock = result[0] as IndentBlock
      expect(indentBlock.elements).toHaveLength(0)
    })
  })
})