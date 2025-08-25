import React from 'react'
import type { IndentBlock } from '../../types'
import { ElementRenderer } from './ElementRenderer'
import styles from './IndentBlockRenderer.module.css'

interface IndentBlockRendererProps {
  element: IndentBlock
}

export function IndentBlockRenderer({ element }: IndentBlockRendererProps) {
  const { elements, indentCount } = element
  
  // Clamp indentCount to non-negative values
  const effectiveIndentCount = Math.max(0, indentCount)
  
  const inlineStyles: React.CSSProperties = {
    marginLeft: `${effectiveIndentCount}em`
  }
  
  return (
    <div 
      className={styles['indent-block']}
      style={inlineStyles}
    >
      {elements.map((childElement, index) => (
        <ElementRenderer 
          key={index} 
          element={childElement} 
        />
      ))}
    </div>
  )
}