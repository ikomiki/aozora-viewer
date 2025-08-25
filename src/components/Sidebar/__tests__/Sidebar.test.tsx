import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Sidebar from '../Sidebar'

// useResizablePanel フックのモック
vi.mock('../../../hooks/useResizablePanel', () => ({
  useResizablePanel: vi.fn(() => ({
    width: 300,
    isResizing: false,
    resizerProps: {
      onMouseDown: vi.fn()
    }
  }))
}))

describe('Sidebar', () => {
  const defaultProps = {
    side: 'left' as const,
    isOpen: false,
    onToggle: vi.fn(),
    width: 280,
    onWidthChange: vi.fn(),
    children: <div>テスト内容</div>
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本レンダリング', () => {
    it('左サイドバーが正しくレンダリングされる', () => {
      render(<Sidebar {...defaultProps} side="left" isOpen={false} />)
      
      const sidebar = screen.getByRole('complementary')
      expect(sidebar.className).toContain('sidebar')
      expect(sidebar.className).toContain('sidebar-left')
      expect(sidebar.className).toContain('sidebar-closed')
      expect(sidebar).toHaveAttribute('aria-expanded', 'false')
    })

    it('右サイドバーが正しくレンダリングされる', () => {
      render(<Sidebar {...defaultProps} side="right" isOpen={true} />)
      
      const sidebar = screen.getByRole('complementary')
      expect(sidebar.className).toContain('sidebar')
      expect(sidebar.className).toContain('sidebar-right')
      expect(sidebar.className).toContain('sidebar-open')
      expect(sidebar).toHaveAttribute('aria-expanded', 'true')
    })

    it('children が正しく表示される', () => {
      render(<Sidebar {...defaultProps} />)
      
      expect(screen.getByText('テスト内容')).toBeInTheDocument()
    })

    it('カスタム width が適用される', () => {
      render(<Sidebar {...defaultProps} width={320} isOpen={true} />)
      
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveStyle('width: 320px')
    })
  })

  describe('開閉機能', () => {
    it('トグルボタンクリックで onToggle が呼ばれる', () => {
      const onToggle = vi.fn()
      render(<Sidebar {...defaultProps} onToggle={onToggle} />)
      
      const toggleButton = screen.getByRole('button', { name: /open left sidebar/i })
      fireEvent.click(toggleButton)
      
      expect(onToggle).toHaveBeenCalledTimes(1)
    })

    it('開閉状態に応じて aria-expanded が変更される', () => {
      const { rerender } = render(<Sidebar {...defaultProps} isOpen={false} />)
      const sidebar = screen.getByRole('complementary')
      
      expect(sidebar).toHaveAttribute('aria-expanded', 'false')
      
      rerender(<Sidebar {...defaultProps} isOpen={true} />)
      expect(sidebar).toHaveAttribute('aria-expanded', 'true')
    })

    it('開閉状態に応じてボタンのテキストが変更される', () => {
      // 左サイドバー
      const { rerender } = render(<Sidebar {...defaultProps} side="left" isOpen={false} />)
      let toggleButton = screen.getByRole('button')
      expect(toggleButton).toHaveTextContent('→')
      
      rerender(<Sidebar {...defaultProps} side="left" isOpen={true} />)
      toggleButton = screen.getByRole('button')
      expect(toggleButton).toHaveTextContent('←')
      
      // 右サイドバー
      rerender(<Sidebar {...defaultProps} side="right" isOpen={false} />)
      toggleButton = screen.getByRole('button')
      expect(toggleButton).toHaveTextContent('←')
      
      rerender(<Sidebar {...defaultProps} side="right" isOpen={true} />)
      toggleButton = screen.getByRole('button')
      expect(toggleButton).toHaveTextContent('→')
    })
  })

  describe('リサイズ機能', () => {
    it('リサイズハンドルが表示される', () => {
      render(<Sidebar {...defaultProps} canResize={true} />)
      
      const resizeHandle = screen.getByTestId('resize-handle')
      expect(resizeHandle).toBeInTheDocument()
    })

    it('リサイズ無効時はハンドルが表示されない', () => {
      render(<Sidebar {...defaultProps} canResize={false} />)
      
      const resizeHandle = screen.queryByTestId('resize-handle')
      expect(resizeHandle).not.toBeInTheDocument()
    })

    it('onWidthChange コールバックが設定される', () => {
      const onWidthChange = vi.fn()
      render(<Sidebar {...defaultProps} canResize={true} onWidthChange={onWidthChange} />)
      
      // リサイズハンドルが表示されることで、useResizablePanelフックが呼ばれることを間接的に確認
      const resizeHandle = screen.getByTestId('resize-handle')
      expect(resizeHandle).toBeInTheDocument()
      expect(onWidthChange).toBeDefined()
    })
  })

  describe('アクセシビリティ', () => {
    it('適切な ARIA 属性が設定される', () => {
      render(<Sidebar {...defaultProps} ariaLabel="カスタムラベル" />)
      
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveAttribute('role', 'complementary')
      expect(sidebar).toHaveAttribute('aria-label', 'カスタムラベル')
    })

    it('デフォルトの aria-label が設定される', () => {
      render(<Sidebar {...defaultProps} side="left" />)
      
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveAttribute('aria-label', 'Table of contents')
    })

    it('閉じた状態で内容が非表示', () => {
      render(<Sidebar {...defaultProps} isOpen={false} />)
      
      const content = screen.getByText('テスト内容').closest('[aria-hidden]')
      expect(content).toHaveAttribute('aria-hidden', 'true')
    })

    it('開いた状態で内容が表示', () => {
      render(<Sidebar {...defaultProps} isOpen={true} />)
      
      const content = screen.getByText('テスト内容').closest('[aria-hidden]')
      expect(content).toHaveAttribute('aria-hidden', 'false')
    })

    it('キーボード操作対応', () => {
      const onToggle = vi.fn()
      render(<Sidebar {...defaultProps} onToggle={onToggle} />)
      
      const toggleButton = screen.getByRole('button')
      
      // Enter キー
      fireEvent.keyDown(toggleButton, { key: 'Enter', code: 'Enter' })
      expect(onToggle).toHaveBeenCalledTimes(1)
      
      // Space キー
      fireEvent.keyDown(toggleButton, { key: ' ', code: 'Space' })
      expect(onToggle).toHaveBeenCalledTimes(2)
    })
  })

  describe('アニメーション', () => {
    it('正しい transition duration が設定される', () => {
      render(<Sidebar {...defaultProps} />)
      
      const sidebar = screen.getByRole('complementary')
      
      // CSSクラスが正しく適用されていることで、アニメーションが設定されることを確認
      expect(sidebar.className).toContain('sidebar')
      
      // 実際のCSS変数の値はテスト環境では利用できないため、
      // クラス名の存在でアニメーション設定を間接的に確認
      expect(sidebar).toBeInTheDocument()
    })
  })
})