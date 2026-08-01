'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function BrandsPage() {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 10;
  const [deleteBrand, setDeleteBrand] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['brands', searchTerm, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (searchTerm) params.set('search', searchTerm);
      const res = await api.get('/brands', { params });
      console.log("FETCHED BRANDS API RESPONSE:", res.data);
      // Handle both response formats
      const response = res.data;
      return Array.isArray(response) ? { data: response, pagination: { total: response.length, pages: 1 } } : response;
    },
  });

  const totalItems = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.pages || 1;
  const brandsList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);

  const handleDelete = async () => {
    if (!deleteBrand) return;
    try {
      await api.delete(`/brands/${deleteBrand.id}`);
      toast.success('Brand deleted successfully!');
      setDeleteBrand(null);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete brand');
    }
  };

  return (
    <div className="p-8 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Brands</h2>
          <p className="text-sm text-gray-500 mt-1">Manage product brands and their logos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refetch()}>Refresh</Button>
          <Link href="/dashboard/brands/create">
            <Button>Create Brand</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        {/* Debug Info — only shown on error */}
        {isError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-sm font-medium text-red-700">API Error:</p>
            <pre className="text-xs mt-2 overflow-auto max-h-40 text-red-600">{String((error as any)?.response?.data?.message || error)}</pre>
            <p className="text-xs mt-1 text-red-500">
              Status: {(error as any)?.response?.status} — Check your permissions or authentication.
            </p>
          </div>
        )}
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
                <p>Loading brands...</p>
              </td></tr>
            ) : brandsList.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No brands found</td></tr>
            ) : (
              brandsList.map((brand: any) => (
                <tr key={brand.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {brand.media && (
                        <img src={brand.media.publicUrl} alt={brand.name} className="w-10 h-10 rounded border mr-3 object-contain" />
                      )}
                      <span className="font-medium text-gray-900">{brand.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{brand.slug}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      brand.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {brand.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(brand.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-1">
                      <Link href={`/dashboard/brands/${brand.id}/edit`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteBrand({ id: brand.id, name: brand.name })}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">Page {page} of {totalPages} ({totalItems} total)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteBrand}
        title="Delete Brand"
        message={`Are you sure you want to delete "${deleteBrand?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteBrand(null)}
      />
    </div>
  );
}
