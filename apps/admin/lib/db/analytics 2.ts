import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Types
// ============================================================

export interface MemberListItem {
  id: string;
  name: string | null;
  email: string | null;
  deviceType: 'apple' | 'google' | 'web';
  stampCount: number;
  rewardAvailable: boolean;
  lastStampAt: string | null;
  createdAt: string;
  totalVisits: number;
  merchantId: string;
  merchantName: string;
  merchantSlug: string;
}

export interface MemberDetail extends MemberListItem {
  visitHistory: {
    id: string;
    stampedAt: string;
  }[];
  daysAsMember: number;
  avgDaysBetweenVisits: number | null;
  rewardsEarned: number;
}

export interface GlobalAnalytics {
  // Overview across all merchants
  totalMerchants: number;
  totalMembers: number;
  totalStampsAwarded: number;
  totalRewardsRedeemed: number;
  totalRewardsPending: number;

  // Activity
  activeMembers30Days: number;
  newMembersToday: number;
  newMembersThisWeek: number;
  newMembersThisMonth: number;
  stampsToday: number;
  stampsThisWeek: number;

  // Device breakdown
  membersByDevice: {
    apple: number;
    google: number;
    web: number;
  };

  // Per-merchant summary
  merchantSummaries: {
    id: string;
    name: string;
    slug: string;
    totalMembers: number;
    activeMembers30Days: number;
    stampsThisWeek: number;
    rewardsPending: number;
  }[];

  // Time series (last 30 days)
  dailyStats: {
    date: string;
    newMembers: number;
    stamps: number;
    activeMembers: number;
  }[];
}

export interface MerchantAnalytics {
  // Overview
  totalMembers: number;
  totalStampsAwarded: number;
  rewardsRedeemed: number;
  rewardsPending: number;

  // Member breakdown
  membersByDevice: {
    apple: number;
    google: number;
    web: number;
  };

  // Stamp distribution
  stampDistribution: {
    stampCount: number;
    memberCount: number;
  }[];

  // Activity metrics
  activeMembers30Days: number;
  newMembersToday: number;
  newMembersThisWeek: number;
  newMembersThisMonth: number;
  stampsToday: number;
  stampsThisWeek: number;

  // Time series (last 30 days)
  dailyStats: {
    date: string;
    newMembers: number;
    stamps: number;
    activeMembers: number;
  }[];

  // Engagement
  avgStampsPerMember: number;
  conversionRate: number; // % of members with at least 1 stamp
  membersNearReward: number; // within 2 stamps of goal
}

/**
 * Get comprehensive analytics for a merchant
 */
export async function getMerchantAnalytics(
  client: SupabaseClient,
  merchantId: string,
  rewardGoal: number
): Promise<MerchantAnalytics> {
  // Run queries in parallel for efficiency
  const [
    memberStats,
    deviceBreakdown,
    stampDistribution,
    visitStats,
    dailyNewMembers,
    dailyStamps
  ] = await Promise.all([
    getMemberStats(client, merchantId, rewardGoal),
    getMembersByDevice(client, merchantId),
    getStampDistribution(client, merchantId),
    getVisitStats(client, merchantId),
    getDailyNewMembers(client, merchantId),
    getDailyStamps(client, merchantId)
  ]);

  // Merge daily stats
  const dailyStatsMap = new Map<string, { newMembers: number; stamps: number; activeMembers: number }>();

  // Initialize last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyStatsMap.set(dateStr, { newMembers: 0, stamps: 0, activeMembers: 0 });
  }

  // Fill in new members
  for (const row of dailyNewMembers) {
    const existing = dailyStatsMap.get(row.date);
    if (existing) {
      existing.newMembers = row.count;
    }
  }

  // Fill in stamps and active members
  for (const row of dailyStamps) {
    const existing = dailyStatsMap.get(row.date);
    if (existing) {
      existing.stamps = row.stamps;
      existing.activeMembers = row.activeMembers;
    }
  }

  const dailyStats = Array.from(dailyStatsMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalMembers: memberStats.totalMembers,
    totalStampsAwarded: visitStats.totalStamps,
    rewardsRedeemed: memberStats.rewardsRedeemed,
    rewardsPending: memberStats.rewardsPending,
    membersByDevice: deviceBreakdown,
    stampDistribution,
    activeMembers30Days: memberStats.activeMembers30Days,
    newMembersToday: memberStats.newMembersToday,
    newMembersThisWeek: memberStats.newMembersThisWeek,
    newMembersThisMonth: memberStats.newMembersThisMonth,
    stampsToday: visitStats.stampsToday,
    stampsThisWeek: visitStats.stampsThisWeek,
    dailyStats,
    avgStampsPerMember: memberStats.totalMembers > 0
      ? Math.round((visitStats.totalStamps / memberStats.totalMembers) * 10) / 10
      : 0,
    conversionRate: memberStats.totalMembers > 0
      ? Math.round((memberStats.membersWithStamps / memberStats.totalMembers) * 100)
      : 0,
    membersNearReward: memberStats.membersNearReward
  };
}

async function getMemberStats(
  client: SupabaseClient,
  merchantId: string,
  rewardGoal: number
) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = monthAgo;

  // Get all members for this merchant
  const { data: members, error } = await client
    .from('members')
    .select('stamp_count, reward_available, last_stamp_at, created_at')
    .eq('merchant_id', merchantId);

  if (error) {
    throw new Error(`Failed to get member stats: ${error.message}`);
  }

  const totalMembers = members?.length ?? 0;
  let rewardsPending = 0;
  let rewardsRedeemed = 0;
  let activeMembers30Days = 0;
  let newMembersToday = 0;
  let newMembersThisWeek = 0;
  let newMembersThisMonth = 0;
  let membersWithStamps = 0;
  let membersNearReward = 0;

  for (const member of members ?? []) {
    if (member.reward_available) {
      rewardsPending++;
    }

    // Estimate redeemed: if stamp_count < reward_goal but they've been active
    // This is approximate - actual redemptions would need a separate table
    if (member.stamp_count === 0 && member.last_stamp_at) {
      rewardsRedeemed++;
    }

    if (member.last_stamp_at && member.last_stamp_at >= thirtyDaysAgo) {
      activeMembers30Days++;
    }

    if (member.created_at >= today) {
      newMembersToday++;
    }
    if (member.created_at >= weekAgo) {
      newMembersThisWeek++;
    }
    if (member.created_at >= monthAgo) {
      newMembersThisMonth++;
    }

    if (member.stamp_count > 0) {
      membersWithStamps++;
    }

    if (member.stamp_count >= rewardGoal - 2 && member.stamp_count < rewardGoal) {
      membersNearReward++;
    }
  }

  return {
    totalMembers,
    rewardsPending,
    rewardsRedeemed,
    activeMembers30Days,
    newMembersToday,
    newMembersThisWeek,
    newMembersThisMonth,
    membersWithStamps,
    membersNearReward
  };
}

async function getMembersByDevice(
  client: SupabaseClient,
  merchantId: string
) {
  const { data, error } = await client
    .from('members')
    .select('device_type')
    .eq('merchant_id', merchantId);

  if (error) {
    throw new Error(`Failed to get device breakdown: ${error.message}`);
  }

  const breakdown = { apple: 0, google: 0, web: 0 };
  for (const member of data ?? []) {
    const deviceType = member.device_type as 'apple' | 'google' | 'web';
    if (deviceType in breakdown) {
      breakdown[deviceType]++;
    }
  }

  return breakdown;
}

async function getStampDistribution(
  client: SupabaseClient,
  merchantId: string
) {
  const { data, error } = await client
    .from('members')
    .select('stamp_count')
    .eq('merchant_id', merchantId);

  if (error) {
    throw new Error(`Failed to get stamp distribution: ${error.message}`);
  }

  const distribution = new Map<number, number>();
  for (const member of data ?? []) {
    const count = member.stamp_count ?? 0;
    distribution.set(count, (distribution.get(count) ?? 0) + 1);
  }

  return Array.from(distribution.entries())
    .map(([stampCount, memberCount]) => ({ stampCount, memberCount }))
    .sort((a, b) => a.stampCount - b.stampCount);
}

async function getVisitStats(
  client: SupabaseClient,
  merchantId: string
) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get total stamps
  const { count: totalStamps, error: totalError } = await client
    .from('visits')
    .select('*', { count: 'exact', head: true })
    .eq('merchant_id', merchantId);

  if (totalError) {
    throw new Error(`Failed to get visit stats: ${totalError.message}`);
  }

  // Get stamps today
  const { count: stampsToday, error: todayError } = await client
    .from('visits')
    .select('*', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .gte('stamped_at', today);

  if (todayError) {
    throw new Error(`Failed to get today's stamps: ${todayError.message}`);
  }

  // Get stamps this week
  const { count: stampsThisWeek, error: weekError } = await client
    .from('visits')
    .select('*', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .gte('stamped_at', weekAgo);

  if (weekError) {
    throw new Error(`Failed to get week's stamps: ${weekError.message}`);
  }

  return {
    totalStamps: totalStamps ?? 0,
    stampsToday: stampsToday ?? 0,
    stampsThisWeek: stampsThisWeek ?? 0
  };
}

async function getDailyNewMembers(
  client: SupabaseClient,
  merchantId: string
): Promise<{ date: string; count: number }[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from('members')
    .select('created_at')
    .eq('merchant_id', merchantId)
    .gte('created_at', thirtyDaysAgo);

  if (error) {
    throw new Error(`Failed to get daily new members: ${error.message}`);
  }

  const dailyCounts = new Map<string, number>();
  for (const member of data ?? []) {
    const date = member.created_at.split('T')[0];
    dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1);
  }

  return Array.from(dailyCounts.entries())
    .map(([date, count]) => ({ date, count }));
}

async function getDailyStamps(
  client: SupabaseClient,
  merchantId: string
): Promise<{ date: string; stamps: number; activeMembers: number }[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from('visits')
    .select('stamped_at, member_id')
    .eq('merchant_id', merchantId)
    .gte('stamped_at', thirtyDaysAgo);

  if (error) {
    throw new Error(`Failed to get daily stamps: ${error.message}`);
  }

  const dailyData = new Map<string, { stamps: number; members: Set<string> }>();
  for (const visit of data ?? []) {
    const date = visit.stamped_at.split('T')[0];
    if (!dailyData.has(date)) {
      dailyData.set(date, { stamps: 0, members: new Set() });
    }
    const dayData = dailyData.get(date)!;
    dayData.stamps++;
    dayData.members.add(visit.member_id);
  }

  return Array.from(dailyData.entries())
    .map(([date, { stamps, members }]) => ({
      date,
      stamps,
      activeMembers: members.size
    }));
}

// ============================================================
// Global Analytics (across all merchants)
// ============================================================

export async function getGlobalAnalytics(
  client: SupabaseClient
): Promise<GlobalAnalytics> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Run queries in parallel
  const [merchants, members, visits, recentVisits] = await Promise.all([
    client.from('merchants').select('id, name, slug, reward_goal'),
    client.from('members').select('id, merchant_id, device_type, stamp_count, reward_available, last_stamp_at, created_at'),
    client.from('visits').select('id, merchant_id, member_id, stamped_at'),
    client.from('visits').select('id, merchant_id, member_id, stamped_at').gte('stamped_at', monthAgo)
  ]);

  if (merchants.error) throw new Error(`Failed to get merchants: ${merchants.error.message}`);
  if (members.error) throw new Error(`Failed to get members: ${members.error.message}`);
  if (visits.error) throw new Error(`Failed to get visits: ${visits.error.message}`);
  if (recentVisits.error) throw new Error(`Failed to get recent visits: ${recentVisits.error.message}`);

  const merchantsData = merchants.data ?? [];
  const membersData = members.data ?? [];
  const visitsData = visits.data ?? [];
  const recentVisitsData = recentVisits.data ?? [];

  // Build merchant lookup (available for future use)
  const _merchantMap = new Map(merchantsData.map(m => [m.id, m])); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Calculate global stats
  let totalRewardsRedeemed = 0;
  let totalRewardsPending = 0;
  let activeMembers30Days = 0;
  let newMembersToday = 0;
  let newMembersThisWeek = 0;
  let newMembersThisMonth = 0;
  const deviceBreakdown = { apple: 0, google: 0, web: 0 };

  // Per-merchant aggregations
  const merchantStats = new Map<string, {
    totalMembers: number;
    activeMembers30Days: number;
    rewardsPending: number;
  }>();

  for (const m of merchantsData) {
    merchantStats.set(m.id, { totalMembers: 0, activeMembers30Days: 0, rewardsPending: 0 });
  }

  for (const member of membersData) {
    const stats = merchantStats.get(member.merchant_id);
    if (stats) stats.totalMembers++;

    if (member.reward_available) {
      totalRewardsPending++;
      if (stats) stats.rewardsPending++;
    }

    if (member.stamp_count === 0 && member.last_stamp_at) {
      totalRewardsRedeemed++;
    }

    if (member.last_stamp_at && member.last_stamp_at >= monthAgo) {
      activeMembers30Days++;
      if (stats) stats.activeMembers30Days++;
    }

    if (member.created_at >= today) newMembersToday++;
    if (member.created_at >= weekAgo) newMembersThisWeek++;
    if (member.created_at >= monthAgo) newMembersThisMonth++;

    const dt = member.device_type as 'apple' | 'google' | 'web';
    if (dt in deviceBreakdown) deviceBreakdown[dt]++;
  }

  // Stamps by time window
  let stampsToday = 0;
  let stampsThisWeek = 0;
  const merchantWeeklyStamps = new Map<string, number>();

  for (const visit of visitsData) {
    if (visit.stamped_at >= today) stampsToday++;
    if (visit.stamped_at >= weekAgo) {
      stampsThisWeek++;
      merchantWeeklyStamps.set(visit.merchant_id, (merchantWeeklyStamps.get(visit.merchant_id) ?? 0) + 1);
    }
  }

  // Build daily stats
  const dailyStatsMap = new Map<string, { newMembers: number; stamps: number; activeMembers: Set<string> }>();
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyStatsMap.set(dateStr, { newMembers: 0, stamps: 0, activeMembers: new Set() });
  }

  for (const member of membersData) {
    const date = member.created_at.split('T')[0];
    const day = dailyStatsMap.get(date);
    if (day) day.newMembers++;
  }

  for (const visit of recentVisitsData) {
    const date = visit.stamped_at.split('T')[0];
    const day = dailyStatsMap.get(date);
    if (day) {
      day.stamps++;
      day.activeMembers.add(visit.member_id);
    }
  }

  const dailyStats = Array.from(dailyStatsMap.entries())
    .map(([date, stats]) => ({
      date,
      newMembers: stats.newMembers,
      stamps: stats.stamps,
      activeMembers: stats.activeMembers.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build merchant summaries
  const merchantSummaries = merchantsData.map(m => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    totalMembers: merchantStats.get(m.id)?.totalMembers ?? 0,
    activeMembers30Days: merchantStats.get(m.id)?.activeMembers30Days ?? 0,
    stampsThisWeek: merchantWeeklyStamps.get(m.id) ?? 0,
    rewardsPending: merchantStats.get(m.id)?.rewardsPending ?? 0
  }));

  return {
    totalMerchants: merchantsData.length,
    totalMembers: membersData.length,
    totalStampsAwarded: visitsData.length,
    totalRewardsRedeemed,
    totalRewardsPending,
    activeMembers30Days,
    newMembersToday,
    newMembersThisWeek,
    newMembersThisMonth,
    stampsToday,
    stampsThisWeek,
    membersByDevice: deviceBreakdown,
    merchantSummaries,
    dailyStats
  };
}

// ============================================================
// Member Listing & Search
// ============================================================

export interface MemberFilters {
  merchantId?: string;
  search?: string;
  deviceType?: 'apple' | 'google' | 'web';
  hasReward?: boolean;
  minStamps?: number;
  maxStamps?: number;
  sortBy?: 'created_at' | 'last_stamp_at' | 'stamp_count' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export async function getMembers(
  client: SupabaseClient,
  filters: MemberFilters = {}
): Promise<{ members: MemberListItem[]; total: number }> {
  const {
    merchantId,
    search,
    deviceType,
    hasReward,
    minStamps,
    maxStamps,
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 50,
    offset = 0
  } = filters;

  // Get merchants for name lookup
  const { data: merchantsData } = await client.from('merchants').select('id, name, slug');
  const merchantMap = new Map((merchantsData ?? []).map(m => [m.id, { name: m.name, slug: m.slug }]));

  // Build query
  let query = client
    .from('members')
    .select('id, name, wallet_email, device_type, stamp_count, reward_available, last_stamp_at, created_at, merchant_id', { count: 'exact' });

  if (merchantId) {
    query = query.eq('merchant_id', merchantId);
  }

  if (deviceType) {
    query = query.eq('device_type', deviceType);
  }

  if (hasReward !== undefined) {
    query = query.eq('reward_available', hasReward);
  }

  if (minStamps !== undefined) {
    query = query.gte('stamp_count', minStamps);
  }

  if (maxStamps !== undefined) {
    query = query.lte('stamp_count', maxStamps);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to get members: ${error.message}`);
  }

  // Get visit counts for these members
  const memberIds = (data ?? []).map(m => m.id);
  const { data: visitCounts } = await client
    .from('visits')
    .select('member_id')
    .in('member_id', memberIds);

  const visitCountMap = new Map<string, number>();
  for (const v of visitCounts ?? []) {
    visitCountMap.set(v.member_id, (visitCountMap.get(v.member_id) ?? 0) + 1);
  }

  let members: MemberListItem[] = (data ?? []).map(m => {
    const merchant = merchantMap.get(m.merchant_id);
    return {
      id: m.id,
      name: m.name,
      email: m.wallet_email,
      deviceType: m.device_type as 'apple' | 'google' | 'web',
      stampCount: m.stamp_count,
      rewardAvailable: m.reward_available,
      lastStampAt: m.last_stamp_at,
      createdAt: m.created_at,
      totalVisits: visitCountMap.get(m.id) ?? 0,
      merchantId: m.merchant_id,
      merchantName: merchant?.name ?? 'Unknown',
      merchantSlug: merchant?.slug ?? ''
    };
  });

  // Client-side search filter (for name/email)
  if (search) {
    const searchLower = search.toLowerCase();
    members = members.filter(m =>
      (m.name?.toLowerCase().includes(searchLower)) ||
      (m.email?.toLowerCase().includes(searchLower)) ||
      m.id.toLowerCase().includes(searchLower)
    );
  }

  return { members, total: count ?? 0 };
}

export async function getMemberDetail(
  client: SupabaseClient,
  memberId: string
): Promise<MemberDetail | null> {
  // Get member data
  const { data: memberData, error: memberError } = await client
    .from('members')
    .select('id, name, wallet_email, device_type, stamp_count, reward_available, last_stamp_at, created_at, merchant_id')
    .eq('id', memberId)
    .single();

  if (memberError || !memberData) {
    return null;
  }

  // Get merchant info
  const { data: merchantData } = await client
    .from('merchants')
    .select('id, name, slug, reward_goal')
    .eq('id', memberData.merchant_id)
    .single();

  // Get visit history
  const { data: visitsData } = await client
    .from('visits')
    .select('id, stamped_at')
    .eq('member_id', memberId)
    .order('stamped_at', { ascending: false });

  const visits = visitsData ?? [];
  const rewardGoal = merchantData?.reward_goal ?? 8;

  // Calculate stats
  const createdDate = new Date(memberData.created_at);
  const daysAsMember = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  let avgDaysBetweenVisits: number | null = null;
  if (visits.length > 1) {
    const sortedVisits = [...visits].sort((a, b) =>
      new Date(a.stamped_at).getTime() - new Date(b.stamped_at).getTime()
    );
    let totalDays = 0;
    for (let i = 1; i < sortedVisits.length; i++) {
      const diff = new Date(sortedVisits[i].stamped_at).getTime() -
                   new Date(sortedVisits[i - 1].stamped_at).getTime();
      totalDays += diff / (1000 * 60 * 60 * 24);
    }
    avgDaysBetweenVisits = Math.round((totalDays / (sortedVisits.length - 1)) * 10) / 10;
  }

  // Estimate rewards earned (completed cycles)
  const rewardsEarned = Math.floor(visits.length / rewardGoal);

  return {
    id: memberData.id,
    name: memberData.name,
    email: memberData.wallet_email,
    deviceType: memberData.device_type as 'apple' | 'google' | 'web',
    stampCount: memberData.stamp_count,
    rewardAvailable: memberData.reward_available,
    lastStampAt: memberData.last_stamp_at,
    createdAt: memberData.created_at,
    totalVisits: visits.length,
    merchantId: memberData.merchant_id,
    merchantName: merchantData?.name ?? 'Unknown',
    merchantSlug: merchantData?.slug ?? '',
    visitHistory: visits.map(v => ({ id: v.id, stampedAt: v.stamped_at })),
    daysAsMember,
    avgDaysBetweenVisits,
    rewardsEarned
  };
}

// ============================================================
// Top Insights
// ============================================================

export interface TopInsights {
  topCustomers: {
    id: string;
    name: string | null;
    merchantName: string;
    totalVisits: number;
    stampCount: number;
  }[];
  recentActivity: {
    id: string;
    memberName: string | null;
    merchantName: string;
    stampedAt: string;
  }[];
  atRiskCustomers: {
    id: string;
    name: string | null;
    merchantName: string;
    daysSinceLastVisit: number;
    stampCount: number;
  }[];
  loyaltyFunnel: {
    stage: string;
    count: number;
    percentage: number;
  }[];
}

export async function getTopInsights(
  client: SupabaseClient,
  merchantId?: string
): Promise<TopInsights> {
  // Time boundaries for activity analysis (available for future use)
  const _thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const _sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Get all data
  let merchantQuery = client.from('merchants').select('id, name, slug, reward_goal');
  let memberQuery = client.from('members').select('id, name, merchant_id, stamp_count, reward_available, last_stamp_at, created_at');
  let visitQuery = client.from('visits').select('id, member_id, merchant_id, stamped_at');

  if (merchantId) {
    merchantQuery = merchantQuery.eq('id', merchantId);
    memberQuery = memberQuery.eq('merchant_id', merchantId);
    visitQuery = visitQuery.eq('merchant_id', merchantId);
  }

  const [merchants, members, visits] = await Promise.all([
    merchantQuery,
    memberQuery,
    visitQuery.order('stamped_at', { ascending: false }).limit(100)
  ]);

  if (merchants.error) throw new Error(`Failed to get merchants: ${merchants.error.message}`);
  if (members.error) throw new Error(`Failed to get members: ${members.error.message}`);
  if (visits.error) throw new Error(`Failed to get visits: ${visits.error.message}`);

  const merchantMap = new Map((merchants.data ?? []).map(m => [m.id, m]));
  const membersData = members.data ?? [];
  const visitsData = visits.data ?? [];

  // Count visits per member
  const memberVisitCounts = new Map<string, number>();
  for (const v of visitsData) {
    memberVisitCounts.set(v.member_id, (memberVisitCounts.get(v.member_id) ?? 0) + 1);
  }

  // Top customers by visit count
  const memberMap = new Map(membersData.map(m => [m.id, m]));
  const topCustomers = Array.from(memberVisitCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([memberId, totalVisits]) => {
      const member = memberMap.get(memberId);
      const merchant = member ? merchantMap.get(member.merchant_id) : null;
      return {
        id: memberId,
        name: member?.name ?? null,
        merchantName: merchant?.name ?? 'Unknown',
        totalVisits,
        stampCount: member?.stamp_count ?? 0
      };
    });

  // Recent activity
  const recentActivity = visitsData.slice(0, 20).map(v => {
    const member = memberMap.get(v.member_id);
    const merchant = merchantMap.get(v.merchant_id);
    return {
      id: v.id,
      memberName: member?.name ?? null,
      merchantName: merchant?.name ?? 'Unknown',
      stampedAt: v.stamped_at
    };
  });

  // At-risk customers (active 30-60 days ago but not in last 30 days)
  const now = Date.now();
  const atRiskCustomers = membersData
    .filter(m => {
      if (!m.last_stamp_at) return false;
      const lastVisit = new Date(m.last_stamp_at).getTime();
      const daysSince = (now - lastVisit) / (1000 * 60 * 60 * 24);
      return daysSince >= 30 && daysSince <= 90;
    })
    .map(m => {
      const merchant = merchantMap.get(m.merchant_id);
      const daysSinceLastVisit = Math.floor((now - new Date(m.last_stamp_at!).getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: m.id,
        name: m.name,
        merchantName: merchant?.name ?? 'Unknown',
        daysSinceLastVisit,
        stampCount: m.stamp_count
      };
    })
    .sort((a, b) => a.daysSinceLastVisit - b.daysSinceLastVisit)
    .slice(0, 10);

  // Loyalty funnel
  const rewardGoal = merchantId
    ? merchantMap.get(merchantId)?.reward_goal ?? 8
    : 8;

  const funnelStages = {
    joined: membersData.length,
    firstStamp: membersData.filter(m => m.stamp_count > 0 || m.last_stamp_at).length,
    halfway: membersData.filter(m => m.stamp_count >= Math.floor(rewardGoal / 2)).length,
    nearReward: membersData.filter(m => m.stamp_count >= rewardGoal - 2 && m.stamp_count < rewardGoal).length,
    rewardReady: membersData.filter(m => m.reward_available).length
  };

  const total = funnelStages.joined || 1;
  const loyaltyFunnel = [
    { stage: 'Joined', count: funnelStages.joined, percentage: 100 },
    { stage: 'First Stamp', count: funnelStages.firstStamp, percentage: Math.round((funnelStages.firstStamp / total) * 100) },
    { stage: 'Halfway', count: funnelStages.halfway, percentage: Math.round((funnelStages.halfway / total) * 100) },
    { stage: 'Near Reward', count: funnelStages.nearReward, percentage: Math.round((funnelStages.nearReward / total) * 100) },
    { stage: 'Reward Ready', count: funnelStages.rewardReady, percentage: Math.round((funnelStages.rewardReady / total) * 100) }
  ];

  return {
    topCustomers,
    recentActivity,
    atRiskCustomers,
    loyaltyFunnel
  };
}

// ============================================================
// User-Scoped Analytics (filtered by accessible merchants)
// ============================================================

/**
 * Get global analytics filtered to user's accessible merchants
 */
export async function getGlobalAnalyticsForUser(
  client: SupabaseClient,
  merchantIds: string[]
): Promise<GlobalAnalytics> {
  // Return empty analytics if no merchant access
  if (merchantIds.length === 0) {
    return {
      totalMerchants: 0,
      totalMembers: 0,
      totalStampsAwarded: 0,
      totalRewardsRedeemed: 0,
      totalRewardsPending: 0,
      activeMembers30Days: 0,
      newMembersToday: 0,
      newMembersThisWeek: 0,
      newMembersThisMonth: 0,
      stampsToday: 0,
      stampsThisWeek: 0,
      membersByDevice: { apple: 0, google: 0, web: 0 },
      merchantSummaries: [],
      dailyStats: []
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Run queries in parallel, filtered by merchantIds
  const [merchants, members, visits, recentVisits] = await Promise.all([
    client.from('merchants').select('id, name, slug, reward_goal').in('id', merchantIds),
    client.from('members').select('id, merchant_id, device_type, stamp_count, reward_available, last_stamp_at, created_at').in('merchant_id', merchantIds),
    client.from('visits').select('id, merchant_id, member_id, stamped_at').in('merchant_id', merchantIds),
    client.from('visits').select('id, merchant_id, member_id, stamped_at').in('merchant_id', merchantIds).gte('stamped_at', monthAgo)
  ]);

  if (merchants.error) throw new Error(`Failed to get merchants: ${merchants.error.message}`);
  if (members.error) throw new Error(`Failed to get members: ${members.error.message}`);
  if (visits.error) throw new Error(`Failed to get visits: ${visits.error.message}`);
  if (recentVisits.error) throw new Error(`Failed to get recent visits: ${recentVisits.error.message}`);

  const merchantsData = merchants.data ?? [];
  const membersData = members.data ?? [];
  const visitsData = visits.data ?? [];
  const recentVisitsData = recentVisits.data ?? [];

  // Calculate stats (same logic as getGlobalAnalytics)
  let totalRewardsRedeemed = 0;
  let totalRewardsPending = 0;
  let activeMembers30Days = 0;
  let newMembersToday = 0;
  let newMembersThisWeek = 0;
  let newMembersThisMonth = 0;
  const deviceBreakdown = { apple: 0, google: 0, web: 0 };

  const merchantStats = new Map<string, {
    totalMembers: number;
    activeMembers30Days: number;
    rewardsPending: number;
  }>();

  for (const m of merchantsData) {
    merchantStats.set(m.id, { totalMembers: 0, activeMembers30Days: 0, rewardsPending: 0 });
  }

  for (const member of membersData) {
    const stats = merchantStats.get(member.merchant_id);
    if (stats) stats.totalMembers++;

    if (member.reward_available) {
      totalRewardsPending++;
      if (stats) stats.rewardsPending++;
    }

    if (member.stamp_count === 0 && member.last_stamp_at) {
      totalRewardsRedeemed++;
    }

    if (member.last_stamp_at && member.last_stamp_at >= monthAgo) {
      activeMembers30Days++;
      if (stats) stats.activeMembers30Days++;
    }

    if (member.created_at >= today) newMembersToday++;
    if (member.created_at >= weekAgo) newMembersThisWeek++;
    if (member.created_at >= monthAgo) newMembersThisMonth++;

    const dt = member.device_type as 'apple' | 'google' | 'web';
    if (dt in deviceBreakdown) deviceBreakdown[dt]++;
  }

  let stampsToday = 0;
  let stampsThisWeek = 0;
  const merchantWeeklyStamps = new Map<string, number>();

  for (const visit of visitsData) {
    if (visit.stamped_at >= today) stampsToday++;
    if (visit.stamped_at >= weekAgo) {
      stampsThisWeek++;
      merchantWeeklyStamps.set(visit.merchant_id, (merchantWeeklyStamps.get(visit.merchant_id) ?? 0) + 1);
    }
  }

  // Build daily stats
  const dailyStatsMap = new Map<string, { newMembers: number; stamps: number; activeMembers: Set<string> }>();
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyStatsMap.set(dateStr, { newMembers: 0, stamps: 0, activeMembers: new Set() });
  }

  for (const member of membersData) {
    const date = member.created_at.split('T')[0];
    const day = dailyStatsMap.get(date);
    if (day) day.newMembers++;
  }

  for (const visit of recentVisitsData) {
    const date = visit.stamped_at.split('T')[0];
    const day = dailyStatsMap.get(date);
    if (day) {
      day.stamps++;
      day.activeMembers.add(visit.member_id);
    }
  }

  const dailyStats = Array.from(dailyStatsMap.entries())
    .map(([date, stats]) => ({
      date,
      newMembers: stats.newMembers,
      stamps: stats.stamps,
      activeMembers: stats.activeMembers.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const merchantSummaries = merchantsData.map(m => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    totalMembers: merchantStats.get(m.id)?.totalMembers ?? 0,
    activeMembers30Days: merchantStats.get(m.id)?.activeMembers30Days ?? 0,
    stampsThisWeek: merchantWeeklyStamps.get(m.id) ?? 0,
    rewardsPending: merchantStats.get(m.id)?.rewardsPending ?? 0
  }));

  return {
    totalMerchants: merchantsData.length,
    totalMembers: membersData.length,
    totalStampsAwarded: visitsData.length,
    totalRewardsRedeemed,
    totalRewardsPending,
    activeMembers30Days,
    newMembersToday,
    newMembersThisWeek,
    newMembersThisMonth,
    stampsToday,
    stampsThisWeek,
    membersByDevice: deviceBreakdown,
    merchantSummaries,
    dailyStats
  };
}

/**
 * Get members filtered to user's accessible merchants
 */
export async function getMembersForUser(
  client: SupabaseClient,
  merchantIds: string[],
  filters: MemberFilters = {}
): Promise<{ members: MemberListItem[]; total: number }> {
  if (merchantIds.length === 0) {
    return { members: [], total: 0 };
  }

  const {
    merchantId,
    search,
    deviceType,
    hasReward,
    minStamps,
    maxStamps,
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 50,
    offset = 0
  } = filters;

  // Get merchants for name lookup
  const { data: merchantsData } = await client.from('merchants').select('id, name, slug').in('id', merchantIds);
  const merchantMap = new Map((merchantsData ?? []).map(m => [m.id, { name: m.name, slug: m.slug }]));

  // Build query - filter by accessible merchants
  let query = client
    .from('members')
    .select('id, name, wallet_email, device_type, stamp_count, reward_available, last_stamp_at, created_at, merchant_id', { count: 'exact' })
    .in('merchant_id', merchantId ? [merchantId] : merchantIds);

  if (deviceType) {
    query = query.eq('device_type', deviceType);
  }

  if (hasReward !== undefined) {
    query = query.eq('reward_available', hasReward);
  }

  if (minStamps !== undefined) {
    query = query.gte('stamp_count', minStamps);
  }

  if (maxStamps !== undefined) {
    query = query.lte('stamp_count', maxStamps);
  }

  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to get members: ${error.message}`);
  }

  // Get visit counts
  const memberIds = (data ?? []).map(m => m.id);
  const { data: visitCounts } = await client
    .from('visits')
    .select('member_id')
    .in('member_id', memberIds);

  const visitCountMap = new Map<string, number>();
  for (const v of visitCounts ?? []) {
    visitCountMap.set(v.member_id, (visitCountMap.get(v.member_id) ?? 0) + 1);
  }

  let members: MemberListItem[] = (data ?? []).map(m => {
    const merchant = merchantMap.get(m.merchant_id);
    return {
      id: m.id,
      name: m.name,
      email: m.wallet_email,
      deviceType: m.device_type as 'apple' | 'google' | 'web',
      stampCount: m.stamp_count,
      rewardAvailable: m.reward_available,
      lastStampAt: m.last_stamp_at,
      createdAt: m.created_at,
      totalVisits: visitCountMap.get(m.id) ?? 0,
      merchantId: m.merchant_id,
      merchantName: merchant?.name ?? 'Unknown',
      merchantSlug: merchant?.slug ?? ''
    };
  });

  // Client-side search filter
  if (search) {
    const searchLower = search.toLowerCase();
    members = members.filter(m =>
      (m.name?.toLowerCase().includes(searchLower)) ||
      (m.email?.toLowerCase().includes(searchLower)) ||
      m.id.toLowerCase().includes(searchLower)
    );
  }

  return { members, total: count ?? 0 };
}

/**
 * Get top insights filtered to user's accessible merchants
 */
export async function getTopInsightsForUser(
  client: SupabaseClient,
  merchantIds: string[],
  specificMerchantId?: string
): Promise<TopInsights> {
  if (merchantIds.length === 0) {
    return {
      topCustomers: [],
      recentActivity: [],
      atRiskCustomers: [],
      loyaltyFunnel: []
    };
  }

  // If specific merchant requested, use only that one
  const filterIds = specificMerchantId ? [specificMerchantId] : merchantIds;

  // Get data filtered by merchantIds
  const [merchants, members, visits] = await Promise.all([
    client.from('merchants').select('id, name, slug, reward_goal').in('id', filterIds),
    client.from('members').select('id, name, merchant_id, stamp_count, reward_available, last_stamp_at, created_at').in('merchant_id', filterIds),
    client.from('visits').select('id, member_id, merchant_id, stamped_at').in('merchant_id', filterIds).order('stamped_at', { ascending: false }).limit(100)
  ]);

  if (merchants.error) throw new Error(`Failed to get merchants: ${merchants.error.message}`);
  if (members.error) throw new Error(`Failed to get members: ${members.error.message}`);
  if (visits.error) throw new Error(`Failed to get visits: ${visits.error.message}`);

  const merchantMap = new Map((merchants.data ?? []).map(m => [m.id, m]));
  const membersData = members.data ?? [];
  const visitsData = visits.data ?? [];

  // Count visits per member
  const memberVisitCounts = new Map<string, number>();
  for (const v of visitsData) {
    memberVisitCounts.set(v.member_id, (memberVisitCounts.get(v.member_id) ?? 0) + 1);
  }

  // Top customers
  const memberMap = new Map(membersData.map(m => [m.id, m]));
  const topCustomers = Array.from(memberVisitCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([memberId, totalVisits]) => {
      const member = memberMap.get(memberId);
      const merchant = member ? merchantMap.get(member.merchant_id) : null;
      return {
        id: memberId,
        name: member?.name ?? null,
        merchantName: merchant?.name ?? 'Unknown',
        totalVisits,
        stampCount: member?.stamp_count ?? 0
      };
    });

  // Recent activity
  const recentActivity = visitsData.slice(0, 20).map(v => {
    const member = memberMap.get(v.member_id);
    const merchant = merchantMap.get(v.merchant_id);
    return {
      id: v.id,
      memberName: member?.name ?? null,
      merchantName: merchant?.name ?? 'Unknown',
      stampedAt: v.stamped_at
    };
  });

  // At-risk customers
  const now = Date.now();
  const atRiskCustomers = membersData
    .filter(m => {
      if (!m.last_stamp_at) return false;
      const lastVisit = new Date(m.last_stamp_at).getTime();
      const daysSince = (now - lastVisit) / (1000 * 60 * 60 * 24);
      return daysSince >= 30 && daysSince <= 90;
    })
    .map(m => {
      const merchant = merchantMap.get(m.merchant_id);
      const daysSinceLastVisit = Math.floor((now - new Date(m.last_stamp_at!).getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: m.id,
        name: m.name,
        merchantName: merchant?.name ?? 'Unknown',
        daysSinceLastVisit,
        stampCount: m.stamp_count
      };
    })
    .sort((a, b) => a.daysSinceLastVisit - b.daysSinceLastVisit)
    .slice(0, 10);

  // Loyalty funnel
  const rewardGoal = specificMerchantId
    ? merchantMap.get(specificMerchantId)?.reward_goal ?? 8
    : 8;

  const funnelStages = {
    joined: membersData.length,
    firstStamp: membersData.filter(m => m.stamp_count > 0 || m.last_stamp_at).length,
    halfway: membersData.filter(m => m.stamp_count >= Math.floor(rewardGoal / 2)).length,
    nearReward: membersData.filter(m => m.stamp_count >= rewardGoal - 2 && m.stamp_count < rewardGoal).length,
    rewardReady: membersData.filter(m => m.reward_available).length
  };

  const total = funnelStages.joined || 1;
  const loyaltyFunnel = [
    { stage: 'Joined', count: funnelStages.joined, percentage: 100 },
    { stage: 'First Stamp', count: funnelStages.firstStamp, percentage: Math.round((funnelStages.firstStamp / total) * 100) },
    { stage: 'Halfway', count: funnelStages.halfway, percentage: Math.round((funnelStages.halfway / total) * 100) },
    { stage: 'Near Reward', count: funnelStages.nearReward, percentage: Math.round((funnelStages.nearReward / total) * 100) },
    { stage: 'Reward Ready', count: funnelStages.rewardReady, percentage: Math.round((funnelStages.rewardReady / total) * 100) }
  ];

  return {
    topCustomers,
    recentActivity,
    atRiskCustomers,
    loyaltyFunnel
  };
}
