# テキスト整形機能実装計画書

## 実装概要

青空文庫の字下げ・字上げ指示と行頭全角空白表示機能をTDD（Test-Driven Development）アプローチで実装します。

## 実装フェーズ

### フェーズ1: データモデル拡張 (実装時間: 2-3時間)

#### タスク 1.1: 型定義の拡張
- [ ] `src/types/index.ts` に新しい要素型を追加
  - `IndentedText` インターフェース
  - `IndentBlock` インターフェース  
  - `FormattingInstruction` インターフェース
- [ ] `AozoraElement` 型を拡張
- [ ] パーサー設定型を拡張

#### タスク 1.2: テストファイル準備
- [ ] `src/lib/parser/__tests__/fixtures/` にテストデータ作成
  - 基本字下げパターン
  - 字上げパターン
  - ネストパターン
  - エラーパターン

**成果物:**
- 拡張された型定義
- テストデータセット

### フェーズ2: パーサーコア機能実装 (実装時間: 4-5時間)

#### タスク 2.1: 整形指示解析機能 (TDD)
1. **Red**: テスト作成
   ```typescript
   describe('FormattingInstructionParser', () => {
     it('should parse line indent instruction')
     it('should parse block indent start instruction')
     it('should parse block indent end instruction')
   })
   ```

2. **Green**: 最小実装
   ```typescript
   // AozoraParser.ts
   private parseLineIndent(text: string, startIndex: number): ParseResult<FormattingInstruction> | null
   private parseBlockIndentStart(text: string, startIndex: number): ParseResult<FormattingInstruction> | null
   private parseBlockIndentEnd(text: string, startIndex: number): ParseResult<FormattingInstruction> | null
   ```

3. **Refactor**: コードの整理と最適化

#### タスク 2.2: 字下げブロック処理 (TDD)
1. **Red**: ブロック処理テスト作成
2. **Green**: `processIndentBlocks` メソッド実装
3. **Refactor**: 効率的なアルゴリズムに改善

#### タスク 2.3: パーサー統合
- [ ] `parseText` メソッドに整形指示解析を統合
- [ ] 行頭全角空白保持機能を実装
- [ ] 指示行除去機能を実装

**成果物:**
- 拡張されたAozoraParserクラス
- 100%のテストカバレッジ

### フェーズ3: レンダラー実装 (実装時間: 3-4時間)

#### タスク 3.1: IndentedTextRenderer (TDD)
1. **Red**: レンダラーテスト作成
2. **Green**: 基本的なReactコンポーネント実装
3. **Refactor**: アクセシビリティとパフォーマンス改善

#### タスク 3.2: IndentBlockRenderer (TDD)
1. **Red**: ブロックレンダラーテスト作成
2. **Green**: ネストした要素を含むレンダラー実装
3. **Refactor**: 再帰レンダリングの最適化

#### タスク 3.3: CSS スタイル実装
- [ ] `IndentedText.module.css` 作成
- [ ] `IndentBlock.module.css` 作成
- [ ] 動的字下げスタイル生成

#### タスク 3.4: ElementRenderer統合
- [ ] 新しい要素型のケースを追加
- [ ] DocumentRendererとの連携確認

**成果物:**
- 新しいレンダラーコンポーネント
- CSS Moduleスタイル
- レンダリングテスト

### フェーズ4: 統合・最適化・E2Eテスト (実装時間: 2-3時間)

#### タスク 4.1: 統合テスト
- [ ] パーサーからレンダラーまでの完全なフロー確認
- [ ] 既存機能との相互作用テスト
- [ ] パフォーマンステスト実行

#### タスク 4.2: E2Eテスト
- [ ] ファイルドロップから表示までのユーザーフロー
- [ ] 実際の青空文庫ファイルでのテスト
- [ ] ブラウザ互換性テスト

#### タスク 4.3: エラーハンドリング強化
- [ ] 異常な字下げ数値の処理
- [ ] 未閉じブロックの処理
- [ ] 不正な指示の処理

**成果物:**
- 完全に統合されたテキスト整形機能
- E2Eテストスイート
- パフォーマンスベンチマーク

## ファイル構造

```
src/
├── types/
│   └── index.ts                              # 型定義拡張
├── lib/
│   └── parser/
│       ├── AozoraParser.ts                   # パーサーコア拡張
│       ├── FormattingInstructionParser.ts    # 新規: 整形指示解析
│       ├── IndentBlockProcessor.ts           # 新規: ブロック処理
│       └── __tests__/
│           ├── FormattingInstructionParser.test.ts
│           ├── IndentBlockProcessor.test.ts
│           ├── AozoraParser.formatting.test.ts
│           └── fixtures/
│               ├── basic-indent-test.txt
│               ├── nested-indent-test.txt
│               ├── error-cases-test.txt
│               └── performance-test.txt
├── components/
│   └── DocumentRenderer/
│       ├── IndentedTextRenderer.tsx          # 新規: 字上げ・字下げテキスト
│       ├── IndentBlockRenderer.tsx           # 新規: 字下げブロック
│       ├── IndentedTextRenderer.module.css
│       ├── IndentBlockRenderer.module.css
│       ├── ElementRenderer.tsx               # 拡張
│       └── __tests__/
│           ├── IndentedTextRenderer.test.tsx
│           ├── IndentBlockRenderer.test.tsx
│           └── DocumentRenderer.formatting.test.tsx
└── __tests__/
    └── e2e/
        └── text-formatting.e2e.test.tsx     # 新規: E2Eテスト
```

## 実装の優先度

### 高優先度 (必須機能)
1. **行頭全角空白の保持** - 基本的な表示品質に直結
2. **基本的な字下げブロック** - 最も使用頻度が高い
3. **指示行の完全除去** - 表示品質に重要
4. **基本的なエラーハンドリング** - システム安定性

### 中優先度 (重要だが後回し可能)
1. **字上げ指示機能** - 使用頻度は低いが重要
2. **ネストした字下げブロック** - 複雑な文書で必要
3. **パフォーマンス最適化** - 大容量ファイルで必要
4. **詳細なエラーハンドリング** - エッジケース対応

### 低優先度 (将来拡張)
1. **設定可能な字下げ幅** - ユーザーカスタマイズ
2. **字下げスタイルのバリエーション** - デザイン拡張
3. **デバッグ機能** - 開発者向け機能

## TDD実装サイクル

各機能について以下のサイクルを実施:

```
1. Red Phase (テスト失敗)
   ├── 要件からテストケースを作成
   ├── 期待動作を明確に定義
   └── テスト実行 → 失敗確認

2. Green Phase (最小実装)
   ├── テストが通る最小限のコードを実装
   ├── 設計品質よりも動作を優先
   └── テスト実行 → 成功確認

3. Refactor Phase (品質改善)
   ├── コードの設計品質を改善
   ├── パフォーマンス最適化
   ├── 可読性・保守性向上
   └── テスト実行 → 動作保証
```

## 品質基準

### テストカバレッジ
- **関数カバレッジ**: 95%以上
- **分岐カバレッジ**: 90%以上  
- **行カバレッジ**: 95%以上

### パフォーマンス基準
- **1万行ファイル**: 解析時間 < 500ms
- **100字下げブロック**: 解析時間 < 1秒
- **10MBファイル**: メモリ使用量 < 100MB

### コード品質
- **TypeScript**: Strict mode準拠
- **ESLint**: 全ルール適用、警告ゼロ
- **Prettier**: 統一フォーマット
- **コメント**: 複雑なロジックに十分な説明

## リスクと対策

### 技術的リスク
1. **パフォーマンス劣化**
   - 対策: 段階的な最適化、プロファイリング
   - 軽減策: 機能フラグによるオン/オフ切り替え

2. **既存機能への影響**
   - 対策: 包括的な回帰テスト
   - 軽減策: 機能の段階的展開

3. **複雑なネストケースの処理**
   - 対策: 詳細なテストケース作成
   - 軽減策: 制限付き実装（深度制限など）

### スケジュールリスク
1. **見積もり超過**
   - 対策: 優先度に基づく段階的実装
   - 軽減策: 最小限の機能セットでの早期リリース

2. **テスト作成時間**
   - 対策: テンプレートベースのテスト生成
   - 軽減策: 重要機能に集中したテスト

## 完了基準

### フェーズ1完了基準
- [ ] 全ての新しい型定義が完成
- [ ] 型定義のテストが全て通過
- [ ] TypeScriptコンパイルエラーがゼロ

### フェーズ2完了基準
- [ ] 全てのパーサーテストが通過
- [ ] 既存のパーサーテストが引き続き通過
- [ ] コードカバレッジが基準を満たす

### フェーズ3完了基準
- [ ] 全てのレンダラーテストが通過
- [ ] 視覚的な表示確認が完了
- [ ] アクセシビリティチェック通過

### フェーズ4完了基準
- [ ] 全てのE2Eテストが通過
- [ ] パフォーマンステストが基準を満たす
- [ ] 実際の青空文庫ファイルでの動作確認完了

### 最終完了基準
- [ ] 全ての要求仕様項目が実装済み
- [ ] 全てのテストが通過（126個 → 180個予定）
- [ ] ドキュメントが更新済み
- [ ] コードレビューが完了

## 実装開始準備

実装開始前に以下を確認:

1. **開発環境確認**
   - Node.js, npm versions
   - IDE設定（TypeScript, ESLint）
   - Git workflow設定

2. **ベースライン確立**
   - 現在のテスト全通過確認
   - 現在のビルド成功確認
   - パフォーマンスベンチマーク取得

3. **チーム準備**
   - 実装計画の共有
   - レビュープロセスの確認
   - 進捗報告方法の決定

設計が完了しました。TDDアプローチで実装を開始する準備が整いました！