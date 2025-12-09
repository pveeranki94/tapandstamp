'use client';

import { useState } from 'react';
import { isValidHexColor, normalizeHexColor } from '../../lib/color-utils';
import styles from './ColorPicker.module.css';

interface ContrastStatus {
  ratio: number;
  AA: boolean;
  AAA: boolean;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  contrastCheck?: {
    against: string;
    status: ContrastStatus;
  };
}

export function ColorPicker({ label, value, onChange, contrastCheck }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setInputValue(newColor);
    onChange(newColor);
    setError(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const normalized = normalizeHexColor(newValue);

    if (isValidHexColor(normalized)) {
      onChange(normalized);
      setError(null);
    } else if (newValue.length >= 6) {
      setError('Invalid hex color format');
    }
  };

  const getContrastStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return '#10b981'; // green
      case 'good':
        return '#22c55e'; // light green
      case 'fair':
        return '#eab308'; // yellow
      case 'poor':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>

      <div className={styles.inputGroup}>
        <input
          type="color"
          value={value}
          onChange={handleColorChange}
          className={styles.colorInput}
        />

        <input
          type="text"
          value={inputValue}
          onChange={handleTextChange}
          placeholder="#000000"
          maxLength={7}
          className={styles.textInput}
        />

        <div
          className={styles.preview}
          style={{ backgroundColor: value }}
          title={value}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {contrastCheck && (
        <div
          className={styles.contrast}
          style={{
            borderColor: getContrastStatusColor(contrastCheck.status.status)
          }}
        >
          <div className={styles.contrastHeader}>
            <span
              className={styles.contrastIndicator}
              style={{
                backgroundColor: getContrastStatusColor(
                  contrastCheck.status.status
                )
              }}
            />
            <span className={styles.contrastLabel}>Contrast Check</span>
          </div>
          <div className={styles.contrastMessage}>
            {contrastCheck.status.message}
          </div>
          <div className={styles.contrastBadges}>
            {contrastCheck.status.AA && (
              <span className={styles.badgeSuccess}>WCAG AA ✓</span>
            )}
            {contrastCheck.status.AAA && (
              <span className={styles.badgeSuccess}>WCAG AAA ✓</span>
            )}
            {!contrastCheck.status.AA && (
              <span className={styles.badgeWarning}>Fails WCAG AA</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
