'use client';

import Link from 'next/link';
import { Store, BarChart3, Palette } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminHeader';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <AdminHeader />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-medium mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Manage your loyalty cards and view customer insights</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/branding/new"
            className="group p-8 bg-card border border-border rounded-lg hover:border-foreground/20 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <Palette className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Create Loyalty Card</h3>
            <p className="text-muted-foreground">
              Set up a new branded loyalty card for Apple and Google Wallet
            </p>
          </Link>

          <Link
            href="/merchants"
            className="group p-8 bg-card border border-border rounded-lg hover:border-foreground/20 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Manage Merchants</h3>
            <p className="text-muted-foreground">
              View and edit your existing merchant profiles
            </p>
          </Link>

          <Link
            href="/analytics"
            className="group p-8 bg-card border border-border rounded-lg hover:border-foreground/20 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Analytics</h3>
            <p className="text-muted-foreground">
              View member stats, engagement, and redemptions
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
