'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios-client';
import useToast from '@/components/ui/Toast';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function AttributesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 10;
  const [deleteAttr, setDeleteAttr] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['attributes', searchTerm, filterType, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (searchTerm) params.set('search', searchTerm);
      if (filterType) params.set('type', filterType);
      const res = await api.get('/attributes', { params });
      // Handle both response formats
      const response = res.data;
      return Array.isArray(response) ? { data: response, pagination: { total: response.length, pages: 1 } } : response;
    },
  });

  // Extract attributes list safely
  const attributeList = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);

  const totalItems = data?.pagination?.total || attributeList.length || 0;
  const totalPages = data?.pagination?.pages || Math.ceil(totalItems / LIMIT) || 1;

  const handleDelete = async (id: string, name: string) => {
    setDeleteAttr({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteAttr) return;
    try {
      await api.delete(`/attributes/${deleteAttr.id}`);
      toast.success('Attribute deleted successfully!');
      setDeleteAttr(null);
      await queryClient.invalidateQueries({ queryKey: ['attributes'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete attribute');
    }
  };

  const typeLabels: Record<string, string> = {
    TEXT: 'Text',
    DROPDOWN: 'Dropdown',
    RADIO: 'Radio',
    CHECKBOX: 'Checkbox',
    COLOR_SWATCH: 'Color',
    IMAGE_SWATCH: 'Image',
  };

  const typeColors: Record<string, string> = {
    TEXT: 'bg-gray-100 text-gray-800',
    DROPDOWN: 'bg-blue-100 text-blue-800',
    RADIO: 'bg-green-100 text-green-800',
    CHECKBOX: 'bg-purple-100 text-purple-800',
    COLOR_SWATCH: 'bg-yellow-100 text-yellow-800',
    IMAGE_SWATCH: 'bg-pink-100 text-pink-800',
  };

  return (
    <div className="p-8 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Attributes</h2>
          <p className="text-sm text-gray-500 mt-1">Define product attributes like Color, Size, Material, etc.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refetch()}>Refresh</Button>
          <Link href="/dashboard/attributes/create">
            <Button>Create Attribute</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-4 flex-wrap">
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={filterType || ''}
          onChange={(e) => setFilterType(e.target.value || null)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Types</option>
          <option value="TEXT">Text</option>
          <option value="DROPDOWN">Dropdown</option>
          <option value="RADIO">Radio</option>
          <option value="CHECKBOX">Checkbox</option>
          <option value="COLOR_SWATCH">Color</option>
          <option value="IMAGE_SWATCH">Image</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Values</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
                <p>Loading attributes...</p>
              </td></tr>
            ) : attributeList.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No attributes found</td></tr>
            ) : (
              attributeList.map((attr: any) => (
                <tr key={attr.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{attr.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{attr.slug}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[attr.type] || 'bg-gray-100 text-gray-800'}`}>
                      {typeLabels[attr.type] || attr.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/dashboard/attributes/${attr.id}/values`}>
                      <span className="text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer">
                        {attr.attributeValues?.length || 0} values &rarr;
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(attr.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(attr.id, attr.name)}>Delete</Button>
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
        isOpen={!!deleteAttr}
        title="Delete Attribute"
        message={`Are you sure you want to delete "${deleteAttr?.name}"? This will also delete all its values.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAttr(null)}
      />
    </div>
  );
}
