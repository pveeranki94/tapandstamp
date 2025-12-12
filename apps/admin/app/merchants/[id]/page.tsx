'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Branding } from '@tapandstamp/core';
import { LogoUpload, type LogoData } from '../../../components/branding/LogoUpload';
import { ColorPicker } from '../../../components/branding/ColorPicker';
import { StampConfig } from '../../../components/branding/StampConfig';
import { StampCardDisplay } from '../../../components/card/StampCardDisplay';
import { getContrastStatus } from '../../../lib/color-utils';
import styles from './page.module.css';
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
  const router = useRouter();
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading merchant...</p>
        </div>
      </div>
    );
  }

  if (error && !branding) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <Link href="/merchants" className={styles.backButton}>
            Back to Merchants
          </Link>
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
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/merchants" className={styles.backLink}>
          ← Back to Merchants
        </Link>
        <h1>Edit {merchantName}</h1>
        <p className={styles.slug}>/{merchantSlug}</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.form}>
          {/* Merchant Details */}
          <section className={styles.section}>
            <h2>Merchant Details</h2>
            <div className={styles.field}>
              <label htmlFor="merchant-name">Merchant Name</label>
              <input
                id="merchant-name"
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="e.g., Coffee House"
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label>Slug</label>
              <input
                type="text"
                value={merchantSlug}
                disabled
                className={styles.input + ' ' + styles.disabled}
              />
              <small>Slug cannot be changed after creation</small>
            </div>

            <div className={styles.field}>
              <label htmlFor="reward-goal">Stamps Required for Reward</label>
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
                className={styles.input}
              />
            </div>
          </section>

          {/* Logo Upload */}
          <section className={styles.section}>
            <h2>Stamp Logo</h2>
            <p className={styles.fieldHint}>
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

          {/* Header Logo Upload (Optional) */}
          <section className={styles.section}>
            <h2>Header Logo (Optional)</h2>
            <p className={styles.fieldHint}>
              Displayed at the top left of the stamp card. If not provided, the merchant name will be shown instead.
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
          <section className={styles.section}>
            <h2>Colors</h2>

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
          </section>

          {/* Stamp Configuration */}
          <section className={styles.section}>
            <h2>Stamp Settings</h2>
            <StampConfig
              stamp={branding.stamp}
              backgroundColor={branding.background.color}
              onChange={updateStamp}
            />
          </section>

          {/* Actions */}
          <section className={styles.actions}>
            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>{success}</div>}
            <button
              onClick={handleSave}
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </section>
        </div>

        {/* Live Preview */}
        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <h3>Live Preview</h3>
          </div>
          <div className={styles.previewCard}>
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
          <div className={styles.previewControls}>
            <label className={styles.controlLabel}>
              Preview Stamps: {previewStampCount} / {rewardGoal}
            </label>
            <input
              type="range"
              min={0}
              max={rewardGoal}
              value={previewStampCount}
              onChange={(e) => setPreviewStampCount(parseInt(e.target.value, 10))}
              className={styles.slider}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
