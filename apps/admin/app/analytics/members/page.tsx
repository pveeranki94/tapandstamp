'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, Search, ChevronUp, ChevronDown } from 'lucide-react';
import type { MemberListItem } from '../../../lib/db/analytics';

interface MerchantOption {
  id: string;
  name: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);

  // Filters
  const [merchantId, setMerchantId] = useState('');
  const [search, setSearch] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [hasReward, setHasReward] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const limit = 25;

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (merchantId) params.set('merchantId', merchantId);
      if (search) params.set('search', search);
      if (deviceType) params.set('deviceType', deviceType);
      if (hasReward) params.set('hasReward', hasReward);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('limit', String(limit));
      params.set('offset', String(page * limit));

      const [membersRes, merchantsRes] = await Promise.all([
        fetch(`/api/analytics/members?${params}`),
        merchants.length === 0 ? fetch('/api/merchants') : Promise.resolve(null)
      ]);

      if (!membersRes.ok) throw new Error('Failed to fetch members');

      const membersData = await membersRes.json();
      setMembers(membersData.members);
      setTotal(membersData.total);

      if (merchantsRes) {
        const merchantsData = await merchantsRes.json();
        setMerchants(merchantsData.merchants || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [merchantId, search, deviceType, hasReward, sortBy, sortOrder, page, merchants.length]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [merchantId, search, deviceType, hasReward, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const totalPages = Math.ceil(total / limit);

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/analytics"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Analytics
          </Link>
          <h1 className="text-3xl font-medium mb-1">Members</h1>
          <p className="text-muted-foreground">{total.toLocaleString()} total members</p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <select
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              className="px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Merchants</option>
              {merchants.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Devices</option>
              <option value="apple">Apple Wallet</option>
              <option value="google">Google Wallet</option>
              <option value="web">Web</option>
            </select>

            <select
              value={hasReward}
              onChange={(e) => setHasReward(e.target.value)}
              className="px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Status</option>
              <option value="true">Reward Ready</option>
              <option value="false">In Progress</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {error ? (
          <div className="bg-destructive/10 text-destructive rounded-lg p-8 text-center">
            <p className="mb-4">{error}</p>
            <Button onClick={fetchMembers} variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th
                        onClick={() => handleSort('name')}
                        className="text-left px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                      >
                        Member <SortIcon field="name" />
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Merchant
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Device
                      </th>
                      <th
                        onClick={() => handleSort('stamp_count')}
                        className="text-left px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                      >
                        Stamps <SortIcon field="stamp_count" />
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th
                        onClick={() => handleSort('last_stamp_at')}
                        className="text-left px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                      >
                        Last Visit <SortIcon field="last_stamp_at" />
                      </th>
                      <th
                        onClick={() => handleSort('created_at')}
                        className="text-left px-4 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                      >
                        Joined <SortIcon field="created_at" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <span className="text-muted-foreground text-sm">Loading...</span>
                        </td>
                      </tr>
                    ) : members.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                          No members found
                        </td>
                      </tr>
                    ) : (
                      members.map((member) => (
                        <tr key={member.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <Link
                              href={`/analytics/members/${member.id}`}
                              className="hover:underline"
                            >
                              <div className="font-medium">
                                {member.name || 'Anonymous'}
                              </div>
                              {member.email && (
                                <div className="text-sm text-muted-foreground">{member.email}</div>
                              )}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-muted">
                              {member.merchantName}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              member.deviceType === 'apple'
                                ? 'bg-zinc-100 text-zinc-800'
                                : member.deviceType === 'google'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {member.deviceType === 'apple' ? 'Apple' :
                               member.deviceType === 'google' ? 'Google' : 'Web'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium">{member.stampCount}</span>
                            <span className="text-muted-foreground text-sm ml-1">({member.totalVisits} visits)</span>
                          </td>
                          <td className="px-4 py-3">
                            {member.rewardAvailable ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                                Reward Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                                In Progress
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {member.lastStampAt ? formatDate(member.lastStampAt) : 'Never'}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDate(member.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <Button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}
