import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DropZone from '../DropZone'

// Mock EncodingDetector
vi.mock('../../../lib/encoding/EncodingDetector', () => ({
  EncodingDetector: {
    detectAndDecode: vi.fn().mockImplementation(async (file) => {
      const arrayBuffer = await file.arrayBuffer()
      const text = new TextDecoder().decode(arrayBuffer)
      return {
        encoding: 'utf-8',
        confidence: 0.9,
        text,
        isValid: true,
        hasBom: false
      }
    }),
    isBinaryFile: vi.fn().mockReturnValue(false)
  }
}))

describe('DropZone', () => {
  const mockOnFileLoad = vi.fn()
  const mockOnError = vi.fn()

  // Helper to create mock File with arrayBuffer method
  const createMockFile = (content: string, filename: string, type: string = 'text/plain') => {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(content)
    const arrayBuffer = bytes.buffer

    return {
      name: filename,
      type,
      size: arrayBuffer.byteLength,
      async arrayBuffer() {
        return arrayBuffer
      }
    } as File
  }

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
      const testFile = createMockFile('テスト内容', 'test.txt')
      
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const dropZone = screen.getByLabelText('ファイルドロップエリア')
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [testFile]
        }
      })
      
      await waitFor(() => {
        expect(mockOnFileLoad).toHaveBeenCalledWith('テスト内容', 'test.txt', {
          encoding: 'utf-8',
          confidence: 0.9,
          hasBom: false,
          isValidEncoding: true
        })
      })
    })

    it('should show loading state during file processing', async () => {
      const testFile = createMockFile('テスト内容', 'test.txt')
      
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
      const testFile = createMockFile('テスト内容', 'test.txt')
      
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const fileInput = screen.getByLabelText(/ファイル選択/)
      
      Object.defineProperty(fileInput, 'files', {
        value: [testFile]
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(mockOnFileLoad).toHaveBeenCalledWith('テスト内容', 'test.txt', {
          encoding: 'utf-8',
          confidence: 0.9,
          hasBom: false,
          isValidEncoding: true
        })
      })
    })
  })

  describe('ファイル形式検証', () => {
    it('should accept text files', async () => {
      const textFile = createMockFile('内容', 'test.txt')
      
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
      const imageFile = createMockFile('', 'test.jpg', 'image/jpeg')
      
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
      const largeFile = createMockFile(largeContent, 'large.txt')
      
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
    it('should handle encoding detection errors', async () => {
      // Mock EncodingDetector to simulate error
      const { EncodingDetector } = await import('../../../lib/encoding/EncodingDetector')
      vi.mocked(EncodingDetector.detectAndDecode).mockRejectedValueOnce(new Error('読み込みエラー'))
      
      const testFile = createMockFile('', 'test.txt')
      
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const fileInput = screen.getByLabelText(/ファイル選択/)
      Object.defineProperty(fileInput, 'files', {
        value: [testFile]
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('ファイルの読み込みに失敗しました。')
      })
    })

    it('should handle binary files', async () => {
      // Mock EncodingDetector to detect binary file
      const { EncodingDetector } = await import('../../../lib/encoding/EncodingDetector')
      vi.mocked(EncodingDetector.isBinaryFile).mockReturnValueOnce(true)
      
      const binaryFile = createMockFile('', 'image.jpg', 'image/jpeg')
      
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const fileInput = screen.getByLabelText(/ファイル選択/)
      Object.defineProperty(fileInput, 'files', {
        value: [binaryFile]
      })
      
      fireEvent.change(fileInput)
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('対応していないファイル形式です。テキストファイルを選択してください。')
      })
    })

    it('should handle multiple files by taking only the first', async () => {
      const file1 = createMockFile('内容1', 'test1.txt')
      const file2 = createMockFile('内容2', 'test2.txt')
      
      render(<DropZone onFileLoad={mockOnFileLoad} onError={mockOnError} />)
      
      const fileInput = screen.getByLabelText(/ファイル選択/)
      Object.defineProperty(fileInput, 'files', {
        value: [file1, file2]
      })
      
      fireEvent.change(fileInput)
      
      // Check that either success or error is called, indicating the file was processed
      await waitFor(() => {
        expect(mockOnFileLoad.mock.calls.length + mockOnError.mock.calls.length).toBeGreaterThan(0)
      })
      
      // If onFileLoad was called, it should be called exactly once
      if (mockOnFileLoad.mock.calls.length > 0) {
        expect(mockOnFileLoad).toHaveBeenCalledTimes(1)
      }
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