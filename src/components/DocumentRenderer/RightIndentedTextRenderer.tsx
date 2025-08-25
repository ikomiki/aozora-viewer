import type { RightIndentedText } from '../../types'
import styles from './RightIndentedTextRenderer.module.css'

interface RightIndentedTextRendererProps {
  element: RightIndentedText
}

export function RightIndentedTextRenderer({ element }: RightIndentedTextRendererProps) {
  const { content, indentCount } = element
  
  // For right-aligned text, we use CSS to push text to the right
  // The indentCount represents spaces from the right edge
  const rightMargin = Math.max(indentCount, 0)
  
  return (
    <span 
      className={styles['right-indented-text']}
      style={{
        marginRight: `${rightMargin}em`,
        display: 'block',
        textAlign: 'right'
      }}
    >
      {content}
    </span>
  )
}