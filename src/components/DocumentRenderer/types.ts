import type { ParsedDocument, AozoraElement, RubyText, Heading, Image, Caption, PlainText } from '../../types'

export interface DocumentRendererProps {
  document: ParsedDocument | null
  className?: string
  onImageLoad?: (imageUrl: string, element: Image) => void
  onImageError?: (imageUrl: string, element: Image, error: Error) => void
  onHeadingClick?: (heading: Heading) => void
}

export interface RubyRendererProps {
  element: RubyText
  className?: string
}

export interface HeadingRendererProps {
  element: Heading
  onClick?: (heading: Heading) => void
  className?: string
}

export interface ImageRendererProps {
  element: Image
  onLoad?: (imageUrl: string, element: Image) => void
  onError?: (imageUrl: string, element: Image, error: Error) => void
  className?: string
  lazy?: boolean
}

export interface CaptionRendererProps {
  element: Caption
  className?: string
}

export interface PlainTextRendererProps {
  element: PlainText
  className?: string
}

export interface ElementRendererProps {
  element: AozoraElement
  onImageLoad?: (imageUrl: string, element: Image) => void
  onImageError?: (imageUrl: string, element: Image, error: Error) => void
  onHeadingClick?: (heading: Heading) => void
  className?: string
}