import type { AozoraElement, IndentBlock, FormattingInstruction, Range } from '../../types'

interface IndentBlockStackItem {
  indentCount: number
  elements: Exclude<AozoraElement, FormattingInstruction>[]
  startRange: Range
}

export class IndentBlockProcessor {
  
  processIndentBlocks(elements: AozoraElement[]): AozoraElement[] {
    const result: AozoraElement[] = []
    const blockStack: IndentBlockStackItem[] = []
    
    for (const element of elements) {
      if (element.type === 'formatting-instruction') {
        if (element.instructionType === 'indent-start') {
          // 新しいブロックを開始
          const newBlock: IndentBlockStackItem = {
            indentCount: element.indentCount || 1,
            elements: [],
            startRange: element.range
          }
          blockStack.push(newBlock)
        } else if (element.instructionType === 'indent-end') {
          // ブロックを終了
          if (blockStack.length > 0) {
            const completedBlock = blockStack.pop()!
            const indentBlock: IndentBlock = {
              type: 'indent-block',
              indentCount: completedBlock.indentCount,
              elements: completedBlock.elements,
              range: {
                start: completedBlock.startRange.start,
                end: element.range.end
              }
            }
            
            // 完成したブロックを適切な場所に追加
            if (blockStack.length > 0) {
              // ネストした場合は親ブロックに追加
              blockStack[blockStack.length - 1].elements.push(indentBlock)
            } else {
              // トップレベルの場合は結果に追加
              result.push(indentBlock)
            }
          }
          // 孤立した終了指示は無視
        } else if (element.instructionType === 'left-indent' || element.instructionType === 'right-indent') {
          // left-indent, right-indent 指示は他のフェーズで処理するため、そのまま通す
          if (blockStack.length > 0) {
            // ブロック内の場合は現在のブロックに追加
            blockStack[blockStack.length - 1].elements.push(element as any)
          } else {
            // ブロック外の場合は結果に直接追加
            result.push(element as any)
          }
        }
        // その他の整形指示（indent-start, indent-end）は最終結果から除去されるので何もしない
      } else {
        // 通常の要素
        if (blockStack.length > 0) {
          // ブロック内の場合は現在のブロックに追加
          blockStack[blockStack.length - 1].elements.push(element)
        } else {
          // ブロック外の場合は結果に直接追加
          result.push(element)
        }
      }
    }
    
    // 未閉じのブロックがあれば自動的に閉じる
    while (blockStack.length > 0) {
      const completedBlock = blockStack.pop()!
      const indentBlock: IndentBlock = {
        type: 'indent-block',
        indentCount: completedBlock.indentCount,
        elements: completedBlock.elements,
        range: completedBlock.startRange // 終了範囲は不明なので開始範囲を使用
      }
      
      if (blockStack.length > 0) {
        // まだ親ブロックがある場合
        blockStack[blockStack.length - 1].elements.push(indentBlock)
      } else {
        // 最上位レベルの場合
        result.push(indentBlock)
      }
    }
    
    return result
  }

  removeFormattingInstructions(elements: AozoraElement[]): AozoraElement[] {
    return elements.filter(element => element.type !== 'formatting-instruction')
  }
}