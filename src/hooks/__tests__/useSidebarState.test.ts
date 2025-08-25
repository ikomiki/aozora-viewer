import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSidebarState } from '../useSidebarState'

// localStorageのモック
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('useSidebarState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期状態', () => {
    it('デフォルト状態で両サイドバーが閉じている', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useSidebarState())
      
      expect(result.current.sidebarState).toEqual({
        left: { isOpen: false, width: 280 },
        right: { isOpen: false, width: 280 }
      })
    })

    it('localStorageから状態を復元する', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('true')  // aozora-sidebar-left
        .mockReturnValueOnce('false') // aozora-sidebar-right
        .mockReturnValueOnce('320')   // aozora-sidebar-left-width
        .mockReturnValueOnce('300')   // aozora-sidebar-right-width
      
      const { result } = renderHook(() => useSidebarState())
      
      expect(result.current.sidebarState).toEqual({
        left: { isOpen: true, width: 320 },
        right: { isOpen: false, width: 300 }
      })
    })

    it('無効なlocalStorage値の場合はデフォルト値を使用', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('invalid-boolean') // aozora-sidebar-left
        .mockReturnValueOnce('not-a-number')    // aozora-sidebar-left-width
      
      const { result } = renderHook(() => useSidebarState())
      
      expect(result.current.sidebarState).toEqual({
        left: { isOpen: false, width: 280 },
        right: { isOpen: false, width: 280 }
      })
    })
  })

  describe('状態変更', () => {
    it('toggleSidebar で左サイドバーの開閉状態を切り替える', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useSidebarState())
      
      // 初期状態: closed
      expect(result.current.sidebarState.left.isOpen).toBe(false)
      
      // 開く
      act(() => {
        result.current.toggleSidebar('left')
      })
      
      expect(result.current.sidebarState.left.isOpen).toBe(true)
      
      // 閉じる
      act(() => {
        result.current.toggleSidebar('left')
      })
      
      expect(result.current.sidebarState.left.isOpen).toBe(false)
    })

    it('toggleSidebar で右サイドバーの開閉状態を切り替える', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useSidebarState())
      
      // 左サイドバーと独立して動作することを確認
      act(() => {
        result.current.toggleSidebar('left')
      })
      
      expect(result.current.sidebarState.left.isOpen).toBe(true)
      expect(result.current.sidebarState.right.isOpen).toBe(false)
      
      act(() => {
        result.current.toggleSidebar('right')
      })
      
      expect(result.current.sidebarState.left.isOpen).toBe(true)
      expect(result.current.sidebarState.right.isOpen).toBe(true)
    })

    it('setSidebarWidth でサイドバー幅を変更する', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useSidebarState())
      
      act(() => {
        result.current.setSidebarWidth('left', 320)
      })
      
      expect(result.current.sidebarState.left.width).toBe(320)
    })

    it('幅の境界値テスト', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useSidebarState())
      
      // 最小値未満
      act(() => {
        result.current.setSidebarWidth('left', 150)
      })
      
      expect(result.current.sidebarState.left.width).toBe(200) // 最小値に制限
      
      // 最大値超過
      act(() => {
        result.current.setSidebarWidth('right', 700)
      })
      
      expect(result.current.sidebarState.right.width).toBe(600) // 最大値に制限
    })
  })

  describe('永続化', () => {
    it('状態変更がlocalStorageに保存される', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useSidebarState())
      
      act(() => {
        result.current.toggleSidebar('left')
      })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('aozora-sidebar-left', 'true')
    })

    it('幅変更がlocalStorageに保存される', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useSidebarState())
      
      act(() => {
        result.current.setSidebarWidth('left', 320)
      })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('aozora-sidebar-left-width', '320')
    })

    it('resetToDefaults でlocalStorageがクリアされる', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useSidebarState())
      
      act(() => {
        result.current.resetToDefaults()
      })
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('aozora-sidebar-left')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('aozora-sidebar-right')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('aozora-sidebar-left-width')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('aozora-sidebar-right-width')
      
      expect(result.current.sidebarState).toEqual({
        left: { isOpen: false, width: 280 },
        right: { isOpen: false, width: 280 }
      })
    })
  })
})