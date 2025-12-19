'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Gift, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface StampResult {
  success: boolean;
  stampCount: number;
  rewardGoal: number;
  rewardReady: boolean;
  memberName: string | null;
  merchantName: string;
  error?: string;
  cooldownRemaining?: number;
}

type PageState = 'loading' | 'stamping' | 'success' | 'reward_ready' | 'claimed' | 'cooldown' | 'error';

export default function StampPage() {
  const params = useParams();
  const memberId = params.memberId as string;

  const [state, setState] = useState<PageState>('loading');
  const [result, setResult] = useState<StampResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  const performStamp = useCallback(async () => {
    setState('stamping');
    try {
      const response = await fetch(`/api/stamp/${memberId}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'cooldown') {
          setResult(data);
          setState('cooldown');
        } else if (data.error === 'reward_pending') {
          setResult(data);
          setState('reward_ready');
        } else if (response.status === 403) {
          setError('You can only stamp cards for your own merchants.');
          setState('error');
        } else {
          setError(data.error || 'Failed to stamp card');
          setState('error');
        }
        return;
      }

      setResult(data);
      setState(data.rewardReady ? 'reward_ready' : 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stamp card');
      setState('error');
    }
  }, [memberId]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const response = await fetch(`/api/claim/${memberId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to claim reward');
        setState('error');
        return;
      }

      const data = await response.json();
      setResult(prev => prev ? { ...prev, ...data, stampCount: 0, rewardReady: false } : null);
      setState('claimed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim reward');
      setState('error');
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    // First fetch member data to check current state
    const checkMemberState = async () => {
      try {
        const response = await fetch(`/api/stamp/${memberId}`);
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 403) {
            setError('You can only stamp cards for your own merchants.');
            setState('error');
          } else {
            setError(data.error || 'Failed to load member data');
            setState('error');
          }
          return;
        }

        setResult(data);

        // If reward is already ready, show claim screen
        if (data.rewardReady) {
          setState('reward_ready');
        } else {
          // Otherwise, perform the stamp
          performStamp();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load member data');
        setState('error');
      }
    };

    checkMemberState();
  }, [memberId, performStamp]);

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Loading State */}
        {state === 'loading' && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}

        {/* Stamping State */}
        {state === 'stamping' && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-lg font-medium">Adding stamp...</p>
          </div>
        )}

        {/* Success State - Got a stamp */}
        {state === 'success' && result && (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-medium mb-2">Stamp Added!</h1>
            <p className="text-lg text-muted-foreground mb-6">
              <span className="font-medium text-foreground">{result.memberName || 'Customer'}</span> got their{' '}
              <span className="font-medium text-primary">{getOrdinal(result.stampCount)}</span> stamp
            </p>
            <div className="bg-muted rounded-lg p-4 mb-6">
              <div className="text-3xl font-bold text-primary mb-1">
                {result.stampCount} / {result.rewardGoal}
              </div>
              <p className="text-sm text-muted-foreground">stamps collected</p>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {result.rewardGoal - result.stampCount} more stamp{result.rewardGoal - result.stampCount !== 1 ? 's' : ''} until reward
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        )}

        {/* Reward Ready State */}
        {state === 'reward_ready' && result && (
          <div className="bg-card border-2 border-primary rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gift className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-medium mb-2">Reward Ready!</h1>
            <p className="text-lg text-muted-foreground mb-6">
              <span className="font-medium text-foreground">{result.memberName || 'Customer'}</span> is ready to claim their reward
            </p>
            <div className="bg-primary/10 rounded-lg p-4 mb-6">
              <div className="text-3xl font-bold text-primary mb-1">
                {result.stampCount} / {result.rewardGoal}
              </div>
              <p className="text-sm text-primary">All stamps collected!</p>
            </div>
            <Button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full h-12 text-base font-medium mb-3"
            >
              {claiming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Claiming...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Claim Reward
                </>
              )}
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        )}

        {/* Claimed State */}
        {state === 'claimed' && result && (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-medium mb-2">Reward Claimed!</h1>
            <p className="text-lg text-muted-foreground mb-6">
              <span className="font-medium text-foreground">{result.memberName || 'Customer'}</span>&apos;s card has been reset
            </p>
            <div className="bg-muted rounded-lg p-4 mb-6">
              <div className="text-3xl font-bold text-muted-foreground mb-1">
                0 / {result.rewardGoal}
              </div>
              <p className="text-sm text-muted-foreground">Ready to start collecting again</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        )}

        {/* Cooldown State */}
        {state === 'cooldown' && result && (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-medium mb-2">Please Wait</h1>
            <p className="text-lg text-muted-foreground mb-6">
              <span className="font-medium text-foreground">{result.memberName || 'Customer'}</span> recently received a stamp
            </p>
            <div className="bg-amber-50 rounded-lg p-4 mb-6">
              <div className="text-3xl font-bold text-amber-600 mb-1">
                {formatCooldown(result.cooldownRemaining || 0)}
              </div>
              <p className="text-sm text-amber-600">until next stamp allowed</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="bg-card border border-destructive/50 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-medium mb-2">Error</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
