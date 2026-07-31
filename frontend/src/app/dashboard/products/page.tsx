'use client';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Link from 'next/link';
import useToast from '@/components/ui/Toast';

const EmptyState = () => (
  <div className="text-center py-12">
    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
    <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
    <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or create a new product.</p>
  </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
      <span className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default function ProductsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products', searchTerm, selectedBrand, selectedStatus, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (searchTerm) params.set('search', searchTerm);
      if (selectedBrand) params.set('brandId', selectedBrand);
      if (selectedStatus) params.set('status', selectedStatus);
      const res = await api.get('/products', { params });
      return res.data;
    },
  });

  // Fetch brands for filter dropdown
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get('/brands?limit=100').then(r => r.data),
  });

  const totalItems = data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalItems / LIMIT) || 1;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted successfully!');
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refetch()}>Refresh</Button>
          <Link href="/dashboard/products/create">
            <Button>Create Product</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <Input
          placeholder="Search by name, SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={selectedBrand || ''}
          onChange={(e) => setSelectedBrand(e.target.value || null)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Brands</option>
          {brandsData?.data?.map((b: any) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          value={selectedStatus || ''}
          onChange={(e) => setSelectedStatus(e.target.value || null)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <Button variant="secondary" size="sm" onClick={() => { setSearchTerm(''); setSelectedBrand(null); setSelectedStatus(null); }}>Clear</Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
                <p>Loading products...</p>
              </td></tr>
            ) : (data?.data || []).length === 0 ? (
              <tr><td colSpan={7}><EmptyState /></td></tr>
            ) : (
              (data?.data || []).map((product: any) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.brand?.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">${Number(product.price).toFixed(2)}</p>
                    {product.salePrice && (
                      <p className="text-sm text-gray-500 line-through">${Number(product.salePrice).toFixed(2)}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className={product.stock < 5 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                      {product.stock} units
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                      product.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id, product.name)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
