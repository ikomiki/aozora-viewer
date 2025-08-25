import type { IndentedText } from '../../types'
import styles from './IndentedTextRenderer.module.css'

interface IndentedTextRendererProps {
  element: IndentedText
}

export function IndentedTextRenderer({ element }: IndentedTextRendererProps) {
  const { content, indentCount } = element
  
  // Generate fullwidth spaces for positive indentation
  const generateIndentSpaces = (count: number): string => {
    return count > 0 ? '　'.repeat(count) : ''
  }
  
  // Determine classes and styles
  const classes = [styles['indented-text']]
  const inlineStyles: React.CSSProperties = {}
  
  if (indentCount < 0) {
    classes.push(styles['negative-indent'])
    inlineStyles.marginLeft = `${indentCount}em`
  }
  
  // Render with appropriate indentation
  // For positive indent: add fullwidth spaces
  // For negative indent: use CSS margin-left  
  // For zero: just show content as-is
  const displayContent = indentCount > 0 
    ? generateIndentSpaces(indentCount) + content
    : content
  
  return (
    <span 
      className={classes.join(' ')}
      style={inlineStyles}
    >
      {displayContent}
    </span>
  )
}