import { useState, ReactNode } from 'react'
import Sidebar from '../Sidebar/Sidebar'
import styles from './Layout.module.css'

interface LayoutProps {
  children?: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const mainContentClass = `${styles['main-content']} ${
    leftSidebarOpen ? styles['main-left-open'] : ''
  } ${rightSidebarOpen ? styles['main-right-open'] : ''}`;

  return (
    <div className={styles.layout}>
      {/* Left Sidebar - Table of Contents */}
      <Sidebar
        side="left"
        isOpen={leftSidebarOpen}
        onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
        ariaLabel="Table of contents"
      >
        <div className={styles['sidebar-placeholder']}>
          <h3>目次</h3>
          <p>ここに目次が表示されます</p>
        </div>
      </Sidebar>

      {/* Main Content */}
      <main 
        className={mainContentClass}
        role="main"
        aria-label="Main content"
      >
        {children || (
          <div className={styles['main-placeholder']}>
            <h1>青空文庫ビューワ</h1>
            <p>ここにドキュメントが表示されます</p>
          </div>
        )}
      </main>

      {/* Right Sidebar - Settings */}
      <Sidebar
        side="right"
        isOpen={rightSidebarOpen}
        onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
        ariaLabel="Settings panel"
      >
        <div className={styles['sidebar-placeholder']}>
          <h3>設定</h3>
          <p>ここに設定パネルが表示されます</p>
        </div>
      </Sidebar>
    </div>
  );
};

export default Layout;