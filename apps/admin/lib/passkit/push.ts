import { sendPassUpdate, type APNsConfig } from '@tapandstamp/pass-apple';
import { createAdminClient } from '../supabase/admin';

/**
 * Get APNs configuration from environment variables
 */
function getAPNsConfig(): APNsConfig | null {
  const keyPath = process.env.APPLE_APNS_KEY_PATH;
  const keyId = process.env.APPLE_APNS_KEY_ID;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!keyPath || !keyId || !teamId) {
    console.warn('[APNs] Missing configuration:', {
      hasKeyPath: !!keyPath,
      hasKeyId: !!keyId,
      hasTeamId: !!teamId,
    });
    return null;
  }

  return {
    keyPath,
    keyId,
    teamId,
    production: process.env.NODE_ENV === 'production',
  };
}

/**
 * Send push notifications to all devices registered for a member's pass
 */
export async function sendPassUpdateToMember(memberId: string): Promise<{
  sent: number;
  failed: number;
  skipped: boolean;
}> {
  const config = getAPNsConfig();

  if (!config) {
    console.log('[APNs] Push notifications not configured, skipping');
    return { sent: 0, failed: 0, skipped: true };
  }

  const passTypeId = process.env.APPLE_PASS_TYPE_ID;
  if (!passTypeId) {
    console.warn('[APNs] Missing APPLE_PASS_TYPE_ID');
    return { sent: 0, failed: 0, skipped: true };
  }

  const client = createAdminClient();

  // Get all device registrations for this member
  const { data: registrations, error } = await client
    .from('pass_registrations')
    .select('push_token')
    .eq('member_id', memberId)
    .eq('platform', 'apple');

  if (error) {
    console.error('[APNs] Failed to fetch registrations:', error);
    return { sent: 0, failed: 0, skipped: true };
  }

  if (!registrations || registrations.length === 0) {
    console.log('[APNs] No device registrations found for member:', memberId);
    return { sent: 0, failed: 0, skipped: false };
  }

  console.log(`[APNs] Sending push to ${registrations.length} device(s) for member:`, memberId);

  let sent = 0;
  let failed = 0;

  for (const reg of registrations) {
    try {
      const result = await sendPassUpdate(reg.push_token, passTypeId, config);
      if (result.success) {
        sent++;
        console.log('[APNs] Push sent successfully');
      } else {
        failed++;
        console.error('[APNs] Push failed:', result.error);
      }
    } catch (err) {
      failed++;
      console.error('[APNs] Push error:', err);
    }
  }

  return { sent, failed, skipped: false };
}
