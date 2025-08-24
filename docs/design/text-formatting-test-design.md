# テキスト整形機能テスト設計書

## テスト戦略

### テストピラミッド
```
       E2E Tests (10%)
    ─────────────────
   Integration Tests (30%)
  ─────────────────────────
 Unit Tests (60%)
─────────────────────────────
```

## テストケース設計

### 1. 単体テスト (Unit Tests)

#### 1.1 FormattingInstructionParser テスト

```typescript
describe('FormattingInstructionParser', () => {
  describe('parseLineIndent', () => {
    it('should parse simple line indent instruction', () => {
      const input = '［＃地から２字上げ］'
      const result = parser.parseLineIndent(input, 0)
      
      expect(result).toEqual({
        element: {
          type: 'formatting-instruction',
          instruction: '［＃地から２字上げ］',
          instructionType: 'line-indent',
          indentCount: -2, // 負数で字上げ
          range: { start: { line: 0, column: 0, index: 0 }, end: { line: 0, column: 8, index: 8 } }
        },
        length: 8
      })
    })

    it('should handle various indent counts', () => {
      const testCases = [
        { input: '［＃地から１字上げ］', expected: -1 },
        { input: '［＃地から３字上げ］', expected: -3 },
        { input: '［＃地から10字上げ］', expected: -10 }
      ]
      
      testCases.forEach(({ input, expected }) => {
        const result = parser.parseLineIndent(input, 0)
        expect(result?.element.indentCount).toBe(expected)
      })
    })

    it('should return null for invalid instructions', () => {
      const invalidInputs = [
        '［＃地から字上げ］',     // 数字なし
        '［＃地から-2字上げ］',   // 負数
        '［＃地から0字上げ］',    // ゼロ
        '［地から２字上げ］'      // ＃なし
      ]
      
      invalidInputs.forEach(input => {
        const result = parser.parseLineIndent(input, 0)
        expect(result).toBeNull()
      })
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
          range: expect.any(Object)
        },
        length: 9
      })
    })

    it('should handle large indent counts with limit', () => {
      const input = '［＃ここから100字下げ］'
      const result = parser.parseBlockIndentStart(input, 0)
      
      // 最大値20でクランプされる
      expect(result?.element.indentCount).toBe(20)
    })
  })

  describe('parseBlockIndentEnd', () => {
    it('should parse block indent end instruction', () => {
      const input = '［＃ここで字下げ終わり］'
      const result = parser.parseBlockIndentEnd(input, 0)
      
      expect(result?.element.instructionType).toBe('indent-end')
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

    it('should not preserve half-width spaces as leading', () => {
      const input = '  テスト'  // 半角スペース
      const result = parser.preserveLeadingSpaces(input)
      expect(result).toBe('テスト')  // トリミングされる
    })
  })
})
```

#### 1.2 IndentBlockProcessor テスト

```typescript
describe('IndentBlockProcessor', () => {
  describe('processIndentBlocks', () => {
    it('should group simple indent block', () => {
      const elements: AozoraElement[] = [
        { type: 'formatting-instruction', instructionType: 'indent-start', indentCount: 2 },
        { type: 'text', content: '字下げされたテキスト1' },
        { type: 'text', content: '字下げされたテキスト2' },
        { type: 'formatting-instruction', instructionType: 'indent-end' }
      ]
      
      const result = processor.processIndentBlocks(elements)
      
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('indent-block')
      expect(result[0].indentCount).toBe(2)
      expect(result[0].elements).toHaveLength(2)
    })

    it('should handle nested indent blocks', () => {
      const elements: AozoraElement[] = [
        { type: 'formatting-instruction', instructionType: 'indent-start', indentCount: 1 },
        { type: 'text', content: '外側' },
        { type: 'formatting-instruction', instructionType: 'indent-start', indentCount: 2 },
        { type: 'text', content: '内側' },
        { type: 'formatting-instruction', instructionType: 'indent-end' },
        { type: 'text', content: '外側に戻る' },
        { type: 'formatting-instruction', instructionType: 'indent-end' }
      ]
      
      const result = processor.processIndentBlocks(elements)
      
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('indent-block')
      expect(result[0].indentCount).toBe(1)
      
      // ネストしたブロックが含まれる
      const nestedBlock = result[0].elements.find(e => e.type === 'indent-block')
      expect(nestedBlock).toBeDefined()
      expect(nestedBlock?.indentCount).toBe(2)
    })

    it('should handle unclosed blocks', () => {
      const elements: AozoraElement[] = [
        { type: 'formatting-instruction', instructionType: 'indent-start', indentCount: 1 },
        { type: 'text', content: '終了指示なし' }
        // indent-end がない
      ]
      
      const result = processor.processIndentBlocks(elements)
      
      // 自動的にブロックを閉じる
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('indent-block')
    })

    it('should remove formatting instructions from output', () => {
      const elements: AozoraElement[] = [
        { type: 'text', content: '通常テキスト' },
        { type: 'formatting-instruction', instructionType: 'indent-start', indentCount: 1 },
        { type: 'text', content: '字下げテキスト' },
        { type: 'formatting-instruction', instructionType: 'indent-end' },
        { type: 'text', content: '通常に戻る' }
      ]
      
      const result = processor.processIndentBlocks(elements)
      
      // formatting-instruction要素が除去されている
      const hasInstructions = result.some(e => e.type === 'formatting-instruction')
      expect(hasInstructions).toBe(false)
    })
  })
})
```

### 2. 統合テスト (Integration Tests)

#### 2.1 AozoraParser統合テスト

```typescript
describe('AozoraParser Text Formatting Integration', () => {
  let parser: AozoraParser

  beforeEach(() => {
    parser = new AozoraParser({
      enableTextFormatting: true,
      maxIndentCount: 20
    })
  })

  describe('Complete parsing workflow', () => {
    it('should parse document with indent blocks', () => {
      const input = `通常のテキスト

［＃ここから２字下げ］
これは字下げされた段落です。
複数行にわたって適用されます。
［＃ここで字下げ終わり］

また通常のテキストに戻ります。`

      const result = parser.parse(input, 'test.txt')
      
      expect(result.elements).toContainEqual(
        expect.objectContaining({
          type: 'indent-block',
          indentCount: 2,
          elements: expect.arrayContaining([
            expect.objectContaining({
              type: 'text',
              content: expect.stringContaining('字下げされた段落')
            })
          ])
        })
      )
      
      // 指示行が除去されている
      const hasInstructions = result.elements.some(e => 
        e.type === 'text' && e.content.includes('ここから２字下げ')
      )
      expect(hasInstructions).toBe(false)
    })

    it('should handle mixed content with various elements', () => {
      const input = `# 見出し

通常のテキストと漢字《かんじ》のルビ

［＃ここから１字下げ］
字下げ内の漢字《かんじ》
　　さらに手動で字下げ
［＃ここで字下げ終わり］

［＃地から３字上げ］この行は字上げされます`

      const result = parser.parse(input, 'test.txt')
      
      // 見出し、通常テキスト、字下げブロック、字上げテキストが含まれる
      expect(result.elements.some(e => e.type === 'heading')).toBe(true)
      expect(result.elements.some(e => e.type === 'ruby')).toBe(true)
      expect(result.elements.some(e => e.type === 'indent-block')).toBe(true)
      expect(result.elements.some(e => e.type === 'indented-text')).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should handle excessive indent counts', () => {
      const input = '［＃ここから100字下げ］\n過度な字下げ\n［＃ここで字下げ終わり］'
      const result = parser.parse(input, 'test.txt')
      
      const indentBlock = result.elements.find(e => e.type === 'indent-block')
      expect(indentBlock?.indentCount).toBe(20) // 上限でクランプ
    })

    it('should preserve leading spaces in normal text', () => {
      const input = '　　手動での字下げ\n通常の行\n　また字下げ'
      const result = parser.parse(input, 'test.txt')
      
      const textWithSpaces = result.elements.filter(e => 
        e.type === 'text' && e.content.startsWith('　')
      )
      expect(textWithSpaces.length).toBeGreaterThan(0)
    })
  })
})
```

### 3. レンダラーテスト

#### 3.1 IndentBlockRenderer テスト

```typescript
describe('IndentBlockRenderer', () => {
  const mockIndentBlock: IndentBlock = {
    type: 'indent-block',
    indentCount: 2,
    elements: [
      { type: 'text', content: '字下げされたテキスト', range: mockRange },
      { type: 'ruby', text: '漢字', ruby: 'かんじ', range: mockRange }
    ],
    range: mockRange
  }

  it('should render indent block with correct CSS class', () => {
    render(<IndentBlockRenderer element={mockIndentBlock} />)
    
    const blockElement = screen.getByTestId('indent-block')
    expect(blockElement).toHaveClass('indentBlock')
    expect(blockElement).toHaveAttribute('data-indent-count', '2')
  })

  it('should render nested elements correctly', () => {
    render(<IndentBlockRenderer element={mockIndentBlock} />)
    
    expect(screen.getByText('字下げされたテキスト')).toBeInTheDocument()
    expect(screen.getByRole('ruby')).toBeInTheDocument()
  })

  it('should apply correct indentation styles', () => {
    render(<IndentBlockRenderer element={mockIndentBlock} />)
    
    const blockElement = screen.getByTestId('indent-block')
    const computedStyle = window.getComputedStyle(blockElement)
    
    // CSS変数が正しく設定される
    expect(blockElement.style.getPropertyValue('--indent-count')).toBe('2')
  })
})
```

#### 3.2 IndentedTextRenderer テスト

```typescript
describe('IndentedTextRenderer', () => {
  const mockIndentedText: IndentedText = {
    type: 'indented-text',
    content: '字上げされたテキスト',
    indentCount: -3, // 字上げ
    range: mockRange
  }

  it('should render indented text with correct attributes', () => {
    render(<IndentedTextRenderer element={mockIndentedText} />)
    
    const textElement = screen.getByText('字上げされたテキスト')
    expect(textElement).toHaveClass('indentedText')
    expect(textElement).toHaveAttribute('data-indent-count', '-3')
  })

  it('should handle positive indent (字下げ)', () => {
    const element = { ...mockIndentedText, indentCount: 2 }
    render(<IndentedTextRenderer element={element} />)
    
    const textElement = screen.getByText('字上げされたテキスト')
    expect(textElement).toHaveAttribute('data-indent-count', '2')
  })
})
```

### 4. E2Eテスト

#### 4.1 ユーザーシナリオテスト

```typescript
describe('Text Formatting E2E', () => {
  it('should display formatted text correctly in full workflow', async () => {
    const testFile = `夏目漱石
吾輩は猫である

［＃ここから２字下げ］
　これは字下げされた引用文です。
　手動の字下げも含まれています。
［＃ここで字下げ終わり］

［＃地から５字上げ］── 作者 ──

通常のテキストが続きます。`

    // ファイルをドロップ
    const file = new File([testFile], 'test.txt', { type: 'text/plain' })
    await user.upload(screen.getByTestId('file-drop-zone'), file)

    // 字下げブロックが表示される
    const indentBlock = await screen.findByTestId('indent-block')
    expect(indentBlock).toBeVisible()
    expect(indentBlock).toHaveAttribute('data-indent-count', '2')

    // 字上げテキストが表示される
    const indentedText = await screen.findByText('── 作者 ──')
    expect(indentedText).toBeVisible()
    expect(indentedText).toHaveAttribute('data-indent-count', '-5')

    // 指示行が表示されない
    expect(screen.queryByText('ここから２字下げ')).not.toBeInTheDocument()
    expect(screen.queryByText('地から５字上げ')).not.toBeInTheDocument()
  })

  it('should handle real aozora bunko file correctly', async () => {
    // 実際の青空文庫ファイルを使用したテスト
    const realAozoraFile = await fetch('/test-data/real-aozora-sample.txt')
    const content = await realAozoraFile.text()
    const file = new File([content], 'aozora-sample.txt', { type: 'text/plain' })

    await user.upload(screen.getByTestId('file-drop-zone'), file)

    // 整形が正しく適用される
    const indentBlocks = await screen.findAllByTestId('indent-block')
    expect(indentBlocks.length).toBeGreaterThan(0)

    // パフォーマンスが許容範囲内
    const startTime = performance.now()
    await screen.findByText(/.*/, {}, { timeout: 3000 })
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThan(3000) // 3秒以内
  })
})
```

### 5. パフォーマンステスト

```typescript
describe('Text Formatting Performance', () => {
  it('should handle large file with many indent blocks efficiently', () => {
    // 大容量ファイルシミュレーション
    const lines = []
    for (let i = 0; i < 1000; i++) {
      lines.push('［＃ここから１字下げ］')
      lines.push(`段落 ${i} の内容です。`.repeat(10))
      lines.push('［＃ここで字下げ終わり］')
    }
    const largeInput = lines.join('\n')

    const startTime = performance.now()
    const result = parser.parse(largeInput, 'large-test.txt')
    const endTime = performance.now()

    expect(endTime - startTime).toBeLessThan(1000) // 1秒以内
    expect(result.elements.length).toBeGreaterThan(0)
  })

  it('should have acceptable memory usage', () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0
    
    // 複数回の解析実行
    for (let i = 0; i < 100; i++) {
      const input = `［＃ここから${i % 10 + 1}字下げ］\nテスト内容\n［＃ここで字下げ終わり］`
      parser.parse(input, `test-${i}.txt`)
    }

    const finalMemory = performance.memory?.usedJSHeapSize || 0
    const memoryIncrease = finalMemory - initialMemory

    // メモリ使用量の増加が許容範囲内
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB
  })
})
```

## テストデータ設計

### テストファイルサンプル

#### 1. 基本機能テスト用

```
// basic-indent-test.txt
通常のテキストです。

［＃ここから２字下げ］
これは２字下げのブロックです。
複数行にわたって適用されます。
［＃ここで字下げ終わり］

また通常のテキストに戻ります。

［＃地から３字上げ］この行は３字上げです。

［＃ここから１字下げ］
字下げ内にさらに字下げがある場合：
［＃ここから２字下げ］
ネストしたブロックです。
［＃ここで字下げ終わり］
外側に戻りました。
［＃ここで字下げ終わり］
```

#### 2. エラーケーステスト用

```
// error-cases-test.txt
［＃ここから２字下げ］
終了指示がないブロック

［＃ここから100字下げ］
異常に大きな数値
［＃ここで字下げ終わり］

［＃地から-5字上げ］負数の場合

［＃ここで字下げ終わり］
開始指示なしの終了
```

#### 3. パフォーマンステスト用

```typescript
// performance-test-generator.ts
export function generateLargeTestFile(blockCount: number, linesPerBlock: number): string {
  const lines: string[] = []
  
  for (let i = 0; i < blockCount; i++) {
    lines.push(`［＃ここから${(i % 5) + 1}字下げ］`)
    
    for (let j = 0; j < linesPerBlock; j++) {
      lines.push(`ブロック${i}の行${j}: これは性能テスト用の長いテキストです。`.repeat(3))
    }
    
    lines.push('［＃ここで字下げ終わり］')
    lines.push('') // 空行
  }
  
  return lines.join('\n')
}
```

## テスト実行戦略

### 1. 継続的インテグレーション
- プルリクエスト時: 全単体テスト + 重要な統合テスト
- デイリービルド: 全テスト + パフォーマンステスト
- リリース前: 全テスト + E2Eテスト + 手動検証

### 2. テストカバレッジ目標
- 関数カバレッジ: 95%以上
- 分岐カバレッジ: 90%以上
- 行カバレッジ: 95%以上

### 3. パフォーマンス基準
- 1万行ファイル: 解析時間 < 500ms
- 100個の字下げブロック: 解析時間 < 1秒  
- 10MBファイル: メモリ使用量 < 100MB

### 4. ブラウザ互換性テスト
- Chrome (最新 & 1つ前のバージョン)
- Firefox (最新 & 1つ前のバージョン)
- Safari (最新)
- Edge (最新)

これらのテスト設計に基づいて、TDDアプローチで実装を進めていきます。