import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../../../../../lib/supabase';
import { getMemberWithMerchant } from '@tapandstamp/db';
import { buildPassBundle, type PassBuilderConfig, type PassInput } from '@tapandstamp/pass-apple';
import type { Branding, Merchant, Member } from '@tapandstamp/core';
import * as crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Verify the authentication token from the pass
function verifyAuthToken(token: string, memberId: string): boolean {
  const secret = process.env.PASSKIT_AUTH_SECRET || 'default-secret-change-in-production';
  const expectedToken = crypto
    .createHmac('sha256', secret)
    .update(memberId)
    .digest('hex');
  return token === expectedToken;
}

// Extract member ID from serial number (format: apple-{memberId})
function extractMemberId(serial: string): string | null {
  if (serial.startsWith('apple-')) {
    return serial.substring(6);
  }
  return null;
}

// Get PassKit configuration
function getPassKitConfig(): PassBuilderConfig | null {
  const passTypeId = process.env.APPLE_PASS_TYPE_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const certPath = process.env.APPLE_PASSKIT_CERT_PATH;
  const certPassword = process.env.APPLE_PASSKIT_CERT_PASSWORD;
  const wwdrCertPath = process.env.APPLE_WWDR_CERT_PATH;
  const webServiceUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (!passTypeId || !teamId || !certPath || !certPassword || !webServiceUrl) {
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

// Generate auth token for the pass
function generateAuthToken(memberId: string): string {
  const secret = process.env.PASSKIT_AUTH_SECRET || 'default-secret-change-in-production';
  return crypto
    .createHmac('sha256', secret)
    .update(memberId)
    .digest('hex');
}

interface RouteParams {
  passTypeId: string;
  serial: string;
}

/**
 * GET - Return the latest version of the pass
 * Apple Wallet calls this after receiving a push notification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { passTypeId, serial } = await params;

    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('ApplePass ')) {
      return new NextResponse(null, { status: 401 });
    }
    const authToken = authHeader.substring(10);

    // Extract member ID from serial
    const memberId = extractMemberId(serial);
    if (!memberId) {
      return new NextResponse(null, { status: 400 });
    }

    // Verify auth token
    if (!verifyAuthToken(authToken, memberId)) {
      return new NextResponse(null, { status: 401 });
    }

    // Check if PassKit is configured
    const passKitConfig = getPassKitConfig();
    if (!passKitConfig) {
      return new NextResponse(null, { status: 500 });
    }

    // Verify pass type matches
    if (passTypeId !== passKitConfig.passTypeId) {
      return new NextResponse(null, { status: 400 });
    }

    const client = createServiceClient();
    const result = await getMemberWithMerchant(client, memberId);

    if (!result) {
      return new NextResponse(null, { status: 404 });
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

    const passInput: PassInput = {
      merchant: merchantData,
      member: memberData,
      branding,
      memberName: member.name || undefined,
      authToken: generateAuthToken(memberId),
    };

    // Build the updated .pkpass bundle
    const pkpassBuffer = await buildPassBundle(passInput, passKitConfig);

    // Return with proper content type
    return new NextResponse(new Uint8Array(pkpassBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Last-Modified': new Date().toUTCString(),
      },
    });
  } catch (error) {
    console.error('[PassKit] Pass update error:', error);
    return new NextResponse(null, { status: 500 });
  }
}
