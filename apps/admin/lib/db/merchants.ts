import type { SupabaseClient } from '@supabase/supabase-js';
import type { Branding } from '@tapandstamp/core';

export interface MerchantInsert {
  slug: string;
  name: string;
  rewardGoal: number;
  branding: Branding;
  joinQrUrl: string;
  stampQrUrl: string;
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

/**
 * Create a new merchant in the database
 */
export async function createMerchant(
  client: SupabaseClient,
  merchant: MerchantInsert
): Promise<MerchantRow> {
  const { data, error } = await client
    .from('merchants')
    .insert({
      slug: merchant.slug,
      name: merchant.name,
      reward_goal: merchant.rewardGoal,
      branding: merchant.branding,
      join_qr_url: merchant.joinQrUrl,
      stamp_qr_url: merchant.stampQrUrl,
      branding_version: 1
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create merchant: ${error.message}`);
  }

  return data as MerchantRow;
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
      // Not found
      return null;
    }
    throw new Error(`Failed to get merchant: ${error.message}`);
  }

  return data as MerchantRow;
}

/**
 * Get merchant by ID
 */
export async function getMerchantById(
  client: SupabaseClient,
  id: string
): Promise<MerchantRow | null> {
  const { data, error } = await client
    .from('merchants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get merchant: ${error.message}`);
  }

  return data as MerchantRow;
}

/**
 * Update merchant branding
 */
export async function updateMerchantBranding(
  client: SupabaseClient,
  id: string,
  branding: Branding
): Promise<MerchantRow> {
  const { data, error } = await client
    .from('merchants')
    .update({
      branding,
      branding_version: client.raw('branding_version + 1')
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update merchant branding: ${error.message}`);
  }

  return data as MerchantRow;
}
