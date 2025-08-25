import { describe, it, expect } from 'vitest'
import { FormattingInstructionParser } from '../FormattingInstructionParser'

describe('FormattingInstructionParser', () => {
  const parser = new FormattingInstructionParser()

  describe('parseLeftIndent', () => {
    it('should parse left indent instruction', () => {
      const input = '［＃２字上げ］'
      const result = parser.parseLeftIndent(input, 0)
      
      expect(result).toEqual({
        element: {
          type: 'formatting-instruction',
          instruction: '［＃２字上げ］',
          instructionType: 'left-indent',
          indentCount: 2,
          range: expect.objectContaining({
            start: expect.objectContaining({ index: 0 }),
            end: expect.objectContaining({ index: 7 })
          })
        },
        length: 7
      })
    })

    it('should handle various left indent counts', () => {
      const testCases = [
        { input: '［＃１字上げ］', expected: 1 },
        { input: '［＃３字上げ］', expected: 3 },
        { input: '［＃10字上げ］', expected: 10 }
      ]
      
      testCases.forEach(({ input, expected }) => {
        const result = parser.parseLeftIndent(input, 0)
        expect(result?.element.indentCount).toBe(expected)
      })
    })

    it('should return null for invalid left indent instructions', () => {
      const invalidInputs = [
        '［＃字上げ］',           // 数字なし
        '［＃-2字上げ］',         // 負数
        '［＃0字上げ］',          // ゼロ
        '［２字上げ］',           // ＃なし
        '２字上げ',              // 括弧なし
        '［＃地から２字上げ］'    // 地からを含む（これは右寄せ用）
      ]
      
      invalidInputs.forEach(input => {
        const result = parser.parseLeftIndent(input, 0)
        expect(result).toBeNull()
      })
    })

    it('should handle text after left indent instruction', () => {
      const input = '［＃２字上げ］後続のテキスト'
      const result = parser.parseLeftIndent(input, 0)
      
      expect(result?.length).toBe(7) // 指示部分のみの長さ
      expect(result?.element.instruction).toBe('［＃２字上げ］')
    })
  })

  describe('parseRightIndent', () => {
    it('should parse right indent instruction', () => {
      const input = '［＃地から２字上げ］'
      const result = parser.parseRightIndent(input, 0)
      
      expect(result).toEqual({
        element: {
          type: 'formatting-instruction',
          instruction: '［＃地から２字上げ］',
          instructionType: 'right-indent',
          indentCount: 2,
          range: expect.objectContaining({
            start: expect.objectContaining({ index: 0 }),
            end: expect.objectContaining({ index: 10 })
          })
        },
        length: 10
      })
    })

    it('should handle various right indent counts', () => {
      const testCases = [
        { input: '［＃地から１字上げ］', expected: 1 },
        { input: '［＃地から３字上げ］', expected: 3 },
        { input: '［＃地から10字上げ］', expected: 10 }
      ]
      
      testCases.forEach(({ input, expected }) => {
        const result = parser.parseRightIndent(input, 0)
        expect(result?.element.indentCount).toBe(expected)
      })
    })

    it('should return null for invalid right indent instructions', () => {
      const invalidInputs = [
        '［＃地から字上げ］',     // 数字なし
        '［＃地から-2字上げ］',   // 負数
        '［＃地から0字上げ］',    // ゼロ
        '［地から２字上げ］',     // ＃なし
        '地から２字上げ',        // 括弧なし
        '［＃２字上げ］'         // 地からなし（これは左インデント用）
      ]
      
      invalidInputs.forEach(input => {
        const result = parser.parseRightIndent(input, 0)
        expect(result).toBeNull()
      })
    })

    it('should handle text after right indent instruction', () => {
      const input = '［＃地から２字上げ］後続のテキスト'
      const result = parser.parseRightIndent(input, 0)
      
      expect(result?.length).toBe(10) // 指示部分のみの長さ
      expect(result?.element.instruction).toBe('［＃地から２字上げ］')
    })
  })

  describe('parseBlockIndentStart', () => {
    it('should parse block indent start instruction', () => {
      const input = '［＃ここから１字下げ］'
      const result = parser.parseBlockIndentStart(input, 0)
      
      expect(result).toEqual({
        element: {
          type: 'formatting-instruction',
          instruction: '［＃ここから１字下げ］',
          instructionType: 'indent-start',
          indentCount: 1,
          range: expect.objectContaining({
            start: expect.objectContaining({ index: 0 }),
            end: expect.objectContaining({ index: 11 })
          })
        },
        length: 11
      })
    })

    it('should handle various indent counts for blocks', () => {
      const testCases = [
        { input: '［＃ここから１字下げ］', expected: 1 },
        { input: '［＃ここから５字下げ］', expected: 5 },
        { input: '［＃ここから15字下げ］', expected: 15 }
      ]
      
      testCases.forEach(({ input, expected }) => {
        const result = parser.parseBlockIndentStart(input, 0)
        expect(result?.element.indentCount).toBe(expected)
      })
    })

    it('should limit excessive indent counts', () => {
      const input = '［＃ここから100字下げ］'
      const result = parser.parseBlockIndentStart(input, 0)
      
      // 最大値20でクランプされる
      expect(result?.element.indentCount).toBe(20)
    })

    it('should return null for invalid block start instructions', () => {
      const invalidInputs = [
        '［＃ここから字下げ］',      // 数字なし
        '［＃ここから-1字下げ］',    // 負数
        '［＃ここから0字下げ］',     // ゼロ
        '［ここから１字下げ］',      // ＃なし
      ]
      
      invalidInputs.forEach(input => {
        const result = parser.parseBlockIndentStart(input, 0)
        expect(result).toBeNull()
      })
    })
  })

  describe('parseBlockIndentEnd', () => {
    it('should parse block indent end instruction', () => {
      const input = '［＃ここで字下げ終わり］'
      const result = parser.parseBlockIndentEnd(input, 0)
      
      expect(result).toEqual({
        element: {
          type: 'formatting-instruction',
          instruction: '［＃ここで字下げ終わり］',
          instructionType: 'indent-end',
          indentCount: undefined,
          range: expect.objectContaining({
            start: expect.objectContaining({ index: 0 }),
            end: expect.objectContaining({ index: 12 })
          })
        },
        length: 12
      })
    })

    it('should return null for invalid end instructions', () => {
      const invalidInputs = [
        '［＃ここで字下げ］',         // 不完全
        '［ここで字下げ終わり］',     // ＃なし
        '＃ここで字下げ終わり'       // 括弧なし
      ]
      
      invalidInputs.forEach(input => {
        const result = parser.parseBlockIndentEnd(input, 0)
        expect(result).toBeNull()
      })
    })
  })

  describe('preserveLeadingSpaces', () => {
    it('should preserve leading fullwidth spaces', () => {
      const testCases = [
        { input: '　　テスト', expected: '　　テスト' },
        { input: '　テスト　', expected: '　テスト　' },
        { input: 'テスト', expected: 'テスト' },
        { input: '　', expected: '　' },
        { input: '', expected: '' }
      ]
      
      testCases.forEach(({ input, expected }) => {
        const result = parser.preserveLeadingSpaces(input)
        expect(result).toBe(expected)
      })
    })

    it('should trim half-width spaces but preserve fullwidth', () => {
      const testCases = [
        { input: '  　テスト', expected: '　テスト' },  // 半角スペース→削除、全角→保持
        { input: ' 　　テスト', expected: '　　テスト' }, // 半角スペース→削除
        { input: '　  テスト', expected: '　  テスト' }, // 全角の後の半角は保持
      ]
      
      testCases.forEach(({ input, expected }) => {
        const result = parser.preserveLeadingSpaces(input)
        expect(result).toBe(expected)
      })
    })

    it('should handle mixed whitespace correctly', () => {
      // 行頭の半角スペースは削除、全角スペースは保持
      const input = '  　　　テキスト'
      const result = parser.preserveLeadingSpaces(input)
      expect(result).toBe('　　　テキスト')
    })
  })
})