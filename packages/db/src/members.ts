import type { SupabaseClient } from '@supabase/supabase-js';
import type { Branding } from '@tapandstamp/core';

export type DeviceType = 'apple' | 'google' | 'web';

export interface MemberInsert {
  merchantId: string;
  deviceType: DeviceType;
  walletEmail?: string;
  name?: string;
}

export interface MemberRow {
  id: string;
  merchant_id: string;
  device_type: DeviceType;
  wallet_email: string | null;
  name: string | null;
  stamp_count: number;
  reward_available: boolean;
  last_stamp_at: string | null;
  created_at: string;
}

export interface MerchantRow {
  id: string;
  slug: string;
  name: string;
  reward_goal: number;
  branding: Branding;
  branding_version: number;
  join_qr_url: string;
  stamp_qr_url: string;
  created_at: string;
}

export interface MemberWithMerchant {
  member: MemberRow;
  merchant: MerchantRow;
}

/**
 * Create a new member in the database
 */
export async function createMember(
  client: SupabaseClient,
  member: MemberInsert
): Promise<MemberRow> {
  const { data, error } = await client
    .from('members')
    .insert({
      merchant_id: member.merchantId,
      device_type: member.deviceType,
      wallet_email: member.walletEmail || null,
      name: member.name || null,
      stamp_count: 0,
      reward_available: false
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create member: ${error.message}`);
  }

  return data as MemberRow;
}

/**
 * Get member by ID
 */
export async function getMemberById(
  client: SupabaseClient,
  id: string
): Promise<MemberRow | null> {
  const { data, error } = await client
    .from('members')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get member: ${error.message}`);
  }

  return data as MemberRow;
}

/**
 * Get member with merchant data (for stamp card display)
 */
export async function getMemberWithMerchant(
  client: SupabaseClient,
  memberId: string
): Promise<MemberWithMerchant | null> {
  const { data, error } = await client
    .from('members')
    .select(`
      *,
      merchant:merchants (*)
    `)
    .eq('id', memberId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get member with merchant: ${error.message}`);
  }

  if (!data || !data.merchant) {
    return null;
  }

  return {
    member: {
      id: data.id,
      merchant_id: data.merchant_id,
      device_type: data.device_type,
      wallet_email: data.wallet_email,
      name: data.name,
      stamp_count: data.stamp_count,
      reward_available: data.reward_available,
      last_stamp_at: data.last_stamp_at,
      created_at: data.created_at
    },
    merchant: data.merchant as MerchantRow
  };
}

/**
 * Update member stamp count and reward status
 */
export async function updateMemberStamp(
  client: SupabaseClient,
  memberId: string,
  newStampCount: number,
  rewardAvailable: boolean
): Promise<MemberRow> {
  const { data, error } = await client
    .from('members')
    .update({
      stamp_count: newStampCount,
      reward_available: rewardAvailable,
      last_stamp_at: new Date().toISOString()
    })
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update member stamp: ${error.message}`);
  }

  return data as MemberRow;
}

/**
 * Reset member reward (after redemption)
 */
export async function resetMemberReward(
  client: SupabaseClient,
  memberId: string
): Promise<MemberRow> {
  const { data, error } = await client
    .from('members')
    .update({
      stamp_count: 0,
      reward_available: false
    })
    .eq('id', memberId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to reset member reward: ${error.message}`);
  }

  return data as MemberRow;
}

/**
 * Get merchant by slug
 */
export async function getMerchantBySlug(
  client: SupabaseClient,
  slug: string
): Promise<MerchantRow | null> {
  const { data, error } = await client
    .from('merchants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get merchant: ${error.message}`);
  }

  return data as MerchantRow;
}
