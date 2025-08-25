import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDocumentSettings } from '../useDocumentSettings'

// localStorage のモック
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('useDocumentSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
  })

  describe('初期状態', () => {
    it('デフォルト設定値で初期化される', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useDocumentSettings())
      
      expect(result.current.settings).toEqual({
        fontSize: 16,
        lineHeight: 1.6,
        horizontalMargin: 20,
        letterSpacing: 0,
        paragraphSpacing: 16
      })
    })

    it('localStorageから設定を復元する', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('20')   // fontSize
        .mockReturnValueOnce('1.8')  // lineHeight
        .mockReturnValueOnce('30')   // horizontalMargin
        .mockReturnValueOnce('0.5')  // letterSpacing
        .mockReturnValueOnce('20')   // paragraphSpacing
      
      const { result } = renderHook(() => useDocumentSettings())
      
      expect(result.current.settings).toEqual({
        fontSize: 20,
        lineHeight: 1.8,
        horizontalMargin: 30,
        letterSpacing: 0.5,
        paragraphSpacing: 20
      })
    })

    it('不正なlocalStorage値はデフォルト値を使用', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('invalid')  // fontSize
        .mockReturnValueOnce('null')     // lineHeight
        .mockReturnValueOnce('999')      // horizontalMargin (範囲外)
        .mockReturnValueOnce('-10')      // letterSpacing (範囲外)
        .mockReturnValueOnce('100')      // paragraphSpacing (範囲外)
      
      const { result } = renderHook(() => useDocumentSettings())
      
      expect(result.current.settings).toEqual({
        fontSize: 16,        // デフォルト
        lineHeight: 1.6,     // デフォルト
        horizontalMargin: 200, // 最大値にクランプ
        letterSpacing: -0.5,   // 最小値にクランプ
        paragraphSpacing: 50   // 最大値にクランプ
      })
    })
  })

  describe('設定変更', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('updateSetting で設定が更新される', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useDocumentSettings())
      
      act(() => {
        result.current.updateSetting('fontSize', 20)
      })
      
      expect(result.current.settings.fontSize).toBe(20)
    })

    it('範囲外の値は自動的にクランプされる', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useDocumentSettings())
      
      act(() => {
        result.current.updateSetting('fontSize', 50) // 最大36を超過
        result.current.updateSetting('lineHeight', 0.5) // 最小1.2未満
      })
      
      expect(result.current.settings.fontSize).toBe(36)
      expect(result.current.settings.lineHeight).toBe(1.2)
    })

    it('デバウンス後にlocalStorageに保存される', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useDocumentSettings())
      
      act(() => {
        result.current.updateSetting('fontSize', 18)
      })
      
      // デバウンス前はまだ保存されない
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
      
      // デバウンス時間経過
      act(() => {
        vi.advanceTimersByTime(500)
      })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('aozora-settings-fontSize', '18')
    })

    it('resetToDefaults で全設定がリセットされる', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useDocumentSettings())
      
      act(() => {
        result.current.updateSetting('fontSize', 24)
        result.current.updateSetting('lineHeight', 2.0)
      })
      
      act(() => {
        result.current.resetToDefaults()
      })
      
      expect(result.current.settings).toEqual({
        fontSize: 16,
        lineHeight: 1.6,
        horizontalMargin: 20,
        letterSpacing: 0,
        paragraphSpacing: 16
      })
    })

    it('resetSetting で個別設定がリセットされる', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useDocumentSettings())
      
      act(() => {
        result.current.updateSetting('fontSize', 24)
        result.current.updateSetting('lineHeight', 2.0)
      })
      
      act(() => {
        result.current.resetSetting('fontSize')
      })
      
      expect(result.current.settings.fontSize).toBe(16)
      expect(result.current.settings.lineHeight).toBe(2.0) // 他は変更されない
    })
  })

  describe('CSS Variables連携', () => {
    beforeEach(() => {
      // document.documentElement.style のモック
      vi.spyOn(document.documentElement.style, 'setProperty')
    })

    it('設定変更時にCSS変数が更新される', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useDocumentSettings())
      
      act(() => {
        result.current.updateSetting('fontSize', 20)
        result.current.updateSetting('lineHeight', 1.8)
      })
      
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--document-font-size', '20px')
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--document-line-height', '1.8')
    })

    it('リセット時にCSS変数もリセットされる', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useDocumentSettings())
      
      act(() => {
        result.current.updateSetting('fontSize', 24)
      })
      
      act(() => {
        result.current.resetSetting('fontSize')
      })
      
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--document-font-size', '16px')
    })
  })
})