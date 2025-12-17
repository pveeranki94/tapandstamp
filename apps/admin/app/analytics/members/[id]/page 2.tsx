'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { AdminHeader } from '../../../../components/admin/AdminHeader';
import { Button } from '../../../../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { MemberDetail } from '../../../../lib/db/analytics';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MemberDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMember() {
      try {
        const res = await fetch(`/api/analytics/members/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Member not found');
          }
          throw new Error('Failed to fetch member');
        }
        const data = await res.json();
        setMember(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load member');
      } finally {
        setLoading(false);
      }
    }

    fetchMember();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading member details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-16 text-center">
          <div className="bg-destructive/10 text-destructive rounded-lg p-8">
            <h2 className="text-xl font-medium mb-2">Error</h2>
            <p className="mb-4">{error || 'Member not found'}</p>
            <Button asChild variant="outline">
              <Link href="/analytics/members">Back to Members</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/analytics/members"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Members
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-medium">
                {member.name ? member.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <h1 className="text-3xl font-medium">{member.name || 'Anonymous Member'}</h1>
                {member.email && (
                  <p className="text-muted-foreground">{member.email}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                member.deviceType === 'apple'
                  ? 'bg-zinc-100 text-zinc-800'
                  : member.deviceType === 'google'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {member.deviceType === 'apple' ? 'Apple Wallet' :
                 member.deviceType === 'google' ? 'Google Wallet' : 'Web'}
              </span>
              <Link
                href={`/merchants/${member.merchantId}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted hover:bg-muted/80"
              >
                {member.merchantName}
              </Link>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-3xl font-semibold mb-1">{member.stampCount}</div>
            <div className="text-sm text-muted-foreground">Current Stamps</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-3xl font-semibold mb-1">{member.totalVisits}</div>
            <div className="text-sm text-muted-foreground">Total Visits</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-3xl font-semibold mb-1">{member.rewardsEarned}</div>
            <div className="text-sm text-muted-foreground">Rewards Earned</div>
          </div>
          <div className={`bg-card border rounded-lg p-6 text-center ${
            member.rewardAvailable ? 'border-primary bg-primary/5' : 'border-border'
          }`}>
            <div className="text-3xl font-semibold mb-1">
              {member.rewardAvailable ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-muted-foreground">Reward Available</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Member Info */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Member Information</h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-sm text-muted-foreground">Member ID</span>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{member.id}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-sm text-muted-foreground">Days as Member</span>
                <span className="text-sm">{member.daysAsMember} days</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-sm text-muted-foreground">Joined</span>
                <span className="text-sm">
                  {new Date(member.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-sm text-muted-foreground">Last Visit</span>
                <span className="text-sm">
                  {member.lastStampAt
                    ? new Date(member.lastStampAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Never'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-sm text-muted-foreground">Avg. Days Between Visits</span>
                <span className="text-sm">
                  {member.avgDaysBetweenVisits !== null
                    ? `${member.avgDaysBetweenVisits} days`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-sm text-muted-foreground">Visit Frequency</span>
                <span className="text-sm">
                  {member.daysAsMember > 0 && member.totalVisits > 0
                    ? `${(member.totalVisits / (member.daysAsMember / 30)).toFixed(1)} visits/month`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </section>

          {/* Loyalty Progress */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Loyalty Progress</h2>

            <div className="mb-6">
              <div className="w-full bg-muted rounded-full h-3 mb-2">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (member.stampCount / 8) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{member.stampCount} / 8 stamps</span>
                {member.rewardAvailable ? (
                  <span className="text-primary font-medium">Reward Ready!</span>
                ) : (
                  <span className="text-muted-foreground">{8 - member.stampCount} more to go</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-semibold">{member.rewardsEarned}</div>
                <div className="text-xs text-muted-foreground">Lifetime Rewards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">{member.totalVisits}</div>
                <div className="text-xs text-muted-foreground">Lifetime Visits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold">
                  {member.totalVisits > 0 && member.rewardsEarned > 0
                    ? `${Math.round((member.rewardsEarned / member.totalVisits) * 8 * 100)}%`
                    : '0%'}
                </div>
                <div className="text-xs text-muted-foreground">Completion Rate</div>
              </div>
            </div>
          </section>
        </div>

        {/* Visit History */}
        <section className="bg-card border border-border rounded-lg p-6 mt-8">
          <h2 className="text-lg font-medium mb-4">Visit History</h2>
          {member.visitHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No visits recorded yet
            </div>
          ) : (
            <div className="relative pl-4 border-l-2 border-border space-y-6">
              {member.visitHistory.map((visit, index) => {
                const date = new Date(visit.stampedAt);
                const prevVisit = member.visitHistory[index + 1];
                const daysSincePrev = prevVisit
                  ? Math.floor((date.getTime() - new Date(prevVisit.stampedAt).getTime()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <div key={visit.id} className="relative">
                    <div className="absolute -left-[1.3rem] w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
                    <div className="pl-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {date.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                          })}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {date.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {daysSincePrev !== null && daysSincePrev > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {daysSincePrev === 1 ? '1 day later' : `${daysSincePrev} days later`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
