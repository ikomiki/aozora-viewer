import React, { useCallback } from 'react'
import type { HeadingRendererProps } from './types'
import styles from './HeadingRenderer.module.css'

const HeadingRenderer: React.FC<HeadingRendererProps> = ({ 
  element, 
  onClick, 
  className = '' 
}) => {
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(element)
    }
  }, [onClick, element])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault()
      onClick(element)
    }
  }, [onClick, element])

  const headingClass = [
    styles.heading,
    styles[element.level],
    onClick ? styles.clickable : '',
    className
  ].filter(Boolean).join(' ')

  const commonProps = {
    id: element.id,
    className: headingClass,
    'aria-label': element.text,
    onClick: onClick ? handleClick : undefined,
    onKeyDown: onClick ? handleKeyDown : undefined,
    tabIndex: onClick ? 0 : undefined,
    style: onClick ? { cursor: 'pointer' } : undefined
  }

  // Render appropriate heading level
  switch (element.level) {
    case 'large':
      return <h1 {...commonProps}>{element.text}</h1>
    case 'medium':
      return <h2 {...commonProps}>{element.text}</h2>
    case 'small':
      return <h3 {...commonProps}>{element.text}</h3>
    default:
      return <h3 {...commonProps}>{element.text}</h3>
  }
}

export default HeadingRenderer