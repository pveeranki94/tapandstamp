'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { StampCardDisplay } from '../../../components/card/StampCardDisplay';
import { AddToHomeScreen } from '../../../components/card/AddToHomeScreen';
import type { Branding } from '@tapandstamp/core';
import styles from './page.module.css';
import './card.css';

interface CardData {
  member: {
    id: string;
    stampCount: number;
    rewardAvailable: boolean;
    lastStampAt: string | null;
    createdAt: string;
  };
  merchant: {
    id: string;
    slug: string;
    name: string;
    rewardGoal: number;
    branding: Branding;
    brandingVersion: number;
    stampQrUrl: string;
  };
}

type MessageType = 'success' | 'error' | 'info';

export default function StampCardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const memberId = params.memberId as string;

  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: MessageType; text: string } | undefined>();
  const [isRedeeming, setIsRedeeming] = useState(false);

  const fetchCardData = useCallback(async () => {
    try {
      const response = await fetch(`/api/card/${memberId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Card not found');
        }
        throw new Error('Failed to load card');
      }
      const data: CardData = await response.json();
      setCardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load card');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchCardData();
  }, [fetchCardData]);

  // Handle URL params for messages
  useEffect(() => {
    const stamped = searchParams.get('stamped');
    const errorType = searchParams.get('error');
    const remaining = searchParams.get('remaining');

    if (stamped === 'true') {
      setMessage({ type: 'success', text: '✓ Stamp collected!' });
      // Clear message after 5 seconds
      const timer = setTimeout(() => setMessage(undefined), 5000);
      return () => clearTimeout(timer);
    }

    if (errorType === 'cooldown' && remaining) {
      const mins = Math.floor(Number(remaining) / 60);
      const secs = Number(remaining) % 60;
      const timeText = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      setMessage({
        type: 'error',
        text: `Please wait ${timeText} before your next stamp`
      });
    }

    if (errorType === 'reward_pending') {
      setMessage({
        type: 'info',
        text: 'Redeem your reward first before collecting more stamps'
      });
    }
  }, [searchParams]);

  const handleRedeem = async () => {
    if (!cardData || isRedeeming) return;

    setIsRedeeming(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/redeem/${memberId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        const data: { message?: string } = await response.json();
        throw new Error(data.message || 'Failed to redeem');
      }

      setMessage({ type: 'success', text: '🎉 Reward redeemed! Enjoy!' });
      // Refresh card data
      await fetchCardData();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to redeem reward'
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your stamp card...</p>
        </div>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1>😕</h1>
          <p>{error || 'Card not found'}</p>
          <p className={styles.errorHint}>
            Please scan the Join QR code to get a new stamp card
          </p>
        </div>
      </div>
    );
  }

  const { member, merchant } = cardData;

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <StampCardDisplay
          merchantName={merchant.name}
          stampCount={member.stampCount}
          rewardGoal={merchant.rewardGoal}
          rewardAvailable={member.rewardAvailable}
          branding={merchant.branding}
          stampQrUrl={merchant.stampQrUrl}
          message={message}
          onRedeem={handleRedeem}
          isRedeeming={isRedeeming}
        />
      </main>

      <AddToHomeScreen />

      <footer className={styles.footer}>
        <p>Powered by Tap & Stamp</p>
      </footer>
    </div>
  );
}
