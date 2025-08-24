import React, { useCallback, useState } from 'react'
import type { TableOfContentsItemProps } from './types'
import styles from './TableOfContents.module.css'

const TableOfContentsItem: React.FC<TableOfContentsItemProps> = ({
  node,
  activeHeadingId,
  onHeadingClick,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true) // Default to expanded
  const hasChildren = node.children.length > 0
  const isActive = activeHeadingId === node.heading.id
  
  const handleClick = useCallback(() => {
    onHeadingClick(node.heading)
  }, [onHeadingClick, node.heading])
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onHeadingClick(node.heading)
    }
  }, [onHeadingClick, node.heading])
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    onHeadingClick(node.heading)
  }, [onHeadingClick, node.heading])
  
  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }, [isExpanded])
  
  const itemClass = [
    styles.treeItem,
    className
  ].filter(Boolean).join(' ')
  
  return (
    <>
      <div
        className={itemClass}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onTouchEnd={handleTouchEnd}
        data-level={node.level}
        data-active={isActive}
        data-heading-id={node.heading.id}
        role="treeitem"
        aria-level={node.level}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-current={isActive ? 'location' : undefined}
        tabIndex={0}
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
      >
        {hasChildren && (
          <button
            className={styles.expandButton}
            onClick={toggleExpanded}
            data-expanded={isExpanded}
            aria-label={isExpanded ? '折りたたむ' : '展開する'}
            tabIndex={-1}
          >
            ▶
          </button>
        )}
        {!hasChildren && <div className={styles.expandButton}></div>}
        <span className={styles.headingText} title={node.heading.text}>
          {node.heading.text}
        </span>
      </div>
      
      {hasChildren && isExpanded && (
        <div role="group" aria-labelledby={node.heading.id}>
          {node.children.map((childNode) => (
            <TableOfContentsItem
              key={childNode.heading.id}
              node={childNode}
              activeHeadingId={activeHeadingId}
              onHeadingClick={onHeadingClick}
              className={className}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default TableOfContentsItem