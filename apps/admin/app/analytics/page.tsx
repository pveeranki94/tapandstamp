'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/ui/button';
import { Users, Stamp, TrendingUp, Gift, Apple, Smartphone, Globe, ArrowLeft } from 'lucide-react';
import type { GlobalAnalytics, TopInsights } from '../../lib/db/analytics';

interface MerchantOption {
  id: string;
  name: string;
  slug: string;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
  const [insights, setInsights] = useState<TopInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<string>('');
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const analyticsUrl = selectedMerchant
          ? `/api/analytics/merchant/${selectedMerchant}`
          : '/api/analytics';
        const insightsUrl = selectedMerchant
          ? `/api/analytics/insights?merchantId=${selectedMerchant}`
          : '/api/analytics/insights';

        const [analyticsRes, insightsRes, merchantsRes] = await Promise.all([
          fetch(analyticsUrl),
          fetch(insightsUrl),
          merchants.length === 0 ? fetch('/api/merchants') : Promise.resolve(null)
        ]);

        if (!analyticsRes.ok) throw new Error('Failed to fetch analytics');
        if (!insightsRes.ok) throw new Error('Failed to fetch insights');

        const analyticsData = await analyticsRes.json();
        const insightsData = await insightsRes.json();

        setAnalytics(analyticsData);
        setInsights(insightsData);

        if (merchantsRes) {
          const merchantsData = await merchantsRes.json();
          setMerchants(merchantsData.merchants || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedMerchant]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-16 text-center">
          <div className="bg-destructive/10 text-destructive rounded-lg p-8">
            <h2 className="text-xl font-medium mb-2">Error</h2>
            <p className="mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics || !insights) return null;

  const maxDailyStamps = Math.max(...analytics.dailyStats.map(d => d.stamps), 1);

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-medium mb-2">Analytics</h1>
            <p className="text-muted-foreground">Track customer loyalty and engagement</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedMerchant}
              onChange={(e) => setSelectedMerchant(e.target.value)}
              className="px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Merchants</option>
              {merchants.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <Button asChild variant="outline">
              <Link href="/analytics/members">View Members</Link>
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-medium">{analytics.totalMembers.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Members</div>
            <div className="text-xs text-primary mt-1">+{analytics.newMembersThisWeek} this week</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Stamp className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-medium">{analytics.totalStampsAwarded.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Stamps Awarded</div>
            <div className="text-xs text-primary mt-1">+{analytics.stampsThisWeek} this week</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-medium">{analytics.activeMembers30Days}</div>
            <div className="text-sm text-muted-foreground">Active (30 days)</div>
            <div className="text-xs text-muted-foreground mt-1">
              {analytics.totalMembers > 0
                ? `${Math.round((analytics.activeMembers30Days / analytics.totalMembers) * 100)}% of members`
                : '0% of members'}
            </div>
          </div>
          <div className="bg-card border border-primary/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-medium text-primary">{analytics.totalRewardsPending}</div>
            <div className="text-sm text-muted-foreground">Rewards Pending</div>
            <div className="text-xs text-muted-foreground mt-1">Ready to redeem</div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium mb-4">Activity (Last 30 Days)</h2>
          <div className="h-40 flex items-end gap-1">
            {analytics.dailyStats.map((day) => (
              <div
                key={day.date}
                className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t"
                style={{ height: `${Math.max((day.stamps / maxDailyStamps) * 100, 2)}%` }}
                title={`${day.date}: ${day.stamps} stamps, ${day.newMembers} new members`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{analytics.dailyStats[0]?.date ? new Date(analytics.dailyStats[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
            <span>{analytics.dailyStats[analytics.dailyStats.length - 1]?.date ? new Date(analytics.dailyStats[analytics.dailyStats.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Platform Distribution */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Platform Distribution</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Apple className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Apple Wallet</span>
                    <span>{analytics.membersByDevice.apple}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground rounded-full"
                      style={{ width: `${analytics.totalMembers > 0 ? (analytics.membersByDevice.apple / analytics.totalMembers) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Google Wallet</span>
                    <span>{analytics.membersByDevice.google}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${analytics.totalMembers > 0 ? (analytics.membersByDevice.google / analytics.totalMembers) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Web</span>
                    <span>{analytics.membersByDevice.web}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${analytics.totalMembers > 0 ? (analytics.membersByDevice.web / analytics.totalMembers) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Funnel */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Loyalty Funnel</h2>
            <div className="space-y-3">
              {insights.loyaltyFunnel.map((stage) => (
                <div key={stage.stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{stage.stage}</span>
                    <span className="text-muted-foreground">{stage.count} ({stage.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Customers */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Top Customers</h2>
            {insights.topCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No customer data yet</p>
            ) : (
              <div className="space-y-2">
                {insights.topCustomers.slice(0, 5).map((customer, i) => (
                  <Link
                    key={customer.id}
                    href={`/analytics/members/${customer.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{customer.name || 'Anonymous'}</div>
                      <div className="text-xs text-muted-foreground">{customer.merchantName}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div>{customer.totalVisits} visits</div>
                      <div className="text-muted-foreground">{customer.stampCount} stamps</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* At-Risk Customers */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-1">At-Risk Customers</h2>
            <p className="text-sm text-muted-foreground mb-4">Haven&apos;t visited in 30+ days</p>
            {insights.atRiskCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No at-risk customers</p>
            ) : (
              <div className="space-y-2">
                {insights.atRiskCustomers.slice(0, 5).map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/analytics/members/${customer.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border-l-2 border-destructive"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{customer.name || 'Anonymous'}</div>
                      <div className="text-xs text-muted-foreground">{customer.merchantName}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-destructive">{customer.daysSinceLastVisit}d ago</div>
                      <div className="text-muted-foreground">{customer.stampCount} stamps</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
          {insights.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {insights.recentActivity.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                  <span className="font-medium">{activity.memberName || 'Anonymous'}</span>
                  <span className="text-muted-foreground">earned a stamp at</span>
                  <span>{activity.merchantName}</span>
                  <span className="ml-auto text-muted-foreground">{formatRelativeTime(activity.stampedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Merchant Performance */}
        {!selectedMerchant && 'merchantSummaries' in analytics && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Merchant Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Merchant</th>
                    <th className="text-right py-3 px-2 font-medium">Members</th>
                    <th className="text-right py-3 px-2 font-medium hidden sm:table-cell">Active (30d)</th>
                    <th className="text-right py-3 px-2 font-medium hidden sm:table-cell">Stamps/Week</th>
                    <th className="text-right py-3 px-2 font-medium">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics as GlobalAnalytics).merchantSummaries.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedMerchant(m.id)}
                    >
                      <td className="py-3 px-2 font-medium">{m.name}</td>
                      <td className="py-3 px-2 text-right">{m.totalMembers}</td>
                      <td className="py-3 px-2 text-right hidden sm:table-cell">{m.activeMembers30Days}</td>
                      <td className="py-3 px-2 text-right hidden sm:table-cell">{m.stampsThisWeek}</td>
                      <td className={`py-3 px-2 text-right ${m.rewardsPending > 0 ? 'text-primary font-medium' : ''}`}>
                        {m.rewardsPending}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
