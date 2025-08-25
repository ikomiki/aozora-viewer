# TASK-201: サイドバー制御実装 - テストケース

## 1. useSidebarState フック テストケース

### 1.1 初期状態テスト
```typescript
describe('useSidebarState - 初期状態', () => {
  it('デフォルト状態で両サイドバーが閉じている', () => {
    // 期待値: { left: { isOpen: false, width: 280 }, right: { isOpen: false, width: 280 } }
  });

  it('localStorageから状態を復元する', () => {
    // localStorage に状態を事前に保存
    // フックを呼び出し、保存された状態が復元されることを確認
  });

  it('無効なlocalStorage値の場合はデフォルト値を使用', () => {
    // 不正なJSON文字列をlocalStorageに設定
    // デフォルト値が使用されることを確認
  });
});
```

### 1.2 状態変更テスト
```typescript
describe('useSidebarState - 状態変更', () => {
  it('toggleSidebar で左サイドバーの開閉状態を切り替える', () => {
    // 初期状態: closed
    // toggleSidebar('left') 実行
    // 期待値: open状態
    // 再度実行して closed に戻ることを確認
  });

  it('toggleSidebar で右サイドバーの開閉状態を切り替える', () => {
    // 左サイドバーと独立して動作することを確認
  });

  it('setSidebarWidth でサイドバー幅を変更する', () => {
    // setSidebarWidth('left', 320) 実行
    // 期待値: left.width = 320
  });

  it('幅の境界値テスト', () => {
    // 最小値(200px)未満、最大値(600px)超過の場合の動作確認
  });
});
```

### 1.3 永続化テスト
```typescript
describe('useSidebarState - 永続化', () => {
  it('状態変更がlocalStorageに保存される', () => {
    // toggleSidebar 実行後、localStorageの値を確認
    // キー: 'aozora-sidebar-left', 'aozora-sidebar-right'
  });

  it('幅変更がlocalStorageに保存される', () => {
    // setSidebarWidth 実行後、localStorageの値を確認
    // キー: 'aozora-sidebar-left-width', 'aozora-sidebar-right-width'
  });

  it('resetToDefaults でlocalStorageがクリアされる', () => {
    // 状態をリセット後、localStorage値が削除されることを確認
  });
});
```

## 2. useResizablePanel フック テストケース

### 2.1 初期化テスト
```typescript
describe('useResizablePanel - 初期化', () => {
  it('初期幅が正しく設定される', () => {
    // initialWidth: 300 で初期化
    // 期待値: width = 300
  });

  it('初期状態でリサイズ中ではない', () => {
    // 期待値: isResizing = false
  });
});
```

### 2.2 リサイズ操作テスト
```typescript
describe('useResizablePanel - リサイズ操作', () => {
  it('mousedown でリサイズ開始', () => {
    // resizerProps.onMouseDown を実行
    // 期待値: isResizing = true
  });

  it('mousemove でリサイズ実行', () => {
    // mousedown → mousemove の一連の操作をシミュレート
    // onWidthChange コールバックが呼ばれることを確認
  });

  it('mouseup でリサイズ終了', () => {
    // リサイズ中状態から mouseup で終了
    // 期待値: isResizing = false
  });

  it('最小幅以下にはリサイズできない', () => {
    // minWidth: 200, 現在幅: 250
    // 150px までドラッグしても 200px で止まることを確認
  });

  it('最大幅以上にはリサイズできない', () => {
    // maxWidth: 600, 現在幅: 550
    // 700px までドラッグしても 600px で止まることを確認
  });
});
```

## 3. Sidebar コンポーネント テストケース

### 3.1 基本レンダリング
```typescript
describe('Sidebar - 基本レンダリング', () => {
  it('左サイドバーが正しくレンダリングされる', () => {
    // props: side="left", isOpen=false
    // クラス名に 'sidebar-left' と 'sidebar-closed' が含まれることを確認
  });

  it('右サイドバーが正しくレンダリングされる', () => {
    // props: side="right", isOpen=true
    // クラス名に 'sidebar-right' と 'sidebar-open' が含まれることを確認
  });

  it('children が正しく表示される', () => {
    // <Sidebar><div>テスト内容</div></Sidebar>
    // 'テスト内容' が表示されることを確認
  });
});
```

### 3.2 開閉機能
```typescript
describe('Sidebar - 開閉機能', () => {
  it('トグルボタンクリックで onToggle が呼ばれる', () => {
    // onToggle をモック
    // トグルボタンをクリック
    // onToggle が1回呼ばれることを確認
  });

  it('開閉状態に応じて aria-expanded が変更される', () => {
    // isOpen=false: aria-expanded="false"
    // isOpen=true: aria-expanded="true"
  });

  it('開閉状態に応じてボタンのテキストが変更される', () => {
    // 左サイドバー: closed="→", open="←"  
    // 右サイドバー: closed="←", open="→"
  });
});
```

### 3.3 リサイズ機能
```typescript
describe('Sidebar - リサイズ機能', () => {
  it('リサイズハンドルが表示される', () => {
    // canResize=true の場合、リサイズハンドルが存在
  });

  it('リサイズハンドルをドラッグしてサイズ変更', () => {
    // onWidthChange コールバックが呼ばれることを確認
  });

  it('リサイズ中のカーソル表示', () => {
    // リサイズ中は body に 'resizing' クラスが追加される
  });
});
```

### 3.4 アクセシビリティ
```typescript
describe('Sidebar - アクセシビリティ', () => {
  it('適切な ARIA 属性が設定される', () => {
    // role="complementary"
    // aria-label が設定される
    // aria-expanded が状態に応じて変更される
  });

  it('キーボード操作対応', () => {
    // Tab キーでトグルボタンにフォーカス
    // Enter/Space キーで開閉実行
  });

  it('閉じた状態で内容が非表示', () => {
    // isOpen=false の場合、content に aria-hidden="true"
  });
});
```

## 4. Layout コンポーネント統合テスト

### 4.1 状態管理統合
```typescript
describe('Layout - 状態管理統合', () => {
  it('useSidebarState の状態が Sidebar に正しく伝達される', () => {
    // useSidebarState の状態変更が Sidebar の props に反映
  });

  it('左右独立して開閉できる', () => {
    // 左のみ開く、右のみ開く、両方開く、両方閉じる
  });

  it('メインコンテンツ領域が適切に調整される', () => {
    // サイドバー開閉に応じて main の className が変更される
  });
});
```

### 4.2 永続化統合テスト
```typescript
describe('Layout - 永続化統合', () => {
  it('ページリロード後も状態が維持される', () => {
    // 1. 左サイドバーを開く
    // 2. コンポーネントを再マウント（リロードシミュレート）
    // 3. 左サイドバーが開いた状態で表示されることを確認
  });

  it('複数タブで状態が同期される', () => {
    // localStorage の変更イベントに応じて状態が更新される
  });
});
```

## 5. E2Eテストシナリオ

### 5.1 基本操作フロー
```typescript
describe('E2E - サイドバー基本操作', () => {
  it('デスクトップでの完全なフロー', async () => {
    // 1. ページ読み込み（両サイドバー閉じた状態）
    // 2. 左サイドバーを開く
    // 3. 右サイドバーを開く
    // 4. 左サイドバーを閉じる
    // 5. 右サイドバーを閉じる
    // 各ステップでアニメーションが完了するまで待機
  });

  it('モバイルでのオーバーレイ操作', async () => {
    // 1. ビューポートをモバイルサイズに設定
    // 2. サイドバーを開く（オーバーレイ表示）
    // 3. メインコンテンツクリックでサイドバーが閉じる
  });
});
```

### 5.2 永続化フロー
```typescript
describe('E2E - 状態永続化', () => {
  it('リロード後の状態復元', async () => {
    // 1. サイドバーを開く
    // 2. ページリロード
    // 3. サイドバーが開いた状態で表示される
    // 4. localStorage の値を直接確認
  });
});
```

## 6. パフォーマンステスト

### 6.1 アニメーション性能
```typescript
describe('パフォーマンス - アニメーション', () => {
  it('アニメーション時間が0.3秒以内', () => {
    // CSS transition の実際の時間を測定
  });

  it('60fps を維持', () => {
    // アニメーション中のフレームレート測定
  });
});
```

### 6.2 メモリリーク
```typescript
describe('パフォーマンス - メモリ', () => {
  it('コンポーネントアンマウント時にイベントリスナーが削除される', () => {
    // useResizablePanel のクリーンアップ処理確認
  });
});
```

## テスト実行環境

### 単体テスト
- **フレームワーク**: Vitest + React Testing Library
- **モック**: localStorage, ResizeObserver
- **カバレッジ**: 90%以上

### E2Eテスト  
- **フレームワーク**: Playwright
- **ブラウザ**: Chrome, Firefox, Safari
- **デバイス**: Desktop, Mobile

## 期待される結果

### 成功基準
- 全テストが通過 (100%)
- カバレッジ 90% 以上
- E2Eテストで実際のユーザー操作が正常動作
- パフォーマンス要件を満たす

### 失敗時の対応
- 失敗したテストの詳細ログ出力
- デバッグ用のスクリーンショット取得（E2E）
- 段階的な修正とテスト再実行