import { useState, useCallback } from 'react'
import type { SidebarState, UseSidebarStateReturn, SidebarSide } from '../types/sidebar'
import { SIDEBAR_CONSTANTS } from '../constants/sidebar'

const DEFAULT_STATE: SidebarState = {
  left: { isOpen: false, width: SIDEBAR_CONSTANTS.DEFAULT_WIDTH },
  right: { isOpen: false, width: SIDEBAR_CONSTANTS.DEFAULT_WIDTH }
}

export const useSidebarState = (): UseSidebarStateReturn => {
  const [sidebarState, setSidebarState] = useState<SidebarState>(() => {
    // localStorage から状態を復元
    try {
      const leftOpen = localStorage.getItem(SIDEBAR_CONSTANTS.STORAGE_KEYS.LEFT_OPEN)
      const rightOpen = localStorage.getItem(SIDEBAR_CONSTANTS.STORAGE_KEYS.RIGHT_OPEN)
      const leftWidth = localStorage.getItem(SIDEBAR_CONSTANTS.STORAGE_KEYS.LEFT_WIDTH)
      const rightWidth = localStorage.getItem(SIDEBAR_CONSTANTS.STORAGE_KEYS.RIGHT_WIDTH)

      return {
        left: {
          isOpen: leftOpen === 'true',
          width: leftWidth ? Math.max(SIDEBAR_CONSTANTS.MIN_WIDTH, Math.min(SIDEBAR_CONSTANTS.MAX_WIDTH, parseInt(leftWidth))) : SIDEBAR_CONSTANTS.DEFAULT_WIDTH
        },
        right: {
          isOpen: rightOpen === 'true',
          width: rightWidth ? Math.max(SIDEBAR_CONSTANTS.MIN_WIDTH, Math.min(SIDEBAR_CONSTANTS.MAX_WIDTH, parseInt(rightWidth))) : SIDEBAR_CONSTANTS.DEFAULT_WIDTH
        }
      }
    } catch {
      return DEFAULT_STATE
    }
  })

  const toggleSidebar = useCallback((side: SidebarSide) => {
    setSidebarState(prev => {
      const newState = {
        ...prev,
        [side]: {
          ...prev[side],
          isOpen: !prev[side].isOpen
        }
      }
      
      // localStorage に保存
      const storageKey = side === 'left' ? SIDEBAR_CONSTANTS.STORAGE_KEYS.LEFT_OPEN : SIDEBAR_CONSTANTS.STORAGE_KEYS.RIGHT_OPEN
      localStorage.setItem(storageKey, String(newState[side].isOpen))
      
      return newState
    })
  }, [])

  const setSidebarWidth = useCallback((side: SidebarSide, width: number) => {
    const clampedWidth = Math.max(SIDEBAR_CONSTANTS.MIN_WIDTH, Math.min(SIDEBAR_CONSTANTS.MAX_WIDTH, width))
    
    setSidebarState(prev => {
      const newState = {
        ...prev,
        [side]: {
          ...prev[side],
          width: clampedWidth
        }
      }
      
      // localStorage に保存
      const storageKey = side === 'left' ? SIDEBAR_CONSTANTS.STORAGE_KEYS.LEFT_WIDTH : SIDEBAR_CONSTANTS.STORAGE_KEYS.RIGHT_WIDTH
      localStorage.setItem(storageKey, String(clampedWidth))
      
      return newState
    })
  }, [])

  const resetToDefaults = useCallback(() => {
    setSidebarState(DEFAULT_STATE)
    localStorage.removeItem(SIDEBAR_CONSTANTS.STORAGE_KEYS.LEFT_OPEN)
    localStorage.removeItem(SIDEBAR_CONSTANTS.STORAGE_KEYS.RIGHT_OPEN)
    localStorage.removeItem(SIDEBAR_CONSTANTS.STORAGE_KEYS.LEFT_WIDTH)
    localStorage.removeItem(SIDEBAR_CONSTANTS.STORAGE_KEYS.RIGHT_WIDTH)
  }, [])

  return {
    sidebarState,
    toggleSidebar,
    setSidebarWidth,
    resetToDefaults
  }
}