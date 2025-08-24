// ===== 青空文庫ビューワ TypeScript 型定義 =====

// ===== 基本型定義 =====

export type ThemeType = 'light' | 'dark' | 'system';

export type HeadingLevel = 'large' | 'medium' | 'small';

export interface Position {
  line: number;
  column: number;
  index: number;
}

export interface Range {
  start: Position;
  end: Position;
}

// ===== 青空文庫記法パース結果の型定義 =====

export interface RubyText {
  type: 'ruby';
  text: string;       // ベーステキスト（漢字等）
  ruby: string;       // ルビテキスト（ひらがな等）
  range: Range;
}

export interface Heading {
  type: 'heading';
  level: HeadingLevel;
  text: string;
  id: string;         // ナビゲーション用のID
  range: Range;
}

export interface Image {
  type: 'image';
  description: string;  // 画像説明
  filename?: string;    // ファイル名（存在する場合）
  width?: number;       // 幅
  height?: number;      // 高さ
  base64?: string;      // Base64エンコードされた画像データ
  range: Range;
}

export interface Caption {
  type: 'caption';
  text: string;
  imageId?: string;     // 関連する画像のID
  range: Range;
}

export interface PlainText {
  type: 'text';
  content: string;
  range: Range;
}

export interface Emphasis {
  type: 'emphasis';
  text: string;
  style: 'dot' | 'underline' | 'bold';  // 傍点、傍線、太字
  range: Range;
}

export interface Correction {
  type: 'correction';
  original: string;     // 底本の文字
  corrected: string;    // 修正後の文字
  range: Range;
}

// 青空文庫記法要素の共用体型
export type AozoraElement = 
  | RubyText 
  | Heading 
  | Image 
  | Caption 
  | PlainText 
  | Emphasis 
  | Correction;

// ===== 文書構造の型定義 =====

export interface ParsedDocument {
  title?: string;               // 文書タイトル（最初の大見出しから抽出）
  author?: string;              // 著者名
  elements: AozoraElement[];    // パースされた全要素
  headings: Heading[];          // 見出しのみの配列（目次生成用）
  images: Image[];              // 画像のみの配列
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  filename: string;
  fileSize: number;
  lastModified: Date;
  encoding: string;
  parseTime: number;            // パース処理時間（ms）
  elementCount: number;         // 要素数
  characterCount: number;       // 文字数
}

// ===== UI状態管理の型定義 =====

export interface SidebarState {
  left: {
    isOpen: boolean;
    width: number;              // px
  };
  right: {
    isOpen: boolean;
    width: number;              // px
  };
}

export interface DisplaySettings {
  theme: ThemeType;
  fontSize: number;             // px (12-36)
  lineHeight: number;           // 倍数 (1.0-3.0)
  letterSpacing: number;        // px (-2 to 10)
  marginLeft: number;           // px (10-200)
  marginRight: number;          // px (10-200)
  fontFamily: string;           // フォント名
  textAlign: 'left' | 'justify'; // テキスト配置
}

export interface ViewportState {
  scrollTop: number;
  activeHeadingId?: string;     // 現在表示中の見出しID
  selectedText?: string;        // 選択されたテキスト
}

// ===== アプリケーション全体の状態 =====

export interface AppState {
  document?: ParsedDocument;
  sidebar: SidebarState;
  display: DisplaySettings;
  viewport: ViewportState;
  isLoading: boolean;
  error?: AppError;
}

export interface AppError {
  type: 'file' | 'parse' | 'render' | 'storage';
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// ===== アクション型定義（Reducer用） =====

export type AppAction =
  | { type: 'SET_DOCUMENT'; payload: ParsedDocument }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: AppError | null }
  | { type: 'TOGGLE_SIDEBAR'; payload: { side: 'left' | 'right' } }
  | { type: 'UPDATE_DISPLAY_SETTINGS'; payload: Partial<DisplaySettings> }
  | { type: 'UPDATE_VIEWPORT'; payload: Partial<ViewportState> }
  | { type: 'RESET_STATE' };

// ===== ファイル処理関連の型定義 =====

export interface FileProcessingResult {
  success: boolean;
  document?: ParsedDocument;
  error?: {
    type: 'invalid_file' | 'parse_error' | 'memory_error';
    message: string;
  };
  warnings?: string[];
}

export interface DropzoneProps {
  onFileAccepted: (file: File) => void;
  onFileRejected: (error: string) => void;
  accept: string[];
  maxSize: number;              // bytes
}

// ===== コンポーネントProps型定義 =====

export interface TableOfContentsProps {
  headings: Heading[];
  activeId?: string;
  onHeadingClick: (heading: Heading) => void;
  className?: string;
}

export interface SettingsPanelProps {
  settings: DisplaySettings;
  onSettingsChange: (settings: Partial<DisplaySettings>) => void;
  onResetSettings: () => void;
}

export interface DocumentViewerProps {
  document: ParsedDocument;
  settings: DisplaySettings;
  onImageLoad?: (imageId: string, success: boolean) => void;
  onTextSelect?: (selectedText: string, range: Range) => void;
}

export interface SidebarProps {
  side: 'left' | 'right';
  isOpen: boolean;
  width: number;
  onToggle: () => void;
  onResize?: (newWidth: number) => void;
  children: any; // React.ReactNode
}

// ===== Hooks関連の型定義 =====

export interface UseLocalStorageOptions<T> {
  defaultValue: T;
  serializer?: {
    read: (value: string) => T;
    write: (value: T) => string;
  };
}

export interface UseThemeReturn {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  effectiveTheme: 'light' | 'dark';     // system選択時の実際のテーマ
}

export interface UseFileDropReturn {
  isDragActive: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  getRootProps: () => Record<string, any>;
  getInputProps: () => Record<string, any>;
}

// ===== パフォーマンス監視用の型定義 =====

export interface PerformanceMetrics {
  fileLoadTime: number;         // ファイル読み込み時間 (ms)
  parseTime: number;            // パース処理時間 (ms)
  renderTime: number;           // 初期レンダリング時間 (ms)
  memoryUsage?: number;         // メモリ使用量 (MB)
  documentSize: number;         // 文書サイズ (bytes)
  elementCount: number;         // 要素数
}

export interface VirtualScrollItem {
  id: string;
  index: number;
  height: number;
  offsetTop: number;
  data: AozoraElement;
}

// ===== エクスポート・インポート用の型定義 =====

export interface ExportSettings {
  includeImages: boolean;
  format: 'html' | 'markdown' | 'plain';
  preserveRuby: boolean;
  preserveHeadings: boolean;
}

export interface ImportedSettings {
  version: string;
  settings: DisplaySettings;
  timestamp: Date;
}

// ===== 開発・デバッグ用の型定義 =====

export interface DebugInfo {
  version: string;
  buildDate: string;
  userAgent: string;
  screenSize: { width: number; height: number };
  localStorage: boolean;
  fileApiSupported: boolean;
  dragDropSupported: boolean;
}

// ===== 定数定義 =====

export const THEME_TYPES: readonly ThemeType[] = ['light', 'dark', 'system'] as const;

export const HEADING_LEVELS: readonly HeadingLevel[] = ['large', 'medium', 'small'] as const;

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  theme: 'system',
  fontSize: 16,
  lineHeight: 1.8,
  letterSpacing: 0,
  marginLeft: 40,
  marginRight: 40,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  textAlign: 'left'
} as const;

export const DEFAULT_SIDEBAR_STATE: SidebarState = {
  left: { isOpen: false, width: 280 },
  right: { isOpen: false, width: 320 }
} as const;

export const SUPPORTED_FILE_TYPES = ['.txt'] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const VIRTUAL_SCROLL_THRESHOLD = 100; // 見出し数の閾値