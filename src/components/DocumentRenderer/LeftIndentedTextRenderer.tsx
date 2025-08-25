import type { LeftIndentedText } from '../../types'
import styles from './LeftIndentedTextRenderer.module.css'

interface LeftIndentedTextRendererProps {
  element: LeftIndentedText
}

export function LeftIndentedTextRenderer({ element }: LeftIndentedTextRendererProps) {
  const { content, indentCount } = element
  
  // Generate fullwidth spaces for left indentation
  const generateIndentSpaces = (count: number): string => {
    return Math.max(count, 0) > 0 ? '　'.repeat(Math.max(count, 0)) : ''
  }
  
  // Add fullwidth spaces at the beginning of content
  const displayContent = generateIndentSpaces(indentCount) + content
  
  return (
    <span className={styles['left-indented-text']}>
      {displayContent}
    </span>
  )
}