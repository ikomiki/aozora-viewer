// サイドバー関連の定数

export const SIDEBAR_CONSTANTS = {
  DEFAULT_WIDTH: 280,
  COLLAPSED_WIDTH: 40,
  MIN_WIDTH: 200,
  MAX_WIDTH: 600,
  
  // localStorage キー
  STORAGE_KEYS: {
    LEFT_OPEN: 'aozora-sidebar-left',
    RIGHT_OPEN: 'aozora-sidebar-right',
    LEFT_WIDTH: 'aozora-sidebar-left-width',
    RIGHT_WIDTH: 'aozora-sidebar-right-width',
  },
  
  // デフォルトのaria-label
  ARIA_LABELS: {
    LEFT: 'Table of contents',
    RIGHT: 'Settings panel'
  }
} as const