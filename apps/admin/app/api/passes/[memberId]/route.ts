import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../../lib/supabase';
import { getMemberWithMerchant } from '@tapandstamp/db';
import { buildPassBundle, type PassBuilderConfig, type PassInput } from '@tapandstamp/pass-apple';
import type { Branding, Merchant, Member } from '@tapandstamp/core';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Environment variable validation
function getPassKitConfig(): PassBuilderConfig | null {
  const passTypeId = process.env.APPLE_PASS_TYPE_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const certPath = process.env.APPLE_PASSKIT_CERT_PATH;
  const certPassword = process.env.APPLE_PASSKIT_CERT_PASSWORD;
  const wwdrCertPath = process.env.APPLE_WWDR_CERT_PATH;
  const webServiceUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (!passTypeId || !teamId || !certPath || !certPassword || !webServiceUrl) {
    console.error('[PassKit] Missing required environment variables:', {
      hasPassTypeId: !!passTypeId,
      hasTeamId: !!teamId,
      hasCertPath: !!certPath,
      hasCertPassword: !!certPassword,
      hasWebServiceUrl: !!webServiceUrl,
    });
    return null;
  }

  return {
    passTypeId,
    teamId,
    webServiceUrl,
    signerConfig: {
      certPath,
      certPassword,
      wwdrCertPath,
    },
  };
}

// Generate a secure auth token for the pass
function generateAuthToken(memberId: string): string {
  const secret = process.env.PASSKIT_AUTH_SECRET || 'default-secret-change-in-production';
  return crypto
    .createHmac('sha256', secret)
    .update(memberId)
    .digest('hex');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;

    // Check if PassKit is configured
    const passKitConfig = getPassKitConfig();
    if (!passKitConfig) {
      return NextResponse.json(
        { error: 'Apple PassKit is not configured' },
        { status: 503 }
      );
    }

    const client = createServiceClient();
    const result = await getMemberWithMerchant(client, memberId);

    if (!result) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    const { member, merchant } = result;

    // Convert database types to core types
    const merchantData: Merchant = {
      id: merchant.id,
      slug: merchant.slug,
      name: merchant.name,
      rewardGoal: merchant.reward_goal,
      createdAt: merchant.created_at,
    };

    const memberData: Member = {
      id: member.id,
      merchantId: member.merchant_id,
      stampCount: member.stamp_count,
      rewardAvailable: member.reward_available,
      lastStampAt: member.last_stamp_at || undefined,
      createdAt: member.created_at,
    };

    const branding = merchant.branding as Branding;

    // Generate auth token for web service callbacks
    const authToken = generateAuthToken(memberId);

    const passInput: PassInput = {
      merchant: merchantData,
      member: memberData,
      branding,
      memberName: member.name || undefined,
      authToken,
    };

    // Build the .pkpass bundle
    const pkpassBuffer = await buildPassBundle(passInput, passKitConfig);

    // Return with proper content type for Apple Wallet
    return new NextResponse(new Uint8Array(pkpassBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${merchant.slug}-loyalty.pkpass"`,
        'Content-Length': pkpassBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[PassKit] Error generating pass:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate pass', details: errorMessage },
      { status: 500 }
    );
  }
}
