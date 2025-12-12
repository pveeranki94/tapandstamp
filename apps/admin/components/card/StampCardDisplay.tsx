'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Branding } from '@tapandstamp/core';

interface StampCardDisplayProps {
  merchantName: string;
  memberName?: string | null;
  stampCount: number;
  rewardGoal: number;
  rewardAvailable: boolean;
  branding: Branding;
  stampQrUrl?: string;
  rewardMessage?: string;
  message?: {
    type: 'success' | 'error' | 'info';
    text: string;
  };
  onRedeem?: () => void;
  isRedeeming?: boolean;
}

export function StampCardDisplay({
  merchantName,
  memberName,
  stampCount,
  rewardGoal,
  rewardAvailable,
  branding,
  stampQrUrl,
  rewardMessage,
  message,
  onRedeem,
  isRedeeming
}: StampCardDisplayProps) {
  // Default values for branding properties
  const background = branding?.background || { color: '#FFFFFF' };
  const primaryColor = branding?.primaryColor || '#6366f1';
  const labelColor = branding?.labelColor || '#333333';
  const logoUrl = branding?.logoUrl;

  // Default stamp config if not provided
  const stamp = branding?.stamp || {
    shape: 'circle' as const,
    filledColor: '#4CAF50',
    emptyColor: '#E0E0E0',
    outlineColor: '#BDBDBD'
  };

  // Default reward message
  const defaultRewardMessage = `Buy ${rewardGoal} coffees, get your ${rewardGoal === 6 ? 'seventh' : 'next'} on us.`;

  // Generate QR code for cashier to scan
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (stampQrUrl) {
      QRCode.toDataURL(stampQrUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(setQrCodeDataUrl).catch(console.error);
    }
  }, [stampQrUrl]);

  return (
    <div
      className="stamp-card"
      style={{
        backgroundColor: background.color,
        backgroundImage: background.imageUrl ? `url(${background.imageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Header - logo or name on left, stamp count right */}
      <div className="stamp-card-header">
        {branding?.headerLogoUrl ? (
          <img
            src={branding.headerLogoUrl}
            alt={merchantName}
            className="stamp-card-header-logo"
          />
        ) : (
          <h1 className="stamp-card-title" style={{ color: labelColor }}>
            {merchantName}
          </h1>
        )}
        <div className="stamp-card-count" style={{ color: labelColor }}>
          <span className="stamp-card-count-label">STAMPS</span>
          <span className="stamp-card-count-value">{stampCount}</span>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`stamp-card-message stamp-card-message--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Stamp Grid - 2 rows × 3 columns with number labels */}
      <div className="stamp-grid">
        {Array.from({ length: rewardGoal }).map((_, index) => {
          const isFilled = index < stampCount;
          const stampNumber = index + 1;

          return (
            <div key={index} className="stamp-cell">
              <span className="stamp-number" style={{ color: labelColor }}>{stampNumber}</span>
              {/* Logo shape: render logo images with opacity transition */}
              {stamp.shape === 'logo' && logoUrl ? (
                <div
                  className={`stamp-slot stamp-slot--logo ${isFilled ? 'stamp-slot--logo-filled' : 'stamp-slot--logo-empty'}`}
                >
                  <img
                    src={logoUrl}
                    alt=""
                    className={`stamp-logo-img ${isFilled ? 'stamp-logo-img--filled' : 'stamp-logo-img--empty'}`}
                  />
                </div>
              ) : (
                /* Circle/Square shapes: render colored slots with checkmark */
                <div
                  className={`stamp-slot stamp-slot--${stamp.shape} ${isFilled ? 'stamp-slot--filled' : 'stamp-slot--empty'}`}
                  style={{
                    backgroundColor: isFilled ? stamp.filledColor : stamp.emptyColor,
                    borderColor: stamp.outlineColor
                  }}
                >
                  {isFilled && (
                    <svg viewBox="0 0 24 24" className="stamp-check">
                      <path
                        fill={labelColor}
                        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                      />
                    </svg>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tagline */}
      <p className="stamp-tagline" style={{ color: primaryColor }}>
        {rewardMessage || defaultRewardMessage}
      </p>

      {/* Member Name Section */}
      {memberName && (
        <div className="member-name-section">
          <span className="member-name-label" style={{ color: labelColor }}>NAME</span>
          <span className="member-name-value" style={{ color: labelColor }}>{memberName}</span>
        </div>
      )}

      {/* Reward Section */}
      {rewardAvailable && (
        <div className="reward-section">
          <div className="reward-banner">
            🎉 Reward Available!
          </div>
          <p className="reward-text" style={{ color: labelColor }}>
            Show this to the cashier to redeem your free drink
          </p>
          {onRedeem && (
            <button
              className="redeem-button"
              onClick={onRedeem}
              disabled={isRedeeming}
              style={{ backgroundColor: primaryColor }}
            >
              {isRedeeming ? 'Redeeming...' : 'Redeem Reward'}
            </button>
          )}
        </div>
      )}

      {/* Stamp QR Code - Show to cashier */}
      {stampQrUrl && !rewardAvailable && (
        <div className="stamp-qr-section">
          {qrCodeDataUrl && (
            <div className="stamp-qr-code">
              <img src={qrCodeDataUrl} alt="Scan to collect stamp" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
