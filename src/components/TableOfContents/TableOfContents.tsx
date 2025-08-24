import React, { useMemo, useCallback, useEffect, useState } from 'react'
import { buildHeadingTree, flattenTree } from './hierarchyUtils'
import { useScrollSpy } from './useScrollSpy'
import TableOfContentsItem from './TableOfContentsItem'
import VirtualScroll from './VirtualScroll'
import type { TableOfContentsProps } from './types'
import styles from './TableOfContents.module.css'

const TableOfContents: React.FC<TableOfContentsProps> = ({
  headings,
  activeHeadingId,
  onHeadingClick,
  className = '',
  maxHeight = 600,
  virtualScroll = false
}) => {
  const [isMobile, setIsMobile] = useState(false)
  
  // Build hierarchical tree from flat headings array
  const headingTree = useMemo(() => buildHeadingTree(headings), [headings])
  
  // Use scroll spy to track active heading if not provided externally
  const { activeHeadingId: spyActiveId } = useScrollSpy({ headings })
  const currentActiveId = activeHeadingId ?? spyActiveId
  
  // Check if we should use virtual scrolling
  const shouldUseVirtualScroll = useMemo(() => {
    return virtualScroll || headings.length > 100
  }, [virtualScroll, headings.length])
  
  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    
    e.preventDefault()
    
    const flattenedTree = flattenTree(headingTree)
    if (flattenedTree.length === 0) return
    
    const activeElement = document.activeElement as HTMLElement
    const currentId = activeElement?.getAttribute('data-heading-id')
    
    let currentIndex = -1
    if (currentId) {
      currentIndex = flattenedTree.findIndex(node => node.heading.id === currentId)
    }
    
    let nextIndex: number
    if (e.key === 'ArrowDown') {
      nextIndex = currentIndex < flattenedTree.length - 1 ? currentIndex + 1 : 0
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : flattenedTree.length - 1
    }
    
    const nextNode = flattenedTree[nextIndex]
    if (nextNode) {
      const nextElement = document.querySelector(`[data-heading-id="${nextNode.heading.id}"]`) as HTMLElement
      if (nextElement) {
        nextElement.focus()
      }
    }
  }, [headingTree])
  
  // Handle touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isMobile) {
      // Add touch handling if needed
      ;(e.currentTarget as HTMLElement).style.touchAction = 'manipulation'
    }
  }, [isMobile])
  
  // Render virtual scroll item
  const renderVirtualItem = useCallback((node: any) => (
    <TableOfContentsItem
      key={node.heading.id}
      node={node}
      activeHeadingId={currentActiveId ?? undefined}
      onHeadingClick={onHeadingClick}
    />
  ), [currentActiveId, onHeadingClick])
  
  const containerClass = [
    styles.tableOfContents,
    isMobile ? styles.mobile : '',
    className
  ].filter(Boolean).join(' ')
  
  // Handle empty state
  if (headings.length === 0) {
    return (
      <nav 
        className={containerClass}
        aria-label="目次"
        role="navigation"
      >
        <div className={styles.emptyState}>
          📖 目次がありません
        </div>
      </nav>
    )
  }
  
  return (
    <nav 
      className={containerClass}
      aria-label="目次"
      role="navigation"
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      data-virtual-scroll={shouldUseVirtualScroll}
      tabIndex={0}
    >
      {shouldUseVirtualScroll ? (
        <VirtualScroll
          items={flattenTree(headingTree)}
          itemHeight={36}
          containerHeight={maxHeight}
          renderItem={renderVirtualItem}
        />
      ) : (
        <div 
          className={styles.tree}
          role="tree"
          aria-label="見出し一覧"
          style={{ maxHeight }}
        >
          {headingTree.map((node) => (
            <TableOfContentsItem
              key={node.heading.id}
              node={node}
              activeHeadingId={currentActiveId ?? undefined}
              onHeadingClick={onHeadingClick}
            />
          ))}
        </div>
      )}
    </nav>
  )
}

export default TableOfContents