import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '../../../../lib/supabase';
import { getMerchantBySlug } from '@tapandstamp/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const client = createServiceClient();

    const merchant = await getMerchantBySlug(client, slug);

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: merchant.id,
      slug: merchant.slug,
      name: merchant.name,
      rewardGoal: merchant.reward_goal,
      branding: merchant.branding,
      brandingVersion: merchant.branding_version
    });
  } catch (error) {
    console.error('[merchants/[slug]] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
