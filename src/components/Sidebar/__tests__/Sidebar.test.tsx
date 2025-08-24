import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Sidebar from '../Sidebar'

describe('Sidebar', () => {
  it('should render sidebar with toggle button', () => {
    const mockOnToggle = vi.fn()
    render(
      <Sidebar 
        side="left" 
        isOpen={false} 
        onToggle={mockOnToggle}
      >
        <div>Test Content</div>
      </Sidebar>
    )
    
    // トグルボタンが存在すること
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should call onToggle when toggle button is clicked', () => {
    const mockOnToggle = vi.fn()
    render(
      <Sidebar 
        side="left" 
        isOpen={false} 
        onToggle={mockOnToggle}
      >
        <div>Test Content</div>
      </Sidebar>
    )
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockOnToggle).toHaveBeenCalledTimes(1)
  })

  it('should show content when isOpen is true', () => {
    render(
      <Sidebar 
        side="left" 
        isOpen={true} 
        onToggle={vi.fn()}
      >
        <div>Test Content</div>
      </Sidebar>
    )
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should have different classes for left and right sidebars', () => {
    const { rerender } = render(
      <Sidebar 
        side="left" 
        isOpen={false} 
        onToggle={vi.fn()}
      >
        <div>Content</div>
      </Sidebar>
    )
    
    const leftSidebar = screen.getByRole('complementary')
    expect(leftSidebar.classList.toString()).toMatch(/sidebar-left/)
    
    rerender(
      <Sidebar 
        side="right" 
        isOpen={false} 
        onToggle={vi.fn()}
      >
        <div>Content</div>
      </Sidebar>
    )
    
    const rightSidebar = screen.getByRole('complementary')
    expect(rightSidebar.classList.toString()).toMatch(/sidebar-right/)
  })
})