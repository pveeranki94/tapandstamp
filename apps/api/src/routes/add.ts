import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getSupabaseClient } from '../lib/supabase.js';
import { getMerchantBySlug, createMember } from '@tapandstamp/db';

const router: RouterType = Router();

/**
 * Join flow: GET /add/:merchantSlug
 * 1. Look up merchant by slug
 * 2. Create member with stamp_count=0, device_type='web'
 * 3. Redirect to /card/:memberId
 */
router.get('/:merchantSlug', async (req: Request, res: Response) => {
  const { merchantSlug } = req.params;

  try {
    const client = getSupabaseClient();

    // Look up merchant
    const merchant = await getMerchantBySlug(client, merchantSlug);
    if (!merchant) {
      return res.status(404).json({
        error: 'Merchant not found',
        slug: merchantSlug
      });
    }

    // Create new member
    const member = await createMember(client, {
      merchantId: merchant.id,
      deviceType: 'web'
    });

    // Get the admin app URL from environment or use default
    const adminBaseUrl = process.env.ADMIN_BASE_URL || 'http://localhost:3001';

    // Redirect to web stamp card
    return res.redirect(`${adminBaseUrl}/card/${member.id}`);
  } catch (error) {
    console.error('[add] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
