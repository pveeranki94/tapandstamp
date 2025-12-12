'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface MerchantSummary {
  id: string;
  slug: string;
  name: string;
  rewardGoal: number;
  brandingVersion: number;
  logoUrl?: string;
  primaryColor?: string;
  createdAt: string;
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<MerchantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMerchants() {
      try {
        const response = await fetch('/api/merchants');
        if (!response.ok) {
          throw new Error('Failed to fetch merchants');
        }
        const data = await response.json();
        setMerchants(data.merchants);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load merchants');
      } finally {
        setLoading(false);
      }
    }

    fetchMerchants();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading merchants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <Link href="/" className={styles.backLink}>
              ← Back to Dashboard
            </Link>
            <h1>Manage Merchants</h1>
            <p>View and edit your merchant configurations</p>
          </div>
          <Link href="/branding/new" className={styles.createButton}>
            + New Merchant
          </Link>
        </div>
      </header>

      {merchants.length === 0 ? (
        <div className={styles.empty}>
          <h2>No merchants yet</h2>
          <p>Create your first merchant to get started</p>
          <Link href="/branding/new" className={styles.createButton}>
            Create Merchant
          </Link>
        </div>
      ) : (
        <div className={styles.merchantList}>
          {merchants.map((merchant) => (
            <Link
              key={merchant.id}
              href={`/merchants/${merchant.id}`}
              className={styles.merchantCard}
            >
              <div className={styles.merchantInfo}>
                {merchant.logoUrl ? (
                  <img
                    src={merchant.logoUrl}
                    alt={merchant.name}
                    className={styles.merchantLogo}
                  />
                ) : (
                  <div
                    className={styles.merchantLogoPlaceholder}
                    style={{ backgroundColor: merchant.primaryColor || '#6366f1' }}
                  >
                    {merchant.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={styles.merchantDetails}>
                  <h3>{merchant.name}</h3>
                  <p className={styles.merchantSlug}>/{merchant.slug}</p>
                </div>
              </div>
              <div className={styles.merchantMeta}>
                <span className={styles.rewardGoal}>
                  {merchant.rewardGoal} stamps
                </span>
                <span className={styles.version}>
                  v{merchant.brandingVersion}
                </span>
              </div>
              <span className={styles.editArrow}>→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
