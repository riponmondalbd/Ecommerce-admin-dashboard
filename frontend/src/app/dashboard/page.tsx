'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import StatCard from '@/components/StatCard';

export default function DashboardPage() {
  const { data: productRes, isLoading: productLoading } = useQuery(
    ['products'],
    () => api.get('/products').then(res => res.data),
    { enabled: false } // Don't fetch automatically until mounted
  );

  const { data: categoryRes, isLoading: categoryLoading } = useQuery(
    ['categories'],
    () => api.get('/categories').then(res => res.data),
    { enabled: false }
  );

  const { data: brandRes, isLoading: brandLoading } = useQuery(
    ['brands'],
    () => api.get('/brands').then(res => res.data),
    { enabled: false }
  );

  // Fetch data when component mounts (using useEffect since we need enabled: false for conditional fetching)
  import('useEffect').then(({ useEffect }) => {
    useEffect(() => {
      if (!productRes?.refetch) productRefetch();
      if (!categoryRefetch) categoryRefetch();
      if (!brandRefetch) brandRefetch();
    }, []);
  });

  const handleRefresh = async () => {
    await productRes?.refetch?.();
    await categoryRes?.refetch?.();
    await brandRes?.refetch?.();
  };

  if (productLoading || categoryLoading || brandLoading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button onClick={handleRefresh} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors">
            Refresh
          </button>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome back! Here's your admin overview.</p>
        </div>
        <button onClick={handleRefresh} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
          Refresh Data
        </button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={productRes?.data?.length || 0}
          description="All products in catalog"
        />
        <StatCard
          title="Categories"
          value={categoryRes?.data?.length || 0}
          description="Product categories"
        />
        <StatCard
          title="Brands"
          value={brandRes?.data?.length || 0}
          description="Brand partners"
        />
        <StatCard
          title="Active Users"
          value="1"
          description="Admin users online"
        />
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          No recent activity yet. Start managing your products!
        </div>
      </div>
    </div>
  );
}
