import React from 'react'
import type { RubyRendererProps } from './types'
import styles from './RubyRenderer.module.css'

const RubyRenderer: React.FC<RubyRendererProps> = ({ element, className = '' }) => {
  const rubyClass = [styles.ruby, className].filter(Boolean).join(' ')
  
  return (
    <ruby className={rubyClass} role="ruby" data-ruby={element.ruby}>
      <span>{element.text}</span>
      <rt>{element.ruby}</rt>
    </ruby>
  )
}

export default RubyRenderer