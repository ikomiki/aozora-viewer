import React from 'react'
import type { CaptionRendererProps } from './types'

const CaptionRenderer: React.FC<CaptionRendererProps> = ({ element, className = '' }) => {
  const captionClass = ['caption', className].filter(Boolean).join(' ')
  
  return (
    <figcaption className={captionClass}>
      {element.text}
    </figcaption>
  )
}

export default CaptionRenderer