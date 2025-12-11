'use client';

import { useState } from 'react';
import type { Branding } from '@tapandstamp/core';
import styles from './BrandingPreview.module.css';

interface BrandingPreviewProps {
  branding: Branding;
  count: number;
  merchantName: string;
}

export function BrandingPreview({ branding, count, merchantName }: BrandingPreviewProps) {
  const [previewCount, setPreviewCount] = useState(count);
  const [platform, setPlatform] = useState<'apple' | 'google'>('apple');

  const { stamp, background, labelColor } = branding;

  // Calculate dimensions for preview (scaled down)
  const scale = 0.4;
  const dimensions = {
    apple: { width: 1125 * scale, height: 432 * scale },
    google: { width: 1032 * scale, height: 336 * scale }
  };
  const { width, height } = dimensions[platform];

  // Render stamps
  const renderStamps = () => {
    const stamps = [];
    const stampSize = 40;
    const spacing = 8;
    const totalWidth = stamp.total * stampSize + (stamp.total - 1) * spacing;
    const startX = (width - totalWidth) / 2;
    const startY = 20;

    for (let i = 0; i < stamp.total; i++) {
      const x = startX + i * (stampSize + spacing);
      const isFilled = i < previewCount;

      // For logo shape, render the logo with opacity
      if (stamp.shape === 'logo' && branding.logoUrl) {
        stamps.push(
          <div
            key={i}
            className={`${styles.stamp} ${styles.logoStamp} ${isFilled ? styles.logoStampFilled : ''}`}
            style={{
              left: x,
              top: startY,
              width: stampSize,
              height: stampSize,
            }}
          >
            <img
              src={branding.logoUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: isFilled ? 1 : 0.2,
                filter: isFilled ? 'none' : 'grayscale(100%)',
                transition: 'opacity 0.3s, filter 0.3s'
              }}
            />
          </div>
        );
      } else {
        stamps.push(
          <div
            key={i}
            className={styles.stamp}
            style={{
              left: x,
              top: startY,
              width: stampSize,
              height: stampSize,
              backgroundColor: isFilled ? stamp.filledColor : stamp.emptyColor,
              border: `2px solid ${stamp.outlineColor}`,
              borderRadius: stamp.shape === 'circle' ? '50%' : '4px'
            }}
          />
        );
      }
    }

    return stamps;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Live Preview</h3>
        <div className={styles.platformToggle}>
          <button
            onClick={() => setPlatform('apple')}
            className={platform === 'apple' ? styles.active : ''}
          >
            Apple
          </button>
          <button
            onClick={() => setPlatform('google')}
            className={platform === 'google' ? styles.active : ''}
          >
            Google
          </button>
        </div>
      </div>

      <div className={styles.preview}>
        <div
          className={styles.card}
          style={{
            width,
            height,
            backgroundColor: background.color,
            backgroundImage:
              background.type === 'image' && background.imageUrl
                ? `url(${background.imageUrl})`
                : undefined
          }}
        >
          {/* Logo */}
          {branding.logoUrl && (
            <div className={styles.logo}>
              <img src={branding.logoUrl} alt="Logo" />
            </div>
          )}

          {/* Merchant Name */}
          <div
            className={styles.merchantName}
            style={{ color: labelColor }}
          >
            {merchantName}
          </div>

          {/* Stamps */}
          <div className={styles.stamps}>{renderStamps()}</div>

          {/* Count Text */}
          <div
            className={styles.countText}
            style={{ color: labelColor }}
          >
            {previewCount} / {stamp.total}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <label className={styles.controlLabel}>
          Preview Stamp Count: {previewCount}
        </label>
        <input
          type="range"
          min={0}
          max={stamp.total}
          value={previewCount}
          onChange={(e) => setPreviewCount(parseInt(e.target.value, 10))}
          className={styles.slider}
        />
      </div>

      <div className={styles.info}>
        <p>
          <strong>Platform:</strong> {platform === 'apple' ? 'Apple Wallet' : 'Google Wallet'}
        </p>
        <p>
          <strong>Dimensions:</strong>{' '}
          {platform === 'apple' ? '1125×432px' : '1032×336px'}
        </p>
      </div>
    </div>
  );
}
