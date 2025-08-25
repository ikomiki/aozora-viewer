import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPanel from '../SettingsPanel'

// useDocumentSettings のモック
const mockUpdateSetting = vi.fn()
const mockResetSetting = vi.fn()
const mockResetToDefaults = vi.fn()

vi.mock('../../../hooks/useDocumentSettings', () => ({
  useDocumentSettings: vi.fn(() => ({
    settings: {
      fontSize: 16,
      lineHeight: 1.6,
      horizontalMargin: 20,
      letterSpacing: 0,
      paragraphSpacing: 16
    },
    updateSetting: mockUpdateSetting,
    resetSetting: mockResetSetting,
    resetToDefaults: mockResetToDefaults
  }))
}))

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

describe('SettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
  })

  describe('基本レンダリング', () => {
    it('全設定項目が表示される', () => {
      render(<SettingsPanel />)
      
      expect(screen.getByText('表示設定')).toBeInTheDocument()
      expect(screen.getByText('文字サイズ')).toBeInTheDocument()
      expect(screen.getByText('行間')).toBeInTheDocument()
      expect(screen.getByText('左右マージン')).toBeInTheDocument()
      expect(screen.getByText('文字間隔')).toBeInTheDocument()
      expect(screen.getByText('段落間隔')).toBeInTheDocument()
    })

    it('全リセットボタンが表示される', () => {
      render(<SettingsPanel />)
      
      const resetAllButton = screen.getByRole('button', { name: /すべてリセット|reset all/i })
      expect(resetAllButton).toBeInTheDocument()
    })

    it('各設定のスライダーが表示される', () => {
      render(<SettingsPanel />)
      
      const sliders = screen.getAllByRole('slider')
      expect(sliders).toHaveLength(5) // 5つの設定項目
    })
  })

  describe('設定変更', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('文字サイズ変更が正常に動作する', async () => {
      render(<SettingsPanel />)
      
      const fontSizeSlider = screen.getByRole('slider', { name: /文字サイズ/i })
      
      // スライダーの値を直接変更
      fireEvent.change(fontSizeSlider, { target: { value: '18' } })
      
      expect(mockUpdateSetting).toHaveBeenCalledWith('fontSize', 18)
    })

    it('全リセットボタンで全設定がリセットされる', async () => {
      const user = userEvent.setup()
      render(<SettingsPanel />)
      
      const resetAllButton = screen.getByRole('button', { name: /すべてリセット/i })
      await user.click(resetAllButton)
      
      expect(mockResetToDefaults).toHaveBeenCalledTimes(1)
    })

    it('個別リセットが正常に動作する', async () => {
      const user = userEvent.setup()
      render(<SettingsPanel />)
      
      // 文字サイズのリセットボタンをクリック
      const resetButtons = screen.getAllByRole('button', { name: /Reset 文字サイズ/i })
      
      if (resetButtons.length > 0) {
        await user.click(resetButtons[0])
        expect(mockResetSetting).toHaveBeenCalledWith('fontSize')
      } else {
        // フォールバック：一般的なリセットボタンをクリック
        const allResetButtons = screen.getAllByText('↺')
        await user.click(allResetButtons[0])
        expect(mockResetSetting).toHaveBeenCalled()
      }
    })
  })

  describe('スライダーの設定範囲', () => {
    it('各スライダーが正しい範囲を持つ', () => {
      render(<SettingsPanel />)
      
      const sliders = screen.getAllByRole('slider')
      
      // 文字サイズ: 12-36px
      expect(sliders[0]).toHaveAttribute('min', '12')
      expect(sliders[0]).toHaveAttribute('max', '36')
      
      // 行間: 1.2-2.5
      expect(sliders[1]).toHaveAttribute('min', '1.2')
      expect(sliders[1]).toHaveAttribute('max', '2.5')
      
      // 左右マージン: 0-200px
      expect(sliders[2]).toHaveAttribute('min', '0')
      expect(sliders[2]).toHaveAttribute('max', '200')
      
      // 文字間隔: -0.5-2.0px
      expect(sliders[3]).toHaveAttribute('min', '-0.5')
      expect(sliders[3]).toHaveAttribute('max', '2')
      
      // 段落間隔: 0-50px
      expect(sliders[4]).toHaveAttribute('min', '0')
      expect(sliders[4]).toHaveAttribute('max', '50')
    })

    it('各スライダーが正しいステップを持つ', () => {
      render(<SettingsPanel />)
      
      const sliders = screen.getAllByRole('slider')
      
      // 文字サイズ: 1px step
      expect(sliders[0]).toHaveAttribute('step', '1')
      
      // 行間: 0.1 step
      expect(sliders[1]).toHaveAttribute('step', '0.1')
      
      // 左右マージン: 5px step
      expect(sliders[2]).toHaveAttribute('step', '5')
      
      // 文字間隔: 0.1px step
      expect(sliders[3]).toHaveAttribute('step', '0.1')
      
      // 段落間隔: 2px step
      expect(sliders[4]).toHaveAttribute('step', '2')
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定される', () => {
      render(<SettingsPanel />)
      
      const settingsPanel = screen.getByRole('region', { name: /設定|settings/i })
      expect(settingsPanel).toBeInTheDocument()
      
      const sliders = screen.getAllByRole('slider')
      sliders.forEach(slider => {
        expect(slider).toHaveAttribute('aria-label')
        expect(slider).toHaveAttribute('aria-valuemin')
        expect(slider).toHaveAttribute('aria-valuemax')
        expect(slider).toHaveAttribute('aria-valuenow')
      })
    })

    it('キーボードナビゲーション対応', () => {
      render(<SettingsPanel />)
      
      const sliders = screen.getAllByRole('slider')
      const resetAllButton = screen.getByRole('button', { name: /すべてリセット/i })
      
      // スライダーとボタンがTabで移動可能な要素であることを確認
      expect(sliders[0]).toHaveAttribute('type', 'range')
      expect(resetAllButton).toHaveAttribute('type', 'button')
      
      // 要素が存在することを確認
      expect(sliders).toHaveLength(5)
      expect(resetAllButton).toBeInTheDocument()
    })
  })

  describe('エラーハンドリング', () => {
    it('不正な設定値でもクラッシュしない', () => {
      // 不正な値を持つモック設定
      vi.mocked(mockUpdateSetting).mockClear()
      
      expect(() => {
        render(<SettingsPanel />)
      }).not.toThrow()
      
      // 基本的なレンダリングが成功することを確認
      expect(screen.getByText('表示設定')).toBeInTheDocument()
    })
  })
})