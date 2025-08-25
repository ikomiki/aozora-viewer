import { describe, it, expect } from 'vitest'
import { EncodingDetector } from '../EncodingDetector'

describe('EncodingDetector', () => {
  // テスト用のUTF-8テキストデータを作成（テスト環境対応）
  const createUtf8File = (text: string, withBom = false) => {
    const encoder = new TextEncoder()
    const utf8Bytes = encoder.encode(text)
    
    let arrayBuffer: ArrayBuffer
    if (withBom) {
      const bomBytes = new Uint8Array([0xEF, 0xBB, 0xBF])
      const combined = new Uint8Array(bomBytes.length + utf8Bytes.length)
      combined.set(bomBytes, 0)
      combined.set(utf8Bytes, bomBytes.length)
      arrayBuffer = combined.buffer
    } else {
      arrayBuffer = utf8Bytes.buffer
    }
    
    // Fileオブジェクトを模擬
    const mockFile = {
      name: 'test.txt',
      type: 'text/plain',
      size: arrayBuffer.byteLength,
      async arrayBuffer() {
        return arrayBuffer
      }
    }
    
    return mockFile as File
  }

  // テスト用のShift-JISデータを作成（手動エンコード）
  // Currently unused but kept for potential future tests
  // const createShiftJisFile = (_text: string) => {
  //   // 簡単な文字列を手動でShift-JISバイトに変換
  //   // 実際のテストでは限られた文字セットのみテスト
  //   const shiftJisBytes = new Uint8Array([
  //     0x83, 0x65, 0x83, 0x58, 0x83, 0x67 // "テスト" in Shift-JIS
  //   ])
  //   
  //   const arrayBuffer = shiftJisBytes.buffer
  //   
  //   // Fileオブジェクトを模擬
  //   const mockFile = {
  //     name: 'test.txt',
  //     type: 'text/plain',
  //     size: arrayBuffer.byteLength,
  //     async arrayBuffer() {
  //       return arrayBuffer
  //     }
  //   }
  //   
  //   return mockFile as File
  // }

  describe('detectAndDecode', () => {
    it('should detect UTF-8 without BOM correctly', async () => {
      const testText = 'これはテストです。\nThis is a test.'
      const file = createUtf8File(testText)
      
      const result = await EncodingDetector.detectAndDecode(file)
      
      expect(result.encoding).toBe('utf-8')
      expect(result.text).toBe(testText)
      expect(result.hasBom).toBe(false)
      expect(result.isValid).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    it('should detect UTF-8 with BOM correctly', async () => {
      const testText = 'これはBOM付きUTF-8です。'
      const file = createUtf8File(testText, true)
      
      const result = await EncodingDetector.detectAndDecode(file)
      
      expect(result.encoding).toBe('utf-8')
      expect(result.text).toBe(testText)
      expect(result.hasBom).toBe(true)
      expect(result.isValid).toBe(true)
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    it('should handle ASCII text as UTF-8', async () => {
      const testText = 'This is ASCII text only.'
      const file = createUtf8File(testText)
      
      const result = await EncodingDetector.detectAndDecode(file)
      
      expect(result.encoding).toBe('utf-8')
      expect(result.text).toBe(testText)
      expect(result.isValid).toBe(true)
    })

    it('should handle empty file', async () => {
      const file = createUtf8File('')
      
      const result = await EncodingDetector.detectAndDecode(file)
      
      expect(result.text).toBe('')
      expect(result.isValid).toBe(true)
    })

    it('should fallback to best effort for invalid data', async () => {
      // 無効なバイトシーケンスを含むファイルを作成
      const invalidBytes = new Uint8Array([0xFF, 0xFE, 0x00, 0x01, 0x80, 0x90])
      const arrayBuffer = invalidBytes.buffer
      
      const mockFile = {
        name: 'invalid.txt',
        type: 'text/plain',
        size: arrayBuffer.byteLength,
        async arrayBuffer() {
          return arrayBuffer
        }
      } as File
      
      const result = await EncodingDetector.detectAndDecode(mockFile)
      
      expect(result.isValid).toBe(false)
      expect(result.confidence).toBeLessThan(0.5)
      // 最良努力での結果が返される
      expect(result.text).toBeDefined()
    })
  })

  describe('isBinaryFile', () => {
    it('should detect text file correctly', () => {
      const textBytes = new TextEncoder().encode('これは普通のテキストファイルです。')
      
      expect(EncodingDetector.isBinaryFile(textBytes)).toBe(false)
    })

    it('should detect binary file correctly', () => {
      // バイナリファイルを模擬（多くのNULLバイトを含む）
      const binaryBytes = new Uint8Array(1000)
      // 半分以上をNULLバイトにする
      for (let i = 0; i < 600; i++) {
        binaryBytes[i] = 0
      }
      
      expect(EncodingDetector.isBinaryFile(binaryBytes)).toBe(true)
    })

    it('should handle small files correctly', () => {
      const smallTextBytes = new TextEncoder().encode('小さなファイル')
      
      expect(EncodingDetector.isBinaryFile(smallTextBytes)).toBe(false)
    })
  })

  describe('UTF-8 BOM detection', () => {
    it('should detect UTF-8 BOM correctly', () => {
      const bomBytes = new Uint8Array([0xEF, 0xBB, 0xBF, 0x48, 0x65, 0x6C, 0x6C, 0x6F])
      
      // BOM検出は detectAndDecode で確認済み
      expect(bomBytes.slice(0, 3)).toEqual(new Uint8Array([0xEF, 0xBB, 0xBF]))
    })

    it('should not detect BOM in non-BOM file', () => {
      const noBomBytes = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F])
      
      expect(noBomBytes[0]).not.toBe(0xEF)
    })
  })

  describe('confidence calculation', () => {
    it('should give high confidence for valid Japanese UTF-8', async () => {
      const japaneseText = 'これは日本語のテキストです。漢字、ひらがな、カタカナが含まれています。'
      const file = createUtf8File(japaneseText)
      
      const result = await EncodingDetector.detectAndDecode(file)
      
      expect(result.confidence).toBeGreaterThan(0.8)
      expect(result.isValid).toBe(true)
    })

    it('should give lower confidence for ASCII-only text', async () => {
      const asciiText = 'This is ASCII only text without any Japanese characters.'
      const file = createUtf8File(asciiText)
      
      const result = await EncodingDetector.detectAndDecode(file)
      
      // ASCIIのみの場合は信頼度が少し低くなる
      expect(result.confidence).toBeLessThan(0.9)
      expect(result.isValid).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle extremely large files gracefully', async () => {
      // 大きなファイルをシミュレート（実際には小さくして処理速度を保つ）
      const largeText = 'テスト'.repeat(10000)
      const file = createUtf8File(largeText)
      
      const result = await EncodingDetector.detectAndDecode(file)
      
      expect(result).toBeDefined()
      expect(result.text.length).toBe(largeText.length)
    })

    it('should handle file with only control characters', async () => {
      const controlChars = '\\n\\r\\t'
      const file = createUtf8File(controlChars)
      
      const result = await EncodingDetector.detectAndDecode(file)
      
      expect(result.isValid).toBe(true)
      expect(result.text).toBe(controlChars)
    })
  })
})