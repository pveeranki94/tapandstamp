import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import {
  isCooldownActive,
  getCooldownRemainingSeconds,
  nextStamp,
  isRewardReady
} from '@tapandstamp/core';
import { sendPassUpdateToMember } from '../../../../lib/passkit/push';

const COOLDOWN_MINUTES = 5;

interface MemberData {
  id: string;
  merchant_id: string;
  name: string | null;
  stamp_count: number;
  reward_available: boolean;
  last_stamp_at: string | null;
  merchant: {
    id: string;
    name: string;
    reward_goal: number;
  };
}

// GET /api/stamp/[memberId]/check - Check member state without stamping
export async function GET(
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
      last_stamp_at,
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
      { error: 'You can only stamp cards for your own merchants' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    stampCount: typedMember.stamp_count,
    rewardGoal: typedMember.merchant.reward_goal,
    rewardReady: typedMember.reward_available,
    memberName: typedMember.name,
    merchantName: typedMember.merchant.name
  });
}

// POST /api/stamp/[memberId] - Add a stamp
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
      last_stamp_at,
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
      { error: 'You can only stamp cards for your own merchants' },
      { status: 403 }
    );
  }

  // Check if reward is already available (can't stamp until claimed)
  if (typedMember.reward_available) {
    return NextResponse.json({
      error: 'reward_pending',
      stampCount: typedMember.stamp_count,
      rewardGoal: typedMember.merchant.reward_goal,
      rewardReady: true,
      memberName: typedMember.name,
      merchantName: typedMember.merchant.name
    }, { status: 400 });
  }

  // Check cooldown
  if (isCooldownActive(typedMember.last_stamp_at, COOLDOWN_MINUTES)) {
    const remaining = getCooldownRemainingSeconds(typedMember.last_stamp_at, COOLDOWN_MINUTES);
    return NextResponse.json({
      error: 'cooldown',
      cooldownRemaining: remaining,
      stampCount: typedMember.stamp_count,
      rewardGoal: typedMember.merchant.reward_goal,
      rewardReady: false,
      memberName: typedMember.name,
      merchantName: typedMember.merchant.name
    }, { status: 429 });
  }

  // Calculate new stamp count
  const newStampCount = nextStamp(typedMember.stamp_count, typedMember.merchant.reward_goal);
  const rewardAvailable = isRewardReady(newStampCount, typedMember.merchant.reward_goal);

  // Update member
  const { error: updateError } = await supabase
    .from('members')
    .update({
      stamp_count: newStampCount,
      reward_available: rewardAvailable,
      last_stamp_at: new Date().toISOString()
    })
    .eq('id', memberId);

  if (updateError) {
    console.error('[stamp] Update error:', updateError);
    return NextResponse.json(
      { error: 'Failed to update stamp count' },
      { status: 500 }
    );
  }

  // Create visit record
  await supabase
    .from('visits')
    .insert({
      merchant_id: typedMember.merchant_id,
      member_id: memberId
    });

  // Send APNs push notification to update wallet pass
  try {
    const pushResult = await sendPassUpdateToMember(memberId);
    console.log('[stamp] Push result:', pushResult);
  } catch (pushError) {
    // Don't fail the stamp if push fails
    console.error('[stamp] Push notification error:', pushError);
  }

  return NextResponse.json({
    success: true,
    stampCount: newStampCount,
    rewardGoal: typedMember.merchant.reward_goal,
    rewardReady: rewardAvailable,
    memberName: typedMember.name,
    merchantName: typedMember.merchant.name
  });
}
