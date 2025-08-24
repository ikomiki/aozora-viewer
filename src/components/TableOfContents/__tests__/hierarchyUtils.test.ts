import { describe, it, expect } from 'vitest'
import { buildHeadingTree, flattenTree, findNodeById } from '../hierarchyUtils'
import type { Heading } from '../../../types'

describe('hierarchyUtils', () => {
  const mockHeadings: Heading[] = [
    {
      type: 'heading',
      level: 'large',
      text: '第一章 始まり',
      id: 'chapter-1',
      range: {
        start: { line: 0, column: 0, index: 0 },
        end: { line: 0, column: 10, index: 10 }
      }
    },
    {
      type: 'heading',
      level: 'medium',
      text: '一 出会い',
      id: 'section-1',
      range: {
        start: { line: 1, column: 0, index: 11 },
        end: { line: 1, column: 8, index: 19 }
      }
    },
    {
      type: 'heading',
      level: 'small',
      text: 'その後',
      id: 'subsection-1',
      range: {
        start: { line: 2, column: 0, index: 20 },
        end: { line: 2, column: 3, index: 23 }
      }
    },
    {
      type: 'heading',
      level: 'small',
      text: 'さらに',
      id: 'subsection-2',
      range: {
        start: { line: 3, column: 0, index: 24 },
        end: { line: 3, column: 3, index: 27 }
      }
    },
    {
      type: 'heading',
      level: 'medium',
      text: '二 別れ',
      id: 'section-2',
      range: {
        start: { line: 4, column: 0, index: 28 },
        end: { line: 4, column: 6, index: 34 }
      }
    },
    {
      type: 'heading',
      level: 'large',
      text: '第二章 発展',
      id: 'chapter-2',
      range: {
        start: { line: 5, column: 0, index: 35 },
        end: { line: 5, column: 10, index: 45 }
      }
    }
  ]

  describe('buildHeadingTree', () => {
    it('should build correct hierarchical tree structure', () => {
      const tree = buildHeadingTree(mockHeadings)
      
      expect(tree).toHaveLength(2) // Two main chapters
      
      // Check first chapter structure
      const firstChapter = tree[0]
      expect(firstChapter.heading.id).toBe('chapter-1')
      expect(firstChapter.level).toBe(1)
      expect(firstChapter.children).toHaveLength(2) // Two sections under chapter 1
      
      // Check first section under first chapter
      const firstSection = firstChapter.children[0]
      expect(firstSection.heading.id).toBe('section-1')
      expect(firstSection.level).toBe(2)
      expect(firstSection.children).toHaveLength(2) // Two subsections
      
      // Check subsections
      expect(firstSection.children[0].heading.id).toBe('subsection-1')
      expect(firstSection.children[1].heading.id).toBe('subsection-2')
      expect(firstSection.children[0].level).toBe(3)
      expect(firstSection.children[1].level).toBe(3)
      
      // Check second section under first chapter
      const secondSection = firstChapter.children[1]
      expect(secondSection.heading.id).toBe('section-2')
      expect(secondSection.children).toHaveLength(0) // No subsections
      
      // Check second chapter
      const secondChapter = tree[1]
      expect(secondChapter.heading.id).toBe('chapter-2')
      expect(secondChapter.children).toHaveLength(0) // No sections
    })

    it('should handle empty headings array', () => {
      const tree = buildHeadingTree([])
      expect(tree).toHaveLength(0)
    })

    it('should handle single heading', () => {
      const singleHeading = mockHeadings.slice(0, 1)
      const tree = buildHeadingTree(singleHeading)
      
      expect(tree).toHaveLength(1)
      expect(tree[0].heading.id).toBe('chapter-1')
      expect(tree[0].children).toHaveLength(0)
    })

    it('should handle headings without proper hierarchy', () => {
      const messyHeadings: Heading[] = [
        {
          type: 'heading',
          level: 'small',
          text: '細かい見出し',
          id: 'small-1',
          range: {
            start: { line: 0, column: 0, index: 0 },
            end: { line: 0, column: 6, index: 6 }
          }
        },
        {
          type: 'heading',
          level: 'large',
          text: '大きな見出し',
          id: 'large-1',
          range: {
            start: { line: 1, column: 0, index: 7 },
            end: { line: 1, column: 6, index: 13 }
          }
        },
        {
          type: 'heading',
          level: 'medium',
          text: '中くらいの見出し',
          id: 'medium-1',
          range: {
            start: { line: 2, column: 0, index: 14 },
            end: { line: 2, column: 8, index: 22 }
          }
        }
      ]
      
      const tree = buildHeadingTree(messyHeadings)
      
      // Should still create a valid tree structure
      expect(tree.length).toBeGreaterThan(0)
      expect(tree[0].heading.id).toBe('small-1')
    })

    it('should assign correct indices', () => {
      const tree = buildHeadingTree(mockHeadings)
      const flattened = flattenTree(tree)
      
      flattened.forEach((node, index) => {
        expect(node.index).toBe(index)
      })
    })
  })

  describe('flattenTree', () => {
    it('should flatten tree structure maintaining order', () => {
      const tree = buildHeadingTree(mockHeadings)
      const flattened = flattenTree(tree)
      
      expect(flattened).toHaveLength(6) // All headings
      expect(flattened[0].heading.id).toBe('chapter-1')
      expect(flattened[1].heading.id).toBe('section-1')
      expect(flattened[2].heading.id).toBe('subsection-1')
      expect(flattened[3].heading.id).toBe('subsection-2')
      expect(flattened[4].heading.id).toBe('section-2')
      expect(flattened[5].heading.id).toBe('chapter-2')
    })

    it('should handle empty tree', () => {
      const flattened = flattenTree([])
      expect(flattened).toHaveLength(0)
    })

    it('should preserve nesting levels', () => {
      const tree = buildHeadingTree(mockHeadings)
      const flattened = flattenTree(tree)
      
      expect(flattened[0].level).toBe(1) // chapter-1
      expect(flattened[1].level).toBe(2) // section-1
      expect(flattened[2].level).toBe(3) // subsection-1
      expect(flattened[3].level).toBe(3) // subsection-2
      expect(flattened[4].level).toBe(2) // section-2
      expect(flattened[5].level).toBe(1) // chapter-2
    })
  })

  describe('findNodeById', () => {
    it('should find node by id in tree', () => {
      const tree = buildHeadingTree(mockHeadings)
      
      const found = findNodeById(tree, 'section-1')
      expect(found).not.toBeNull()
      expect(found?.heading.id).toBe('section-1')
      expect(found?.heading.text).toBe('一 出会い')
    })

    it('should find deeply nested node', () => {
      const tree = buildHeadingTree(mockHeadings)
      
      const found = findNodeById(tree, 'subsection-1')
      expect(found).not.toBeNull()
      expect(found?.heading.id).toBe('subsection-1')
      expect(found?.level).toBe(3)
    })

    it('should return null for non-existent id', () => {
      const tree = buildHeadingTree(mockHeadings)
      
      const found = findNodeById(tree, 'non-existent')
      expect(found).toBeNull()
    })

    it('should handle empty tree', () => {
      const found = findNodeById([], 'any-id')
      expect(found).toBeNull()
    })
  })

  describe('パフォーマンス', () => {
    it('should handle large heading trees efficiently', () => {
      // Create a large heading list
      const largeHeadingList: Heading[] = []
      for (let i = 0; i < 100; i++) {
        largeHeadingList.push({
          type: 'heading',
          level: i % 3 === 0 ? 'large' : i % 3 === 1 ? 'medium' : 'small',
          text: `見出し ${i + 1}`,
          id: `heading-${i + 1}`,
          range: {
            start: { line: i, column: 0, index: i * 10 },
            end: { line: i, column: 8, index: i * 10 + 8 }
          }
        })
      }
      
      const startTime = performance.now()
      const tree = buildHeadingTree(largeHeadingList)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(50) // Should build quickly
      expect(tree.length).toBeGreaterThan(0)
      
      // Test flattening performance
      const startFlatten = performance.now()
      const flattened = flattenTree(tree)
      const endFlatten = performance.now()
      
      expect(endFlatten - startFlatten).toBeLessThan(20)
      expect(flattened).toHaveLength(100)
    })

    it('should handle deep nesting efficiently', () => {
      const deepHeadings: Heading[] = [
        {
          type: 'heading',
          level: 'large',
          text: 'レベル1',
          id: 'level-1',
          range: { start: { line: 0, column: 0, index: 0 }, end: { line: 0, column: 4, index: 4 } }
        },
        {
          type: 'heading',
          level: 'medium',
          text: 'レベル2',
          id: 'level-2',
          range: { start: { line: 1, column: 0, index: 5 }, end: { line: 1, column: 4, index: 9 } }
        },
        {
          type: 'heading',
          level: 'small',
          text: 'レベル3',
          id: 'level-3',
          range: { start: { line: 2, column: 0, index: 10 }, end: { line: 2, column: 4, index: 14 } }
        }
      ]
      
      const tree = buildHeadingTree(deepHeadings)
      expect(tree[0].children[0].children[0].heading.id).toBe('level-3')
      
      const found = findNodeById(tree, 'level-3')
      expect(found?.level).toBe(3)
    })
  })
})