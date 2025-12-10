import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getSupabaseClient } from '../lib/supabase.js';
import {
  getMemberWithMerchant,
  updateMemberStamp,
  createVisit
} from '@tapandstamp/db';
import {
  isCooldownActive,
  getCooldownRemainingSeconds,
  nextStamp,
  isRewardReady
} from '@tapandstamp/core';

const router: RouterType = Router();

const COOLDOWN_MINUTES = 5;

/**
 * Stamp flow: GET /stamp/:memberId
 * 1. Get member + merchant
 * 2. Check 5-minute cooldown → 429 if active
 * 3. Increment stamp_count using nextStamp()
 * 4. Check if reward ready using isRewardReady()
 * 5. Update member, create visit record
 * 6. Redirect to /card/:memberId?stamped=true
 */
router.get('/:memberId', async (req: Request, res: Response) => {
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

    // Check cooldown
    if (isCooldownActive(member.last_stamp_at, COOLDOWN_MINUTES)) {
      const remaining = getCooldownRemainingSeconds(member.last_stamp_at, COOLDOWN_MINUTES);
      const adminBaseUrl = process.env.ADMIN_BASE_URL || 'http://localhost:3001';

      // Redirect with cooldown error info
      return res.redirect(
        `${adminBaseUrl}/card/${memberId}?error=cooldown&remaining=${remaining}`
      );
    }

    // Check if reward is already available (shouldn't stamp more until redeemed)
    if (member.reward_available) {
      const adminBaseUrl = process.env.ADMIN_BASE_URL || 'http://localhost:3001';
      return res.redirect(
        `${adminBaseUrl}/card/${memberId}?error=reward_pending`
      );
    }

    // Calculate new stamp count
    const newStampCount = nextStamp(member.stamp_count, merchant.reward_goal);
    const rewardAvailable = isRewardReady(newStampCount, merchant.reward_goal);

    // Update member and create visit record
    await Promise.all([
      updateMemberStamp(client, memberId, newStampCount, rewardAvailable),
      createVisit(client, {
        merchantId: merchant.id,
        memberId: member.id
      })
    ]);

    // Get the admin app URL from environment or use default
    const adminBaseUrl = process.env.ADMIN_BASE_URL || 'http://localhost:3001';

    // Redirect to web stamp card with success indicator
    return res.redirect(`${adminBaseUrl}/card/${memberId}?stamped=true`);
  } catch (error) {
    console.error('[stamp] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
