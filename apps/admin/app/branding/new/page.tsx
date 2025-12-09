'use client';

import { useState } from 'react';
import type { Branding } from '@tapandstamp/core';
import { LogoUpload } from '../../../components/branding/LogoUpload';
import { ColorPicker } from '../../../components/branding/ColorPicker';
import { StampConfig } from '../../../components/branding/StampConfig';
import { BrandingPreview } from '../../../components/branding/BrandingPreview';
import { getContrastStatus } from '../../../lib/color-utils';
import styles from './page.module.css';

export default function NewBrandingPage() {
  const [merchantName, setMerchantName] = useState('');
  const [merchantSlug, setMerchantSlug] = useState('');
  const [rewardGoal, setRewardGoal] = useState(8);
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

  // Check contrast between label color and background
  const labelContrast = getContrastStatus(
    branding.labelColor,
    branding.background.color
  );

  // Check contrast between filled stamp and background
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

    // Validation
    if (!merchantName.trim()) {
      setError('Merchant name is required');
      return;
    }

    if (!merchantSlug.trim()) {
      setError('Merchant slug is required');
      return;
    }

    if (!branding.logoUrl) {
      setError('Logo is required');
      return;
    }

    if (!labelContrast.AA) {
      setError('Label color contrast is too low - please adjust colors');
      return;
    }

    setSaving(true);

    try {
      // TODO: Implement API call to save merchant and branding
      const response = await fetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: merchantName,
          slug: merchantSlug,
          rewardGoal,
          branding
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save merchant');
      }

      const result = await response.json();
      console.log('Merchant created:', result);

      // TODO: Redirect to merchant dashboard or success page
      alert('Merchant created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Create Merchant Branding</h1>
        <p>Set up your loyalty card branding for Apple and Google Wallet</p>
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
              <label htmlFor="merchant-slug">
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
                className={styles.input}
              />
              <small>Used in QR code URLs: /add/{merchantSlug || 'your-slug'}</small>
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
            <h2>Logo</h2>
            <LogoUpload
              currentUrl={branding.logoUrl}
              onUpload={(url) => updateBranding({ logoUrl: url })}
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
            {error && <div className={styles.error}>{error}</div>}
            <button
              onClick={handleSave}
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? 'Saving...' : 'Save & Generate Assets'}
            </button>
          </section>
        </div>

        {/* Live Preview */}
        <div className={styles.preview}>
          <BrandingPreview branding={branding} count={3} merchantName={merchantName || 'Your Cafe'} />
        </div>
      </div>
    </div>
  );
}
