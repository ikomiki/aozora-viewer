import { ReactNode } from 'react'
import styles from './Sidebar.module.css'

interface SidebarProps {
  side: 'left' | 'right';
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  ariaLabel?: string;
}

const Sidebar = ({ side, isOpen, onToggle, children, ariaLabel }: SidebarProps) => {
  const sidebarClass = `${styles.sidebar} ${styles[`sidebar-${side}`]} ${
    isOpen ? styles['sidebar-open'] : styles['sidebar-closed']
  }`;
  
  const defaultAriaLabel = side === 'left' ? 'Table of contents' : 'Settings panel';
  
  return (
    <aside 
      className={sidebarClass}
      role="complementary"
      aria-label={ariaLabel || defaultAriaLabel}
      aria-expanded={isOpen}
    >
      {/* Toggle button */}
      <button
        className={styles['sidebar-toggle']}
        onClick={onToggle}
        aria-label={`${isOpen ? 'Close' : 'Open'} ${side} sidebar`}
        type="button"
      >
        {side === 'left' ? (isOpen ? '←' : '→') : (isOpen ? '→' : '←')}
      </button>
      
      {/* Sidebar content */}
      <div className={styles['sidebar-content']} aria-hidden={!isOpen}>
        {children}
      </div>
    </aside>
  );
};

export default Sidebar;