# 青空文庫ビューワ アーキテクチャ設計

## システム概要

青空文庫ビューワは、ブラウザ上で完結するクライアントサイドWebアプリケーションです。サーバーを必要とせず、ローカルのテキストファイルを直接処理して青空文庫記法を解析し、美しい読書体験を提供します。

## アーキテクチャパターン

- **パターン**: Client-Side Single Page Application (SPA)
- **理由**: 
  - ファイルアップロードサーバーを必要としない制約（REQ-402）
  - プライバシー保護（個人情報を外部送信しない - REQ-403）
  - 高速なレスポンス性（設定変更後1秒以内の反映 - NFR-002）

## システム境界

```
┌─────────────────────────────────────────┐
│              Browser Environment         │
│  ┌─────────────────────────────────────┐ │
│  │        Aozora Viewer SPA           │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │  - File Parser                 │ │ │
│  │  │  - Renderer                    │ │ │
│  │  │  - UI Components               │ │ │
│  │  │  - Settings Manager            │ │ │
│  │  └─────────────────────────────────┘ │ │
│  └─────────────────────────────────────┘ │
│                     │                    │
│  ┌─────────────────────────────────────┐ │
│  │        Browser APIs                │ │
│  │  - File API                       │ │
│  │  - localStorage                   │ │
│  │  - Drag & Drop API                │ │
│  │  - MediaQuery API                 │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## コンポーネント構成

### フロントエンド技術スタック

- **フレームワーク**: React 18 with TypeScript
- **状態管理**: React Context API + useReducer
- **スタイリング**: CSS Modules + CSS Variables (テーマ対応)
- **ビルドツール**: Vite
- **型チェック**: TypeScript strict mode

### コア機能モジュール

#### 1. File Processing Layer
- **AozoraParser**: 青空文庫記法の解析エンジン
- **FileReader**: ドラッグ&ドロップファイルの読み込み
- **ContentProcessor**: テキスト前処理とバリデーション

#### 2. Rendering Layer
- **DocumentRenderer**: メイン文書の表示
- **RubyRenderer**: ルビ記法の表示処理
- **ImageRenderer**: 画像とキャプション表示
- **HeadingRenderer**: 見出し階層の表示

#### 3. UI Components
- **Sidebar**: 左右サイドバーの共通コンポーネント
- **TableOfContents**: 目次ツリーコンポーネント
- **SettingsPanel**: 表示設定パネル
- **DropZone**: ファイルドロップエリア
- **ThemeProvider**: テーマ管理コンポーネント

#### 4. State Management
- **AppContext**: グローバル状態管理
- **SettingsContext**: 表示設定の管理
- **DocumentContext**: 文書状態の管理

### データストレージ

- **localStorage**: 
  - ユーザー設定の永続化
  - テーマ設定
  - サイドバー状態
  - 表示設定（フォント、マージン等）

### パフォーマンス最適化戦略

#### メモリ管理
- 10MBまでのファイル処理（NFR-003）
- ストリーミング解析による大容量ファイル対応
- 仮想スクロール（100個以上の見出し対応）

#### レンダリング最適化
- React.memo によるコンポーネントメモ化
- useMemo による計算結果キャッシュ
- 遅延レンダリング（画像の遅延読み込み）

## セキュリティ考慮事項

### XSS対策
- DOMPurify による HTML サニタイゼーション
- Content Security Policy (CSP) の設定
- innerHTML の使用回避

### プライバシー保護
- 完全クライアントサイド処理
- 外部通信なし（画像は Base64 エンコード）
- ローカルストレージのみ使用

## 非機能要件への対応

### パフォーマンス要件
- **NFR-001**: Web Workers による非同期解析で3秒以内の初期表示
- **NFR-002**: CSS Variables による即座の設定反映（1秒以内）
- **NFR-003**: ストリーミング解析とメモリ効率化で10MB対応

### アクセシビリティ要件
- **NFR-102**: ARIA属性による完全キーボードナビゲーション
- **WCAG 2.1 AA** 準拠
- スクリーンリーダー対応

### レスポンシブデザイン
- **NFR-103**: CSS Grid/Flexbox によるモバイル対応
- ブレークポイント設計: Mobile < 768px, Tablet < 1024px, Desktop >= 1024px

## デプロイメント戦略

### 静的ホスティング
- **推奨**: GitHub Pages, Netlify, Vercel
- **特徴**: サーバーレス、CDN配信、HTTPS対応

### PWA対応
- Service Worker による オフライン対応
- Web App Manifest による インストール可能性
- キャッシュ戦略による高速化

## 技術的制約と対応

### ブラウザ互換性（NFR-301）
- **対象ブラウザ**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Polyfill**: Core-js による古いブラウザ対応
- **Progressive Enhancement**: 基本機能から段階的な機能向上

### ファイル処理制約
- **File API**: ブラウザのセキュリティ制限内での処理
- **メモリ制限**: ブラウザタブあたり2GB制限への対応
- **同期処理回避**: 大容量ファイル処理時のUI凍結防止