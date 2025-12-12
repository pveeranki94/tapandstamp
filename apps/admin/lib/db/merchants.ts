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

export interface MerchantUpdate {
  name?: string;
  rewardGoal?: number;
  branding?: Branding;
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
  // First get current version
  const { data: current, error: fetchError } = await client
    .from('merchants')
    .select('branding_version')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch merchant: ${fetchError.message}`);
  }

  const newVersion = ((current as { branding_version: number })?.branding_version ?? 0) + 1;

  const { data, error } = await client
    .from('merchants')
    .update({
      branding,
      branding_version: newVersion
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update merchant branding: ${error.message}`);
  }

  return data as MerchantRow;
}

/**
 * List all merchants with optional pagination
 */
export async function listMerchants(
  client: SupabaseClient,
  options?: { limit?: number; offset?: number }
): Promise<{ merchants: MerchantRow[]; total: number }> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  // Get total count
  const { count, error: countError } = await client
    .from('merchants')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw new Error(`Failed to count merchants: ${countError.message}`);
  }

  // Get paginated results
  const { data, error } = await client
    .from('merchants')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to list merchants: ${error.message}`);
  }

  return {
    merchants: data as MerchantRow[],
    total: count ?? 0
  };
}

/**
 * Update merchant (name, rewardGoal, and/or branding)
 * If branding is updated, increments branding_version
 */
export async function updateMerchant(
  client: SupabaseClient,
  id: string,
  updates: MerchantUpdate
): Promise<MerchantRow> {
  // Build update object
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }

  if (updates.rewardGoal !== undefined) {
    updateData.reward_goal = updates.rewardGoal;
  }

  // If branding is being updated, increment version
  if (updates.branding !== undefined) {
    const { data: current, error: fetchError } = await client
      .from('merchants')
      .select('branding_version')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch merchant: ${fetchError.message}`);
    }

    const newVersion = ((current as { branding_version: number })?.branding_version ?? 0) + 1;
    updateData.branding = updates.branding;
    updateData.branding_version = newVersion;
  }

  if (Object.keys(updateData).length === 0) {
    // No updates, just return current merchant
    const merchant = await getMerchantById(client, id);
    if (!merchant) {
      throw new Error('Merchant not found');
    }
    return merchant;
  }

  const { data, error } = await client
    .from('merchants')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update merchant: ${error.message}`);
  }

  return data as MerchantRow;
}
