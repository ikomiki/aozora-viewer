import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingSlider from '../SettingSlider'

describe('SettingSlider', () => {
  const defaultProps = {
    label: 'テスト設定',
    value: 16,
    min: 12,
    max: 36,
    step: 1,
    unit: 'px',
    onChange: vi.fn(),
    onReset: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本レンダリング', () => {
    it('正しくレンダリングされる', () => {
      render(<SettingSlider {...defaultProps} />)
      
      expect(screen.getByText('テスト設定')).toBeInTheDocument()
      expect(screen.getByDisplayValue('16')).toBeInTheDocument()
      expect(screen.getByText('16px')).toBeInTheDocument()
    })

    it('スライダーの属性が正しく設定される', () => {
      render(<SettingSlider {...defaultProps} />)
      
      const slider = screen.getByRole('slider')
      expect(slider).toHaveAttribute('min', '12')
      expect(slider).toHaveAttribute('max', '36')
      expect(slider).toHaveAttribute('step', '1')
      expect(slider).toHaveAttribute('value', '16')
    })

    it('リセットボタンが表示される', () => {
      render(<SettingSlider {...defaultProps} />)
      
      const resetButton = screen.getByRole('button', { name: /reset|リセット/i })
      expect(resetButton).toBeInTheDocument()
    })
  })

  describe('操作', () => {
    it('スライダー操作でonChangeが呼ばれる', async () => {
      const onChange = vi.fn()
      
      render(<SettingSlider {...defaultProps} onChange={onChange} />)
      
      const slider = screen.getByRole('slider')
      
      // input イベントを直接発火
      fireEvent.change(slider, { target: { value: '17' } })
      
      expect(onChange).toHaveBeenCalledWith(17)
    })

    it('リセットボタンクリックでonResetが呼ばれる', async () => {
      const user = userEvent.setup()
      const onReset = vi.fn()
      
      render(<SettingSlider {...defaultProps} onReset={onReset} />)
      
      const resetButton = screen.getByRole('button', { name: /reset|リセット/i })
      await user.click(resetButton)
      
      expect(onReset).toHaveBeenCalledTimes(1)
    })

    it('キーボード操作でスライダーが操作できる', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      
      render(<SettingSlider {...defaultProps} onChange={onChange} />)
      
      const slider = screen.getByRole('slider')
      slider.focus()
      
      await user.keyboard('{ArrowRight}')
      
      expect(onChange).toHaveBeenCalledWith(17)
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定される', () => {
      render(<SettingSlider {...defaultProps} />)
      
      const slider = screen.getByRole('slider')
      expect(slider).toHaveAttribute('aria-label', 'テスト設定')
      expect(slider).toHaveAttribute('aria-valuemin', '12')
      expect(slider).toHaveAttribute('aria-valuemax', '36')
      expect(slider).toHaveAttribute('aria-valuenow', '16')
      expect(slider).toHaveAttribute('aria-valuetext', '16px')
    })

    it('キーボード操作対応', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      
      render(<SettingSlider {...defaultProps} onChange={onChange} />)
      
      const slider = screen.getByRole('slider')
      slider.focus()
      
      await user.keyboard('{ArrowRight}')
      expect(onChange).toHaveBeenCalledWith(17)
      
      await user.keyboard('{ArrowLeft}')
      expect(onChange).toHaveBeenCalledWith(15)
      
      await user.keyboard('{Home}')
      expect(onChange).toHaveBeenCalledWith(12)
      
      await user.keyboard('{End}')
      expect(onChange).toHaveBeenCalledWith(36)
    })

    it('スクリーンリーダー対応', () => {
      render(<SettingSlider {...defaultProps} />)
      
      const slider = screen.getByRole('slider')
      const label = screen.getByText('テスト設定')
      
      expect(slider).toHaveAttribute('aria-describedby')
      expect(label).toBeInTheDocument()
    })
  })

  describe('値の範囲', () => {
    it('小数点の値が正しく処理される', () => {
      const props = {
        ...defaultProps,
        value: 1.5,
        min: 1.0,
        max: 2.5,
        step: 0.1,
        unit: ''
      }
      
      render(<SettingSlider {...props} />)
      
      expect(screen.getByDisplayValue('1.5')).toBeInTheDocument()
      expect(screen.getByText('1.5')).toBeInTheDocument()
    })

    it('負の値が正しく処理される', () => {
      const props = {
        ...defaultProps,
        value: -0.5,
        min: -1.0,
        max: 2.0,
        step: 0.1,
        unit: 'px'
      }
      
      render(<SettingSlider {...props} />)
      
      expect(screen.getByDisplayValue('-0.5')).toBeInTheDocument()
      expect(screen.getByText('-0.5px')).toBeInTheDocument()
    })
  })
})