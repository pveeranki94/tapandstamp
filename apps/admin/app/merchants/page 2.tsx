'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/ui/button';
import { Plus, ChevronRight } from 'lucide-react';

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
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading merchants...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-16 text-center">
          <div className="bg-destructive/10 text-destructive rounded-lg p-8">
            <h2 className="text-xl font-medium mb-2">Error</h2>
            <p className="mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-medium mb-2">Merchants</h1>
            <p className="text-muted-foreground">Manage your merchant configurations</p>
          </div>
          <Button asChild>
            <Link href="/branding/new">
              <Plus className="w-4 h-4 mr-2" />
              New Merchant
            </Link>
          </Button>
        </div>

        {merchants.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium mb-2">No merchants yet</h2>
            <p className="text-muted-foreground mb-6">Create your first merchant to get started</p>
            <Button asChild>
              <Link href="/branding/new">Create Merchant</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {merchants.map((merchant) => (
              <Link
                key={merchant.id}
                href={`/merchants/${merchant.id}`}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-foreground/20 transition-colors group"
              >
                {merchant.logoUrl ? (
                  <img
                    src={merchant.logoUrl}
                    alt={merchant.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-medium text-lg"
                    style={{ backgroundColor: merchant.primaryColor || '#6366f1' }}
                  >
                    {merchant.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{merchant.name}</h3>
                  <p className="text-sm text-muted-foreground">/{merchant.slug}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="bg-muted px-2 py-1 rounded">{merchant.rewardGoal} stamps</span>
                  <span>v{merchant.brandingVersion}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
