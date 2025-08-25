import React, { useCallback } from 'react'
import styles from './SettingSlider.module.css'

interface SettingSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
  onReset: () => void
}

const SettingSlider = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  onReset
}: SettingSliderProps) => {
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)
    onChange(newValue)
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault()
        onChange(Math.min(max, value + step))
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault()
        onChange(Math.max(min, value - step))
        break
      case 'Home':
        e.preventDefault()
        onChange(min)
        break
      case 'End':
        e.preventDefault()
        onChange(max)
        break
    }
  }, [value, min, max, step, onChange])

  const formattedValue = unit ? `${value}${unit}` : String(value)
  const sliderId = `setting-slider-${label.replace(/\s+/g, '-').toLowerCase()}`
  const labelId = `${sliderId}-label`
  const valueId = `${sliderId}-value`

  return (
    <div className={styles.container}>
      {/* ラベルと現在値 */}
      <div className={styles.header}>
        <label id={labelId} htmlFor={sliderId} className={styles.label}>
          {label}
        </label>
        <span id={valueId} className={styles.value}>
          {formattedValue}
        </span>
      </div>

      {/* スライダーとリセットボタン */}
      <div className={styles.controls}>
        <input
          id={sliderId}
          type="range"
          className={styles.slider}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={handleSliderChange}
          onKeyDown={handleKeyDown}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={formattedValue}
          aria-describedby={`${labelId} ${valueId}`}
        />
        <button
          type="button"
          className={styles.resetButton}
          onClick={onReset}
          aria-label={`Reset ${label}`}
          title={`Reset ${label} to default`}
        >
          ↺
        </button>
      </div>
    </div>
  )
}

export default SettingSlider