import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { sendPassUpdateToMember } from '../../../../lib/passkit/push';

interface MemberData {
  id: string;
  merchant_id: string;
  name: string | null;
  stamp_count: number;
  reward_available: boolean;
  merchant: {
    id: string;
    name: string;
    reward_goal: number;
  };
}

// POST /api/claim/[memberId] - Claim reward and reset stamps
export async function POST(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  const supabase = await createClient();
  const memberId = params.memberId;

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get member with merchant
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select(`
      id,
      merchant_id,
      name,
      stamp_count,
      reward_available,
      merchant:merchants (
        id,
        name,
        reward_goal
      )
    `)
    .eq('id', memberId)
    .single();

  if (memberError || !member) {
    return NextResponse.json(
      { error: 'Member not found' },
      { status: 404 }
    );
  }

  const typedMember = member as unknown as MemberData;

  // Verify user has access to this merchant
  const { data: userMerchant, error: accessError } = await supabase
    .from('user_merchants')
    .select('id')
    .eq('user_id', user.id)
    .eq('merchant_id', typedMember.merchant_id)
    .single();

  if (accessError || !userMerchant) {
    return NextResponse.json(
      { error: 'You can only claim rewards for your own merchants' },
      { status: 403 }
    );
  }

  // Check if reward is available
  if (!typedMember.reward_available) {
    return NextResponse.json(
      { error: 'No reward available to claim' },
      { status: 400 }
    );
  }

  // Reset member: stamp_count = 0, reward_available = false, last_stamp_at = null
  // Setting last_stamp_at to null ensures NO cooldown after claim
  const { error: updateError } = await supabase
    .from('members')
    .update({
      stamp_count: 0,
      reward_available: false,
      last_stamp_at: null
    })
    .eq('id', memberId);

  if (updateError) {
    console.error('[claim] Update error:', updateError);
    return NextResponse.json(
      { error: 'Failed to claim reward' },
      { status: 500 }
    );
  }

  // Send APNs push notification to update wallet pass
  try {
    const pushResult = await sendPassUpdateToMember(memberId);
    console.log('[claim] Push result:', pushResult);
  } catch (pushError) {
    // Don't fail the claim if push fails
    console.error('[claim] Push notification error:', pushError);
  }

  return NextResponse.json({
    success: true,
    stampCount: 0,
    rewardGoal: typedMember.merchant.reward_goal,
    rewardReady: false,
    memberName: typedMember.name,
    merchantName: typedMember.merchant.name
  });
}
