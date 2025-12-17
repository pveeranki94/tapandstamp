import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { validateSession, hasAccessToMerchant } from '../../../../lib/auth/api';
import { getMembersForUser, MemberFilters } from '../../../../lib/db/analytics';

/**
 * GET /api/analytics/members - Get member list with filters
 * Query params:
 *   - merchantId: Filter by merchant
 *   - search: Search by name/email
 *   - deviceType: Filter by device (apple/google/web)
 *   - hasReward: Filter by reward availability (true/false)
 *   - minStamps: Minimum stamp count
 *   - maxStamps: Maximum stamp count
 *   - sortBy: Sort field (created_at/last_stamp_at/stamp_count/name)
 *   - sortOrder: Sort direction (asc/desc)
 *   - limit: Results per page (default 50)
 *   - offset: Pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  // Validate session
  const authResult = await validateSession();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);

    const filters: MemberFilters = {};

    const merchantId = searchParams.get('merchantId');
    // Only allow filtering by merchants the user has access to
    if (merchantId) {
      if (!hasAccessToMerchant(authResult, merchantId)) {
        return NextResponse.json(
          { error: 'Access denied to this merchant' },
          { status: 403 }
        );
      }
      filters.merchantId = merchantId;
    }

    const search = searchParams.get('search');
    if (search) filters.search = search;

    const deviceType = searchParams.get('deviceType');
    if (deviceType && ['apple', 'google', 'web'].includes(deviceType)) {
      filters.deviceType = deviceType as 'apple' | 'google' | 'web';
    }

    const hasReward = searchParams.get('hasReward');
    if (hasReward !== null) {
      filters.hasReward = hasReward === 'true';
    }

    const minStamps = searchParams.get('minStamps');
    if (minStamps) filters.minStamps = parseInt(minStamps, 10);

    const maxStamps = searchParams.get('maxStamps');
    if (maxStamps) filters.maxStamps = parseInt(maxStamps, 10);

    const sortBy = searchParams.get('sortBy');
    if (sortBy && ['created_at', 'last_stamp_at', 'stamp_count', 'name'].includes(sortBy)) {
      filters.sortBy = sortBy as MemberFilters['sortBy'];
    }

    const sortOrder = searchParams.get('sortOrder');
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      filters.sortOrder = sortOrder as 'asc' | 'desc';
    }

    const limit = searchParams.get('limit');
    if (limit) filters.limit = Math.min(parseInt(limit, 10), 100);

    const offset = searchParams.get('offset');
    if (offset) filters.offset = parseInt(offset, 10);

    const supabase = createAdminClient();
    const result = await getMembersForUser(supabase, authResult.merchantIds, filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}
