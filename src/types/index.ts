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

// Union type for all elements
export type AozoraElement = 
  | RubyText 
  | Heading 
  | Image 
  | Caption 
  | PlainText 
  | Emphasis 
  | Correction;

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
  strictMode: boolean;          // Strict parsing mode
  maxFileSize: number;          // Maximum file size in bytes
}