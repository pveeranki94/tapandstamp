import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../../lib/supabase';
import { getMemberWithMerchant } from '@tapandstamp/db';

// Disable caching for this dynamic route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const client = createServiceClient();

    const result = await getMemberWithMerchant(client, memberId);

    if (!result) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    const { member, merchant } = result;

    // Build the member-specific stamp URL
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const memberStampUrl = `${apiBaseUrl}/stamp/${member.id}`;

    const response = NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        stampCount: member.stamp_count,
        rewardAvailable: member.reward_available,
        lastStampAt: member.last_stamp_at,
        createdAt: member.created_at
      },
      merchant: {
        id: merchant.id,
        slug: merchant.slug,
        name: merchant.name,
        rewardGoal: merchant.reward_goal,
        branding: merchant.branding,
        brandingVersion: merchant.branding_version,
        stampQrUrl: memberStampUrl
      }
    });

    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    return response;
  } catch (error) {
    console.error('[card API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
