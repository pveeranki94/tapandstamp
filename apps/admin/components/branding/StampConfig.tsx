'use client';

import type { StampConfig as StampConfigType } from '@tapandstamp/core';
import { ColorPicker } from './ColorPicker';
import { getContrastStatus } from '../../lib/color-utils';
import styles from './StampConfig.module.css';

interface StampConfigProps {
  stamp: StampConfigType;
  backgroundColor: string;
  onChange: (updates: Partial<StampConfigType>) => void;
}

export function StampConfig({ stamp, backgroundColor, onChange }: StampConfigProps) {
  const filledContrast = getContrastStatus(stamp.filledColor, backgroundColor);
  const emptyContrast = getContrastStatus(stamp.emptyColor, backgroundColor);

  return (
    <div className={styles.container}>
      {/* Shape Selection */}
      <div className={styles.field}>
        <label className={styles.label}>Stamp Shape</label>
        <div className={styles.shapeSelector}>
          <button
            type="button"
            onClick={() => onChange({ shape: 'circle' })}
            className={`${styles.shapeButton} ${
              stamp.shape === 'circle' ? styles.active : ''
            }`}
          >
            <div className={styles.circlePreview} />
            Circle
          </button>
          <button
            type="button"
            onClick={() => onChange({ shape: 'square' })}
            className={`${styles.shapeButton} ${
              stamp.shape === 'square' ? styles.active : ''
            }`}
          >
            <div className={styles.squarePreview} />
            Square
          </button>
          <button
            type="button"
            onClick={() => onChange({ shape: 'logo' })}
            className={`${styles.shapeButton} ${
              stamp.shape === 'logo' ? styles.active : ''
            }`}
          >
            <div className={styles.logoPreview}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            Logo
          </button>
        </div>
      </div>

      {/* Filled Stamp Color */}
      <ColorPicker
        label="Filled Stamp Color"
        value={stamp.filledColor}
        onChange={(color) => onChange({ filledColor: color })}
        contrastCheck={{
          against: backgroundColor,
          status: filledContrast
        }}
      />

      {/* Empty Stamp Color */}
      <ColorPicker
        label="Empty Stamp Color"
        value={stamp.emptyColor}
        onChange={(color) => onChange({ emptyColor: color })}
        contrastCheck={{
          against: backgroundColor,
          status: emptyContrast
        }}
      />

      {/* Outline Color */}
      <ColorPicker
        label="Stamp Outline Color"
        value={stamp.outlineColor}
        onChange={(color) => onChange({ outlineColor: color })}
      />
    </div>
  );
}
