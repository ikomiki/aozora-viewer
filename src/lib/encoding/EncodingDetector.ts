export type SupportedEncoding = 'utf-8' | 'shift-jis'

export interface EncodingDetectionResult {
  encoding: SupportedEncoding
  confidence: number
  text: string
  isValid: boolean
  hasBom: boolean
}

export class EncodingDetector {
  
  /**
   * ファイルから文字エンコードを自動検出してテキストを読み込む
   */
  static async detectAndDecode(file: File): Promise<EncodingDetectionResult> {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // UTF-8 BOMの検出
    const hasBom = this.hasUtf8Bom(uint8Array)
    
    // UTF-8を最初に試行
    const utf8Result = this.tryDecodeAsUtf8(uint8Array, hasBom)
    if (utf8Result.isValid && utf8Result.confidence >= 0.8) {
      return utf8Result
    }
    
    // UTF-8で失敗した場合、Shift-JISを試行
    const sjisResult = this.tryDecodeAsShiftJis(uint8Array)
    if (sjisResult.isValid) {
      return sjisResult
    }
    
    // 両方とも失敗した場合、UTF-8として強制デコード（最良努力）
    return {
      ...utf8Result,
      confidence: 0.1,
      isValid: false
    }
  }
  
  /**
   * UTF-8 BOMの存在チェック
   */
  private static hasUtf8Bom(bytes: Uint8Array): boolean {
    return bytes.length >= 3 && 
           bytes[0] === 0xEF && 
           bytes[1] === 0xBB && 
           bytes[2] === 0xBF
  }
  
  /**
   * UTF-8としてデコードを試行
   */
  private static tryDecodeAsUtf8(bytes: Uint8Array, hasBom: boolean): EncodingDetectionResult {
    try {
      // BOMがある場合は除去
      const dataBytes = hasBom ? bytes.slice(3) : bytes
      
      const decoder = new TextDecoder('utf-8', { fatal: true })
      const text = decoder.decode(dataBytes)
      
      // UTF-8の有効性チェック
      const confidence = this.calculateUtf8Confidence(text, bytes)
      
      return {
        encoding: 'utf-8',
        confidence,
        text,
        isValid: confidence >= 0.7,
        hasBom
      }
    } catch {
      // UTF-8デコードに失敗
      return {
        encoding: 'utf-8',
        confidence: 0,
        text: '',
        isValid: false,
        hasBom
      }
    }
  }
  
  /**
   * Shift-JISとしてデコードを試行
   */
  private static tryDecodeAsShiftJis(bytes: Uint8Array): EncodingDetectionResult {
    try {
      const decoder = new TextDecoder('shift-jis', { fatal: false })
      const text = decoder.decode(bytes)
      
      // Shift-JISの有効性チェック
      const confidence = this.calculateShiftJisConfidence(text, bytes)
      
      return {
        encoding: 'shift-jis',
        confidence,
        text,
        isValid: confidence >= 0.6,
        hasBom: false
      }
    } catch {
      // Shift-JISデコードに失敗
      return {
        encoding: 'shift-jis',
        confidence: 0,
        text: '',
        isValid: false,
        hasBom: false
      }
    }
  }
  
  /**
   * UTF-8テキストの信頼度計算
   */
  private static calculateUtf8Confidence(text: string, _originalBytes: Uint8Array): number {
    // 空ファイルは有効なUTF-8
    if (text.length === 0) {
      return 0.8
    }
    
    let confidence = 0.5 // ベース信頼度
    
    // ASCII文字のみの場合は高い信頼度
    // eslint-disable-next-line no-control-regex
    const asciiOnlyText = text.replace(/[^\u0000-\u007F]/g, '')
    if (asciiOnlyText.length === text.length) {
      confidence = 0.8 // ASCII文字のみは確実にUTF-8
    }
    
    // 日本語文字の存在チェック
    const japaneseChars = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g
    const japaneseMatches = text.match(japaneseChars)
    if (japaneseMatches && japaneseMatches.length > 0) {
      confidence += 0.3
    }
    
    // 制御文字や無効文字の存在チェック
    const invalidChars = /[\uFFFD]/g
    const invalidMatches = text.match(invalidChars)
    if (invalidMatches && invalidMatches.length > 0) {
      confidence -= 0.4
    }
    
    // ASCII範囲外の文字の妥当性
    const nonAsciiRatio = (text.length - asciiOnlyText.length) / text.length
    if (nonAsciiRatio > 0.1) {
      confidence += 0.2
    }
    
    return Math.max(0, Math.min(1, confidence))
  }
  
  /**
   * Shift-JISテキストの信頼度計算
   */
  private static calculateShiftJisConfidence(text: string, originalBytes: Uint8Array): number {
    let confidence = 0.4 // ベース信頼度（UTF-8より低め）
    
    // 日本語文字の存在チェック
    const japaneseChars = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g
    const japaneseMatches = text.match(japaneseChars)
    if (japaneseMatches && japaneseMatches.length > 0) {
      confidence += 0.4
    }
    
    // 制御文字や無効文字の存在チェック
    const invalidChars = /[\uFFFD]/g
    const invalidMatches = text.match(invalidChars)
    if (invalidMatches && invalidMatches.length > 0) {
      confidence -= 0.3
    }
    
    // Shift-JIS特有のバイトパターンチェック
    confidence += this.checkShiftJisBytePatterns(originalBytes)
    
    return Math.max(0, Math.min(1, confidence))
  }
  
  /**
   * Shift-JIS特有のバイトパターンをチェック
   */
  private static checkShiftJisBytePatterns(bytes: Uint8Array): number {
    let score = 0
    const length = bytes.length
    
    for (let i = 0; i < length; i++) {
      const byte = bytes[i]
      
      // Shift-JIS第1バイト範囲
      if ((byte >= 0x81 && byte <= 0x9F) || (byte >= 0xE0 && byte <= 0xFC)) {
        if (i + 1 < length) {
          const nextByte = bytes[i + 1]
          // Shift-JIS第2バイト範囲
          if ((nextByte >= 0x40 && nextByte <= 0x7E) || (nextByte >= 0x80 && nextByte <= 0xFC)) {
            score += 0.01
            i++ // 次のバイトをスキップ
          }
        }
      }
    }
    
    return Math.min(0.3, score)
  }
  
  /**
   * バイナリファイルかどうかをチェック
   */
  static isBinaryFile(bytes: Uint8Array): boolean {
    const sampleSize = Math.min(8000, bytes.length)
    let nullBytes = 0
    
    for (let i = 0; i < sampleSize; i++) {
      if (bytes[i] === 0) {
        nullBytes++
      }
    }
    
    // NULL文字が多い場合はバイナリファイルと判定
    return (nullBytes / sampleSize) > 0.01
  }
}