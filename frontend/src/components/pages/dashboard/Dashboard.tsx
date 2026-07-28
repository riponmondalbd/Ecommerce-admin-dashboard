import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
// Use custom hooks for real data
import useProducts from '../../../hooks/useProducts';
import useCategories from '../../../hooks/useCategories';
import useBrands from '../../../hooks/useBrands';
import useTransactions from '../../../hooks/useTransactions';

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

  // Fetch real data from backend using custom hooks
  const { products: productData, loading: productsLoading, error: productsError } = useProducts();
  const { categories: categoryData, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { brands: brandData, loading: brandsLoading, error: brandsError } = useBrands();
  const { transactions: transactionData, loading: transactionsLoading, error: transactionsError } = useTransactions();

  // Combine loading states
  const isLoading = productsLoading || categoriesLoading || brandsLoading || transactionsLoading || (user?.isLoading || false);
  const hasError = productsError || categoriesError || brandsError || transactionsError;

  if (!user) return null; // AuthProvider handles loading state
  if (isLoading) return <div className="text-center py-12"><div className="inline-animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div></div>;
  if (hasError) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 max-w-2xl mx-auto">Failed to load dashboard data. Please try again.</div>;

  // Calculate statistics from real data
  const stats = {
    products: productData.length,
    categories: categoryData.length,
    brands: brandData.length,
    transactions: transactionData.length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Welcome back, {user.name}!</h1>
            <p className="mt-2 text-gray-600">Overview of your store's performance</p>
          </div>
          <button className="mt-4 sm:mt-0 inline-flex items-center justify-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <span className="mr-2">➕</span>
            Create Product
          </button>
        </div>
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