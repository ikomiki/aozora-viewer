// Type definitions for Aozora Bunko Parser

export type ThemeType = 'light' | 'dark' | 'system';
export type HeadingLevel = 'large' | 'medium' | 'small';

export interface Position {
  line: number;
  column: number;
  index: number;
}

export interface Range {
  start: Position;
  end: Position;
}

// Parsed element types
export interface RubyText {
  type: 'ruby';
  text: string;       // Base text (kanji, etc.)
  ruby: string;       // Ruby text (hiragana, etc.)
  range: Range;
}

export interface Heading {
  type: 'heading';
  level: HeadingLevel;
  text: string;
  id: string;         // ID for navigation
  range: Range;
}

export interface Image {
  type: 'image';
  description: string;  // Image description
  filename?: string;    // Filename if present
  width?: number;       // Width
  height?: number;      // Height
  base64?: string;      // Base64 encoded image data
  range: Range;
}

export interface Caption {
  type: 'caption';
  text: string;
  imageId?: string;     // Related image ID
  range: Range;
}

export interface PlainText {
  type: 'text';
  content: string;
  range: Range;
}

export interface Emphasis {
  type: 'emphasis';
  text: string;
  style: 'dot' | 'underline' | 'bold';  // Emphasis style
  range: Range;
}

export interface Correction {
  type: 'correction';
  original: string;     // Original text
  corrected: string;    // Corrected text
  range: Range;
}

// Text formatting elements
export interface IndentedText {
  type: 'indented-text';
  content: string;
  indentCount: number;  // Positive for indent (字下げ), negative for outdent (字上げ)
  range: Range;
}

export interface LeftIndentedText {
  type: 'left-indented-text';
  content: string;
  indentCount: number;  // Number of fullwidth spaces from line start
  range: Range;
}

export interface RightIndentedText {
  type: 'right-indented-text';
  content: string;
  indentCount: number;  // Number of fullwidth spaces from line end
  range: Range;
}

export interface IndentBlock {
  type: 'indent-block';
  indentCount: number;  // Number of fullwidth spaces to indent
  elements: Exclude<AozoraElement, FormattingInstruction>[];  // Elements within the block (excluding instructions)
  range: Range;
}

// Internal formatting instruction (removed from final output)
export interface FormattingInstruction {
  type: 'formatting-instruction';
  instruction: string;  // Original instruction text
  instructionType: 'indent-start' | 'indent-end' | 'line-indent' | 'left-indent' | 'right-indent';
  indentCount?: number; // Number of characters to indent (undefined for indent-end)
  range: Range;
}

// Union type for all elements
export type AozoraElement = 
  | RubyText 
  | Heading 
  | Image 
  | Caption 
  | PlainText 
  | Emphasis 
  | Correction
  | IndentedText
  | LeftIndentedText
  | RightIndentedText
  | IndentBlock
  | FormattingInstruction;

// Document structure
export interface ParsedDocument {
  title?: string;               // Document title (from first large heading)
  author?: string;              // Author name
  elements: AozoraElement[];    // All parsed elements
  headings: Heading[];          // Headings only (for table of contents)
  images: Image[];              // Images only
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  filename: string;
  fileSize: number;
  lastModified?: Date;
  encoding: string;
  encodingConfidence?: number;  // Encoding detection confidence (0-1)
  hasBom?: boolean;            // Whether file had UTF-8 BOM
  isValidEncoding?: boolean;   // Whether encoding detection was successful
  parseTime: number;            // Parse processing time (ms)
  elementCount: number;         // Number of elements
  characterCount: number;       // Character count
}

// Parser configuration
export interface ParserConfig {
  enableRuby: boolean;
  enableHeadings: boolean;
  enableImages: boolean;
  enableCaptions: boolean;
  enableEmphasis: boolean;
  enableTextFormatting: boolean; // Enable text formatting (indent/outdent)
  preserveLeadingSpaces: boolean; // Preserve leading fullwidth spaces
  maxIndentCount: number;        // Maximum allowed indent count (safety limit)
  strictMode: boolean;          // Strict parsing mode
  maxFileSize: number;          // Maximum file size in bytes
}