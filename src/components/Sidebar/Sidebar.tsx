import { ReactNode } from 'react'
import { useResizablePanel } from '../../hooks/useResizablePanel'
import type { SidebarSide } from '../../types/sidebar'
import { SIDEBAR_CONSTANTS } from '../../constants/sidebar'
import styles from './Sidebar.module.css'

interface SidebarProps {
  side: SidebarSide;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  ariaLabel?: string;
  width?: number;
  onWidthChange?: (width: number) => void;
  canResize?: boolean;
}

const Sidebar = ({ side, isOpen, onToggle, children, ariaLabel, width = SIDEBAR_CONSTANTS.DEFAULT_WIDTH, onWidthChange, canResize = false }: SidebarProps) => {
  const resizablePanel = useResizablePanel({
    initialWidth: width,
    minWidth: SIDEBAR_CONSTANTS.MIN_WIDTH,
    maxWidth: SIDEBAR_CONSTANTS.MAX_WIDTH,
    onWidthChange: onWidthChange || (() => {})
  })

  const sidebarClass = `${styles.sidebar} ${styles[`sidebar-${side}`]} ${
    isOpen ? styles['sidebar-open'] : styles['sidebar-closed']
  }`;
  
  const defaultAriaLabel = side === 'left' ? SIDEBAR_CONSTANTS.ARIA_LABELS.LEFT : SIDEBAR_CONSTANTS.ARIA_LABELS.RIGHT;
  
  // 開いている場合は指定された幅、閉じている場合はcollapsed幅を使用
  const currentWidth = isOpen ? width : SIDEBAR_CONSTANTS.COLLAPSED_WIDTH;
  const sidebarStyle = {
    width: `${currentWidth}px`
  }
  
  return (
    <aside 
      className={sidebarClass}
      style={sidebarStyle}
      role="complementary"
      aria-label={ariaLabel || defaultAriaLabel}
      aria-expanded={isOpen}
    >
      {/* Toggle button */}
      <button
        className={styles['sidebar-toggle']}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
        aria-label={`${isOpen ? 'Close' : 'Open'} ${side} sidebar`}
        type="button"
      >
        {side === 'left' ? (isOpen ? '←' : '→') : (isOpen ? '→' : '←')}
      </button>
      
      {/* Resize handle */}
      {canResize && (
        <div
          className={styles['resize-handle']}
          data-testid="resize-handle"
          {...resizablePanel.resizerProps}
        />
      )}
      
      {/* Sidebar content */}
      <div className={styles['sidebar-content']} aria-hidden={!isOpen}>
        {children}
      </div>
    </aside>
  );
};

export default Sidebar;