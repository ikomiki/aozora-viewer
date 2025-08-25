import type { FormattingInstruction, Range } from '../../types'

interface ParseResult<T> {
  element: T;
  length: number;
}

export class FormattingInstructionParser {
  private maxIndentCount: number

  constructor(maxIndentCount: number = 20) {
    this.maxIndentCount = maxIndentCount
  }

  parseLeftIndent(text: string, startIndex: number): ParseResult<FormattingInstruction> | null {
    // 左インデント指示: ［＃２字上げ］ (半角・全角数字両対応)
    const pattern = /^［＃([０-９0-9]+)字上げ］/
    const match = text.match(pattern)
    
    if (!match) {
      return null
    }

    // 全角数字を半角に変換してパース
    const numberStr = match[1].replace(/[０-９]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
    })
    const indentCount = parseInt(numberStr, 10)
    
    if (indentCount <= 0) {
      return null
    }

    const instruction = match[0]
    const range = this.createRange(startIndex, startIndex + instruction.length)

    return {
      element: {
        type: 'formatting-instruction',
        instruction,
        instructionType: 'left-indent',
        indentCount: indentCount,
        range
      },
      length: instruction.length
    }
  }

  parseRightIndent(text: string, startIndex: number): ParseResult<FormattingInstruction> | null {
    // 右寄せ指示: ［＃地から２字上げ］ (半角・全角数字両対応)
    const pattern = /^［＃地から([０-９0-9]+)字上げ］/
    const match = text.match(pattern)
    
    if (!match) {
      return null
    }

    // 全角数字を半角に変換してパース
    const numberStr = match[1].replace(/[０-９]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
    })
    const indentCount = parseInt(numberStr, 10)
    
    if (indentCount <= 0) {
      return null
    }

    const instruction = match[0]
    const range = this.createRange(startIndex, startIndex + instruction.length)

    return {
      element: {
        type: 'formatting-instruction',
        instruction,
        instructionType: 'right-indent',
        indentCount: indentCount,
        range
      },
      length: instruction.length
    }
  }

  parseBlockIndentStart(text: string, startIndex: number): ParseResult<FormattingInstruction> | null {
    // 字下げブロック開始: ［＃ここから１字下げ］ (半角・全角数字両対応)
    const pattern = /^［＃ここから([０-９0-9]+)字下げ］/
    const match = text.match(pattern)
    
    if (!match) {
      return null
    }

    // 全角数字を半角に変換してパース
    const numberStr = match[1].replace(/[０-９]/g, (char) => {
      return String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
    })
    const indentCount = parseInt(numberStr, 10)
    
    if (indentCount <= 0) {
      return null
    }

    // 最大値制限
    const clampedIndentCount = Math.min(indentCount, this.maxIndentCount)

    const instruction = match[0]
    const range = this.createRange(startIndex, startIndex + instruction.length)

    return {
      element: {
        type: 'formatting-instruction',
        instruction,
        instructionType: 'indent-start',
        indentCount: clampedIndentCount,
        range
      },
      length: instruction.length
    }
  }

  parseBlockIndentEnd(text: string, startIndex: number): ParseResult<FormattingInstruction> | null {
    // 字下げブロック終了: ［＃ここで字下げ終わり］
    const pattern = /^［＃ここで字下げ終わり］/
    const match = text.match(pattern)
    
    if (!match) {
      return null
    }

    const instruction = match[0]
    const range = this.createRange(startIndex, startIndex + instruction.length)

    return {
      element: {
        type: 'formatting-instruction',
        instruction,
        instructionType: 'indent-end',
        indentCount: undefined,
        range
      },
      length: instruction.length
    }
  }

  preserveLeadingSpaces(line: string): string {
    // 行頭の半角スペースを削除し、全角スペース（\u3000）は保持
    return line.replace(/^[ \t]+/, '')
  }

  private createRange(start: number, end: number): Range {
    return {
      start: { line: 0, column: start, index: start },
      end: { line: 0, column: end, index: end }
    }
  }
}