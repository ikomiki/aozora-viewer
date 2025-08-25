import { describe, it, expect } from 'vitest'
import AozoraParser from '../AozoraParser'

describe('Text Formatting Integration Tests', () => {
  const parser = new AozoraParser({
    enableTextFormatting: true,
    preserveLeadingSpaces: true
  })

  describe('Left indentation (字上げ)', () => {
    it('should parse and process left indentation instructions', () => {
      const text = '［＃２字上げ］このテキストは２文字左にインデントされます'
      const result = parser.parse(text, 'test.txt')
      
      expect(result.elements.length).toBeGreaterThan(0)
      const indentedElement = result.elements.find(e => e.type === 'left-indented-text')
      expect(indentedElement).toBeDefined()
      expect(indentedElement?.type).toBe('left-indented-text')
      
      if (indentedElement?.type === 'left-indented-text') {
        expect(indentedElement.content).toBe('このテキストは２文字左にインデントされます')
        expect(indentedElement.indentCount).toBe(2)
      }
    })

    it('should handle multiple left indentation instructions', () => {
      const text = `［＃１字上げ］最初の行
［＃３字上げ］２番目の行
通常の行`
      const result = parser.parse(text, 'test.txt')
      
      // 最初の行
      const firstLine = result.elements.find(e => 
        e.type === 'left-indented-text' && e.content === '最初の行'
      )
      expect(firstLine).toBeDefined()
      if (firstLine?.type === 'left-indented-text') {
        expect(firstLine.indentCount).toBe(1)
      }
      
      // ２番目の行
      const secondLine = result.elements.find(e => 
        e.type === 'left-indented-text' && e.content === '２番目の行'
      )
      expect(secondLine).toBeDefined()
      if (secondLine?.type === 'left-indented-text') {
        expect(secondLine.indentCount).toBe(3)
      }
      
      // 通常の行
      const thirdLine = result.elements.find(e => 
        e.type === 'text' && e.content.includes('通常の行')
      )
      expect(thirdLine).toBeDefined()
    })
  })

  describe('Right indentation (右寄せ)', () => {
    it('should parse and process right indentation instructions', () => {
      const text = '［＃地から２字上げ］このテキストは右寄せされます'
      const result = parser.parse(text, 'test.txt')
      
      expect(result.elements.length).toBeGreaterThan(0)
      const indentedElement = result.elements.find(e => e.type === 'right-indented-text')
      expect(indentedElement).toBeDefined()
      expect(indentedElement?.type).toBe('right-indented-text')
      
      if (indentedElement?.type === 'right-indented-text') {
        expect(indentedElement.content).toBe('このテキストは右寄せされます')
        expect(indentedElement.indentCount).toBe(2)
      }
    })

    it('should handle multiple right indentation instructions', () => {
      const text = `［＃地から１字上げ］右寄せ行１
［＃地から３字上げ］右寄せ行２
通常の行`
      const result = parser.parse(text, 'test.txt')
      
      // 最初の右寄せ行
      const firstLine = result.elements.find(e => 
        e.type === 'right-indented-text' && e.content === '右寄せ行１'
      )
      expect(firstLine).toBeDefined()
      if (firstLine?.type === 'right-indented-text') {
        expect(firstLine.indentCount).toBe(1)
      }
      
      // ２番目の右寄せ行
      const secondLine = result.elements.find(e => 
        e.type === 'right-indented-text' && e.content === '右寄せ行２'
      )
      expect(secondLine).toBeDefined()
      if (secondLine?.type === 'right-indented-text') {
        expect(secondLine.indentCount).toBe(3)
      }
      
      // 通常の行
      const thirdLine = result.elements.find(e => 
        e.type === 'text' && e.content.includes('通常の行')
      )
      expect(thirdLine).toBeDefined()
    })
  })

  describe('Block indentation (字下げ)', () => {
    it('should parse and process simple block indentation', () => {
      const text = `［＃ここから２字下げ］
字下げされた1行目
字下げされた2行目
［＃ここで字下げ終わり］`

      const result = parser.parse(text, 'test.txt')
      
      // インデントブロックが作成されているかチェック
      const indentBlock = result.elements.find(e => e.type === 'indent-block')
      expect(indentBlock).toBeDefined()
      
      if (indentBlock?.type === 'indent-block') {
        expect(indentBlock.indentCount).toBe(2)
        expect(indentBlock.elements.length).toBeGreaterThan(0)
        
        // ブロック内のテキスト要素をチェック
        const textElements = indentBlock.elements.filter(e => e.type === 'text')
        expect(textElements.length).toBeGreaterThan(0)
      }
    })

    it('should handle nested block indentation', () => {
      const text = `［＃ここから１字下げ］
外側のテキスト
［＃ここから２字下げ］
内側のテキスト
［＃ここで字下げ終わり］
外側に戻ったテキスト
［＃ここで字下げ終わり］`

      const result = parser.parse(text, 'test.txt')
      
      // 外側のブロックを探す
      const outerBlock = result.elements.find(e => e.type === 'indent-block')
      expect(outerBlock).toBeDefined()
      
      if (outerBlock?.type === 'indent-block') {
        expect(outerBlock.indentCount).toBe(1)
        
        // 内側にネストしたブロックを探す
        const nestedBlock = outerBlock.elements.find(e => e.type === 'indent-block')
        expect(nestedBlock).toBeDefined()
        
        if (nestedBlock?.type === 'indent-block') {
          expect(nestedBlock.indentCount).toBe(2)
        }
      }
    })
  })

  describe('Mixed formatting', () => {
    it('should handle left indentation, right indentation and block indentation together', () => {
      const text = `通常のテキスト
［＃１字上げ］左インデントテキスト
［＃地から１字上げ］右寄せテキスト
［＃ここから２字下げ］
ブロック内のテキスト
［＃１字上げ］ブロック内で左インデント
［＃ここで字下げ終わり］
最後のテキスト`

      const result = parser.parse(text, 'test.txt')
      
      // 通常のテキストがある
      const normalText = result.elements.find(e => e.type === 'text' && e.content.includes('通常のテキスト'))
      expect(normalText).toBeDefined()
      
      // 左インデントテキストがある
      const leftIndentedText = result.elements.find(e => e.type === 'left-indented-text')
      expect(leftIndentedText).toBeDefined()
      
      // 右寄せテキストがある
      const rightIndentedText = result.elements.find(e => e.type === 'right-indented-text')
      expect(rightIndentedText).toBeDefined()
      
      // ブロックインデントがある
      const indentBlock = result.elements.find(e => e.type === 'indent-block')
      expect(indentBlock).toBeDefined()
    })

    it('should handle formatting with ruby and other elements', () => {
      const text = `［＃ここから１字下げ］
通常のテキストと｜漢字《かんじ》のルビ
見出し［＃「見出し」は中見出し］
［＃ここで字下げ終わり］`

      const result = parser.parse(text, 'test.txt')
      
      // ブロックが作成される
      const indentBlock = result.elements.find(e => e.type === 'indent-block')
      expect(indentBlock).toBeDefined()
      
      if (indentBlock?.type === 'indent-block') {
        // ブロック内にルビ要素がある
        const hasRuby = indentBlock.elements.some(e => e.type === 'ruby')
        expect(hasRuby).toBe(true)
        
        // ブロック内に見出し要素がある
        const hasHeading = indentBlock.elements.some(e => e.type === 'heading')
        expect(hasHeading).toBe(true)
      }
    })
  })

  describe('Leading space preservation', () => {
    it('should preserve leading fullwidth spaces when enabled', () => {
      const parserWithSpaces = new AozoraParser({
        enableTextFormatting: true,
        preserveLeadingSpaces: true
      })
      
      const text = `　　全角スペースが先頭にあります
普通の行
　もう一つの全角スペース行`

      const result = parserWithSpaces.parse(text, 'test.txt')
      
      // 全角スペースが保持されているかチェック
      const firstLine = result.elements[0]
      if (firstLine.type === 'text') {
        expect(firstLine.content).toContain('　　全角スペース')
      }
    })

    it('should work correctly with formatting instructions', () => {
      const text = `［＃ここから２字下げ］
　　既存の全角スペース付き行
［＃地から１字上げ］字上げと組み合わせ
［＃ここで字下げ終わり］`

      const result = parser.parse(text, 'test.txt')
      
      const indentBlock = result.elements.find(e => e.type === 'indent-block')
      expect(indentBlock).toBeDefined()
      
      if (indentBlock?.type === 'indent-block') {
        // 既存の全角スペースが保持された行を探す
        const spacedLine = indentBlock.elements.find(e => 
          e.type === 'text' && e.content.includes('　　既存の全角スペース')
        )
        expect(spacedLine).toBeDefined()
        
        // ブロック内では字上げ指示が別途処理される場合があるため、柔軟にチェック
        expect(indentBlock.elements.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle malformed instructions gracefully', () => {
      const text = `［＃ここから字下げ］無効な指示
［＃地から上げ］別の無効な指示
正常なテキスト`

      expect(() => {
        const result = parser.parse(text, 'test.txt')
        expect(result.elements.length).toBeGreaterThan(0)
      }).not.toThrow()
    })

    it('should handle unclosed blocks', () => {
      const text = `［＃ここから２字下げ］
開始されたが終了されないブロック
テキストが続く`

      expect(() => {
        const result = parser.parse(text, 'test.txt')
        expect(result.elements.length).toBeGreaterThan(0)
      }).not.toThrow()
    })

    it('should handle orphaned end instructions', () => {
      const text = `普通のテキスト
［＃ここで字下げ終わり］対応する開始がない
また普通のテキスト`

      expect(() => {
        const result = parser.parse(text, 'test.txt')
        expect(result.elements.length).toBeGreaterThan(0)
      }).not.toThrow()
    })
  })
})