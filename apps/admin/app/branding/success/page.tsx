'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { generateJoinQR, generateStampQR } from '../../../lib/qrcode';
import styles from './page.module.css';

function SuccessContent() {
  const searchParams = useSearchParams();
  const merchantId = searchParams.get('merchantId');
  const slug = searchParams.get('slug');

  const [joinQR, setJoinQR] = useState<string>('');
  const [stampQR, setStampQR] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const generateQRCodes = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const [joinCode, stampCode] = await Promise.all([
          generateJoinQR(baseUrl, slug),
          generateStampQR(baseUrl)
        ]);

        setJoinQR(joinCode);
        setStampQR(stampCode);
      } catch (error) {
        console.error('Failed to generate QR codes:', error);
      } finally {
        setLoading(false);
      }
    };

    generateQRCodes();
  }, [slug]);

  if (!merchantId || !slug) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1>Missing Information</h1>
          <p>Merchant ID or slug not provided. Please try creating a merchant again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.success}>
        <div className={styles.successIcon}>✓</div>
        <h1>Merchant Created Successfully!</h1>
        <p>Your loyalty card branding has been set up and all assets have been generated.</p>
      </div>

      <div className={styles.details}>
        <h2>Merchant Details</h2>
        <dl>
          <dt>Merchant ID:</dt>
          <dd><code>{merchantId}</code></dd>
          <dt>Slug:</dt>
          <dd><code>{slug}</code></dd>
          <dt>Join URL:</dt>
          <dd>
            <code>{process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/add/{slug}</code>
          </dd>
        </dl>
      </div>

      {loading ? (
        <div className={styles.loading}>Generating QR codes...</div>
      ) : (
        <div className={styles.qrCodes}>
          <div className={styles.qrCard}>
            <h3>Join QR Code</h3>
            <p>Customers scan this to add the loyalty card to their wallet</p>
            {joinQR && (
              <>
                <img src={joinQR} alt="Join QR Code" className={styles.qrImage} />
                <a
                  href={joinQR}
                  download={`${slug}-join-qr.png`}
                  className={styles.downloadButton}
                >
                  Download Join QR
                </a>
              </>
            )}
          </div>

          <div className={styles.qrCard}>
            <h3>Stamp QR Code (Template)</h3>
            <p>Each member will have their own unique stamp QR code</p>
            {stampQR && (
              <>
                <img src={stampQR} alt="Stamp QR Code" className={styles.qrImage} />
                <div className={styles.note}>
                  Note: This is a placeholder. Actual stamp QR codes will be generated per member.
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className={styles.nextSteps}>
        <h2>Next Steps</h2>
        <ol>
          <li>Download and print the Join QR code poster</li>
          <li>Display it prominently at your counter or entrance</li>
          <li>Test the flow by scanning with your own phone</li>
          <li>Monitor member signups in your dashboard (coming soon)</li>
        </ol>
      </div>

      <div className={styles.actions}>
        <a href="/" className={styles.homeButton}>
          Back to Home
        </a>
        <a href="/branding/new" className={styles.secondaryButton}>
          Create Another Merchant
        </a>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className={styles.container}>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
