'use client';

import { useState } from 'react';
import type { Branding } from '@tapandstamp/core';
import { LogoUpload, type LogoData } from '../../../components/branding/LogoUpload';
import { ColorPicker } from '../../../components/branding/ColorPicker';
import { StampConfig } from '../../../components/branding/StampConfig';
import { StampCardDisplay } from '../../../components/card/StampCardDisplay';
import { getContrastStatus } from '../../../lib/color-utils';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { Button } from '../../../components/ui/button';
import '../../../app/card/[memberId]/card.css';

export default function NewBrandingPage() {
  const [merchantName, setMerchantName] = useState('');
  const [merchantSlug, setMerchantSlug] = useState('');
  const [rewardGoal, setRewardGoal] = useState(8);
  const [logoData, setLogoData] = useState<LogoData | null>(null);
  const [headerLogoData, setHeaderLogoData] = useState<LogoData | null>(null);
  const [branding, setBranding] = useState<Branding>({
    logoUrl: '',
    primaryColor: '#6B4A3A',
    secondaryColor: '#E8D9CF',
    labelColor: '#FFFFFF',
    background: {
      type: 'solid',
      color: '#6B4A3A'
    },
    stamp: {
      total: 8,
      shape: 'circle',
      filledColor: '#FFFFFF',
      emptyColor: '#E8D9CF',
      outlineColor: '#FFFFFF',
      overlayLogo: false
    }
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewStampCount, setPreviewStampCount] = useState(3);

  const labelContrast = getContrastStatus(
    branding.labelColor,
    branding.background.color
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const stampContrast = getContrastStatus(
    branding.stamp.filledColor,
    branding.background.color
  );

  const updateBranding = (updates: Partial<Branding>) => {
    setBranding((prev) => ({ ...prev, ...updates }));
  };

  const updateStamp = (updates: Partial<Branding['stamp']>) => {
    setBranding((prev) => ({
      ...prev,
      stamp: { ...prev.stamp, ...updates }
    }));
  };

  const updateBackground = (updates: Partial<Branding['background']>) => {
    setBranding((prev) => ({
      ...prev,
      background: { ...prev.background, ...updates }
    }));
  };

  const handleSave = async () => {
    setError(null);

    if (!merchantName.trim()) {
      setError('Merchant name is required');
      return;
    }

    if (!merchantSlug.trim()) {
      setError('Merchant slug is required');
      return;
    }

    if (!logoData) {
      setError('Logo is required');
      return;
    }

    if (!labelContrast.AA) {
      setError('Label color contrast is too low - please adjust colors');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: merchantName,
          slug: merchantSlug,
          rewardGoal,
          branding,
          logoData: {
            base64: logoData.base64,
            contentType: logoData.contentType
          },
          headerLogoData: headerLogoData ? {
            base64: headerLogoData.base64,
            contentType: headerLogoData.contentType
          } : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save merchant');
      }

      const result = await response.json();
      window.location.href = `/branding/success?merchantId=${result.merchantId}&slug=${result.slug}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-medium mb-2">Create Loyalty Card</h1>
          <p className="text-muted-foreground">Set up your branded loyalty card for Apple and Google Wallet</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-8">
            {/* Merchant Details */}
            <section className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Merchant Details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="merchant-name" className="block text-sm font-medium mb-1.5">
                    Merchant Name
                  </label>
                  <input
                    id="merchant-name"
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="e.g., Coffee House"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label htmlFor="merchant-slug" className="block text-sm font-medium mb-1.5">
                    Slug (URL-friendly identifier)
                  </label>
                  <input
                    id="merchant-slug"
                    type="text"
                    value={merchantSlug}
                    onChange={(e) =>
                      setMerchantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    }
                    placeholder="e.g., coffee-house"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Used in QR code URLs: /add/{merchantSlug || 'your-slug'}
                  </p>
                </div>

                <div>
                  <label htmlFor="reward-goal" className="block text-sm font-medium mb-1.5">
                    Stamps Required for Reward
                  </label>
                  <input
                    id="reward-goal"
                    type="number"
                    min={3}
                    max={15}
                    value={rewardGoal}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setRewardGoal(val);
                      updateStamp({ total: val });
                    }}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </section>

            {/* Logo Upload */}
            <section className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-medium mb-2">Stamp Logo</h2>
              <p className="text-sm text-muted-foreground mb-4">
                This logo is used for stamp shapes and wallet pass icons.
              </p>
              <LogoUpload
                currentUrl={branding.logoUrl}
                onUpload={(url, data) => {
                  updateBranding({ logoUrl: url });
                  if (data) {
                    setLogoData(data);
                  }
                }}
              />
            </section>

            {/* Header Logo Upload */}
            <section className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-medium mb-2">Header Logo (Optional)</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Displayed at the top left of the stamp card. If not provided, the merchant name will be shown.
              </p>
              <LogoUpload
                currentUrl={branding.headerLogoUrl || ''}
                onUpload={(url, data) => {
                  updateBranding({ headerLogoUrl: url || undefined });
                  if (data) {
                    setHeaderLogoData(data);
                  }
                }}
              />
            </section>

            {/* Colors */}
            <section className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Colors</h2>
              <div className="space-y-4">
                <ColorPicker
                  label="Primary Color (Background)"
                  value={branding.primaryColor}
                  onChange={(color) => {
                    updateBranding({ primaryColor: color });
                    updateBackground({ color });
                  }}
                />
                <ColorPicker
                  label="Secondary Color"
                  value={branding.secondaryColor}
                  onChange={(color) => updateBranding({ secondaryColor: color })}
                />
                <ColorPicker
                  label="Label Color (Text)"
                  value={branding.labelColor}
                  onChange={(color) => updateBranding({ labelColor: color })}
                  contrastCheck={{
                    against: branding.background.color,
                    status: labelContrast
                  }}
                />
              </div>
            </section>

            {/* Stamp Configuration */}
            <section className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Stamp Settings</h2>
              <StampConfig
                stamp={branding.stamp}
                backgroundColor={branding.background.color}
                onChange={updateStamp}
              />
            </section>

            {/* Actions */}
            <div className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                  {error}
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 text-base font-medium"
              >
                {saving ? 'Saving...' : 'Save & Generate Assets'}
              </Button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Live Preview</h3>
              <div className="flex justify-center mb-6">
                <StampCardDisplay
                  merchantName={merchantName || 'Your Cafe'}
                  memberName="Jane Doe"
                  stampCount={previewStampCount}
                  rewardGoal={rewardGoal}
                  rewardAvailable={previewStampCount >= rewardGoal}
                  branding={branding}
                  rewardMessage={`Buy ${rewardGoal} coffees, get your next on us.`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Preview Stamps: {previewStampCount} / {rewardGoal}
                </label>
                <input
                  type="range"
                  min={0}
                  max={rewardGoal}
                  value={previewStampCount}
                  onChange={(e) => setPreviewStampCount(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
