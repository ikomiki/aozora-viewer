import React from 'react'
import type { PlainTextRendererProps } from './types'

const PlainTextRenderer: React.FC<PlainTextRendererProps> = ({ element, className = '' }) => {
  // Handle line breaks and preserve whitespace
  const content = element.content.split('\n').map((line, index, array) => (
    <React.Fragment key={index}>
      {line}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ))

  return (
    <span className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {content}
    </span>
  )
}

export default PlainTextRenderer