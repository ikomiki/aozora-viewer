import { useState, useCallback, useEffect } from 'react'

export interface DocumentSettings {
  fontSize: number
  lineHeight: number
  horizontalMargin: number
  letterSpacing: number
  paragraphSpacing: number
}

export interface UseDocumentSettingsReturn {
  settings: DocumentSettings
  updateSetting: (key: keyof DocumentSettings, value: number) => void
  resetSetting: (key: keyof DocumentSettings) => void
  resetToDefaults: () => void
}

const DEFAULT_SETTINGS: DocumentSettings = {
  fontSize: 16,
  lineHeight: 1.6,
  horizontalMargin: 20,
  letterSpacing: 0,
  paragraphSpacing: 16
}

const SETTING_CONSTRAINTS = {
  fontSize: { min: 12, max: 36 },
  lineHeight: { min: 1.2, max: 2.5 },
  horizontalMargin: { min: 0, max: 200 },
  letterSpacing: { min: -0.5, max: 2.0 },
  paragraphSpacing: { min: 0, max: 50 }
}

const STORAGE_KEYS = {
  fontSize: 'aozora-settings-fontSize',
  lineHeight: 'aozora-settings-lineHeight',
  horizontalMargin: 'aozora-settings-horizontalMargin',
  letterSpacing: 'aozora-settings-letterSpacing',
  paragraphSpacing: 'aozora-settings-paragraphSpacing'
}

// 値を範囲内にクランプする
const clampValue = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value))
}

// localStorageから設定を読み込む
const loadSettingsFromStorage = (): DocumentSettings => {
  const settings = { ...DEFAULT_SETTINGS }
  
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) {
        const parsedValue = parseFloat(stored)
        if (!isNaN(parsedValue)) {
          const constraints = SETTING_CONSTRAINTS[key as keyof DocumentSettings]
          settings[key as keyof DocumentSettings] = clampValue(
            parsedValue, 
            constraints.min, 
            constraints.max
          )
        }
      }
    } catch (error) {
      console.warn(`Failed to load setting ${key}:`, error)
    }
  })
  
  return settings
}

// CSS変数を更新する
const updateCSSVariables = (settings: DocumentSettings) => {
  const root = document.documentElement
  
  root.style.setProperty('--document-font-size', `${settings.fontSize}px`)
  root.style.setProperty('--document-line-height', `${settings.lineHeight}`)
  root.style.setProperty('--document-horizontal-margin', `${settings.horizontalMargin}px`)
  root.style.setProperty('--document-letter-spacing', `${settings.letterSpacing}px`)
  root.style.setProperty('--document-paragraph-spacing', `${settings.paragraphSpacing}px`)
}

// localStorageに設定を保存する（デバウンス付き）
const createDebouncedStorage = () => {
  const timeouts: Record<string, number> = {}
  
  const save = (key: keyof DocumentSettings, value: number) => {
    const storageKey = STORAGE_KEYS[key]
    
    // 既存のタイマーをクリア
    if (timeouts[key]) {
      clearTimeout(timeouts[key])
    }
    
    // 500ms後に保存
    timeouts[key] = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, String(value))
      } catch (error) {
        console.warn(`Failed to save setting ${key}:`, error)
      }
      delete timeouts[key]
    }, 500)
  }
  
  const cleanup = () => {
    Object.values(timeouts).forEach(clearTimeout)
    Object.keys(timeouts).forEach(key => delete timeouts[key])
  }
  
  return { save, cleanup }
}

const debouncedStorage = createDebouncedStorage()
const saveSettingToStorage = debouncedStorage.save

export const useDocumentSettings = (): UseDocumentSettingsReturn => {
  const [settings, setSettings] = useState<DocumentSettings>(() => {
    return loadSettingsFromStorage()
  })

  // 初期化時にCSS変数を設定
  useEffect(() => {
    updateCSSVariables(settings)
    
    // クリーンアップ関数でタイマーをクリア
    return () => {
      debouncedStorage.cleanup()
    }
  }, [])

  const updateSetting = useCallback((key: keyof DocumentSettings, value: number) => {
    const constraints = SETTING_CONSTRAINTS[key]
    const clampedValue = clampValue(value, constraints.min, constraints.max)
    
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: clampedValue
      }
      
      // CSS変数を即座に更新
      updateCSSVariables(newSettings)
      
      return newSettings
    })
    
    // localStorageに保存（デバウンス付き）
    saveSettingToStorage(key, clampedValue)
  }, [])

  const resetSetting = useCallback((key: keyof DocumentSettings) => {
    const defaultValue = DEFAULT_SETTINGS[key]
    
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: defaultValue
      }
      
      // CSS変数を更新
      updateCSSVariables(newSettings)
      
      return newSettings
    })
    
    // localStorageから削除
    try {
      localStorage.removeItem(STORAGE_KEYS[key])
    } catch (error) {
      console.warn(`Failed to remove setting ${key}:`, error)
    }
  }, [])

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    
    // CSS変数をリセット
    updateCSSVariables(DEFAULT_SETTINGS)
    
    // localStorageをクリア
    Object.values(STORAGE_KEYS).forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn(`Failed to remove setting ${key}:`, error)
      }
    })
  }, [])

  return {
    settings,
    updateSetting,
    resetSetting,
    resetToDefaults
  }
}