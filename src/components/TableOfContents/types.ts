import type { Heading } from '../../types'

export interface TableOfContentsProps {
  headings: Heading[]
  activeHeadingId?: string
  onHeadingClick: (heading: Heading) => void
  className?: string
  maxHeight?: number
  virtualScroll?: boolean
}

export interface HeadingTreeNode {
  heading: Heading
  children: HeadingTreeNode[]
  level: number
  index: number
}

export interface TableOfContentsItemProps {
  node: HeadingTreeNode
  activeHeadingId?: string
  onHeadingClick: (heading: Heading) => void
  className?: string
}

export interface VirtualScrollProps {
  items: HeadingTreeNode[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: HeadingTreeNode, index: number) => React.ReactNode
}

export interface UseScrollSpyOptions {
  headings: Heading[]
  rootMargin?: string
  threshold?: number
}

export interface UseScrollSpyResult {
  activeHeadingId: string | null
}

export interface HeadingHierarchy {
  buildTree: (headings: Heading[]) => HeadingTreeNode[]
  flattenTree: (tree: HeadingTreeNode[]) => HeadingTreeNode[]
  findNodeById: (tree: HeadingTreeNode[], id: string) => HeadingTreeNode | null
}