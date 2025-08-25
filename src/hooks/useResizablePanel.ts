import { useState, useCallback, useEffect, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { UseResizablePanelProps, UseResizablePanelReturn } from '../types/sidebar'

export const useResizablePanel = ({
  initialWidth,
  minWidth,
  maxWidth,
  onWidthChange
}: UseResizablePanelProps): UseResizablePanelReturn => {
  const [width, setWidth] = useState(initialWidth)
  const [isResizing, setIsResizing] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    
    const deltaX = e.clientX - startXRef.current
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX))
    
    setWidth(newWidth)
    onWidthChange(newWidth)
  }, [isResizing, minWidth, maxWidth, onWidthChange])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = width
  }, [width])

  return {
    width,
    isResizing,
    resizerProps: {
      onMouseDown: handleMouseDown
    }
  }
}