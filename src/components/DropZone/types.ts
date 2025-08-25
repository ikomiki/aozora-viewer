export interface FileEncodingMetadata {
  encoding: 'utf-8' | 'shift-jis'
  confidence: number
  hasBom: boolean
  isValidEncoding: boolean
}

export interface DropZoneProps {
  onFileLoad: (content: string, filename: string, encodingInfo?: FileEncodingMetadata) => void
  onError: (message: string) => void
  maxFileSize?: number // bytes, default 10MB
  acceptedFileTypes?: string[] // MIME types, default ['text/plain', 'text/html']
  disabled?: boolean
  className?: string
}

export interface DropZoneState {
  isDragOver: boolean
  isLoading: boolean
  loadingProgress: number
}