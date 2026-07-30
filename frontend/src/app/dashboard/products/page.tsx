'use client';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import { Product } from '@/types';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select, { SelectItem, SelectTrigger, SelectValue, SelectContent } from '@/components/ui/select';
import toast from '@/components/ui/Toast';

// UI Components
const EmptyState = () => (
  <div className="text-center py-12">
    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
      <path strokeLinecap="round" strokeWidth={2} d="M4 35V24a4 4 0 014-4h12-4 12M4 35l12-12m0 0l12 12M4 35v-9.5a1.5 1.5 0 011.5-1.5h41.01m-39 20a6 6 0 01-6-6V11a6 6 0 016-6h27a6 6 0 016 6v27a6 6 0 01-6 6h-9z" />
    </svg>
    <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
    <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or create a new product.</p>
  </div>
);

const TableRow = ({ product }: { product: Product }) => (
  <tr className="border-t hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-900">{product.name}</p>
          <p className="text-sm text-gray-500">{product.sku}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`inline-flex items-rounded-full px-2.5 py-.5 text-xs font-medium ${
        product.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
        product.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {product.status}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <p className="text-sm text-gray-900">${product.price.toFixed(2)}</p>
      {product.salePrice && (
        <p className="text-sm text-gray-500 line-through">$${product.salePrice.toFixed(2)}</p>
      )}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <p className={product.inventory < 5 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
        {product.inventory} units
      </p>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {new Date(product.createdAt).toLocaleDateString()}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex space-x-2">
        <Button variant="secondary" size="sm">Edit</Button>
        <Button variant="danger" size="sm">Delete</Button>
      </div>
    </td>
  </tr>
);

const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
  const pages: number[] = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return totalPages <= 1 ? null : (
    <div className="flex justify-between items-center border-t border-gray-200 bg-white py-4">
      <div className="text-sm text-gray-700">
        Showing {Math.max(0, (currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalPages * 10)} of {totalPages * 10} items
      </div>
      <div className="relative z-0 inline-flex shadow-sm rounded-md">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={currentPage === 1 ? 'relative inline-flex items-center py-2 px-3 border border-gray-300 bg-white text-sm text-gray-500' : 'relative inline-flex items-center py-2 px-4 border border-gray-300 bg-white text-sm text-primary hover:bg-gray-50 focus:z-10'}>
          Previous
        </button>
        {pages.length > 0 && (
          <span className="relative inline-flex items-center py-2 px-4 border-l border-r border-gray-300 bg-white text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={currentPage === totalPages ? 'relative inline-flex items-center py-2 pr-3 border border-gray-300 bg-white text-sm text-gray-500' : 'relative inline-flex items-center py-2 pr-4 border border-gray-300 bg-white text-sm text-primary hover:bg-gray-50 focus:z-10'}>
          Next
        </button>
      </div>
    </div>
  );
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 10;

  // Fetch products with query parameters
  const { data, isLoading, refetch } = useQuery(
    ['products', { searchTerm, selectedBrand, selectedStatus, page: currentPage, limit: LIMIT }],
    async () => {
      const params = new URLSearchParams({ page: currentPage.toString(), limit: LIMIT.toString() });
      if (searchTerm) params.set('search', searchTerm);
      if (selectedBrand) params.set('brandId', selectedBrand);
      if (selectedStatus) params.set('status', selectedStatus);

      const res = await api.get('/products', { params });
      return res.data;
    },
    { keepPreviousData: true }
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBrand, selectedStatus]);

  const handleCreate = async () => {
    alert('Redirecting to create product page...');
  };

  const handleRefresh = async () => {
    await refetch();
    toast.info('Products refreshed');
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Products</h2>
          <Button onClick={handleCreate}>Create Product</Button>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  const totalItems = data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalItems / LIMIT) || 1;

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleRefresh}>Refresh</Button>
          <Button onClick={handleCreate}>Create Product</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <Input
              placeholder="Search by name, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <Select value={selectedBrand || undefined} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Brands</SelectItem>
                {/* Brands would be populated here from an API call */}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select value={selectedStatus || undefined} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear button */}
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => { setSearchTerm(''); setSelectedBrand(null); setSelectedStatus(null); }}>Clear Filters</Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="min-w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data.map((product: Product) => (
                <TableRow key={product.id} product={product} />
              ))}
            </tbody>
          </table>

          {/* No results state */}
          {!data?.data || data.data.length === 0 && (
            <EmptyState />
          )}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
}
