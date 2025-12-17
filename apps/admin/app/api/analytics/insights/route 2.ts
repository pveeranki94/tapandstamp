import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { validateSession, hasAccessToMerchant } from '../../../../lib/auth/api';
import { getTopInsightsForUser } from '../../../../lib/db/analytics';

/**
 * GET /api/analytics/insights - Get top insights (top customers, at-risk, funnel)
 * Query params:
 *   - merchantId: Optional - filter to specific merchant
 */
export async function GET(request: NextRequest) {
  // Validate session
  const authResult = await validateSession();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId') || undefined;

    // If filtering by merchant, verify access
    if (merchantId && !hasAccessToMerchant(authResult, merchantId)) {
      return NextResponse.json(
        { error: 'Access denied to this merchant' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();
    const insights = await getTopInsightsForUser(
      supabase,
      authResult.merchantIds,
      merchantId
    );

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
