import { ReactNode, useEffect, useState } from 'react'
import Sidebar from '../Sidebar/Sidebar'
import { useSidebarState } from '../../hooks/useSidebarState'
import { SIDEBAR_CONSTANTS } from '../../constants/sidebar'
import styles from './Layout.module.css'

interface LayoutProps {
  children?: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { sidebarState, toggleSidebar, setSidebarWidth } = useSidebarState();
  const [isDesktop, setIsDesktop] = useState(true);

  // レスポンシブ状態を監視
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth > 768);
    };

    checkScreenSize(); // 初回実行
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // 動的にマージンを計算（デスクトップのみ）
  const leftMargin = isDesktop ? 
    (sidebarState.left.isOpen ? sidebarState.left.width : SIDEBAR_CONSTANTS.COLLAPSED_WIDTH) : 0;
  const rightMargin = isDesktop ? 
    (sidebarState.right.isOpen ? sidebarState.right.width : SIDEBAR_CONSTANTS.COLLAPSED_WIDTH) : 0;

  const mainContentStyle = {
    marginLeft: `${leftMargin}px`,
    marginRight: `${rightMargin}px`
  };

  return (
    <div className={styles.layout}>
      {/* Left Sidebar - Table of Contents */}
      <Sidebar
        side="left"
        isOpen={sidebarState.left.isOpen}
        onToggle={() => toggleSidebar('left')}
        width={sidebarState.left.width}
        onWidthChange={(width) => setSidebarWidth('left', width)}
        canResize={true}
        ariaLabel="Table of contents"
      >
        <div className={styles['sidebar-placeholder']}>
          <h3>目次</h3>
          <p>ここに目次が表示されます</p>
        </div>
      </Sidebar>

      {/* Main Content */}
      <main 
        className={styles['main-content']}
        style={mainContentStyle}
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
        isOpen={sidebarState.right.isOpen}
        onToggle={() => toggleSidebar('right')}
        width={sidebarState.right.width}
        onWidthChange={(width) => setSidebarWidth('right', width)}
        canResize={true}
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