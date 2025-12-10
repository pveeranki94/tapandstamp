'use client';

import type { Branding } from '@tapandstamp/core';

interface StampCardDisplayProps {
  merchantName: string;
  stampCount: number;
  rewardGoal: number;
  rewardAvailable: boolean;
  branding: Branding;
  stampQrUrl?: string;
  message?: {
    type: 'success' | 'error' | 'info';
    text: string;
  };
  onRedeem?: () => void;
  isRedeeming?: boolean;
}

export function StampCardDisplay({
  merchantName,
  stampCount,
  rewardGoal,
  rewardAvailable,
  branding,
  stampQrUrl,
  message,
  onRedeem,
  isRedeeming
}: StampCardDisplayProps) {
  const { stamp, background, primaryColor, labelColor, logoUrl } = branding;

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
      {/* Header */}
      <div className="stamp-card-header">
        {logoUrl && logoUrl.trim() !== '' && (
          <img src={logoUrl} alt={merchantName} className="stamp-card-logo" />
        )}
        <h1 className="stamp-card-title" style={{ color: labelColor }}>
          {merchantName}
        </h1>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`stamp-card-message stamp-card-message--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Stamp Grid */}
      <div className="stamp-grid">
        {Array.from({ length: rewardGoal }).map((_, index) => {
          const isFilled = index < stampCount;
          return (
            <div
              key={index}
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
          );
        })}
      </div>

      {/* Progress Text */}
      <p className="stamp-progress" style={{ color: labelColor }}>
        {stampCount} of {rewardGoal} stamps
      </p>

      {/* Reward Section */}
      {rewardAvailable ? (
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
      ) : (
        <div className="next-reward">
          <p style={{ color: labelColor }}>
            {rewardGoal - stampCount} more stamp{rewardGoal - stampCount !== 1 ? 's' : ''} until your free reward!
          </p>
        </div>
      )}

      {/* Stamp QR Instruction */}
      {stampQrUrl && !rewardAvailable && (
        <div className="stamp-instruction" style={{ color: labelColor }}>
          <p>Scan the QR code at the counter to collect stamps</p>
        </div>
      )}
    </div>
  );
}
