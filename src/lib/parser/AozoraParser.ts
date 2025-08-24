import type { 
  ParsedDocument, 
  AozoraElement, 
  RubyText, 
  Heading, 
  Image, 
  Caption, 
  PlainText,
  Range,
  ParserConfig 
} from '../../types'

export default class AozoraParser {
  private config: ParserConfig

  constructor(config?: Partial<ParserConfig>) {
    this.config = {
      enableRuby: true,
      enableHeadings: true,
      enableImages: true,
      enableCaptions: true,
      enableEmphasis: true,
      strictMode: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      ...config
    }
  }

  parse(text: string, filename: string): ParsedDocument {
    const startTime = performance.now()
    
    if (text.length > this.config.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.config.maxFileSize} bytes`)
    }

    const elements: AozoraElement[] = []
    const headings: Heading[] = []
    const images: Image[] = []
    
    if (text.length === 0) {
      return this.createDocument(elements, headings, images, filename, startTime, text)
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

      return this.createDocument(elements, headings, images, filename, startTime, text)
    } catch (error) {
      // Partial parsing on error - return what we have
      console.warn('Parser error, attempting partial parse:', error)
      return this.createDocument(elements, headings, images, filename, startTime, text)
    }
  }

  private parseText(text: string): AozoraElement[] {
    const elements: AozoraElement[] = []
    
    // Split text into lines for better processing
    const lines = text.split(/\r?\n/)
    let lineStart = 0
    
    for (const line of lines) {
      if (line.trim().length === 0) {
        // Add empty line as text element
        elements.push({
          type: 'text',
          content: line + '\n',
          range: this.createRange(lineStart, lineStart + line.length + 1)
        })
        lineStart += line.length + 1
        continue
      }
      
      let currentIndex = 0
      
      while (currentIndex < line.length) {
        const remaining = line.slice(currentIndex)
        let matched = false
        
        // Skip whitespace at the beginning of remaining text
        const trimmedRemaining = remaining.trimStart()
        const whitespaceLength = remaining.length - trimmedRemaining.length
        
        // If we have whitespace, add it as text element first
        if (whitespaceLength > 0) {
          elements.push({
            type: 'text',
            content: remaining.slice(0, whitespaceLength),
            range: this.createRange(lineStart + currentIndex, lineStart + currentIndex + whitespaceLength)
          })
          currentIndex += whitespaceLength
          continue
        }
        
        // Try to parse different notations in priority order on trimmed text
        const rubyMatch = this.parseRuby(trimmedRemaining, lineStart + currentIndex)
        if (rubyMatch) {
          elements.push(rubyMatch.element)
          currentIndex += rubyMatch.length
          matched = true
          continue
        }

        const headingMatch = this.parseHeading(trimmedRemaining, lineStart + currentIndex)
        if (headingMatch) {
          elements.push(headingMatch.element)
          currentIndex += headingMatch.length
          matched = true
          continue
        }

        const imageMatch = this.parseImage(trimmedRemaining, lineStart + currentIndex)
        if (imageMatch) {
          elements.push(imageMatch.element)
          currentIndex += imageMatch.length
          matched = true
          continue
        }

        const captionMatch = this.parseCaption(trimmedRemaining, lineStart + currentIndex)
        if (captionMatch) {
          elements.push(captionMatch.element)
          currentIndex += captionMatch.length
          matched = true
          continue
        }

        // If no special notation found, parse as plain text until next special character
        if (!matched) {
          const plainTextMatch = this.parsePlainText(trimmedRemaining, lineStart + currentIndex)
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

    // Filter out consecutive empty text elements and merge adjacent text elements
    return this.cleanupElements(elements)
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
    originalText: string
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
        encoding: 'UTF-8',
        parseTime: endTime - startTime,
        elementCount: elements.length,
        characterCount: originalText.length
      }
    }
  }
}