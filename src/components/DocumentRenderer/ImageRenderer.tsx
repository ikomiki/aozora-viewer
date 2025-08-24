import React, { useState, useCallback } from 'react'
import type { ImageRendererProps } from './types'
import styles from './ImageRenderer.module.css'

const ImageRenderer: React.FC<ImageRendererProps> = ({ 
  element, 
  onLoad, 
  onError, 
  className = '',
  lazy = false 
}) => {
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [, setErrorMessage] = useState<string>('')

  const handleLoad = useCallback(() => {
    setLoadingState('loaded')
    const imageUrl = element.base64 || element.filename || ''
    if (onLoad) {
      onLoad(imageUrl, element)
    }
  }, [element, onLoad])

  const handleError = useCallback((_event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setLoadingState('error')
    const imageUrl = element.base64 || element.filename || ''
    const error = new Error(`Failed to load image: ${imageUrl}`)
    setErrorMessage(error.message)
    
    if (onError) {
      onError(imageUrl, element, error)
    }
  }, [element, onError])

  const containerClass = [styles.imageContainer, className].filter(Boolean).join(' ')
  const imageClass = [
    styles.image,
    styles.responsive,
    loadingState === 'loaded' ? styles.loaded : ''
  ].filter(Boolean).join(' ')

  // Determine image source
  const imageSrc = element.base64 || element.filename || ''
  
  if (!imageSrc) {
    return (
      <figure className={containerClass}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>🖼️</span>
          <div className={styles.errorMessage}>画像ソースが見つかりません</div>
          <div className={styles.errorDetail}>{element.description}</div>
        </div>
      </figure>
    )
  }

  if (loadingState === 'error') {
    return (
      <figure className={containerClass}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>❌</span>
          <div className={styles.errorMessage}>画像を読み込めませんでした</div>
          <div className={styles.errorDetail}>{element.description}</div>
        </div>
      </figure>
    )
  }

  return (
    <figure className={containerClass}>
      <img
        src={imageSrc}
        alt={element.description || ''}
        className={imageClass}
        width={element.width}
        height={element.height}
        loading={lazy ? 'lazy' : undefined}
        onLoad={handleLoad}
        onError={handleError}
      />
      {loadingState === 'loading' && (
        <div className={styles.loading}>
          📸 読み込み中...
        </div>
      )}
    </figure>
  )
}

export default ImageRenderer