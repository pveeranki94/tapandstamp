import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '../../../../../lib/supabase/admin';
import { validateSession, hasAccessToMerchant } from '../../../../../lib/auth/api';
import { getMemberDetail } from '../../../../../lib/db/analytics';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/analytics/members/[id] - Get detailed info for a specific member
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Validate session
  const authResult = await validateSession();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id: memberId } = await params;
    const supabase = createAdminClient();

    const member = await getMemberDetail(supabase, memberId);

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check user has access to this member's merchant
    if (!hasAccessToMerchant(authResult, member.merchantId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching member detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member detail' },
      { status: 500 }
    );
  }
}
