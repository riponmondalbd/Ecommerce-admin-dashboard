'use client';

import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Home, Package as ProductIcon, Category, Settings as BrandIcon, LineChart, User } from 'lucide-react';
import { useDashboardStats } from '@/lib/hooks/useDashboardStats';
import { useAuth } from '@/contexts/AuthContext';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp }) => (
  <Card className="flex items-start justify-between">
    <div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      {trend !== undefined && (
        <p className={`text-sm mt-1 ${trendUp ? 'text-success-500' : 'text-error-500'}`}>
          {trend > 0 ? '+' : ''}{trend}% from last month
        </p>
      )}
    </div>
    <div className="ml-4 p-3 bg-gray-50 rounded-lg">{icon}</div>
  </Card>
);

export default function DashboardPage() {
  const { stats, loading, error } = useDashboardStats();
  const { user } = useAuth();

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {user?.name || 'User'} - Overview of your store performance</p>
          </div>
          <Button variant="primary" onClick={() => window.location.href = '/products'}>
            <ProductIcon className="mr-2" /> Manage Products
          </button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Products"
            value={stats?.products || 0}
            icon={<ProductIcon className="w-8 h-8 text-primary-500" />}
            trend={12}
            trendUp={true}
          />
          <StatCard
            title="Total Categories"
            value={stats?.categories || 0}
            icon={<Category className="w-8 h-8 text-primary-500" />}
            trend={5}
            trendUp={true}
          />
          <StatCard
            title="Total Brands"
            value={stats?.brands || 0}
            icon={<BrandIcon className="w-8 h-8 text-primary-500" />}
            trend={8}
            trendUp={true}
          />
          <StatCard
            title="Recent Transactions"
            value={stats?.transactions || 0}
            icon={<LineChart className="w-8 h-8 text-primary-500" />}
            trend={15}
            trendUp={true}
          />
        </div>

        {/* Recent Activity Section */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <ProductIcon className="text-primary-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Product Added</p>
                  <p className="text-sm text-gray-500">Just now by John Doe</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">New Product</span>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <ProductIcon className="text-primary-500" />
                </div>
                <span className="font-medium">Create Product</span>
              </div>
              <p className="text-sm text-gray-500">Add new product to your catalog</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <User className="text-secondary-500" />
                </div>
                <span className="font-medium">Manage Users</span>
              </div>
              <p className="text-sm text-gray-500">View and manage user accounts</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                  <Category className="text-accent-500" />
                </div>
                <span className="font-medium">Categories</span>
              </div>
              <p className="text-sm text-gray-500">Organize your product categories</p>
            </button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
