# テキスト整形機能設計書

## 概要

青空文庫の字下げ・字上げ指示と行頭全角空白の表示機能を実装するための設計書。

## 要件分析

### 機能要件
1. **行頭全角空白の保持**: テキストファイル行頭の全角空白文字を削除せずに表示
2. **字上げ指示**: ［＃地から２字上げ］のような指示で行頭に指定個数分の全角空白を挿入
3. **字下げブロック**: ［＃ここから１字下げ］〜［＃ここで字下げ終わり］のブロック内全行に指定個数分の全角空白を挿入
4. **指示行除去**: 字下げ指示行そのものを改行も残さず完全除去

### 技術要件
- 既存のAozoraParserに統合
- パフォーマンス: 大容量ファイルでも高速処理
- 正確性: 青空文庫記法の完全対応
- 拡張性: 他の整形指示への対応可能性

## アーキテクチャ設計

### 1. データモデル拡張

#### 新しい要素型の追加

```typescript
// 字上げ・字下げされたテキスト
export interface IndentedText {
  type: 'indented-text';
  content: string;
  indentCount: number;  // 字下げ数（負数で字上げ）
  range: Range;
}

// 字下げブロック
export interface IndentBlock {
  type: 'indent-block';
  indentCount: number;
  elements: AozoraElement[];  // ブロック内要素
  range: Range;
}

// 整形指示（解析時のみ使用、最終出力からは除去）
export interface FormattingInstruction {
  type: 'formatting-instruction';
  instruction: string;
  instructionType: 'indent-start' | 'indent-end' | 'line-indent';
  indentCount?: number;
  range: Range;
}
```

#### AozoraElement型の拡張

```typescript
export type AozoraElement = 
  | RubyText 
  | Heading 
  | Image 
  | Caption 
  | PlainText 
  | Emphasis 
  | Correction
  | IndentedText      // 新規追加
  | IndentBlock       // 新規追加
```

### 2. パーサー拡張設計

#### AozoraParser.ts の拡張

```typescript
class AozoraParser {
  // 新しいメソッド
  private parseFormattingInstructions(text: string): FormattingInstruction[]
  private processIndentBlocks(elements: AozoraElement[]): AozoraElement[]
  private parseLineIndent(text: string, startIndex: number): ParseResult<FormattingInstruction> | null
  private parseBlockIndentStart(text: string, startIndex: number): ParseResult<FormattingInstruction> | null
  private parseBlockIndentEnd(text: string, startIndex: number): ParseResult<FormattingInstruction> | null
  private preserveLeadingSpaces(line: string): string
  private removeFormattingInstructions(elements: AozoraElement[]): AozoraElement[]
}
```

#### 処理フロー

```
1. テキスト行分割 (行頭全角空白を保持)
   ↓
2. 各行の整形指示を解析
   - ［＃地から○字上げ］
   - ［＃ここから○字下げ］
   - ［＃ここで字下げ終わり］
   ↓
3. 字下げブロックを特定・グループ化
   ↓
4. 各要素に字下げ情報を適用
   ↓
5. 整形指示行を完全除去
   ↓
6. 最終要素配列を生成
```

### 3. 正規表現パターン

```typescript
// 字上げ指示: ［＃地から２字上げ］
const LINE_INDENT_PATTERN = /［＃地から(\d+)字上げ］/

// 字下げブロック開始: ［＃ここから１字下げ］
const BLOCK_INDENT_START_PATTERN = /［＃ここから(\d+)字下げ］/

// 字下げブロック終了: ［＃ここで字下げ終わり］
const BLOCK_INDENT_END_PATTERN = /［＃ここで字下げ終わり］/

// 行頭全角空白: 行の先頭の連続する全角空白
const LEADING_FULLWIDTH_SPACE_PATTERN = /^(　+)/
```

### 4. レンダラー拡張設計

#### 新しいレンダラーコンポーネント

```typescript
// IndentedTextRenderer.tsx
interface IndentedTextRendererProps {
  element: IndentedText;
  className?: string;
}

// IndentBlockRenderer.tsx
interface IndentBlockRendererProps {
  element: IndentBlock;
  onImageLoad?: (src: string) => void;
  onImageError?: (src: string) => void;
  onHeadingClick?: (heading: Heading) => void;
  className?: string;
}
```

#### CSS設計

```css
/* 字下げテキスト */
.indentedText {
  display: block;
  white-space: pre-wrap; /* 空白を保持 */
}

.indentedText[data-indent-count="1"]::before { content: "　"; }
.indentedText[data-indent-count="2"]::before { content: "　　"; }
.indentedText[data-indent-count="3"]::before { content: "　　　"; }
/* ... 動的に生成 */

/* 字下げブロック */
.indentBlock {
  margin: 1em 0;
}

.indentBlock .indentBlockContent {
  padding-left: calc(var(--indent-count) * 1em);
}
```

## 実装戦略

### フェーズ1: データモデルとパーサー
1. 型定義の拡張
2. AozoraParserに整形指示解析機能を追加
3. 字下げブロック処理ロジックの実装
4. 単体テストの作成

### フェーズ2: レンダラー
1. IndentedTextRendererの実装
2. IndentBlockRendererの実装
3. ElementRendererの拡張
4. CSS スタイルの実装

### フェーズ3: 統合とテスト
1. エンドツーエンドテストの作成
2. パフォーマンステストの実行
3. Edge case の処理確認

## エラーハンドリング設計

### 1. 異常なケースの処理

```typescript
interface IndentErrorHandling {
  // 異常に大きな数値 (100字など)
  maxIndentCount: 20;
  
  // ブロック終了指示がない場合
  handleUnclosedBlock: 'auto-close' | 'ignore' | 'warn';
  
  // ネストしたブロック
  handleNestedBlocks: 'flatten' | 'preserve' | 'error';
  
  // 不正な指示
  handleInvalidInstruction: 'ignore' | 'warn' | 'error';
}
```

### 2. ログとデバッグ

```typescript
interface FormattingLogger {
  logFormattingInstruction(instruction: string, lineNumber: number): void;
  logIndentBlockStart(indentCount: number, lineNumber: number): void;
  logIndentBlockEnd(lineNumber: number): void;
  logError(error: string, context: any): void;
}
```

## パフォーマンス考慮事項

### 1. 最適化戦略
- **前処理**: 整形指示の事前スキャンでブロック構造を把握
- **メモ化**: 同じ字下げ数のスタイル計算結果をキャッシュ
- **バッチ処理**: 連続する同じ字下げのテキストをまとめて処理

### 2. メモリ管理
- 中間データ構造の適切な破棄
- 大容量ファイル処理時のストリーミング対応検討

## テスト設計

### 1. 単体テスト
```typescript
describe('FormattingInstructionParser', () => {
  it('should parse line indent instruction')
  it('should parse block indent start instruction')  
  it('should parse block indent end instruction')
  it('should handle invalid instructions gracefully')
  it('should preserve leading fullwidth spaces')
})

describe('IndentBlockProcessor', () => {
  it('should group indent blocks correctly')
  it('should handle nested blocks')
  it('should handle unclosed blocks')
  it('should remove instruction lines completely')
})
```

### 2. 統合テスト
```typescript
describe('TextFormatting Integration', () => {
  it('should render simple indent block correctly')
  it('should handle mixed content with indents')
  it('should preserve original formatting in non-indent areas')
  it('should handle edge cases gracefully')
})
```

### 3. テストデータ
```
// 基本ケース
［＃ここから２字下げ］
これは字下げされたテキストです。
複数行にわたって字下げが適用されます。
［＃ここで字下げ終わり］

// ネストケース  
［＃ここから１字下げ］
外側の字下げ
［＃ここから２字下げ］
内側の字下げ
［＃ここで字下げ終わり］
外側に戻る
［＃ここで字下げ終わり］

// 字上げケース
通常のテキスト
［＃地から３字上げ］これは字上げされた行です
次の行は通常に戻ります
```

## 互換性とマイグレーション

### 1. 下位互換性
- 既存のパースロジックは変更せず、新機能として追加
- 既存の要素型との共存を保証

### 2. 段階的展開
- 機能フラグによる有効/無効切り替え
- パフォーマンステスト後の段階的有効化

## 今後の拡張性

### 1. 他の整形指示への対応
- 縦中横: ［＃「文字列」は縦中横］
- 文字サイズ: ［＃「文字列」は○ポイント］
- 罫線: ［＃罫線］

### 2. 設定可能な整形オプション
- 字下げ幅のカスタマイズ
- 全角空白の表示方法選択
- 整形指示の表示/非表示切り替え

## 実装優先度

1. **高**: 行頭全角空白の保持
2. **高**: 基本的な字下げブロック機能
3. **中**: 字上げ指示機能  
4. **中**: エラーハンドリングの充実
5. **低**: 高度な設定オプション