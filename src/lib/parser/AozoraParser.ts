import type { 
  ParsedDocument, 
  AozoraElement, 
  RubyText, 
  Heading, 
  Image, 
  Caption, 
  PlainText,
  LeftIndentedText,
  RightIndentedText,
  Range,
  ParserConfig 
} from '../../types'
import { FormattingInstructionParser } from './FormattingInstructionParser'
import { IndentBlockProcessor } from './IndentBlockProcessor'

export default class AozoraParser {
  private config: ParserConfig
  private formattingParser: FormattingInstructionParser
  private blockProcessor: IndentBlockProcessor

  constructor(config?: Partial<ParserConfig>) {
    this.config = {
      enableRuby: true,
      enableHeadings: true,
      enableImages: true,
      enableCaptions: true,
      enableEmphasis: true,
      enableTextFormatting: true,
      preserveLeadingSpaces: true,
      maxIndentCount: 20,
      strictMode: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      ...config
    }
    
    // Initialize processors
    this.formattingParser = new FormattingInstructionParser(this.config.maxIndentCount)
    this.blockProcessor = new IndentBlockProcessor()
  }

  parse(text: string, filename: string, encodingInfo?: {
    encoding: string
    confidence?: number
    hasBom?: boolean
    isValidEncoding?: boolean
  }): ParsedDocument {
    const startTime = performance.now()
    
    if (text.length > this.config.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.config.maxFileSize} bytes`)
    }

    const elements: AozoraElement[] = []
    const headings: Heading[] = []
    const images: Image[] = []
    
    if (text.length === 0) {
      return this.createDocument(elements, headings, images, filename, startTime, text, encodingInfo)
    }

    try {
      const parsedElements = this.parseText(text)
      
      for (const element of parsedElements) {
        elements.push(element)
        
        if (element.type === 'heading') {
          headings.push(element)
        } else if (element.type === 'image') {
          images.push(element)
        }
      }

      return this.createDocument(elements, headings, images, filename, startTime, text, encodingInfo)
    } catch (error) {
      // Partial parsing on error - return what we have
      console.warn('Parser error, attempting partial parse:', error)
      return this.createDocument(elements, headings, images, filename, startTime, text, encodingInfo)
    }
  }

  private parseText(text: string): AozoraElement[] {
    const elements: AozoraElement[] = []
    
    // Split text into lines for better processing
    const lines = text.split(/\r?\n/)
    let lineStart = 0
    
    for (const line of lines) {
      // Preserve leading fullwidth spaces if enabled
      const processedLine = this.config.preserveLeadingSpaces ? 
        this.formattingParser.preserveLeadingSpaces(line) : 
        line.trim()
      
      if (processedLine.length === 0) {
        // Add empty line as text element
        elements.push({
          type: 'text',
          content: '\n',
          range: this.createRange(lineStart, lineStart + 1)
        })
        lineStart += line.length + 1
        continue
      }
      
      let currentIndex = 0
      
      while (currentIndex < processedLine.length) {
        const remaining = processedLine.slice(currentIndex)
        let matched = false
        
        // Try to parse formatting instructions first if enabled
        if (this.config.enableTextFormatting) {
          // Try left indent instruction (［＃２字上げ］)
          const leftIndentMatch = this.formattingParser.parseLeftIndent(remaining, lineStart + currentIndex)
          if (leftIndentMatch) {
            elements.push(leftIndentMatch.element)
            currentIndex += leftIndentMatch.length
            matched = true
            continue
          }
          
          // Try right indent instruction (［＃地から２字上げ］)
          const rightIndentMatch = this.formattingParser.parseRightIndent(remaining, lineStart + currentIndex)
          if (rightIndentMatch) {
            elements.push(rightIndentMatch.element)
            currentIndex += rightIndentMatch.length
            matched = true
            continue
          }
          
          // Try block indent start
          const blockStartMatch = this.formattingParser.parseBlockIndentStart(remaining, lineStart + currentIndex)
          if (blockStartMatch) {
            elements.push(blockStartMatch.element)
            currentIndex += blockStartMatch.length
            matched = true
            continue
          }
          
          // Try block indent end
          const blockEndMatch = this.formattingParser.parseBlockIndentEnd(remaining, lineStart + currentIndex)
          if (blockEndMatch) {
            elements.push(blockEndMatch.element)
            currentIndex += blockEndMatch.length
            matched = true
            continue
          }
        }
        
        // Try to parse different notations in priority order
        const rubyMatch = this.parseRuby(remaining, lineStart + currentIndex)
        if (rubyMatch) {
          elements.push(rubyMatch.element)
          currentIndex += rubyMatch.length
          matched = true
          continue
        }

        const headingMatch = this.parseHeading(remaining, lineStart + currentIndex)
        if (headingMatch) {
          elements.push(headingMatch.element)
          currentIndex += headingMatch.length
          matched = true
          continue
        }

        const imageMatch = this.parseImage(remaining, lineStart + currentIndex)
        if (imageMatch) {
          elements.push(imageMatch.element)
          currentIndex += imageMatch.length
          matched = true
          continue
        }

        const captionMatch = this.parseCaption(remaining, lineStart + currentIndex)
        if (captionMatch) {
          elements.push(captionMatch.element)
          currentIndex += captionMatch.length
          matched = true
          continue
        }

        // If no special notation found, parse as plain text until next special character
        if (!matched) {
          const plainTextMatch = this.parsePlainText(remaining, lineStart + currentIndex)
          if (plainTextMatch) {
            // Add all text elements, even empty ones temporarily - we'll clean up later
            elements.push(plainTextMatch.element)
            currentIndex += plainTextMatch.length
          } else {
            // Safety: advance by one character if nothing matches
            currentIndex++
          }
        }
      }
      
      // Add line break
      elements.push({
        type: 'text',
        content: '\n',
        range: this.createRange(lineStart + line.length, lineStart + line.length + 1)
      })
      
      lineStart += line.length + 1
    }

    // Process indent blocks if text formatting is enabled
    let processedElements = elements
    if (this.config.enableTextFormatting) {
      // First process indent blocks (this also removes formatting instructions)
      processedElements = this.blockProcessor.processIndentBlocks(elements)
      
      // Handle left and right indent instructions separately
      processedElements = this.processIndentInstructions(processedElements)
    }

    // Filter out consecutive empty text elements and merge adjacent text elements
    return this.cleanupElements(processedElements)
  }

  private processIndentInstructions(elements: AozoraElement[]): AozoraElement[] {
    const result: AozoraElement[] = []
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      
      if (element.type === 'formatting-instruction' && 
          (element.instructionType === 'left-indent' || element.instructionType === 'right-indent')) {
        // インデント指示の場合、次の要素と結合する
        const nextElement = elements[i + 1]
        if (nextElement && nextElement.type === 'text') {
          if (element.instructionType === 'left-indent') {
            // 左インデント
            const leftIndentedText: LeftIndentedText = {
              type: 'left-indented-text',
              content: nextElement.content,
              indentCount: element.indentCount || 0,
              range: {
                start: element.range.start,
                end: nextElement.range.end
              }
            }
            result.push(leftIndentedText)
          } else {
            // 右寄せ
            const rightIndentedText: RightIndentedText = {
              type: 'right-indented-text',
              content: nextElement.content,
              indentCount: element.indentCount || 0,
              range: {
                start: element.range.start,
                end: nextElement.range.end
              }
            }
            result.push(rightIndentedText)
          }
          i++ // 次の要素もスキップ
        }
        // 次の要素がない、またはテキストでない場合は指示を無視
      } else {
        result.push(element)
      }
    }
    
    return result
  }

  private parseRuby(text: string, startIndex: number): { element: RubyText; length: number } | null {
    if (!this.config.enableRuby) return null

    // Pattern: ｜text《ruby》 or text《ruby》
    const rangePattern = /^｜([^《]+)《([^》]+)》/
    const basicPattern = /^([^｜［《\s]+)《([^》]+)》/

    const rangeMatch = text.match(rangePattern)
    if (rangeMatch) {
      const [fullMatch, baseText, ruby] = rangeMatch
      return {
        element: {
          type: 'ruby',
          text: baseText,
          ruby: ruby,
          range: this.createRange(startIndex, startIndex + fullMatch.length)
        },
        length: fullMatch.length
      }
    }

    const basicMatch = text.match(basicPattern)
    if (basicMatch) {
      const [fullMatch, baseText, ruby] = basicMatch
      return {
        element: {
          type: 'ruby',
          text: baseText,
          ruby: ruby,
          range: this.createRange(startIndex, startIndex + fullMatch.length)
        },
        length: fullMatch.length
      }
    }

    return null
  }

  private parseHeading(text: string, startIndex: number): { element: Heading; length: number } | null {
    if (!this.config.enableHeadings) return null

    // Pattern: text［＃「text」は大/中/小見出し］
    const pattern = /^(.+?)［＃「(.+?)」は(大|中|小)見出し］/
    const match = text.match(pattern)

    if (match) {
      const [fullMatch, , innerText, levelText] = match
      const level = levelText === '大' ? 'large' : levelText === '中' ? 'medium' : 'small'
      const id = this.generateHeadingId(innerText)

      return {
        element: {
          type: 'heading',
          level,
          text: innerText,
          id,
          range: this.createRange(startIndex, startIndex + fullMatch.length)
        },
        length: fullMatch.length
      }
    }

    return null
  }

  private parseImage(text: string, startIndex: number): { element: Image; length: number } | null {
    if (!this.config.enableImages) return null

    // Pattern: ［＃description（filename、横width×縦height）入る］ or ［＃description（filename）入る］
    const withSizePattern = /^［＃([^（]+)（([^、]+)、横(\d+)×縦(\d+)）入る］/
    const basicPattern = /^［＃([^（]+)（([^）]+)）入る］/

    const withSizeMatch = text.match(withSizePattern)
    if (withSizeMatch) {
      const [fullMatch, description, filename, width, height] = withSizeMatch
      return {
        element: {
          type: 'image',
          description: description.trim(),
          filename: filename.trim(),
          width: parseInt(width),
          height: parseInt(height),
          range: this.createRange(startIndex, startIndex + fullMatch.length)
        },
        length: fullMatch.length
      }
    }

    const basicMatch = text.match(basicPattern)
    if (basicMatch) {
      const [fullMatch, description, filename] = basicMatch
      return {
        element: {
          type: 'image',
          description: description.trim(),
          filename: filename.trim(),
          range: this.createRange(startIndex, startIndex + fullMatch.length)
        },
        length: fullMatch.length
      }
    }

    return null
  }

  private parseCaption(text: string, startIndex: number): { element: Caption; length: number } | null {
    if (!this.config.enableCaptions) return null

    // Pattern: text［＃「text」はキャプション］
    const pattern = /^(.+?)［＃「(.+?)」はキャプション］/
    const match = text.match(pattern)

    if (match) {
      const [fullMatch, , innerText] = match
      return {
        element: {
          type: 'caption',
          text: innerText,
          range: this.createRange(startIndex, startIndex + fullMatch.length)
        },
        length: fullMatch.length
      }
    }

    return null
  }

  private parsePlainText(text: string, startIndex: number): { element: PlainText; length: number } | null {
    // Find the next special character or pattern
    const specialChars = /[｜［《》]/
    const match = text.search(specialChars)
    
    const endIndex = match === -1 ? text.length : Math.max(match, 1)
    if (endIndex === 0) return null

    const content = text.slice(0, endIndex)
    
    // Always return content, even if it's just whitespace
    return {
      element: {
        type: 'text',
        content,
        range: this.createRange(startIndex, startIndex + endIndex)
      },
      length: endIndex
    }
  }

  private generateHeadingId(text: string): string {
    // Generate a unique ID for headings
    return text
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase() + 
      '-' + Date.now().toString(36) // Add timestamp for uniqueness
  }

  private createRange(start: number, end: number): Range {
    // Simple range creation - could be enhanced with line/column calculation
    return {
      start: { line: 0, column: start, index: start },
      end: { line: 0, column: end, index: end }
    }
  }

  private cleanupElements(elements: AozoraElement[]): AozoraElement[] {
    const cleaned: AozoraElement[] = []
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      
      // Skip empty text elements except for meaningful whitespace
      if (element.type === 'text' && element.content.trim().length === 0 && element.content !== '\n') {
        continue
      }
      
      // Merge adjacent text elements
      if (element.type === 'text' && cleaned.length > 0) {
        const lastElement = cleaned[cleaned.length - 1]
        if (lastElement.type === 'text') {
          lastElement.content += element.content
          lastElement.range.end = element.range.end
          continue
        }
      }
      
      cleaned.push(element)
    }
    
    return cleaned
  }

  private createDocument(
    elements: AozoraElement[], 
    headings: Heading[], 
    images: Image[], 
    filename: string, 
    startTime: number,
    originalText: string,
    encodingInfo?: {
      encoding: string
      confidence?: number
      hasBom?: boolean
      isValidEncoding?: boolean
    }
  ): ParsedDocument {
    const endTime = performance.now()
    
    // Extract title from first large heading
    const title = headings.find(h => h.level === 'large')?.text

    return {
      title,
      elements,
      headings,
      images,
      metadata: {
        filename,
        fileSize: originalText.length,
        encoding: encodingInfo?.encoding || 'UTF-8',
        encodingConfidence: encodingInfo?.confidence,
        hasBom: encodingInfo?.hasBom,
        isValidEncoding: encodingInfo?.isValidEncoding,
        parseTime: endTime - startTime,
        elementCount: elements.length,
        characterCount: originalText.length
      }
    }
  }
}