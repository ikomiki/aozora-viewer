export interface DropZoneProps {
  onFileLoad: (content: string, filename: string) => void
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