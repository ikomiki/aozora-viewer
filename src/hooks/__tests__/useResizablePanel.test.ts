import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useResizablePanel } from '../useResizablePanel'

// マウスイベントのモック
const createMouseEvent = (clientX: number): MouseEvent => {
  return new MouseEvent('mousemove', {
    clientX,
    bubbles: true
  })
}

describe('useResizablePanel', () => {
  const defaultProps = {
    initialWidth: 300,
    minWidth: 200,
    maxWidth: 600,
    onWidthChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期化', () => {
    it('初期幅が正しく設定される', () => {
      const { result } = renderHook(() => useResizablePanel(defaultProps))
      
      expect(result.current.width).toBe(300)
    })

    it('初期状態でリサイズ中ではない', () => {
      const { result } = renderHook(() => useResizablePanel(defaultProps))
      
      expect(result.current.isResizing).toBe(false)
    })
  })

  describe('リサイズ操作', () => {
    it('mousedown でリサイズ開始', () => {
      const { result } = renderHook(() => useResizablePanel(defaultProps))
      
      const mouseEvent = createMouseEvent(300)
      
      act(() => {
        result.current.resizerProps.onMouseDown(mouseEvent as any)
      })
      
      expect(result.current.isResizing).toBe(true)
    })

    it('mousemove でリサイズ実行', () => {
      const onWidthChange = vi.fn()
      const { result } = renderHook(() => 
        useResizablePanel({ ...defaultProps, onWidthChange })
      )
      
      // mousedown でリサイズ開始
      act(() => {
        result.current.resizerProps.onMouseDown(createMouseEvent(300) as any)
      })
      
      // mousemove でリサイズ実行（右に50px移動）
      act(() => {
        document.dispatchEvent(createMouseEvent(350))
      })
      
      expect(onWidthChange).toHaveBeenCalledWith(350) // 300 + 50
    })

    it('mouseup でリサイズ終了', () => {
      const { result } = renderHook(() => useResizablePanel(defaultProps))
      
      // mousedown でリサイズ開始
      act(() => {
        result.current.resizerProps.onMouseDown(createMouseEvent(300) as any)
      })
      
      expect(result.current.isResizing).toBe(true)
      
      // mouseup でリサイズ終了
      act(() => {
        document.dispatchEvent(new MouseEvent('mouseup'))
      })
      
      expect(result.current.isResizing).toBe(false)
    })

    it('最小幅以下にはリサイズできない', () => {
      const onWidthChange = vi.fn()
      const { result } = renderHook(() => 
        useResizablePanel({ ...defaultProps, onWidthChange, initialWidth: 250 })
      )
      
      // mousedown でリサイズ開始
      act(() => {
        result.current.resizerProps.onMouseDown(createMouseEvent(250) as any)
      })
      
      // 左に100px移動（150px = 最小値以下）
      act(() => {
        document.dispatchEvent(createMouseEvent(150))
      })
      
      expect(onWidthChange).toHaveBeenCalledWith(200) // 最小値に制限
    })

    it('最大幅以上にはリサイズできない', () => {
      const onWidthChange = vi.fn()
      const { result } = renderHook(() => 
        useResizablePanel({ ...defaultProps, onWidthChange, initialWidth: 550 })
      )
      
      // mousedown でリサイズ開始
      act(() => {
        result.current.resizerProps.onMouseDown(createMouseEvent(550) as any)
      })
      
      // 右に100px移動（650px = 最大値以上）
      act(() => {
        document.dispatchEvent(createMouseEvent(650))
      })
      
      expect(onWidthChange).toHaveBeenCalledWith(600) // 最大値に制限
    })
  })

  describe('クリーンアップ', () => {
    it('コンポーネントアンマウント時にイベントリスナーが削除される', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
      
      const { result, unmount } = renderHook(() => useResizablePanel(defaultProps))
      
      // mousedown でリサイズ開始（イベントリスナー追加）
      act(() => {
        result.current.resizerProps.onMouseDown(createMouseEvent(300) as any)
      })
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
      
      // アンマウント
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
    })
  })
})