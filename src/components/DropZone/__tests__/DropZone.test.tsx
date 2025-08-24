import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DropZone from '../DropZone'

describe('DropZone', () => {
  const mockOnFileLoad = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基本機能', () => {
    it('should render drop zone with default message', () => {
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      expect(screen.getByText(/ファイルをドロップ/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ファイルを選択/ })).toBeInTheDocument()
    })

    it('should have proper accessibility attributes', () => {
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const dropZone = screen.getByLabelText('ファイルドロップエリア')
      expect(dropZone).toHaveAttribute('aria-label', 'ファイルドロップエリア')
      expect(dropZone).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('ドラッグ&ドロップ操作', () => {
    it('should show highlight when dragging over', () => {
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const dropZone = screen.getByLabelText('ファイルドロップエリア')
      
      fireEvent.dragEnter(dropZone)
      expect(dropZone.className).toMatch(/dragOver/)
      
      fireEvent.dragLeave(dropZone)
      expect(dropZone.className).not.toMatch(/dragOver/)
    })

    it('should handle file drop correctly', async () => {
      const testFile = new File(['テスト内容'], 'test.txt', { type: 'text/plain' })
      
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const dropZone = screen.getByLabelText('ファイルドロップエリア')
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [testFile]
        }
      })
      
      await waitFor(() => {
        expect(mockOnFileLoad).toHaveBeenCalledWith('テスト内容', 'test.txt')
      })
    })

    it('should show loading state during file processing', async () => {
      const testFile = new File(['テスト内容'], 'test.txt', { type: 'text/plain' })
      
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const dropZone = screen.getByLabelText('ファイルドロップエリア')
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [testFile]
        }
      })
      
      // Loading state should be visible temporarily
      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/)).toBeInTheDocument()
      }, { timeout: 100 })
    })
  })

  describe('ファイル選択ボタン', () => {
    it('should trigger file selection when button is clicked', () => {
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const fileButton = screen.getByRole('button', { name: /ファイルを選択/ })
      fireEvent.click(fileButton)
      
      // Hidden file input should be triggered
      const fileInput = screen.getByLabelText(/ファイル選択/)
      expect(fileInput).toBeInTheDocument()
    })

    it('should handle file selection from input', async () => {
      const testFile = new File(['テスト内容'], 'test.txt', { type: 'text/plain' })
      
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const fileInput = screen.getByLabelText(/ファイル選択/)
      
      Object.defineProperty(fileInput, 'files', {
        value: [testFile]
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(mockOnFileLoad).toHaveBeenCalledWith('テスト内容', 'test.txt')
      })
    })
  })

  describe('ファイル形式検証', () => {
    it('should accept text files', async () => {
      const textFile = new File(['内容'], 'test.txt', { type: 'text/plain' })
      
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const fileInput = screen.getByLabelText(/ファイル選択/)
      Object.defineProperty(fileInput, 'files', {
        value: [textFile]
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(mockOnFileLoad).toHaveBeenCalled()
        expect(mockOnError).not.toHaveBeenCalled()
      })
    })

    it('should reject non-text files', async () => {
      const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const fileInput = screen.getByLabelText(/ファイル選択/)
      Object.defineProperty(fileInput, 'files', {
        value: [imageFile]
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(mockOnFileLoad).not.toHaveBeenCalled()
        expect(mockOnError).toHaveBeenCalledWith('対応していないファイル形式です。テキストファイルを選択してください。')
      })
    })

    it('should handle oversized files', async () => {
      const largeContent = 'a'.repeat(15 * 1024 * 1024) // 15MB
      const largeFile = new File([largeContent], 'large.txt', { type: 'text/plain' })
      
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const fileInput = screen.getByLabelText(/ファイル選択/)
      Object.defineProperty(fileInput, 'files', {
        value: [largeFile]
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(mockOnFileLoad).not.toHaveBeenCalled()
        expect(mockOnError).toHaveBeenCalledWith('ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。')
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('should handle file read errors', async () => {
      // Mock FileReader to simulate error
      const originalFileReader = window.FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        result: null,
        error: new Error('読み込みエラー'),
        onload: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null,
        onerror: null as ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null
      }
      
      // @ts-ignore
      window.FileReader = vi.fn(() => mockFileReader)
      
      const testFile = new File([''], 'test.txt', { type: 'text/plain' })
      
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const fileInput = screen.getByLabelText(/ファイル選択/)
      Object.defineProperty(fileInput, 'files', {
        value: [testFile]
      })
      
      fireEvent.change(fileInput)
      
      // Simulate error
      if (mockFileReader.onerror) {
        const errorEvent = new ProgressEvent('error') as ProgressEvent<FileReader>
        mockFileReader.onerror.call(mockFileReader as any, errorEvent)
      }
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('ファイルの読み込みに失敗しました。')
      })
      
      window.FileReader = originalFileReader
    })

    it('should handle multiple files by taking only the first', async () => {
      const file1 = new File(['内容1'], 'test1.txt', { type: 'text/plain' })
      const file2 = new File(['内容2'], 'test2.txt', { type: 'text/plain' })
      
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const fileInput = screen.getByLabelText(/ファイル選択/)
      Object.defineProperty(fileInput, 'files', {
        value: [file1, file2]
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(mockOnFileLoad).toHaveBeenCalledWith('内容1', 'test1.txt')
        expect(mockOnFileLoad).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('キーボード操作', () => {
    it('should handle Enter key to trigger file selection', () => {
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const dropZone = screen.getByLabelText('ファイルドロップエリア')
      
      fireEvent.keyDown(dropZone, { key: 'Enter' })
      
      // File input should be triggered
      const fileInput = screen.getByLabelText(/ファイル選択/)
      expect(fileInput).toBeInTheDocument()
    })

    it('should handle Space key to trigger file selection', () => {
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const dropZone = screen.getByLabelText('ファイルドロップエリア')
      
      fireEvent.keyDown(dropZone, { key: ' ' })
      
      // File input should be triggered
      const fileInput = screen.getByLabelText(/ファイル選択/)
      expect(fileInput).toBeInTheDocument()
    })
  })
})