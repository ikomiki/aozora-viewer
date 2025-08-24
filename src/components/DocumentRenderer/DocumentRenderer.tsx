import React, { useMemo } from 'react'
import type { DocumentRendererProps } from './types'
import ElementRenderer from './ElementRenderer'
import styles from './DocumentRenderer.module.css'

const DocumentRenderer: React.FC<DocumentRendererProps> = ({
  document,
  className = '',
  onImageLoad,
  onImageError,
  onHeadingClick
}) => {
  // Check if document should use virtual scrolling
  const shouldUseVirtualScroll = useMemo(() => {
    return document && document.elements.length > 100
  }, [document])

  const containerClass = [
    styles.documentRenderer,
    shouldUseVirtualScroll ? styles.virtualScroll : '',
    className
  ].filter(Boolean).join(' ')

  // Handle null document
  if (!document) {
    return (
      <article className={containerClass} role="document" aria-label="文書コンテンツ">
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📄</div>
          <div>文書が選択されていません</div>
          <div>ファイルをドロップするか選択してください</div>
        </div>
      </article>
    )
  }

  // Handle empty document
  if (document.elements.length === 0) {
    return (
      <article className={containerClass} role="document" aria-label="文書コンテンツ">
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <div>文書に内容がありません</div>
          <div>ファイルが空か、解析できませんでした</div>
        </div>
      </article>
    )
  }

  return (
    <article 
      className={containerClass}
      role="document"
      aria-label="文書コンテンツ"
      tabIndex={0}
    >
      {document.elements.map((element, index) => {
        // Use appropriate wrapper element based on element type
        const isBlockElement = element.type === 'heading' || element.type === 'image' || element.type === 'caption'
        const WrapperElement = isBlockElement ? 'div' : 'span'
        const wrapperClass = isBlockElement ? styles.blockWrapper : styles.inlineWrapper
        
        return (
          <WrapperElement key={`${element.type}-${index}`} className={wrapperClass}>
            <ElementRenderer
              element={element}
              onImageLoad={onImageLoad}
              onImageError={onImageError}
              onHeadingClick={onHeadingClick}
            />
          </WrapperElement>
        )
      })}
    </article>
  )
}

export default DocumentRenderer