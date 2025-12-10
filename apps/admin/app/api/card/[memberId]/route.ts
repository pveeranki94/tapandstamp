import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../../lib/supabase';
import { getMemberWithMerchant } from '@tapandstamp/db';

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

    return NextResponse.json({
      member: {
        id: member.id,
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
        stampQrUrl: merchant.stamp_qr_url
      }
    });
  } catch (error) {
    console.error('[card API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
