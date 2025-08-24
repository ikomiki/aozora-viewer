import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { calculateVisibleRange } from './hierarchyUtils'
import type { VirtualScrollProps } from './types'
import styles from './TableOfContents.module.css'

const VirtualScroll: React.FC<VirtualScrollProps> = ({
  items,
  itemHeight,
  containerHeight,
  renderItem
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])
  
  const { startIndex, endIndex } = useMemo(() => 
    calculateVisibleRange(scrollTop, containerHeight, itemHeight, items.length),
    [scrollTop, containerHeight, itemHeight, items.length]
  )
  
  const visibleItems = useMemo(() => 
    items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  )
  
  const totalHeight = items.length * itemHeight
  
  useEffect(() => {
    // Ensure container has proper height
    if (containerRef.current) {
      containerRef.current.style.height = `${containerHeight}px`
    }
  }, [containerHeight])
  
  return (
    <div 
      ref={containerRef}
      className={styles.virtualContainer}
      onScroll={handleScroll}
      style={{ height: containerHeight }}
    >
      <div 
        className={styles.virtualContent}
        style={{ height: totalHeight }}
      >
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index
          const top = actualIndex * itemHeight
          
          return (
            <div
              key={item.heading.id}
              className={styles.virtualItem}
              style={{
                top,
                height: itemHeight
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VirtualScroll