import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabase/admin';
import { validateSession } from '../../../lib/auth/api';
import { getGlobalAnalyticsForUser } from '../../../lib/db/analytics';

/**
 * GET /api/analytics - Get global analytics for user's accessible merchants
 */
export async function GET() {
  // Validate session
  const authResult = await validateSession();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const supabase = createAdminClient();
    const analytics = await getGlobalAnalyticsForUser(supabase, authResult.merchantIds);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching global analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
