import type { SupabaseClient } from '@supabase/supabase-js';

export interface VisitRow {
  id: string;
  merchant_id: string;
  member_id: string;
  stamped_at: string;
}

export interface VisitInsert {
  merchantId: string;
  memberId: string;
}

/**
 * Create a new visit record (audit trail for stamps)
 */
export async function createVisit(
  client: SupabaseClient,
  visit: VisitInsert
): Promise<VisitRow> {
  const { data, error } = await client
    .from('visits')
    .insert({
      merchant_id: visit.merchantId,
      member_id: visit.memberId
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create visit: ${error.message}`);
  }

  return data as VisitRow;
}

/**
 * Get visits for a member
 */
export async function getVisitsByMember(
  client: SupabaseClient,
  memberId: string,
  limit = 50
): Promise<VisitRow[]> {
  const { data, error } = await client
    .from('visits')
    .select('*')
    .eq('member_id', memberId)
    .order('stamped_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get visits: ${error.message}`);
  }

  return data as VisitRow[];
}

/**
 * Get visit count for a member
 */
export async function getVisitCount(
  client: SupabaseClient,
  memberId: string
): Promise<number> {
  const { count, error } = await client
    .from('visits')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId);

  if (error) {
    throw new Error(`Failed to get visit count: ${error.message}`);
  }

  return count ?? 0;
}
