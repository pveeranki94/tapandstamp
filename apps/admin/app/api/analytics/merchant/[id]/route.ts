import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../../lib/supabase/admin';
import { validateSession, requireMerchantAccess } from '../../../../../lib/auth/api';
import { getMerchantAnalytics } from '../../../../../lib/db/analytics';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/analytics/merchant/[id] - Get analytics for a specific merchant
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Validate session
  const authResult = await validateSession();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id: merchantId } = await params;

    // Check merchant access
    const accessDenied = requireMerchantAccess(authResult, merchantId);
    if (accessDenied) return accessDenied;

    const supabase = createAdminClient();

    // First get the merchant to get reward_goal
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, reward_goal')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    const analytics = await getMerchantAnalytics(
      supabase,
      merchantId,
      merchant.reward_goal
    );

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching merchant analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merchant analytics' },
      { status: 500 }
    );
  }
}
