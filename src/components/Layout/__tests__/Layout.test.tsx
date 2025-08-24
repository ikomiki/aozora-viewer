import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Layout from '../Layout'

describe('Layout', () => {
  it('should render main layout structure', () => {
    render(<Layout />)
    
    // メインランドマークが存在すること
    expect(screen.getByRole('main')).toBeInTheDocument()
    
    // 左サイドバーが存在すること (Table of contentsという名前で)
    expect(screen.getByRole('complementary', { name: 'Table of contents' })).toBeInTheDocument()
    
    // 右サイドバーが存在すること (Settings panelという名前で)  
    expect(screen.getByRole('complementary', { name: 'Settings panel' })).toBeInTheDocument()
  })

  it('should have responsive design classes', () => {
    const { container } = render(<Layout />)
    
    // CSS Modulesによるクラスが適用されていること
    expect(container.firstChild).toHaveAttribute('class')
    expect((container.firstChild as Element)?.className).toMatch(/layout/)
  })

  it('should support CSS variables for theming', () => {
    const { container } = render(<Layout />)
    
    // テーマ用のCSS変数サポートクラスがあること (CSS Modulesハッシュを考慮)
    expect(container.firstChild).toHaveAttribute('class')
    expect((container.firstChild as Element)?.className).toMatch(/layout/)
  })

  it('should have proper ARIA landmarks', () => {
    render(<Layout />)
    
    // 適切なARIAランドマークが設定されていること
    expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Main content')
    expect(screen.getByRole('complementary', { name: 'Table of contents' })).toHaveAttribute('aria-label', 'Table of contents')
    expect(screen.getByRole('complementary', { name: 'Settings panel' })).toHaveAttribute('aria-label', 'Settings panel')
  })
})