'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Branding } from '@tapandstamp/core';
import { LogoUpload, type LogoData } from '../../../components/branding/LogoUpload';
import { ColorPicker } from '../../../components/branding/ColorPicker';
import { StampConfig } from '../../../components/branding/StampConfig';
import { StampCardDisplay } from '../../../components/card/StampCardDisplay';
import { getContrastStatus } from '../../../lib/color-utils';
import { generateJoinQR } from '../../../lib/qrcode';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Download, QrCode } from 'lucide-react';
import '../../card/[memberId]/card.css';

interface MerchantData {
  id: string;
  slug: string;
  name: string;
  rewardGoal: number;
  branding: Branding;
  brandingVersion: number;
  joinQrUrl: string;
  stampQrUrl: string;
  createdAt: string;
}

export default function EditMerchantPage() {
  const params = useParams();
  const merchantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [merchantName, setMerchantName] = useState('');
  const [merchantSlug, setMerchantSlug] = useState('');
  const [rewardGoal, setRewardGoal] = useState(8);
  const [logoData, setLogoData] = useState<LogoData | null>(null);
  const [headerLogoData, setHeaderLogoData] = useState<LogoData | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [previewStampCount, setPreviewStampCount] = useState(3);
  const [joinQR, setJoinQR] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMerchant() {
      try {
        const response = await fetch(`/api/merchants/id/${merchantId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Merchant not found');
          } else {
            throw new Error('Failed to fetch merchant');
          }
          return;
        }
        const data: MerchantData = await response.json();
        setMerchantName(data.name);
        setMerchantSlug(data.slug);
        setRewardGoal(data.rewardGoal);
        setBranding(data.branding);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load merchant');
      } finally {
        setLoading(false);
      }
    }

    fetchMerchant();
  }, [merchantId]);

  // Generate QR code when merchantSlug is available
  useEffect(() => {
    if (!merchantSlug) return;

    const generateQR = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
        const qr = await generateJoinQR(baseUrl, merchantSlug);
        setJoinQR(qr);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };

    generateQR();
  }, [merchantSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading merchant...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !branding) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-16 text-center">
          <div className="bg-destructive/10 text-destructive rounded-lg p-8">
            <h2 className="text-xl font-medium mb-2">Error</h2>
            <p className="mb-4">{error}</p>
            <Button asChild variant="outline">
              <Link href="/merchants">Back to Merchants</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!branding) {
    return null;
  }

  const labelContrast = getContrastStatus(
    branding.labelColor,
    branding.background.color
  );

  const updateBranding = (updates: Partial<Branding>) => {
    setBranding((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const updateStamp = (updates: Partial<Branding['stamp']>) => {
    setBranding((prev) =>
      prev ? { ...prev, stamp: { ...prev.stamp, ...updates } } : prev
    );
  };

  const updateBackground = (updates: Partial<Branding['background']>) => {
    setBranding((prev) =>
      prev ? { ...prev, background: { ...prev.background, ...updates } } : prev
    );
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (!merchantName.trim()) {
      setError('Merchant name is required');
      return;
    }

    if (!labelContrast.AA) {
      setError('Label color contrast is too low - please adjust colors');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/merchants/id/${merchantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: merchantName,
          rewardGoal,
          branding,
          logoData: logoData ? {
            base64: logoData.base64,
            contentType: logoData.contentType
          } : undefined,
          headerLogoData: headerLogoData ? {
            base64: headerLogoData.base64,
            contentType: headerLogoData.contentType
          } : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update merchant');
      }

      setSuccess('Merchant updated successfully!');
      setLogoData(null);
      setHeaderLogoData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-medium mb-1">Edit {merchantName}</h1>
          <p className="text-muted-foreground">/{merchantSlug}</p>
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
                  <label className="block text-sm font-medium mb-1.5">Slug</label>
                  <input
                    type="text"
                    value={merchantSlug}
                    disabled
                    className="w-full px-3 py-2 bg-muted border border-input rounded-md text-sm text-muted-foreground cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Slug cannot be changed after creation
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

            {/* QR Codes */}
            <section className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-medium">QR Codes</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Download QR codes to print and display at your location.
              </p>

              <div className="space-y-4">
                {/* Join QR */}
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  {joinQR ? (
                    <img
                      src={joinQR}
                      alt="Join QR Code"
                      className="w-24 h-24 rounded-lg border border-border bg-white"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg border border-border bg-muted flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1">Join QR Code</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Customers scan this to add your loyalty card to their wallet.
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mb-3 truncate">
                      {process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/add/{merchantSlug}
                    </p>
                    {joinQR && (
                      <Button asChild variant="outline" size="sm">
                        <a href={joinQR} download={`${merchantSlug}-join-qr.png`}>
                          <Download className="w-4 h-4 mr-2" />
                          Download QR
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-primary/10 text-primary text-sm rounded-md p-3">
                  {success}
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 text-base font-medium"
              >
                {saving ? 'Saving...' : 'Save Changes'}
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
