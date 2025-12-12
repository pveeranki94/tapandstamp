'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getContrastTextColor } from '../../../lib/color-utils';
import styles from './page.module.css';

interface MerchantInfo {
  id: string;
  name: string;
  slug: string;
  branding: {
    logoUrl?: string;
    primaryColor: string;
    labelColor: string;
    background: { color: string };
  };
}

export default function JoinPage() {
  const params = useParams();
  const merchantSlug = params.merchantSlug as string;

  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMerchant() {
      try {
        const response = await fetch(`/api/merchants/${merchantSlug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('This loyalty program was not found');
          } else {
            setError('Failed to load loyalty program');
          }
          return;
        }
        const data = await response.json();
        setMerchant(data);
      } catch {
        setError('Failed to load loyalty program');
      } finally {
        setLoading(false);
      }
    }

    fetchMerchant();
  }, [merchantSlug]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joining) return;

    setJoining(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const params = new URLSearchParams();
      if (name.trim()) params.set('name', name.trim());
      if (email.trim()) params.set('email', email.trim());
      const queryString = params.toString() ? `?${params.toString()}` : '';

      // Navigate to API which will create member and redirect to card
      window.location.href = `${apiBaseUrl}/add/${merchantSlug}${queryString}`;
    } catch {
      setError('Failed to join. Please try again.');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !merchant) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1>Oops!</h1>
          <p>{error || 'Something went wrong'}</p>
        </div>
      </div>
    );
  }

  const { branding } = merchant;
  const buttonTextColor = getContrastTextColor(branding.primaryColor);

  return (
    <div
      className={styles.container}
      style={{ backgroundColor: branding.background.color }}
    >
      <div className={styles.card}>
        {branding.logoUrl && (
          <img
            src={branding.logoUrl}
            alt={merchant.name}
            className={styles.logo}
          />
        )}

        <h1 className={styles.title} style={{ color: branding.labelColor }}>
          Join {merchant.name}
        </h1>

        <p className={styles.subtitle} style={{ color: branding.labelColor }}>
          Start collecting stamps and earn rewards!
        </p>

        <form onSubmit={handleJoin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label} style={{ color: branding.labelColor }}>
              Your Name (optional)
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className={styles.input}
              maxLength={50}
              autoComplete="name"
            />
            <p className={styles.hint} style={{ color: branding.labelColor }}>
              This will appear on your stamp card
            </p>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label} style={{ color: branding.labelColor }}>
              Email (optional)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={styles.input}
              maxLength={100}
              autoComplete="email"
            />
            <p className={styles.hint} style={{ color: branding.labelColor }}>
              Receive news and updates from {merchant.name}
            </p>
          </div>

          <button
            type="submit"
            disabled={joining}
            className={styles.joinButton}
            style={{ backgroundColor: branding.primaryColor, color: buttonTextColor }}
          >
            {joining ? 'Joining...' : 'Get My Stamp Card'}
          </button>
        </form>
      </div>

      <footer className={styles.footer} style={{ color: branding.labelColor }}>
        Powered by Tap & Stamp
      </footer>
    </div>
  );
}
