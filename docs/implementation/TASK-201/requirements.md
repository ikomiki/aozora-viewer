# TASK-201: サイドバー制御実装 - 要件定義

## 概要
左右のサイドバーの開閉制御機能を強化し、状態永続化、アニメーション、リサイズ機能を実装する。

## 現在の状態
✅ **既存実装**:
- 基本的なサイドバー構造（Layout.tsx）
- Sidebarコンポーネントの基本実装
- 開閉トグル機能
- レスポンシブ対応（モバイルオーバーレイ）

## 追加実装要件

### 1. 状態永続化 (localStorage)

#### 要件:
- サイドバーの開閉状態をlocalStorageに保存
- ページリロード時に前回の状態を復元
- 左右のサイドバーを独立して管理

#### 仕様:
- キー名: `aozora-sidebar-left`, `aozora-sidebar-right`
- データ形式: boolean
- デフォルト値: 左サイドバー(false), 右サイドバー(false)

### 2. アニメーション強化

#### 要件:
- 開閉アニメーションを0.3秒に統一
- 滑らかなトランジション
- パフォーマンスを考慮したCSS transform使用

#### 現在の問題:
- CSS変数 `--transition-medium` の値が不明確
- アニメーション時間が要件（0.3秒）と異なる可能性

### 3. リサイズ機能

#### 要件:
- サイドバーの幅をドラッグで調整可能
- 最小幅: 200px, 最大幅: 600px
- リサイズ中の視覚的フィードバック
- リサイズした幅もlocalStorageに保存

#### 仕様:
- リサイズハンドルの追加
- ドラッグ操作の実装
- 幅の状態管理

### 4. エッジケース対応

#### EDGE-203: 最小幅確保
- 本文領域の最小幅を確保（320px以上）
- 両サイドバーが開いても本文が見える
- 画面幅が狭い場合の自動調整

### 5. UI/UX要件確認

#### 既存で満たされている要件:
- ✅ トグルボタン: 常に見えるUI
- ✅ モバイル対応: オーバーレイ表示

#### 改善が必要:
- 🔄 滑らかなアニメーション: 0.3秒の開閉
- 🔄 最小幅確保: 本文領域の確保（EDGE-203）

## カスタムフック設計

### useSidebarState
```typescript
interface SidebarState {
  left: {
    isOpen: boolean;
    width: number;
  };
  right: {
    isOpen: boolean; 
    width: number;
  };
}

interface UseSidebarStateReturn {
  sidebarState: SidebarState;
  toggleSidebar: (side: 'left' | 'right') => void;
  setSidebarWidth: (side: 'left' | 'right', width: number) => void;
  resetToDefaults: () => void;
}
```

### useResizablePanel
```typescript
interface UseResizablePanelProps {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  onWidthChange: (width: number) => void;
}

interface UseResizablePanelReturn {
  width: number;
  isResizing: boolean;
  resizerProps: {
    onMouseDown: (e: MouseEvent) => void;
  };
}
```

## テスト要件

### 単体テスト
1. **useSidebarState フック**
   - 初期状態の確認
   - toggle動作の確認
   - localStorage保存・復元の確認
   - width変更の確認

2. **useResizablePanel フック**
   - ドラッグ操作のシミュレーション
   - 境界値テスト（最小/最大幅）
   - リサイズ中状態の確認

3. **Sidebarコンポーネント**
   - propsの適切な反映
   - アニメーション時間の確認
   - アクセシビリティ属性の確認

### E2Eテスト
1. **開閉操作**
   - 左サイドバーの開閉
   - 右サイドバーの開閉
   - 両方同時に開いた場合の動作

2. **状態永続化**
   - ページリロード後の状態復元
   - localStorage値の確認

3. **レスポンシブ対応**
   - デスクトップでの動作
   - モバイルでのオーバーレイ動作

## アクセシビリティ要件

### 既存で満たされている:
- ✅ ARIA属性（role, aria-label, aria-expanded）
- ✅ キーボード操作対応
- ✅ セマンティックHTML

### 追加要件:
- リサイズ機能のキーボード操作対応
- スクリーンリーダー向けの状態変更通知

## パフォーマンス要件

- アニメーション: 60fps維持
- localStorage操作: 非同期処理
- リサイズ操作: throttling適用（16ms間隔）

## 完了条件

1. ✅ 左右サイドバーが独立して開閉
2. 🔄 設定が永続化される（localStorage）
3. 🔄 0.3秒の滑らかなアニメーション
4. 🔄 リサイズ機能が正常に動作
5. 🔄 モバイルでオーバーレイ表示
6. 🔄 本文領域の最小幅確保
7. 🔄 全テストが通過

## 実装優先度

1. **高優先度**: localStorage状態永続化
2. **中優先度**: アニメーション調整
3. **低優先度**: リサイズ機能（高度な機能）