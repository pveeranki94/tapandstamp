import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getSupabaseClient } from '../lib/supabase.js';
import { getMemberWithMerchant, resetMemberReward } from '@tapandstamp/db';

const router: RouterType = Router();

/**
 * Redeem flow: POST /redeem/:memberId
 * 1. Verify reward_available = true
 * 2. Reset stamp_count=0, reward_available=false
 * 3. Return success JSON
 */
router.post('/:memberId', async (req: Request, res: Response) => {
  const { memberId } = req.params;

  try {
    const client = getSupabaseClient();

    // Get member with merchant data
    const result = await getMemberWithMerchant(client, memberId);
    if (!result) {
      return res.status(404).json({
        error: 'Member not found',
        memberId
      });
    }

    const { member, merchant } = result;

    // Verify reward is available
    if (!member.reward_available) {
      return res.status(400).json({
        error: 'No reward available',
        message: `Collect ${merchant.reward_goal} stamps to earn a reward`,
        stampCount: member.stamp_count,
        rewardGoal: merchant.reward_goal
      });
    }

    // Reset member reward
    const updatedMember = await resetMemberReward(client, memberId);

    return res.json({
      success: true,
      message: 'Reward redeemed successfully!',
      memberId: updatedMember.id,
      stampCount: updatedMember.stamp_count,
      rewardAvailable: updatedMember.reward_available,
      merchantName: merchant.name
    });
  } catch (error) {
    console.error('[redeem] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
