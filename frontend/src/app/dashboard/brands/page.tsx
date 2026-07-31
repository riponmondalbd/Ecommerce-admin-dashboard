'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import toast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

// Brand table row component
const BrandRow = ({ brand, onRefresh }: { brand: any; onRefresh: () => void }) => (
  <tr className="border-t hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        {brand.media && (
          <img
            src={brand.media.publicUrl}
            alt={brand.name}
            className="w-10 h-10 rounded border mr-3"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        )}
        <span className="font-medium text-gray-900">{brand.name}</span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`inline-flex items-rounded-full px-2.5 py-.5 text-xs font-medium ${
        brand.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {brand.status}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {new Date(brand.createdAt).toLocaleDateString()}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <Button variant="secondary" size="sm">Edit</Button>
    </td>
  </tr>
);

export default function BrandsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch brands with search
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['brands', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      const res = await api.get('/brands', { params });
      return res.data;
    },
  });

  const handleCreate = async () => {
    alert('Redirecting to create brand page...');
  };

  const handleRefresh = async () => {
    await refetch();
    toast.info('Brands refreshed');
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Brands</h2>
          <Button onClick={handleCreate}>Create Brand</Button>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-500">Loading brands...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Brands</h2>
          <p className="text-sm text-gray-500 mt-1">Manage product brands and their logos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleRefresh}>Refresh</Button>
          <Button onClick={handleCreate}>Create Brand</Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.data.map((brand: any) => (
              <BrandRow key={brand.id} brand={brand} onRefresh={handleRefresh} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
