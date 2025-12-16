'use client';

import { useState } from 'react';

interface AddToAppleWalletProps {
  memberId: string;
  merchantName?: string;
}

export function AddToAppleWallet({ memberId, merchantName }: AddToAppleWalletProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToWallet = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Trigger download of the .pkpass file
      const response = await fetch(`/api/passes/${memberId}`);

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Apple Wallet is not available yet');
        }
        throw new Error('Failed to generate pass');
      }

      // Get the blob and create a download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${merchantName || 'loyalty'}-card.pkpass`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-to-wallet-container">
      <button
        onClick={handleAddToWallet}
        disabled={isLoading}
        className="add-to-wallet-button"
        aria-label="Add to Apple Wallet"
      >
        {isLoading ? (
          <span className="loading-text">Adding...</span>
        ) : (
          <>
            <AppleWalletIcon />
            <span>Add to Apple Wallet</span>
          </>
        )}
      </button>
      {error && <p className="wallet-error">{error}</p>}
      <style jsx>{`
        .add-to-wallet-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin: 16px 0;
        }

        .add-to-wallet-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background-color: #000;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 220px;
          height: 48px;
        }

        .add-to-wallet-button:hover:not(:disabled) {
          background-color: #333;
          transform: translateY(-1px);
        }

        .add-to-wallet-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .add-to-wallet-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-text {
          font-size: 16px;
        }

        .wallet-error {
          color: #dc2626;
          font-size: 14px;
          margin: 0;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

function AppleWalletIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" fill="#fff" />
      <rect x="3" y="4" width="18" height="4" fill="#FF3B30" />
      <rect x="3" y="8" width="18" height="4" fill="#FF9500" />
      <rect x="3" y="12" width="18" height="4" fill="#4CD964" />
      <rect x="3" y="16" width="18" height="4" rx="0 0 2 2" fill="#007AFF" />
    </svg>
  );
}
