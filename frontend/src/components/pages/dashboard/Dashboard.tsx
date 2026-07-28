import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  trend?: string;
  trendValue?: number;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendValue, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow ${className}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        {trend && trendValue !== undefined && (
          <p className={`mt-2 text-xs ${trend === 'increase' ? 'text-green-600' : trend === 'decrease' ? 'text-red-600' : 'text-gray-600'}`}>
            {(trend === 'increase' ? '↑' : trend === 'decrease' ? '↓' : '')} {Math.abs(trendValue)}% from last month
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${trend === 'increase' ? 'bg-green-50' : trend === 'decrease' ? 'bg-red-50' : 'bg-indigo-50'}`}>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    brands: 0,
    transactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch statistics from backend API
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const responses = await Promise.allSettled([
          api.get('/products'),
          api.get('/categories'),
          api.get('/brands'),
          api.get('/products/transactions'),
        ]);

        setStats({
          products: responses[0].status === 'fulfilled' ? (responses[0].value.data?.length || 0) : 0,
          categories: responses[1].status === 'fulfilled' ? (responses[1].value.data?.length || 0) : 0,
          brands: responses[2].status === 'fulfilled' ? (responses[2].value.data?.length || 0) : 0,
          transactions: responses[3].status === 'fulfilled' ? (responses[3].value.data?.length || 0) : 0,
        });
      } catch (err) {
        console.error('Failed to fetch statistics:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (!user) return null; // AuthProvider will handle loading
  if (loading) return <div className="text-center py-12"><div className="inline-animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Welcome back, {user.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Overview of your store's performance
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={stats.products}
          icon="📦"
          trend="increase"
          trendValue={12.5}
        />
        <StatCard
          title="Categories"
          value={stats.categories}
          icon="🏷️"
          trend="increase"
          trendValue={8.3}
        />
        <StatCard
          title="Brands"
          value={stats.brands}
          icon="🏭"
          trend="neutral"
          trendValue={0}
        />
        <StatCard
          title="Recent Transactions"
          value={stats.transactions}
          icon="💰"
          trend="increase"
          trendValue={15.7}
        />
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-extrabold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
            <span className="text-2xl mr-3">➕</span>
            <span className="font-medium text-indigo-700">Create Product</span>
          </button>
          <button className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <span className="text-2xl mr-3">📊</span>
            <span className="font-medium text-blue-700">View Reports</span>
          </button>
          <button className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <span className="text-2xl mr-3">🔄</span>
            <span className="font-medium text-green-700">Restock Inventory</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;