import type { Heading } from '../../types'
import type { HeadingTreeNode } from './types'

/**
 * Convert heading level to numeric value for comparison
 */
const getLevelNumber = (level: Heading['level']): number => {
  switch (level) {
    case 'large': return 1
    case 'medium': return 2
    case 'small': return 3
    default: return 3
  }
}

/**
 * Build hierarchical tree structure from flat heading array
 */
export const buildHeadingTree = (headings: Heading[]): HeadingTreeNode[] => {
  if (headings.length === 0) return []
  
  const tree: HeadingTreeNode[] = []
  const stack: HeadingTreeNode[] = []
  
  headings.forEach((heading, index) => {
    const levelNumber = getLevelNumber(heading.level)
    
    const node: HeadingTreeNode = {
      heading,
      children: [],
      level: levelNumber,
      index // Will be recalculated after tree is built
    }
    
    // Pop stack until we find a parent with lower level number
    while (stack.length > 0 && stack[stack.length - 1].level >= levelNumber) {
      stack.pop()
    }
    
    // Add to parent's children or root
    if (stack.length === 0) {
      tree.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }
    
    stack.push(node)
  })
  
  // Recalculate indices in tree order
  const flattened = flattenTree(tree)
  flattened.forEach((node, index) => {
    node.index = index
  })
  
  return tree
}

/**
 * Flatten tree structure to array maintaining hierarchical order
 */
export const flattenTree = (tree: HeadingTreeNode[]): HeadingTreeNode[] => {
  const result: HeadingTreeNode[] = []
  
  const traverse = (nodes: HeadingTreeNode[]) => {
    for (const node of nodes) {
      result.push(node)
      if (node.children.length > 0) {
        traverse(node.children)
      }
    }
  }
  
  traverse(tree)
  return result
}

/**
 * Find node in tree by heading ID
 */
export const findNodeById = (tree: HeadingTreeNode[], id: string): HeadingTreeNode | null => {
  for (const node of tree) {
    if (node.heading.id === id) {
      return node
    }
    
    if (node.children.length > 0) {
      const found = findNodeById(node.children, id)
      if (found) {
        return found
      }
    }
  }
  
  return null
}

/**
 * Find parent node of given node ID
 */
export const findParentNode = (tree: HeadingTreeNode[], targetId: string): HeadingTreeNode | null => {
  for (const node of tree) {
    // Check direct children
    for (const child of node.children) {
      if (child.heading.id === targetId) {
        return node
      }
    }
    
    // Recursively check deeper levels
    if (node.children.length > 0) {
      const found = findParentNode(node.children, targetId)
      if (found) {
        return found
      }
    }
  }
  
  return null
}

/**
 * Get all ancestor nodes of given node ID
 */
export const getAncestorNodes = (tree: HeadingTreeNode[], targetId: string): HeadingTreeNode[] => {
  const ancestors: HeadingTreeNode[] = []
  
  const findPath = (nodes: HeadingTreeNode[], path: HeadingTreeNode[]): boolean => {
    for (const node of nodes) {
      const currentPath = [...path, node]
      
      if (node.heading.id === targetId) {
        ancestors.push(...path) // Don't include the target node itself
        return true
      }
      
      if (node.children.length > 0 && findPath(node.children, currentPath)) {
        return true
      }
    }
    
    return false
  }
  
  findPath(tree, [])
  return ancestors
}

/**
 * Calculate the visible range for virtual scrolling
 */
export const calculateVisibleRange = (
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 5
): { startIndex: number; endIndex: number } => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const endIndex = Math.min(totalItems - 1, startIndex + visibleCount + overscan * 2)
  
  return { startIndex, endIndex }
}