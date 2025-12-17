import { NextResponse } from 'next/server';
import { createClient } from '../supabase/server';
import { createAdminClient } from '../supabase/admin';

export interface AuthResult {
  user: { id: string; email: string };
  merchantIds: string[];
}

/**
 * Validate session and get user's accessible merchant IDs
 * Call this at the start of protected API routes
 */
export async function validateSession(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's merchant access using admin client (bypasses RLS)
  const adminClient = createAdminClient();
  const { data: access, error: accessError } = await adminClient
    .from('user_merchants')
    .select('merchant_id')
    .eq('user_id', user.id);

  if (accessError) {
    console.error('Error fetching merchant access:', accessError);
    return NextResponse.json(
      { error: 'Failed to verify access' },
      { status: 500 }
    );
  }

  return {
    user: { id: user.id, email: user.email! },
    merchantIds: access?.map((a) => a.merchant_id) ?? [],
  };
}

/**
 * Check if user has access to a specific merchant
 */
export function hasAccessToMerchant(
  authResult: AuthResult,
  merchantId: string
): boolean {
  return authResult.merchantIds.includes(merchantId);
}

/**
 * Return 403 if user doesn't have access to the merchant
 */
export function requireMerchantAccess(
  authResult: AuthResult,
  merchantId: string
): NextResponse | null {
  if (!hasAccessToMerchant(authResult, merchantId)) {
    return NextResponse.json(
      { error: 'Access denied to this merchant' },
      { status: 403 }
    );
  }
  return null;
}
