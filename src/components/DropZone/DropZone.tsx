import React, { useState, useRef, useCallback } from 'react'
import type { DropZoneProps, DropZoneState } from './types'
import styles from './DropZone.module.css'
import { EncodingDetector } from '../../lib/encoding/EncodingDetector'

const DropZone: React.FC<DropZoneProps> = ({
  onFileLoad,
  onError,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFileTypes = ['text/plain', 'text/html'],
  disabled = false,
  className = ''
}) => {
  const [state, setState] = useState<DropZoneState>({
    isDragOver: false,
    isLoading: false,
    loadingProgress: 0
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ファイル検証
  const validateFile = useCallback((file: File): string | null => {
    // ファイルサイズチェック
    if (file.size > maxFileSize) {
      return 'ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。'
    }
    
    // ファイル形式チェック
    if (!acceptedFileTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      return '対応していないファイル形式です。テキストファイルを選択してください。'
    }
    
    return null
  }, [maxFileSize, acceptedFileTypes])

  // ファイル読み込み処理
  const processFile = useCallback(async (file: File) => {
    const error = validateFile(file)
    if (error) {
      onError(error)
      return
    }

    setState(prev => ({ ...prev, isLoading: true, loadingProgress: 0 }))
    
    try {
      // バイナリファイルチェック
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      
      if (EncodingDetector.isBinaryFile(uint8Array)) {
        setState(prev => ({ ...prev, isLoading: false, loadingProgress: 0 }))
        onError('バイナリファイルは読み込めません。テキストファイルを選択してください。')
        return
      }

      setState(prev => ({ ...prev, loadingProgress: 50 }))
      
      // エンコード自動検出
      const detectionResult = await EncodingDetector.detectAndDecode(file)
      
      setState(prev => ({ ...prev, loadingProgress: 90 }))
      
      // 検出結果に応じた処理
      if (!detectionResult.isValid) {
        // 文字化けの警告を出しながらも表示は行う
        const warningMessage = `文字エンコードの検出に失敗しました。${detectionResult.encoding}として読み込みましたが、文字化けしている可能性があります。`
        console.warn(warningMessage)
        // 警告はコンソールにのみ出力し、ファイルは読み込む
      }
      
      setState(prev => ({ ...prev, isLoading: false, loadingProgress: 100 }))
      
      // メタデータと一緒にコンテンツを渡す
      onFileLoad(detectionResult.text, file.name, {
        encoding: detectionResult.encoding,
        confidence: detectionResult.confidence,
        hasBom: detectionResult.hasBom,
        isValidEncoding: detectionResult.isValid
      })
      
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, loadingProgress: 0 }))
      onError('ファイルの読み込みに失敗しました。')
      console.error('File processing error:', error)
    }
  }, [validateFile, onFileLoad, onError])

  // ファイル選択処理
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    
    // 最初のファイルのみ処理
    const file = files[0]
    processFile(file)
  }, [processFile])

  // ドラッグ&ドロップハンドラー
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setState(prev => ({ ...prev, isDragOver: true }))
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState(prev => ({ ...prev, isDragOver: false }))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setState(prev => ({ ...prev, isDragOver: false }))
    
    if (disabled || state.isLoading) return
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [disabled, state.isLoading, handleFileSelect])

  // ボタンクリック・キーボード操作
  const triggerFileSelect = useCallback(() => {
    if (!disabled && !state.isLoading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled, state.isLoading])

  // ボタン専用のクリックハンドラー（イベント伝播を停止）
  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    triggerFileSelect()
  }, [triggerFileSelect])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      triggerFileSelect()
    }
  }, [triggerFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }, [handleFileSelect])

  const dropZoneClass = [
    styles.dropZone,
    state.isDragOver ? styles.dragOver : '',
    disabled ? styles.disabled : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <div
      className={dropZoneClass}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={triggerFileSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="ファイルドロップエリア"
      aria-disabled={disabled}
    >
      <div className={styles.message}>
        📄 ファイルをドロップするか、ボタンをクリック
      </div>
      <div className={styles.subMessage}>
        対応形式: .txt (10MB以下)
      </div>
      
      <button
        type="button"
        className={styles.fileButton}
        onClick={handleButtonClick}
        disabled={disabled || state.isLoading}
      >
        📁 ファイルを選択
      </button>

      <input
        ref={fileInputRef}
        type="file"
        className={styles.hiddenInput}
        accept=".txt,text/plain"
        onChange={handleInputChange}
        disabled={disabled || state.isLoading}
        aria-label="ファイル選択"
      />

      {state.isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingMessage}>
            📖 読み込み中...
          </div>
          <div className={styles.progressBar} role="progressbar" aria-valuenow={state.loadingProgress} aria-valuemin={0} aria-valuemax={100}>
            <div 
              className={styles.progressFill}
              style={{ width: `${state.loadingProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default DropZone