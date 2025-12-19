import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getSupabaseClient } from '../lib/supabase.js';
import { getMemberWithMerchant } from '@tapandstamp/db';

const router: RouterType = Router();

/**
 * Stamp flow: GET /stamp/:memberId
 * 1. Get member + merchant (validates member exists)
 * 2. Redirect to authenticated stamp page /stamp/:memberId
 *    (Authentication, cooldown checks, and stamping handled by admin app)
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

    // Get the admin app URL from environment or use default
    const adminBaseUrl = process.env.ADMIN_BASE_URL || 'http://localhost:3001';

    // Redirect to authenticated stamp page
    // The stamp page will handle authentication, cooldown checks, and stamping
    return res.redirect(`${adminBaseUrl}/stamp/${memberId}`);
  } catch (error) {
    console.error('[stamp] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
