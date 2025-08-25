// サイドバー関連の型定義
import type { MouseEvent as ReactMouseEvent } from 'react'

export interface SidebarState {
  left: {
    isOpen: boolean
    width: number
  }
  right: {
    isOpen: boolean
    width: number
  }
}

export interface UseSidebarStateReturn {
  sidebarState: SidebarState
  toggleSidebar: (side: 'left' | 'right') => void
  setSidebarWidth: (side: 'left' | 'right', width: number) => void
  resetToDefaults: () => void
}

export interface UseResizablePanelProps {
  initialWidth: number
  minWidth: number
  maxWidth: number
  onWidthChange: (width: number) => void
}

export interface UseResizablePanelReturn {
  width: number
  isResizing: boolean
  resizerProps: {
    onMouseDown: (e: ReactMouseEvent) => void
  }
}

export type SidebarSide = 'left' | 'right'