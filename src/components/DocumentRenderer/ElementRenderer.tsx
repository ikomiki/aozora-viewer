import React from 'react'
import type { ElementRendererProps } from './types'
import RubyRenderer from './RubyRenderer'
import HeadingRenderer from './HeadingRenderer'
import ImageRenderer from './ImageRenderer'
import CaptionRenderer from './CaptionRenderer'
import PlainTextRenderer from './PlainTextRenderer'
import { IndentedTextRenderer } from './IndentedTextRenderer'
import { LeftIndentedTextRenderer } from './LeftIndentedTextRenderer'
import { RightIndentedTextRenderer } from './RightIndentedTextRenderer'
import { IndentBlockRenderer } from './IndentBlockRenderer'

const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  onImageLoad,
  onImageError,
  onHeadingClick,
  className = ''
}) => {
  switch (element.type) {
    case 'ruby':
      return <RubyRenderer element={element} className={className} />
    
    case 'heading':
      return (
        <HeadingRenderer 
          element={element} 
          onClick={onHeadingClick}
          className={className} 
        />
      )
    
    case 'image':
      return (
        <ImageRenderer 
          element={element} 
          onLoad={onImageLoad}
          onError={onImageError}
          className={className}
          lazy
        />
      )
    
    case 'caption':
      return <CaptionRenderer element={element} className={className} />
    
    case 'text':
      return <PlainTextRenderer element={element} className={className} />
    
    case 'indented-text':
      return <IndentedTextRenderer element={element} />
    
    case 'left-indented-text':
      return <LeftIndentedTextRenderer element={element} />
    
    case 'right-indented-text':
      return <RightIndentedTextRenderer element={element} />
    
    case 'indent-block':
      return <IndentBlockRenderer element={element} />
    
    default:
      // Handle unknown element types
      console.warn('Unknown element type:', (element as any).type)
      return <span className={className}>{JSON.stringify(element)}</span>
  }
}

export default ElementRenderer
export { ElementRenderer }