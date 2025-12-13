'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { generateJoinQR, generateStampQR } from '../../../lib/qrcode';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { Button } from '../../../components/ui/button';
import { CheckCircle, Download, ArrowRight } from 'lucide-react';

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
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-16 text-center">
          <div className="bg-destructive/10 text-destructive rounded-lg p-8">
            <h1 className="text-2xl font-medium mb-2">Missing Information</h1>
            <p className="text-muted-foreground">
              Merchant ID or slug not provided. Please try creating a merchant again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Success Banner */}
        <div className="bg-card border border-border rounded-lg p-8 text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-medium mb-2">Merchant Created Successfully!</h1>
          <p className="text-muted-foreground">
            Your loyalty card branding has been set up and all assets have been generated.
          </p>
        </div>

        {/* Merchant Details */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium mb-4">Merchant Details</h2>
          <dl className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="text-sm text-muted-foreground w-24">Merchant ID:</dt>
              <dd className="font-mono text-sm bg-muted px-2 py-1 rounded">{merchantId}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="text-sm text-muted-foreground w-24">Slug:</dt>
              <dd className="font-mono text-sm bg-muted px-2 py-1 rounded">{slug}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="text-sm text-muted-foreground w-24">Join URL:</dt>
              <dd className="font-mono text-sm bg-muted px-2 py-1 rounded break-all">
                {process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/add/{slug}
              </dd>
            </div>
          </dl>
        </div>

        {/* QR Codes */}
        {loading ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Generating QR codes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium mb-2">Join QR Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Customers scan this to add the loyalty card to their wallet
              </p>
              {joinQR && (
                <>
                  <img
                    src={joinQR}
                    alt="Join QR Code"
                    className="mx-auto mb-4 rounded-lg border border-border"
                    style={{ maxWidth: '200px' }}
                  />
                  <Button asChild variant="outline" className="w-full">
                    <a href={joinQR} download={`${slug}-join-qr.png`}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Join QR
                    </a>
                  </Button>
                </>
              )}
            </div>

            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium mb-2">Stamp QR Code (Template)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Each member will have their own unique stamp QR code
              </p>
              {stampQR && (
                <>
                  <img
                    src={stampQR}
                    alt="Stamp QR Code"
                    className="mx-auto mb-4 rounded-lg border border-border opacity-50"
                    style={{ maxWidth: '200px' }}
                  />
                  <p className="text-xs text-muted-foreground bg-muted rounded-md p-2">
                    Note: This is a placeholder. Actual stamp QR codes will be generated per member.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium mb-4">Next Steps</h2>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
              <span>Download and print the Join QR code poster</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
              <span>Display it prominently at your counter or entrance</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
              <span>Test the flow by scanning with your own phone</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">4</span>
              <span>Monitor member signups in your analytics dashboard</span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1">
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/branding/new">
              Create Another Merchant
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
