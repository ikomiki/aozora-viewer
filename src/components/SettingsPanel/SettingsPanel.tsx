import { useCallback } from 'react'
import { useDocumentSettings } from '../../hooks/useDocumentSettings'
import SettingSlider from '../SettingSlider/SettingSlider'
import styles from './SettingsPanel.module.css'

const SettingsPanel = () => {
  const { settings, updateSetting, resetSetting, resetToDefaults } = useDocumentSettings()

  const handleFontSizeChange = useCallback((value: number) => {
    updateSetting('fontSize', value)
  }, [updateSetting])

  const handleLineHeightChange = useCallback((value: number) => {
    updateSetting('lineHeight', value)
  }, [updateSetting])

  const handleHorizontalMarginChange = useCallback((value: number) => {
    updateSetting('horizontalMargin', value)
  }, [updateSetting])

  const handleLetterSpacingChange = useCallback((value: number) => {
    updateSetting('letterSpacing', value)
  }, [updateSetting])

  const handleParagraphSpacingChange = useCallback((value: number) => {
    updateSetting('paragraphSpacing', value)
  }, [updateSetting])

  const handleFontSizeReset = useCallback(() => {
    resetSetting('fontSize')
  }, [resetSetting])

  const handleLineHeightReset = useCallback(() => {
    resetSetting('lineHeight')
  }, [resetSetting])

  const handleHorizontalMarginReset = useCallback(() => {
    resetSetting('horizontalMargin')
  }, [resetSetting])

  const handleLetterSpacingReset = useCallback(() => {
    resetSetting('letterSpacing')
  }, [resetSetting])

  const handleParagraphSpacingReset = useCallback(() => {
    resetSetting('paragraphSpacing')
  }, [resetSetting])

  return (
    <div className={styles.container} role="region" aria-label="表示設定">
      {/* ヘッダー */}
      <div className={styles.header}>
        <h3 className={styles.title}>表示設定</h3>
        <button
          type="button"
          className={styles.resetAllButton}
          onClick={resetToDefaults}
          aria-label="すべてリセット"
          title="すべての設定をデフォルト値に戻す"
        >
          すべてリセット
        </button>
      </div>

      {/* 設定項目 */}
      <div className={styles.settings}>
        <SettingSlider
          label="文字サイズ"
          value={settings.fontSize}
          min={12}
          max={36}
          step={1}
          unit="px"
          onChange={handleFontSizeChange}
          onReset={handleFontSizeReset}
        />

        <SettingSlider
          label="行間"
          value={settings.lineHeight}
          min={1.2}
          max={2.5}
          step={0.1}
          unit=""
          onChange={handleLineHeightChange}
          onReset={handleLineHeightReset}
        />

        <SettingSlider
          label="左右マージン"
          value={settings.horizontalMargin}
          min={0}
          max={200}
          step={5}
          unit="px"
          onChange={handleHorizontalMarginChange}
          onReset={handleHorizontalMarginReset}
        />

        <SettingSlider
          label="文字間隔"
          value={settings.letterSpacing}
          min={-0.5}
          max={2.0}
          step={0.1}
          unit="px"
          onChange={handleLetterSpacingChange}
          onReset={handleLetterSpacingReset}
        />

        <SettingSlider
          label="段落間隔"
          value={settings.paragraphSpacing}
          min={0}
          max={50}
          step={2}
          unit="px"
          onChange={handleParagraphSpacingChange}
          onReset={handleParagraphSpacingReset}
        />
      </div>
    </div>
  )
}

export default SettingsPanel